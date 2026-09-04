# CACHO Store

Wholesale grocery catalog and store-management prototype for CACHO Store.

## Current features

- Wholesale-only product catalog
- Product search and categories
- Buyer quantity controls and automatic totals
- Excel-ready catalog data source (`products.json`)
- Owner settings and admin access
- Excel sync endpoint for Power Automate
- Automatic catalog refresh in the website

## Excel catalog workflow

The intended source of truth is an Excel workbook stored in OneDrive for Business or SharePoint. The workbook uses an Excel Table named `ProductsTable` with product name, category, unit, wholesale price, stock quantity, image URL, and active status.

Power Automate reads that table on a schedule and sends the rows to `/api/sync-products`. The endpoint validates a private sync token and updates `products.json`. When CACHO Store is connected to Vercel through GitHub, the commit can trigger a fresh deployment and publish the updated catalog.

See [`EXCEL_SYNC.md`](./EXCEL_SYNC.md) for the complete setup.

## Important security note

The current admin PIN is a **prototype-only client-side lock**. It keeps ordinary visitors from opening the management screen, but it is **not secure enough for a real public production system** because the front-end code is public.

Before using this with real business data, replace the prototype PIN with server-side authentication and move ordering/customer data into a shared database.

## Run locally

```bash
npm install
npm run dev
```
