const STORE = globalThis.__CACHO_ORDERS || new Map();
globalThis.__CACHO_ORDERS = STORE;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "POST") {
    const body = req.body || {};
    const order = body.order;
    if (!order?.orderId) return res.status(400).json({ ok:false, error:"Missing orderId" });
    const existing = STORE.get(String(order.orderId)) || {};
    STORE.set(String(order.orderId), { ...existing, ...order, updatedAt: new Date().toISOString() });
    return res.status(200).json({ ok:true, order: STORE.get(String(order.orderId)) });
  }

  const orderId = String(req.query?.orderId || "").trim();
  if (!orderId) return res.status(400).json({ ok:false, error:"Missing orderId" });
  const order = STORE.get(orderId);
  if (!order) return res.status(404).json({ ok:false, error:"Order not found" });
  return res.status(200).json({ ok:true, order });
}
