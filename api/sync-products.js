const OWNER = process.env.GITHUB_OWNER || "kentcacho090-netizen";
const REPO = process.env.GITHUB_REPO || "STORE";
const PRODUCTS_PATH = "products.json";

function normalizeProduct(row, index) {
  const id = Number(row["Product ID"] ?? row.productId ?? row.id ?? index + 1);
  const name = String(row["Product Name"] ?? row.name ?? "").trim();
  const category = String(row["Category"] ?? row.category ?? "Uncategorized").trim();
  const unit = String(row["Unit / Size"] ?? row.unit ?? "").trim();
  const price = Number(row["Wholesale Price"] ?? row.price ?? 0);
  const stock = Number(row["Stock Quantity"] ?? row.stock ?? 0);
  const image = String(row["Image URL"] ?? row.image ?? "").trim();
  const activeValue = row["Active"] ?? row.active ?? true;
  const active = activeValue === true || String(activeValue).toLowerCase() === "true" || String(activeValue).toLowerCase() === "yes";

  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return null;
  return { id: Number.isFinite(id) ? id : index + 1, name, category: category || "Uncategorized", unit, price, stock, image, active };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const expectedToken = process.env.SYNC_TOKEN;
  const suppliedToken = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!expectedToken || suppliedToken !== expectedToken) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const rows = Array.isArray(body?.products) ? body.products : Array.isArray(body?.rows) ? body.rows : [];
    const products = rows.map(normalizeProduct).filter(Boolean);
    const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    const payload = JSON.stringify({ updatedAt: new Date().toISOString(), source: "Excel Online / Power Automate", categories, products }, null, 2) + "\n";

    const headers = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    };

    if (!process.env.GITHUB_TOKEN) return res.status(500).json({ ok: false, error: "GITHUB_TOKEN is not configured" });

    const fileUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PRODUCTS_PATH}`;
    const currentResponse = await fetch(fileUrl, { headers });
    if (!currentResponse.ok) throw new Error(`GitHub read failed: ${currentResponse.status}`);
    const current = await currentResponse.json();

    const updateResponse = await fetch(fileUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `sync: update catalog from Excel (${new Date().toISOString()})`,
        content: Buffer.from(payload, "utf8").toString("base64"),
        sha: current.sha,
        branch: "main"
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`GitHub write failed: ${updateResponse.status} ${errorText}`);
    }

    return res.status(200).json({ ok: true, products: products.length, categories: categories.length, updatedAt: JSON.parse(payload).updatedAt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Sync failed" });
  }
}
