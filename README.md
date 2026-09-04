# CACHO Store

Wholesale grocery catalog and store-management prototype for CACHO Store.

## Current features

- Wholesale-only product catalog
- Product search and categories
- Buyer quantity controls and automatic totals
- Product management area
- Add, edit, and delete products
- Update stock quickly
- Change wholesale prices
- Upload product photos
- Add and remove categories
- Export/import store backups
- Admin access screen with session lock

## Important security note

The current admin PIN is a **prototype-only client-side lock**. It keeps ordinary visitors from opening the management screen, but it is **not secure enough for a real public production system** because the front-end code is public.

Before using this with real business data, replace the prototype PIN with server-side authentication (for example, Supabase Auth, Clerk, or a Vercel server-side login) and store products in a shared database.

## Run locally

```bash
npm install
npm run dev
```
