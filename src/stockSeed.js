const PRODUCTS_KEY = "cacho-store-products-v1";
const STOCK_SEED_VERSION = "cacho-store-stock-seed-v1";

// Demo inventory for testing the wholesale ordering flow.
// Every catalog item that currently has zero stock receives a deterministic
// quantity between 150 and 200. Existing non-zero stock is preserved.
try {
  if (localStorage.getItem(STOCK_SEED_VERSION) !== "applied") {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    const products = raw ? JSON.parse(raw) : null;
    if (Array.isArray(products)) {
      const next = products.map((product) => {
        if (Number(product?.stock) > 0) return product;
        const id = Number(product?.id) || 0;
        const demoStock = 150 + (Math.abs(id) % 51);
        return { ...product, stock: demoStock };
      });
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next));
      localStorage.setItem(STOCK_SEED_VERSION, "applied");
    }
  }
} catch {}
