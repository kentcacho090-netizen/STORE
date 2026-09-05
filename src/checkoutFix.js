const STYLE_ID = "cacho-checkout-fix-style";
const MODAL_ID = "cacho-checkout-modal";

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${MODAL_ID}{position:fixed;inset:0;background:rgba(9,28,25,.58);display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999;backdrop-filter:blur(5px)}
    .cacho-checkout-card{width:min(560px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 24px 70px rgba(0,0,0,.22);padding:24px;color:#17211f}
    .cacho-checkout-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:18px}.cacho-checkout-head h2{margin:3px 0 5px;font-size:24px}.cacho-checkout-head p{margin:0;color:#75827e;font-size:12px}
    .cacho-close{border:0;background:#edf3f1;color:#50615c;border-radius:10px;width:36px;height:36px;font-size:22px;cursor:pointer}
    .cacho-summary{background:#f6faf8;border:1px solid #e1ece8;border-radius:14px;padding:12px;margin-bottom:16px;display:grid;gap:7px}.cacho-summary-row{display:flex;justify-content:space-between;gap:12px;font-size:12px}.cacho-summary-row span{color:#6e7b77}.cacho-summary-row strong{color:#173b35}
    .cacho-field{display:grid;gap:6px;margin:11px 0}.cacho-field label{font-size:11px;font-weight:800;color:#44534e}.cacho-field input,.cacho-field textarea{font:inherit;width:100%;border:1px solid #d7e2de;border-radius:11px;padding:11px 12px;outline:none;background:#fff}.cacho-field textarea{min-height:76px;resize:vertical}.cacho-field input:focus,.cacho-field textarea:focus{border-color:#83bdb2;box-shadow:0 0 0 3px #0d6b6214}
    .cacho-submit{width:100%;margin-top:8px;border:0;border-radius:12px;padding:13px;background:#0d6b62;color:#fff;font-weight:850;font-size:13px;cursor:pointer}.cacho-submit:disabled{opacity:.55;cursor:not-allowed}
    .cacho-error{background:#fff1f0;border:1px solid #f0cbc7;color:#a24238;border-radius:10px;padding:9px 11px;font-size:11px;margin:10px 0}.cacho-success{background:#edf8f4;border:1px solid #c8e5da;color:#216b5c;border-radius:12px;padding:14px;font-size:12px;line-height:1.5}.cacho-success strong{display:block;font-size:17px;margin-bottom:4px}
    .cacho-order-list{display:grid;gap:7px;margin-bottom:8px}.cacho-order-line{display:flex;justify-content:space-between;gap:10px;font-size:11px}.cacho-order-line span:first-child{color:#475751}.cacho-order-line span:last-child{font-weight:800;color:#183b35}
    @media(max-width:560px){#${MODAL_ID}{padding:10px;align-items:flex-end}.cacho-checkout-card{border-radius:20px 20px 14px 14px;max-height:94vh;padding:18px}.cacho-checkout-head h2{font-size:21px}}
  `;
  document.head.appendChild(style);
}

function money(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseMoney(text) {
  const match = String(text || "").replace(/,/g, "").match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? Number(match[1]) : 0;
}

function readCartFromPage() {
  return [...document.querySelectorAll(".order-panel .order-item")].map((row) => {
    const productName = row.querySelector(".order-name strong")?.textContent?.trim() || "Product";
    const details = row.querySelector(".order-name small")?.textContent?.trim() || "";
    const quantity = Number(row.querySelector(".qty b")?.textContent?.trim() || 0);
    const lineTotal = parseMoney(row.querySelector(".line-total")?.textContent || "0");
    const firstPart = details.split(" · ")[0] || "₱0.00 each";
    const wholesalePrice = parseMoney(firstPart);
    const category = details.includes(" · ") ? details.slice(details.indexOf(" · ") + 3).trim() : "";
    const unit = "";
    return { productId: productName, productName, category, unit, quantity, wholesalePrice, lineTotal };
  }).filter((item) => item.quantity > 0);
}

function closeModal() {
  document.getElementById(MODAL_ID)?.remove();
  document.body.style.overflow = "";
}

function openCheckout() {
  const items = readCartFromPage();
  if (!items.length) return;
  addStyles();
  closeModal();

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const modal = document.createElement("div");
  modal.id = MODAL_ID;
  modal.innerHTML = `
    <div class="cacho-checkout-card" role="dialog" aria-modal="true" aria-labelledby="cacho-checkout-title">
      <div class="cacho-checkout-head">
        <div><div style="font-size:10px;font-weight:850;letter-spacing:.16em;color:#0d6b62">WHOLESALE ORDER</div><h2 id="cacho-checkout-title">Review your order</h2><p>Enter your contact details so CACHO STORE can receive your order.</p></div>
        <button class="cacho-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="cacho-summary"><div class="cacho-summary-row"><span>Products</span><strong>${items.length}</strong></div><div class="cacho-summary-row"><span>Total units</span><strong>${items.reduce((s,i)=>s+i.quantity,0)}</strong></div><div class="cacho-summary-row"><span>Wholesale total</span><strong>${money(total)}</strong></div></div>
      <div class="cacho-order-list">${items.map((item)=>`<div class="cacho-order-line"><span>${item.productName} × ${item.quantity}</span><span>${money(item.lineTotal)}</span></div>`).join("")}</div>
      <form class="cacho-checkout-form">
        <div class="cacho-field"><label for="cacho-name">Customer / Store Name *</label><input id="cacho-name" name="name" required autocomplete="name" placeholder="Juan Dela Cruz / Store Name"></div>
        <div class="cacho-field"><label for="cacho-phone">Phone Number *</label><input id="cacho-phone" name="phone" required autocomplete="tel" inputmode="tel" placeholder="09XXXXXXXXX"></div>
        <div class="cacho-field"><label for="cacho-address">Delivery / Pickup Address</label><textarea id="cacho-address" name="address" placeholder="Complete address or pickup details"></textarea></div>
        <div class="cacho-field"><label for="cacho-notes">Order Notes</label><textarea id="cacho-notes" name="notes" placeholder="Preferred delivery time, special instructions, etc."></textarea></div>
        <div class="cacho-error" hidden></div>
        <button class="cacho-submit" type="submit">Submit wholesale order · ${money(total)}</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  modal.querySelector(".cacho-close")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  modal.querySelector("#cacho-name")?.focus();

  modal.querySelector("form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submit = modal.querySelector(".cacho-submit");
    const error = modal.querySelector(".cacho-error");
    error.hidden = true;
    submit.disabled = true;
    submit.textContent = "Submitting order…";
    const customer = { name: String(form.get("name") || "").trim(), phone: String(form.get("phone") || "").trim(), address: String(form.get("address") || "").trim(), notes: String(form.get("notes") || "").trim() };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, items }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "The order could not be submitted.");
      const orderId = data.order?.orderId || "CACHO-ORDER";
      localStorage.setItem("cacho-last-order-v1", JSON.stringify({ orderId, createdAt: new Date().toISOString(), customer, items, total }));
      modal.querySelector(".cacho-checkout-card").innerHTML = `<div class="cacho-checkout-head"><div><div style="font-size:10px;font-weight:850;letter-spacing:.16em;color:#0d6b62">ORDER RECEIVED</div><h2>Thank you!</h2><p>Your wholesale order has been submitted.</p></div></div><div class="cacho-success"><strong>Order #${orderId}</strong>CACHO STORE has received your order request. Please keep this order number for follow-up.</div><button class="cacho-submit" type="button" style="margin-top:14px">Done</button>`;
      modal.querySelector(".cacho-submit")?.addEventListener("click", closeModal);
      const cartButton = document.querySelector(".order-panel .checkout");
      cartButton?.dispatchEvent(new Event("cacho:order-submitted"));
    } catch (err) {
      error.textContent = err?.message || "Unable to submit the order. Please try again.";
      error.hidden = false;
      submit.disabled = false;
      submit.textContent = `Submit wholesale order · ${money(total)}`;
    }
  });
}

if (!window.__cachoCheckoutFixInstalled) {
  window.__cachoCheckoutFixInstalled = true;
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".checkout");
    if (!button || button.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    openCheckout();
  }, true);
}
