# CACHO STORE

Wholesale grocery ordering prototype for CACHO Store.

## Current MVP

- Wholesale-only product catalog
- Product search and categories
- Buyer quantity controls
- Automatic wholesale order totals
- Stock-aware ordering
- **Manage Store** product editor
- Add, edit, and delete products
- Change wholesale price and stock quantity
- Upload product images
- Create and remove categories
- Export/import a JSON store backup
- Responsive mobile layout

## Product management

Open **Manage Store** from the top navigation.

You can change a product's wholesale price or stock, create new products, upload an image, and organize categories without editing the React source code.

Product and category changes currently persist in the browser using `localStorage`. This makes the management tools functional for the current prototype, but the data is tied to the browser/device. The next production step should move products, orders, users, and inventory into a shared database with real authentication.

Use **Export backup** regularly while the store is running on local browser storage.

## Run locally

```bash
npm install
npm run dev
```
