const ORDERS_KEY="cacho-store-orders-v1";
function readOrders(){try{const raw=localStorage.getItem(ORDERS_KEY);const data=raw?JSON.parse(raw):[];return Array.isArray(data)?data:[]}catch{return[]}}
function money(v){return `₱${Number(v||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`}
function escapeHtml(v){return String(v||"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]))}
function close(){document.getElementById("cacho-my-orders-modal")?.remove()}
function render(){
 const orders=readOrders(); close(); const modal=document.createElement("div");modal.id="cacho-my-orders-modal";modal.className="customer-orders-backdrop";
 const cards=orders.map(o=>`<article class="customer-order-card"><div class="customer-order-top"><div><strong>${escapeHtml(o.customer?.name||"My order")}</strong><small>${new Date(o.createdAt).toLocaleString("en-PH")}</small></div><span class="customer-status">${escapeHtml(o.status||"NEW")}</span></div><div class="customer-order-products">${(o.items||[]).map(i=>`<div><span>${escapeHtml(i.productName)} × ${Number(i.quantity||0)}</span><b>${money(i.lineTotal)}</b></div>`).join("")}</div><div class="customer-order-total"><span>Total</span><b>${money(o.total)}</b></div></article>`).join("");
 modal.innerHTML=`<div class="customer-orders-modal"><button class="customer-orders-close" type="button">×</button><div class="customer-orders-head"><span>MY ORDERS</span><h2>Your order history</h2><p>See what you ordered and the latest status, including completed orders.</p></div>${cards||`<div class="customer-orders-empty"><strong>No orders yet.</strong><p>Your submitted wholesale orders will appear here.</p></div>`}</div>`;
 document.body.appendChild(modal);modal.querySelector(".customer-orders-close").onclick=close;modal.addEventListener("click",e=>{if(e.target===modal)close()});
}
function updateCount(){const el=document.getElementById("cacho-orders-count");if(el)el.textContent=String(readOrders().length)}
function install(){const b=document.getElementById("cacho-my-orders");if(!b)return false;b.onclick=render;updateCount();return true}
window.setInterval(install,500);document.addEventListener("DOMContentLoaded",install);window.addEventListener("storage",updateCount);
window.__cachoUpdateOrderCount=updateCount;
