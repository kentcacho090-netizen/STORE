const PRODUCTS_KEY = "cacho-store-products-v1";

// Public product photos found online. The store only uses these when a product
// does not already have an owner-supplied image. Placeholder images remain for
// products that still need an exact photo match.
const IMAGE_MAP = {
  "Lucky Me! Pancit Canton": "https://cdn.mafrservices.com/sys-master-root/hfe/hfa/14787587145758/595516_main.jpg",
  "Lucky Me! Pancit Canton Original": "https://cdn.mafrservices.com/sys-master-root/hfe/hfa/14787587145758/595516_main.jpg",
  "Coca-Cola": "https://www.promiselandmart.com/cdn/shop/files/COKE_BOTTLED_1.5L_1024x1024%402x.jpg?v=1710311027",
  "Coca-Cola Original Taste": "https://www.promiselandmart.com/cdn/shop/files/COKE_BOTTLED_1.5L_1024x1024%402x.jpg?v=1710311027",
  "Surf Powder Detergent": "https://pasal101.thulo.com.np/assets/tenant/uploads/media-uploader/pasal101/20240628012225_1553008696.jpg",
  "Bear Brand Fortified": "https://ph-test-11.slatic.net/p/3fd1183ccb8af6ee918453085d1833a7.jpg",
  "Bear Brand Fortified Powdered Milk Drink": "https://ph-test-11.slatic.net/p/3fd1183ccb8af6ee918453085d1833a7.jpg",
  "Argentina Corned Beef": "https://k2pharmacy.ph/cdn/shop/files/ArgentinaCornedBeef175g1-fotor-20240627154056_grande.jpg?v=1720416375",
  "Jack 'n Jill Piattos": "https://merkadoph.se/cdn/shop/files/piattos-cheese-85g.jpg?v=1705102773&width=1445",
  "Nissin Ramen Chicken": "https://primomart.ph/cdn/shop/files/4800016551574_a399f665-d8d6-4f32-a728-c3711d24c3ba_700x700.jpg?v=1754892411",
  "Nissin Cup Noodles Seafood": "https://ever.ph/cdn/shop/files/9000009932-Nissin-Cup-Noodles-Seafood-60g-210415.jpg?v=1619082354",
  "555 Sardines Tomato Sauce": "https://img06.weeecdn.com/item/image/893/529/4BED2433D5348CBD.jpg",
  "Century Tuna Flakes in Oil": "https://cf.shopee.ph/file/4d968d8443c98035ad317a862059cce1",
  "Del Monte Tomato Sauce Original": "https://www.landmark.ph/_next/image?q=75&url=https%3A%2F%2Fadmin.landmark.ph%2Fwp-content%2Fuploads%2F2025%2F12%2F7240.jpg&w=3840",
  "Datu Puti Soy Sauce": "https://www.dmc.com.ph/web/image/product.template/1318/image_1024?unique=87948d3",
  "Cheez Whiz Plain": "https://www.prime-mart.ph/cdn/shop/files/cheezwhiz-plain-210g.jpg?v=1",
  "Safeguard Pure White Soap": "https://himopt.com.ua/image/cache/catalog/image/cache/catalog/products/1111111/413408175-700x700.webp",
  "Silka Soap Papaya Green": "https://medias.watsons.com.ph/publishing/WTCPH-10088249-front-zoom.jpg?version=1734003326",
  "Fita Crackers": "https://sukli.com/cdn/shop/files/M.Y.San-FitaCrackers-CheeseFlavor-10Packs-300G_1080x.jpg?v=1749668473",
  "Kopiko Brown Coffee Mix": "https://shopsuki.ph/cdn/shop/files/8996001410547_1024x.jpg?v=1748839410",
  "Nescafe 3-in-1 Original": "https://primomart.ph/cdn/shop/files/4800361403764_58ce684c-2db6-4d1f-9398-b5170c9901a9_1024x1024.jpg?v=1754892147"
};

try {
  const raw = localStorage.getItem(PRODUCTS_KEY);
  const products = raw ? JSON.parse(raw) : null;

  if (Array.isArray(products)) {
    const next = products.map((product) => {
      if (product?.image && !String(product.image).includes("placehold.co")) return product;
      const image = IMAGE_MAP[product?.name];
      return image ? { ...product, image } : product;
    });
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next));
  }
} catch {}

export { IMAGE_MAP };
