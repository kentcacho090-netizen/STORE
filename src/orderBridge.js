const ORDERS_KEY = "cacho-store-orders-v1";

function moneyToNumber(text) {
  const n = Number(String(text || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function readOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function parseCart() {
  return [...document.querySelectorAll(".order-item")].map((row) => {
    const name = row.querySelector(".order-name strong")?.textContent?.trim() || "Product";
    const meta = row.querySelector(".order-name small")?.textContent?.trim() || "";
    const qty = Number(row.querySelector(".qty b")?.textContent || 0);
    const lineTotal = moneyToNumber(row.querySelector(".line-total")?.textContent);
    const priceMatch = meta.match(/₱([0-9,.]+)/);
    return {
      productId: "",
      productName: name,
      category: meta.includes(" · ") ? meta.split(" · ").slice(1).join(" · ") : "",
      unit: "",
      quantity: Number.isFinite(qty) ? qty : 0,
      wholesalePrice: priceMatch ? moneyToNumber(priceMatch[0]) : 0,
      lineTotal
    };
  }).filter((item) => item.quantity > 0);
}

function closeModal() {
  document.getElementById("cacho-order-modal")?.remove();
}

function openCheckout() {
  closeModal();
  const items = parseCart();
  if (!items.length) return;
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const modal = document.createElement("div");
  modal.id = "cacho-order-modal";
  modal.className = "cacho-modal-backdrop";
  modal.innerHTML = `
    <div class="cacho-modal" role="dialog" aria-modal="true" aria-labelledby="cacho-order-title">
      <button class="cacho-modal-close" type="button" aria-label="Close">×</button>
      <div class="cacho-modal-head"><span class="cacho-modal-badge">WHOLESALE ORDER</span><h2 id="cacho-order-title">Complete your order</h2><p>Enter your store details so CACHO STORE can contact you about this order.</p></div>
      <form id="cacho-order-form" class="cacho-order-form">
        <label>Store / customer name<input name="name" required autocomplete="name" placeholder="Juan Dela Cruz / ABC Store"></label>
        <label>Phone number<input name="phone" required autocomplete="tel" inputmode="tel" placeholder="09XX XXX XXXX"></label>
        <label>Delivery / pickup address<textarea name="address" rows="3" placeholder="Complete address or pickup note"></textarea></label>
        <label>Order notes<textarea name="notes" rows="2" placeholder="Optional instructions"></textarea></label>
        <div class="cacho-review-box"><div><span>${items.reduce((s, i) => s + i.quantity, 0)} units</span><span>${items.length} products</span></div><strong>Estimated total ${total.toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</strong></div>
        <div class="cacho-modal-actions"><button class="cacho-secondary" type="button" data-close>Cancel</button><button class="cacho-primary" type="submit">Submit wholesale order →</button></div>
        <p class="cacho-order-status" aria-live="polite"></p>
      </form>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector(".cacho-modal-close").onclick = closeModal;
  modal.querySelector("[data-close]").onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal.querySelector("[name=name]").focus();
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submit = event.currentTarget.querySelector("button[type=submit]");
    const status = event.currentTarget.querySelector(".cacho-order-status");
    submit.disabled = true;
    submit.textContent = "Submitting order…";
    status.textContent = "Sending your wholesale order…";
    const customer = {
      name: String(form.get("name") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      address: String(form.get("address") || "").trim(),
      notes: String(form.get("notes") || "").trim()
    };
    const orderId = `CS-${Date.now().toString().slice(-8)}`;
    const order = { orderId, createdAt: new Date().toISOString(), status: "NEW", customer, items, total };
    let apiSaved = false;
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, items }) });
      apiSaved = response.ok;
    } catch {}
    const localOrders = readOrders();
    saveOrders([order, ...localOrders]);
    status.textContent = apiSaved ? `Order ${orderId} received.` : `Order ${orderId} saved on this device.`;
    status.className = "cacho-order-status success";
    submit.textContent = "Order submitted ✓";
    window.setTimeout(() => {
      closeModal();
      const toast = document.createElement("div");
      toast.className = "cacho-order-success-toast";
      toast.innerHTML = `<strong>Order ${orderId} submitted</strong><span>We received your wholesale order.</span>`;
      document.body.appendChild(toast);
      window.setTimeout(() => toast.remove(), 5000);
    }, 900);
  });
}

function renderOrdersOverlay() {
  closeModal();
  const orders = readOrders();
  const modal = document.createElement("div");
  modal.id = "cacho-order-modal";
  modal.className = "cacho-modal-backdrop";
  const rows = orders.map((order) => `
    <article class="cacho-admin-order">
      <div class="cacho-admin-order-head"><div><b>${order.orderId}</b><span>${new Date(order.createdAt).toLocaleString("en-PH")}</span></div><select data-status="${order.orderId}"><option ${order.status === "NEW" ? "selected" : ""}>NEW</option><option ${order.status === "CONFIRMED" ? "selected" : ""}>CONFIRMED</option><option ${order.status === "PREPARING" ? "selected" : ""}>PREPARING</option><option ${order.status === "READY" ? "selected" : ""}>READY</option><option ${order.status === "DELIVERED" ? "selected" : ""}>DELIVERED</option></select></div>
      <strong>${escapeHtml(order.customer.name)}</strong><span>${escapeHtml(order.customer.phone)}</span><span>${escapeHtml(order.customer.address || "No address provided")}</span>
      <div class="cacho-admin-lines">${order.items.map((item) => `<div><span>${escapeHtml(item.productName)} × ${item.quantity}</span><b>₱${Number(item.lineTotal).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</b></div>`).join("")}</div>
      <div class="cacho-admin-total"><span>Total</span><b>₱${Number(order.total).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</b></div>
    </article>`).join("");
  modal.innerHTML = `<div class="cacho-modal cacho-orders-modal"><button class="cacho-modal-close" type="button">×</button><div class="cacho-modal-head"><span class="cacho-modal-badge">OWNER ORDERS</span><h2>Wholesale orders</h2><p>${orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"} saved on this device.` : "No orders yet."}</p></div><div class="cacho-admin-orders">${rows || `<div class="cacho-no-orders">No wholesale orders have been submitted yet.</div>`}</div></div>`;
  document.body.appendChild(modal);
  modal.querySelector(".cacho-modal-close").onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal.querySelectorAll("select[data-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const next = readOrders().map((order) => order.orderId === select.dataset.status ? { ...order, status: select.value } : order);
      saveOrders(next);
    });
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
}

function addOrdersButton() {
  if (document.getElementById("cacho-orders-nav")) return;
  const nav = document.querySelector(".top-actions");
  if (!nav) return;
  const button = document.createElement("button");
  button.id = "cacho-orders-nav";
  button.type = "button";
  button.className = "nav-btn";
  button.textContent = `Orders (${readOrders().length})`;
  button.onclick = renderOrdersOverlay;
  nav.insertBefore(button, nav.querySelector(".cart-btn") || null);
}

document.addEventListener("click", (event) => {
  const checkout = event.target.closest(".checkout");
  if (checkout && !checkout.disabled) {
    event.preventDefault();
    event.stopPropagation();
    openCheckout();
    return;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  let attempts = 0;
  const timer = window.setInterval(() => {
    addOrdersButton();
    attempts += 1;
    if (attempts > 30) window.clearInterval(timer);
  }, 300);
});
