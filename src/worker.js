const RAW_CATALOG = "https://raw.githubusercontent.com/kentcacho090-netizen/STORE/main/products.json";
const STATUSES = new Set(["NEW", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      image TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'NEW',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      wholesale_price REAL NOT NULL,
      line_total REAL NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`)
  ]);
}

function normalizeProduct(p) {
  return {
    id: Number(p?.id),
    name: String(p?.name || "Product").trim(),
    category: String(p?.category || "Other").trim() || "Other",
    unit: String(p?.unit || "Each").trim() || "Each",
    price: Math.max(0, Number(p?.price || 0)),
    stock: Math.max(0, Math.floor(Number(p?.stock || 0))),
    image: String(p?.image || ""),
    active: p?.active !== false
  };
}

async function seedProducts(db) {
  const count = await db.prepare("SELECT COUNT(*) AS count FROM products").first("count");
  if (Number(count || 0) > 0) return;
  const response = await fetch(RAW_CATALOG, { cf: { cacheTtl: 0, cacheEverything: false } });
  if (!response.ok) throw new Error("Unable to load the existing catalog for D1 seeding.");
  const data = await response.json();
  const products = (Array.isArray(data?.products) ? data.products : []).map(normalizeProduct).filter(p => Number.isFinite(p.id) && p.name);
  if (!products.length) return;
  const now = new Date().toISOString();
  for (let i = 0; i < products.length; i += 50) {
    const batch = products.slice(i, i + 50).map(p => db.prepare(`INSERT OR REPLACE INTO products (id,name,category,unit,price,stock,image,active,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .bind(p.id,p.name,p.category,p.unit,p.price,p.stock,p.image,p.active ? 1 : 0,now));
    await db.batch(batch);
  }
}

async function productsResponse(env) {
  await ensureSchema(env.DB);
  await seedProducts(env.DB);
  const rows = await env.DB.prepare("SELECT id,name,category,unit,price,stock,image,active FROM products WHERE active = 1 ORDER BY category,name").all();
  const products = (rows.results || []).map(p => ({ ...p, active: Boolean(p.active) }));
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  return json({ products, categories, updatedAt: new Date().toISOString() });
}

async function listOrders(env, customerId) {
  await ensureSchema(env.DB);
  const query = customerId
    ? env.DB.prepare("SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC").bind(customerId)
    : env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC");
  const result = await query.all();
  const orders = [];
  for (const order of (result.results || [])) {
    const items = await env.DB.prepare("SELECT product_id AS productId, product_name AS productName, category, unit, quantity, wholesale_price AS wholesalePrice, line_total AS lineTotal FROM order_items WHERE order_id = ? ORDER BY id").bind(order.order_id).all();
    orders.push({
      orderId: order.order_id,
      customerId: order.customer_id,
      customer: { name: order.customer_name, phone: order.phone, address: order.address, notes: order.notes },
      total: order.total,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: items.results || []
    });
  }
  return json({ orders });
}

async function createOrder(env, body) {
  await ensureSchema(env.DB);
  await seedProducts(env.DB);
  const customerId = String(body?.customerId || "").trim();
  const customer = body?.customer || {};
  const name = String(customer.name || "").trim();
  const phone = String(customer.phone || "").trim();
  const address = String(customer.address || "").trim();
  const notes = String(customer.notes || "").trim();
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!customerId || !name || !phone || !items.length) throw new Error("Customer ID, name, phone, and at least one item are required.");

  const validated = [];
  let total = 0;
  for (const raw of items) {
    const productId = Number(raw?.productId);
    const quantity = Math.floor(Number(raw?.quantity));
    if (!Number.isFinite(productId) || quantity <= 0) continue;
    const product = await env.DB.prepare("SELECT id,name,category,unit,price,stock,active FROM products WHERE id = ?").bind(productId).first();
    if (!product || !product.active) throw new Error(`Product ${raw?.productName || productId} is unavailable.`);
    if (quantity > Number(product.stock)) throw new Error(`${product.name} only has ${product.stock} left.`);
    const lineTotal = Number(product.price) * quantity;
    validated.push({ product, quantity, lineTotal });
    total += lineTotal;
  }
  if (!validated.length) throw new Error("No valid items were found in the order.");

  const orderId = `CS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const now = new Date().toISOString();
  const statements = [env.DB.prepare(`INSERT INTO orders (order_id,customer_id,customer_name,phone,address,notes,total,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(orderId,customerId,name,phone,address,notes,total,"NEW",now,now)];
  for (const item of validated) {
    statements.push(env.DB.prepare(`INSERT INTO order_items (order_id,product_id,product_name,category,unit,quantity,wholesale_price,line_total) VALUES (?,?,?,?,?,?,?,?)`).bind(orderId,item.product.id,item.product.name,item.product.category,item.product.unit,item.quantity,item.product.price,item.lineTotal));
    statements.push(env.DB.prepare("UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?").bind(item.quantity,now,item.product.id,item.quantity));
  }
  await env.DB.batch(statements);
  return json({ ok: true, order: { orderId, customerId, customer: {name,phone,address,notes}, total, status: "NEW", createdAt: now, updatedAt: now, items: validated.map(i=>({ productId:i.product.id, productName:i.product.name, category:i.product.category, unit:i.product.unit, quantity:i.quantity, wholesalePrice:i.product.price, lineTotal:i.lineTotal })) } , 201);
}

async function updateOrder(env, orderId, body) {
  await ensureSchema(env.DB);
  const status = String(body?.status || "").toUpperCase();
  if (!STATUSES.has(status)) throw new Error("Invalid order status.");
  const now = new Date().toISOString();
  const result = await env.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE order_id = ?").bind(status,now,orderId).run();
  if (!result.meta?.changes) return json({ error: "Order not found." }, 404);
  return json({ ok: true, orderId, status, updatedAt: now });
}

async function deleteOrder(env, orderId) {
  await ensureSchema(env.DB);
  const order = await env.DB.prepare("SELECT status FROM orders WHERE order_id = ?").bind(orderId).first();
  if (!order) return json({ error: "Order not found." }, 404);
  if (!["DELIVERED","CANCELLED"].includes(order.status)) return json({ error: "Only delivered or cancelled orders can be removed." }, 400);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM order_items WHERE order_id = ?").bind(orderId),
    env.DB.prepare("DELETE FROM orders WHERE order_id = ?").bind(orderId)
  ]);
  return json({ ok: true });
}

function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...cors } });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/products" && request.method === "GET") return productsResponse(env);
      if (url.pathname === "/api/orders" && request.method === "GET") return listOrders(env, url.searchParams.get("customerId"));
      if (url.pathname === "/api/orders" && request.method === "POST") return createOrder(env, await request.json());
      if (url.pathname.startsWith("/api/orders/") && request.method === "PATCH") return updateOrder(env, url.pathname.split("/").pop(), await request.json());
      if (url.pathname.startsWith("/api/orders/") && request.method === "DELETE") return deleteOrder(env, url.pathname.split("/").pop());
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error?.message || "Request failed." }, 500);
    }
  }
};
