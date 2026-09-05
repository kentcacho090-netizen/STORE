const ORDERS_KEY = "cacho-store-orders-v1";
const ADMIN_TAB_ID = "cacho-admin-tabs";

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
  window.dispatchEvent(new CustomEvent("cacho:orders-updated"));
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

function statusLabel(status) {
  return status === "CANCELLED" ? "Cancelled" : status.charAt(0) + status.slice(1).toLowerCase();
}

function customerOrderCard(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const isDone = order.status === "DELIVERED" || order.status === "CANCELLED";
  return `
    <article class="cacho-customer-order ${isDone ? "is-done" : ""}">
      <div class="cacho-customer-order-head">
        <div>
          <span class="cacho-customer-order-date">${new Date(order.createdAt).toLocaleString("en-PH")}</span>
          <h3>${itemCount} item${itemCount === 1 ? "" : "s"} · ${items.length} product${items.length === 1 ? "" : "s"}</h3>
        </div>
        <span class="cacho-status-pill status-${String(order.status || "NEW").toLowerCase()}">${statusLabel(order.status || "NEW")}</span>
      </div>
      <div class="cacho-customer-items">
        ${items.map((item) => `<div class="cacho-customer-item"><span>${escapeHtml(item.productName)}${item.unit ? ` <small>${escapeHtml(item.unit)}</small>` : ""}</span><b>× ${Number(item.quantity || 0)}</b></div>`).join("")}
      </div>
      <div class="cacho-customer-total"><span>Total</span><strong>₱${Number(order.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</strong></div>
      ${isDone ? `<div class="cacho-completed-note">This order is ${order.status === "DELIVERED" ? "completed and delivered" : "cancelled"}. It stays here so you can still see what you ordered.</div>` : ""}
      <div class="cacho-reference">Reference: ${escapeHtml(order.orderId)}</div>
    </article>`;
}

function renderCustomerOrdersOverlay() {
  closeModal();
  const orders = readOrders();
  const modal = document.createElement("div");
  modal.id = "cacho-order-modal";
  modal.className = "cacho-modal-backdrop";
  modal.innerHTML = `
    <div class="cacho-modal cacho-orders-modal customer-orders-modal" role="dialog" aria-modal="true">
      <button class="cacho-modal-close" type="button" aria-label="Close">×</button>
      <div class="cacho-modal-head">
        <span class="cacho-modal-badge">MY ORDERS</span>
        <h2>Your orders</h2>
        <p>See what you ordered and the current status. Completed orders remain visible in your history.</p>
      </div>
      <div class="cacho-customer-orders">
        ${orders.length ? orders.map(customerOrderCard).join("") : `<div class="cacho-no-orders"><strong>No orders yet</strong><br>Add products to your order and submit it to see your order history here.</div>`}
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector(".cacho-modal-close").onclick = closeModal;
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
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
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, items }) });
      if (!response.ok) throw new Error("Order could not be submitted right now.");
    } catch (error) {
      status.textContent = error?.message || "Unable to submit the order. Please try again.";
      submit.disabled = false;
      submit.textContent = "Submit wholesale order →";
      return;
    }
    saveOrders([order, ...readOrders()]);
    localStorage.setItem("cacho-last-order-v1", JSON.stringify(order));
    status.textContent = `Order received. You can track it from My Orders.`;
    status.className = "cacho-order-status success";
    submit.textContent = "Order submitted ✓";
    window.setTimeout(() => {
      closeModal();
      const toast = document.createElement("div");
      toast.className = "cacho-order-success-toast";
      toast.innerHTML = `<strong>Wholesale order submitted</strong><span>You can check the items and status from My Orders.</span>`;
      document.body.appendChild(toast);
      window.setTimeout(() => toast.remove(), 5000);
    }, 900);
  });
}

function adminOrderCard(order) {
  const canRemove = order.status === "DELIVERED" || order.status === "CANCELLED";
  return `
    <article class="cacho-admin-order">
      <div class="cacho-admin-order-head">
        <div><b>${escapeHtml(order.orderId)}</b><span>${new Date(order.createdAt).toLocaleString("en-PH")}</span></div>
        <div class="cacho-admin-order-controls">
          <select data-status="${escapeHtml(order.orderId)}"><option ${order.status === "NEW" ? "selected" : ""}>NEW</option><option ${order.status === "CONFIRMED" ? "selected" : ""}>CONFIRMED</option><option ${order.status === "PREPARING" ? "selected" : ""}>PREPARING</option><option ${order.status === "READY" ? "selected" : ""}>READY</option><option ${order.status === "DELIVERED" ? "selected" : ""}>DELIVERED</option><option ${order.status === "CANCELLED" ? "selected" : ""}>CANCELLED</option></select>
          ${canRemove ? `<button type="button" class="cacho-remove-order" data-remove="${escapeHtml(order.orderId)}">Remove</button>` : ""}
        </div>
      </div>
      <strong>${escapeHtml(order.customer?.name || "Customer")}</strong><span>${escapeHtml(order.customer?.phone || "")}</span><span>${escapeHtml(order.customer?.address || "No address provided")}</span>
      <div class="cacho-admin-lines">${(order.items || []).map((item) => `<div><span>${escapeHtml(item.productName)} × ${Number(item.quantity || 0)}</span><b>₱${Number(item.lineTotal || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</b></div>`).join("")}</div>
      <div class="cacho-admin-total"><span>Total</span><b>₱${Number(order.total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</b></div>
    </article>`;
}

function renderAdminOrdersOverlay() {
  closeModal();
  const orders = readOrders();
  const modal = document.createElement("div");
  modal.id = "cacho-order-modal";
  modal.className = "cacho-modal-backdrop";
  modal.innerHTML = `<div class="cacho-modal cacho-orders-modal"><button class="cacho-modal-close" type="button" aria-label="Close">×</button><div class="cacho-modal-head"><span class="cacho-modal-badge">OWNER ORDERS</span><h2>Wholesale orders</h2><p>${orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"} saved on this device.` : "No orders yet."}</p></div><div class="cacho-admin-orders">${orders.length ? orders.map(adminOrderCard).join("") : `<div class="cacho-no-orders">No wholesale orders have been submitted yet.</div>`}</div></div>`;
  document.body.appendChild(modal);
  modal.querySelector(".cacho-modal-close").onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal.querySelectorAll("select[data-status]").forEach((select) => {
    select.addEventListener("change", () => {
      const next = readOrders().map((order) => order.orderId === select.dataset.status ? { ...order, status: select.value } : order);
      saveOrders(next);
      renderAdminOrdersOverlay();
    });
  });
  modal.querySelectorAll("button[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.remove;
      const order = readOrders().find((item) => item.orderId === orderId);
      if (!order) return;
      if (!window.confirm(`Remove this ${order.status.toLowerCase()} order from the admin order list?`)) return;
      saveOrders(readOrders().filter((item) => item.orderId !== orderId));
      renderAdminOrdersOverlay();
    });
  });
}

function addOrUpdateOrdersButton() {
  const nav = document.querySelector(".top-actions");
  if (!nav) return;
  let button = document.getElementById("cacho-orders-nav");
  if (!button) {
    button = document.createElement("button");
    button.id = "cacho-orders-nav";
    button.type = "button";
    button.className = "nav-btn";
    button.onclick = renderCustomerOrdersOverlay;
    nav.insertBefore(button, nav.querySelector(".cart-btn") || null);
  }
  const count = readOrders().length;
  button.textContent = `My Orders (${count})`;
}

function addAdminTabs() {
  const adminPage = document.querySelector(".admin-page");
  if (!adminPage) return;
  let tabs = document.getElementById(ADMIN_TAB_ID);
  if (!tabs) {
    tabs = document.createElement("div");
    tabs.id = ADMIN_TAB_ID;
    tabs.className = "cacho-admin-tabs";
    tabs.innerHTML = `
      <button type="button" class="active" data-tab="configure">Configure Price</button>
      <button type="button" data-tab="orders">Orders</button>
      <button type="button" data-tab="password">Change Password</button>`;
    const hero = adminPage.querySelector(".admin-hero");
    hero?.insertAdjacentElement("afterend", tabs);
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-tab]");
      if (!button) return;
      tabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
      const tab = button.dataset.tab;
      if (tab === "configure") {
        document.querySelector(".admin-layout")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (tab === "orders") {
        renderAdminOrdersOverlay();
      } else if (tab === "password") {
        openPasswordOverlay();
      }
    });
  }
}

function openPasswordOverlay() {
  closeModal();
  const modal = document.createElement("div");
  modal.id = "cacho-order-modal";
  modal.className = "cacho-modal-backdrop";
  modal.innerHTML = `<div class="cacho-modal" role="dialog" aria-modal="true"><button class="cacho-modal-close" type="button" aria-label="Close">×</button><div class="cacho-modal-head"><span class="cacho-modal-badge">OWNER SECURITY</span><h2>Change password</h2><p>Change the owner PIN used for this browser session.</p></div><form id="cacho-password-form" class="cacho-order-form"><label>Current PIN<input type="password" name="current" inputmode="numeric" required></label><label>New PIN<input type="password" name="next" inputmode="numeric" minlength="4" required placeholder="4 digits or more"></label><label>Confirm new PIN<input type="password" name="confirm" inputmode="numeric" minlength="4" required></label><p class="cacho-order-status" aria-live="polite"></p><div class="cacho-modal-actions"><button class="cacho-secondary" type="button" data-close>Cancel</button><button class="cacho-primary" type="submit">Save new PIN</button></div></form></div>`;
  document.body.appendChild(modal);
  modal.querySelector(".cacho-modal-close").onclick = closeModal;
  modal.querySelector("[data-close]").onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = String(form.get("current") || "");
    const next = String(form.get("next") || "");
    const confirm = String(form.get("confirm") || "");
    const status = event.currentTarget.querySelector(".cacho-order-status");
    const stored = localStorage.getItem("cacho-admin-pin") || "2580";
    if (current !== stored) { status.textContent = "Current PIN is incorrect."; return; }
    if (next.length < 4 || next !== confirm) { status.textContent = "Make sure the new PINs match and are at least 4 characters."; return; }
    localStorage.setItem("cacho-admin-pin", next);
    status.textContent = "PIN changed successfully on this browser.";
    status.className = "cacho-order-status success";
    window.setTimeout(closeModal, 700);
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char]));
}

document.addEventListener("click", (event) => {
  const checkout = event.target.closest(".checkout");
  if (checkout && !checkout.disabled) {
    event.preventDefault();
    event.stopPropagation();
    openCheckout();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  let attempts = 0;
  const timer = window.setInterval(() => {
    addOrUpdateOrdersButton();
    addAdminTabs();
    attempts += 1;
    if (attempts > 40) window.clearInterval(timer);
  }, 300);
});

window.addEventListener("cacho:orders-updated", () => {
  addOrUpdateOrdersButton();
});
