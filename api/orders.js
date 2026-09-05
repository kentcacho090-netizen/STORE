const orders = globalThis.__CACHO_ORDERS_STORE || new Map();
globalThis.__CACHO_ORDERS_STORE = orders;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    const orderId = String(req.query?.orderId || "").trim();
    if (orderId) {
      const order = orders.get(orderId);
      if (!order) return res.status(404).json({ ok:false, error:"Order not found" });
      return res.status(200).json({ ok:true, order });
    }
    return res.status(200).json({ ok:true, orders:[...orders.values()].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)) });
  }

  const body = req.body || {};

  if (req.method === "PATCH") {
    const orderId = String(body.orderId || "").trim();
    const status = String(body.status || "").trim().toUpperCase();
    const allowed = new Set(["NEW","CONFIRMED","PREPARING","READY","DELIVERED","CANCELLED"]);
    if (!orderId || !allowed.has(status)) return res.status(400).json({ ok:false, error:"Valid orderId and status are required." });
    const existing = orders.get(orderId);
    if (!existing) return res.status(404).json({ ok:false, error:"Order not found" });
    const updated = { ...existing, status, updatedAt:new Date().toISOString() };
    orders.set(orderId, updated);
    return res.status(200).json({ ok:true, order:updated });
  }

  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });

  const customer = body.customer || {};
  const items = Array.isArray(body.items) ? body.items : [];
  if (!customer.name || !customer.phone || items.length === 0) {
    return res.status(400).json({ error:"Customer name, phone, and at least one item are required." });
  }

  const id = `CS-${Date.now().toString().slice(-8)}`;
  const createdAt = new Date().toISOString();
  const total = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
  const order = {
    orderId:id,
    createdAt,
    updatedAt:createdAt,
    status:"NEW",
    customer:{
      name:String(customer.name).trim(),
      phone:String(customer.phone).trim(),
      address:String(customer.address || "").trim(),
      notes:String(customer.notes || "").trim()
    },
    items:items.map(item=>({
      productId:String(item.productId || ""),
      productName:String(item.productName || "").trim(),
      category:String(item.category || "").trim(),
      unit:String(item.unit || "").trim(),
      quantity:Math.max(1, Number(item.quantity || 1)),
      wholesalePrice:Number(item.wholesalePrice || 0),
      lineTotal:Number(item.lineTotal || 0)
    })),
    total
  };
  orders.set(id, order);
  console.log("CACHO STORE NEW ORDER", JSON.stringify(order));
  return res.status(200).json({ ok:true, order });
}
