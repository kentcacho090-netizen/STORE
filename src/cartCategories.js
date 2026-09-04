const PRODUCTS_KEY = "cacho-store-products-v1";

function loadProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    const products = raw ? JSON.parse(raw) : [];
    return Array.isArray(products) ? products : [];
  } catch {
    return [];
  }
}

let refreshTimer = null;
let isRefreshing = false;
let observerStarted = false;

function refreshCartCategories() {
  if (isRefreshing) return;
  const panel = document.querySelector(".order-panel");
  const head = panel?.querySelector(".order-head");
  const items = panel?.querySelector(".order-items");
  if (!panel || !head || !items) return;

  isRefreshing = true;
  try {
    const products = loadProducts();
    const byName = new Map(products.map((p) => [String(p.name).trim().toLowerCase(), p.category || "Other"]));
    let categoryBar = panel.querySelector(".cart-category-bar");

    if (!categoryBar) {
      categoryBar = document.createElement("div");
      categoryBar.className = "cart-category-bar";
      head.insertAdjacentElement("afterend", categoryBar);
    }

    const itemCategories = [];
    items.querySelectorAll(":scope > .order-item").forEach((item) => {
      const nameEl = item.querySelector(".order-name strong");
      if (!nameEl) return;
      const category = byName.get(nameEl.textContent.trim().toLowerCase()) || "Other";
      itemCategories.push(category);

      let categoryLabel = item.querySelector(":scope > .cart-item-category");
      if (!categoryLabel) {
        categoryLabel = document.createElement("span");
        categoryLabel.className = "cart-item-category";
        nameEl.insertAdjacentElement("afterend", categoryLabel);
      }
      if (categoryLabel.textContent !== category) categoryLabel.textContent = category;
    });

    const uniqueCategories = [...new Set(itemCategories)];
    const html = uniqueCategories.length
      ? `<span class="cart-category-title">Categories</span>${uniqueCategories.map((c) => `<span class="cart-category-pill">${c}</span>`).join("")}`
      : "";
    if (categoryBar.innerHTML !== html) categoryBar.innerHTML = html;
    const display = uniqueCategories.length ? "flex" : "none";
    if (categoryBar.style.display !== display) categoryBar.style.display = display;
  } finally {
    isRefreshing = false;
  }
}

function scheduleRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    refreshTimer = null;
    refreshCartCategories();
  }, 0);
}

function startCartCategoryWatcher() {
  if (observerStarted) return;
  observerStarted = true;
  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(document.body, { childList: true, subtree: true });
  refreshCartCategories();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startCartCategoryWatcher, { once: true });
} else {
  startCartCategoryWatcher();
}
