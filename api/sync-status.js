export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ enabled: false, error: "Method not allowed" });
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(200).json({
    enabled: Boolean(process.env.EXCEL_SYNC_WEBHOOK_URL),
    mode: "two-way",
    pullSource: "/products.json",
    pushTarget: Boolean(process.env.EXCEL_SYNC_WEBHOOK_URL) ? "Excel automation webhook" : null
  });
}
