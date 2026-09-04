const PRODUCTS_KEY = "cacho-store-products-v1";

// Public product photos found online for the starter catalog.
// These are used only when a product does not already have an image.
const IMAGE_MAP = {
  "Lucky Me! Pancit Canton": "https://cdn.mafrservices.com/sys-master-root/hfe/hfa/14787587145758/595516_main.jpg",
  "Coca-Cola": "https://www.promiselandmart.com/cdn/shop/files/COKE_BOTTLED_1.5L_1024x1024%402x.jpg?v=1710311027",
  "Surf Powder Detergent": "https://pasal101.thulo.com.np/assets/tenant/uploads/media-uploader/pasal101/20240628012225_1553008696.jpg",
  "Bear Brand Fortified": "https://ph-test-11.slatic.net/p/3fd1183ccb8af6ee918453085d1833a7.jpg",
  "Argentina Corned Beef": "https://k2pharmacy.ph/cdn/shop/files/ArgentinaCornedBeef175g1-fotor-20240627154056_grande.jpg?v=1720416375",
  "Jack 'n Jill Piattos": "https://merkadoph.se/cdn/shop/files/piattos-cheese-85g.jpg?v=1705102773&width=1445"
};

try {
  const raw = localStorage.getItem(PRODUCTS_KEY);
  const products = raw ? JSON.parse(raw) : null;

  if (Array.isArray(products)) {
    const next = products.map((product) => {
      if (product?.image || !IMAGE_MAP[product?.name]) return product;
      return { ...product, image: IMAGE_MAP[product.name] };
    });
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next));
  }
} catch {}

export { IMAGE_MAP };
