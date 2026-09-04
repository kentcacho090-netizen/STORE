# CACHO Store — Excel Sync Setup

CACHO Store can use an Excel workbook as the catalog source of truth.

## Excel columns

Use the `Products` worksheet and keep the data in an Excel Table named `ProductsTable` with these columns:

- Product ID
- Product Name
- Category
- Unit / Size
- Wholesale Price
- Stock Quantity
- Image URL
- Active

A starter workbook is provided separately as `CACHO_Store_Products.xlsx`.

## Data flow

Excel Online (Business) → Power Automate → `POST /api/sync-products` → GitHub `products.json` → Vercel deployment → CACHO Store catalog.

The website also refreshes the catalog every 60 seconds. The published `products.json` is the public read model; the Excel workbook remains the place where the owner edits the catalog.

## Vercel environment variables

Set these on the CACHO Store Vercel project:

- `SYNC_TOKEN` — a long random secret used by Power Automate when calling the sync endpoint.
- `GITHUB_TOKEN` — a GitHub token with permission to update repository contents.
- `GITHUB_OWNER` — `kentcacho090-netizen` (optional; this is the default).
- `GITHUB_REPO` — `STORE` (optional; this is the default).

Never commit these secrets to GitHub or put them in browser code.

## Power Automate flow

Use Excel Online (Business) with a workbook stored in OneDrive for Business or SharePoint. Microsoft documents that this connector can list rows from an Excel table. For this project, use a scheduled flow so the catalog is checked automatically.

1. Trigger: **Recurrence**. Five minutes is a reasonable starting interval.
2. Action: **List rows present in a table**.
3. Select the OneDrive/SharePoint location, workbook, and `ProductsTable`.
4. Build a JSON body with the rows returned by Excel, for example:

```json
{
  "products": [
    {
      "Product ID": 1,
      "Product Name": "Lucky Me! Pancit Canton",
      "Category": "Noodles",
      "Unit / Size": "60g",
      "Wholesale Price": 12.5,
      "Stock Quantity": 150,
      "Image URL": "",
      "Active": true
    }
  ]
}
```

5. Send an HTTP `POST` to your deployed CACHO Store URL plus `/api/sync-products`.
6. Add this header:

`Authorization: Bearer <SYNC_TOKEN>`

7. Set content type to `application/json`.

The sync endpoint validates the secret, normalizes the Excel rows, updates `products.json`, and returns a JSON result with the product count and sync time.

## Important behavior

Excel Online (Business) can have short delays when working with workbook data, and Microsoft documents limitations around simultaneous edits and backend update timing. Do not rely on the website being updated literally at the same second an Excel cell is changed.

The production version should keep Excel as the owner-editing interface while customer ordering data is stored separately in a database. Do not use Excel as the order database.
