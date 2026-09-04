const PRODUCTS_KEY = "cacho-store-products-v1";
const CATEGORIES_KEY = "cacho-store-categories-v1";
const LAST_PUSHED_KEY = "cacho-store-last-pushed-v1";
const PULL_INTERVAL = 30000;
const PUSH_INTERVAL = 10000;

let remoteSyncEnabled = false;
let lastRemotePayload = "";
let pushing = false;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function checkStatus() {
  try {
    const response = await fetch(`/api/sync-status?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const status = await response.json();
    remoteSyncEnabled = Boolean(status?.enabled);
  } catch {
    remoteSyncEnabled = false;
  }
}

async function pullFromExcel() {
  if (!remoteSyncEnabled) return;
  try {
    const response = await fetch(`/products.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    const products = Array.isArray(payload?.products) ? payload.products : [];
    if (!products.length) return;

    const remote = JSON.stringify(products);
    if (!lastRemotePayload) {
      lastRemotePayload = remote;
      return;
    }
    if (remote === lastRemotePayload) return;

    lastRemotePayload = remote;
    const categories = Array.isArray(payload?.categories)
      ? payload.categories
      : [...new Set(products.map((product) => product.category).filter(Boolean))];

    localStorage.setItem(PRODUCTS_KEY, remote);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    window.location.reload();
  } catch {}
}

async function pushToExcel() {
  if (!remoteSyncEnabled || pushing) return;
  try {
    const products = readJson(PRODUCTS_KEY, []);
    const categories = readJson(CATEGORIES_KEY, []);
    if (!Array.isArray(products)) return;

    const payloadKey = JSON.stringify({ products, categories });
    if (payloadKey === localStorage.getItem(LAST_PUSHED_KEY)) return;

    pushing = true;
    const response = await fetch("/api/sync-to-excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products, categories, source: "CACHO Store website" })
    });

    if (response.ok) localStorage.setItem(LAST_PUSHED_KEY, payloadKey);
  } catch {} finally {
    pushing = false;
  }
}

async function startRemoteSync() {
  await checkStatus();
  if (!remoteSyncEnabled) return;
  await pullFromExcel();
  await pushToExcel();
  window.setInterval(pullFromExcel, PULL_INTERVAL);
  window.setInterval(pushToExcel, PUSH_INTERVAL);
  window.setInterval(checkStatus, 60000);
}

startRemoteSync();
