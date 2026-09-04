export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const webhookUrl = process.env.EXCEL_SYNC_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(503).json({ ok: false, error: "EXCEL_SYNC_WEBHOOK_URL is not configured" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const products = Array.isArray(body?.products) ? body.products : [];
    const categories = Array.isArray(body?.categories) ? body.categories : [];

    const headers = { "Content-Type": "application/json" };
    if (process.env.EXCEL_SYNC_WEBHOOK_TOKEN) {
      headers.Authorization = `Bearer ${process.env.EXCEL_SYNC_WEBHOOK_TOKEN}`;
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "CACHO Store website",
        updatedAt: new Date().toISOString(),
        products,
        categories
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ ok: false, error: `Excel automation rejected the update: ${response.status}`, detail: text.slice(0, 500) });
    }

    return res.status(200).json({ ok: true, products: products.length, categories: categories.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Website-to-Excel sync failed" });
  }
}
