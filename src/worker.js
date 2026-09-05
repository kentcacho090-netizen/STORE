const RAW_CATALOG = "https://raw.githubusercontent.com/kentcacho090-netizen/STORE/main/products.json";
const STATUSES = ["NEW", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", ...cors }
});

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

function normalizeProduct(product) {
  return {
    id: Number(product?.id),
    name: String(product?.name || "Product").trim() || "Product",
    category: String(product?.category || "Other").trim() || "Other",
    unit: String(product?.unit || "Each").trim() || "Each",
    price: Math.max(0, Number(product?.price || 0)),
    stock: Math.max(0, Math.floor(Number(product?.stock || 0))),
    image: String(product?.image || ""),
    active: product?.active !== false
  };
}

async function seedProducts(db) {
  const count = await db.prepare("SELECT COUNT(*) AS count FROM products").first("count");
  if (Number(count || 0) > 0) return;

  const response = await fetch(RAW_CATALOG);
  if (!response.ok) throw new Error("Unable to load the existing catalog for D1 seeding.");

  const data = await response.json();
  const products = (Array.isArray(data?.products) ? data.products : [])
    .map(normalizeProduct)
    .filter((product) => Number.isFinite(product.id) && product.name);

  const now = new Date().toISOString();
  for (let i = 0; i < products.length; i += 50) {
    const statements = products.slice(i, i + 50).map((product) => db.prepare(
      "INSERT OR REPLACE INTO products (id,name,category,unit,price,stock,image,active,updated_at) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(
      product.id,
      product.name,
      product.category,
      product.unit,
      product.price,
      product.stock,
      product.image,
      product.active ? 1 : 0,
      now
    ));
    if (statements.length) await db.batch(statements);
  }
}

async function getProducts(env) {
  await ensureSchema(env.DB);
  await seedProducts(env.DB);

  const result = await env.DB.prepare(
    "SELECT id,name,category,unit,price,stock,image,active FROM products WHERE active = 1 ORDER BY category,name"
  ).all();

  const products = (result.results || []).map((product) => ({
    ...product,
    active: Boolean(product.active)
  }));

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  return json({ products, categories });
}

async function getOrdersForCustomer(env, customerId) {
  const id = String(customerId || "").trim();
  if (!id) return json({ error: "customerId is required." }, 400);

  await ensureSchema(env.DB);
  const result = await env.DB.prepare(
    "SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC"
  ).bind(id).all();

  const orders = [];
  for (const order of result.results || []) {
    const items = await env.DB.prepare(
      "SELECT product_id AS productId,product_name AS productName,category,unit,quantity,wholesale_price AS wholesalePrice,line_total AS lineTotal FROM order_items WHERE order_id = ? ORDER BY id"
    ).bind(order.order_id).all();

    orders.push({
      orderId: order.order_id,
      customerId: order.customer_id,
      customer: {
        name: order.customer_name,
        phone: order.phone,
        address: order.address,
        notes: order.notes
      },
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
  const customerName = String(customer.name || "").trim();
  const phone = String(customer.phone || "").trim();
  const address = String(customer.address || "").trim();
  const notes = String(customer.notes || "").trim();
  const requestedItems = Array.isArray(body?.items) ? body.items : [];

  if (!customerId || !customerName || !phone || !requestedItems.length) {
    return json({ error: "Customer ID, name, phone, and at least one item are required." }, 400);
  }

  const validated = [];
  let total = 0;

  for (const requested of requestedItems) {
    const productId = Number(requested?.productId);
    const quantity = Math.floor(Number(requested?.quantity));
    if (!Number.isFinite(productId) || quantity <= 0) continue;

    const product = await env.DB.prepare(
      "SELECT id,name,category,unit,price,stock,active FROM products WHERE id = ?"
    ).bind(productId).first();

    if (!product || !product.active) {
      return json({ error: `${requested?.productName || productId} is unavailable.` }, 400);
    }

    if (quantity > Number(product.stock)) {
      return json({ error: `${product.name} only has ${product.stock} left.` }, 400);
    }

    const lineTotal = Number(product.price) * quantity;
    validated.push({ product, quantity, lineTotal });
    total += lineTotal;
  }

  if (!validated.length) return json({ error: "No valid items were found in the order." }, 400);

  const orderId = `CS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();

  const statements = [
    env.DB.prepare(
      "INSERT INTO orders (order_id,customer_id,customer_name,phone,address,notes,total,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).bind(orderId, customerId, customerName, phone, address, notes, total, "NEW", now, now)
  ];

  for (const item of validated) {
    statements.push(
      env.DB.prepare(
        "INSERT INTO order_items (order_id,product_id,product_name,category,unit,quantity,wholesale_price,line_total) VALUES (?,?,?,?,?,?,?,?)"
      ).bind(
        orderId,
        item.product.id,
        item.product.name,
        item.product.category,
        item.product.unit,
        item.quantity,
        item.product.price,
        item.lineTotal
      )
    );
    statements.push(
      env.DB.prepare(
        "UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?"
      ).bind(item.quantity, now, item.product.id, item.quantity)
    );
  }

  await env.DB.batch(statements);

  return json({
    ok: true,
    order: {
      orderId,
      customerId,
      customer: { name: customerName, phone, address, notes },
      total,
      status: "NEW",
      createdAt: now,
      updatedAt: now,
      items: validated.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        unit: item.product.unit,
        quantity: item.quantity,
        wholesalePrice: item.product.price,
        lineTotal: item.lineTotal
      }))
    }
  }, 201);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);

    try {
      if (url.pathname === "/api/products" && request.method === "GET") {
        return getProducts(env);
      }

      if (url.pathname === "/api/orders" && request.method === "GET") {
        return getOrdersForCustomer(env, url.searchParams.get("customerId"));
      }

      if (url.pathname === "/api/orders" && request.method === "POST") {
        return createOrder(env, await request.json());
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error?.message || "Request failed." }, 500);
    }
  }
};
