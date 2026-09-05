const PRODUCTS_KEY = "cacho-store-products-v1";

// Public product photos matched to product name + exact unit/size whenever possible.
// Verified sources found for several current catalog items; unmapped products keep their existing image.
const IMAGE_MAP = {
  "Lucky Me! Pancit Canton": "https://cdn.mafrservices.com/sys-master-root/hfe/hfa/14787587145758/595516_main.jpg",
  "Lucky Me! Pancit Canton Original": "https://shopmetro.ph/angeles-supermarket/wp-content/uploads/2024/05/SM102169577-1-7.jpg",
  "Lucky Me! Pancit Canton Sweet & Spicy": "https://shoplilimart.com/cdn/shop/files/LuckyMePancitCantonSweet_SpicyFlavor-2.12oz.webp?v=1722184768&width=1800",
  "Lucky Me! Pancit Canton Kalamansi": "https://snfood.gr/SNFOOD_media/2025/03/10041277_lm-pc-kalamansi-80g.png",

  "Coca-Cola": "https://www.promiselandmart.com/cdn/shop/files/COKE_BOTTLED_1.5L_1024x1024%402x.jpg?v=1710311027",
  "Coca-Cola Original Taste__1.5L": "https://www.promiselandmart.com/cdn/shop/files/COKE_BOTTLED_1.5L_1024x1024%402x.jpg?v=1710311027",
  "Coca-Cola Original Taste__1L": "https://goisco.com/cdn/shop/files/4900000642-1_800x800.jpg?v=1688072892",
  "Coca-Cola Original Taste__330ml": "https://winesndrinks.com/cdn/shop/files/CokeCan.png?v=1776176441",

  "Surf Powder Detergent": "https://pasal101.thulo.com.np/assets/tenant/uploads/media-uploader/pasal101/20240628012225_1553008696.jpg",
  "Bear Brand Fortified": "https://ph-test-11.slatic.net/p/3fd1183ccb8af6ee918453085d1833a7.jpg",
  "Bear Brand Fortified Powdered Milk Drink__135g": "https://smmarkets.ph/media/catalog/product/2/0/20168848_1.png",
  "Argentina Corned Beef__175g": "https://k2pharmacy.ph/cdn/shop/files/ArgentinaCornedBeef175g1-fotor-20240627154056_grande.jpg?v=1720416375",
  "Argentina Corned Beef__150g": "https://sdcglobalchoice.com/wp-content/uploads/2021/07/150g-argentina-corned-beef-1024x1024.jpg",
  "Argentina Corned Beef": "https://k2pharmacy.ph/cdn/shop/files/ArgentinaCornedBeef175g1-fotor-20240627154056_grande.jpg?v=1720416375",
  "Jack 'n Jill Piattos": "https://merkadoph.se/cdn/shop/files/piattos-cheese-85g.jpg?v=1705102773&width=1445",

  "Nissin Ramen Beef__55g": "https://unlistore.ph/images/thumbs/0024614_nissin-ramen-55g-beef-chicken-creamy-seafood-seafood-spicy-beef-spicy-seafood-nis36_510.jpeg",
  "Nissin Ramen Beef": "https://unlistore.ph/images/thumbs/0024614_nissin-ramen-55g-beef-chicken-creamy-seafood-seafood-spicy-beef-spicy-seafood-nis36_510.jpeg",
  "Nissin Ramen Chicken__55g": "https://marilenminimart.com/cdn/shop/products/ramenchicken.png?v=1616569700",
  "Nissin Ramen Chicken": "https://marilenminimart.com/cdn/shop/products/ramenchicken.png?v=1616569700",
  "Nissin Cup Noodles Seafood__40g": "https://ursuki.com/cdn/shop/files/URC20210113_03.jpg?crop=center&height=1200&v=1762938554&width=1200",
  "Nissin Cup Noodles Seafood": "https://ursuki.com/cdn/shop/files/URC20210113_03.jpg?crop=center&height=1200&v=1762938554&width=1200",

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
      const key = `${product?.name || ""}__${product?.unit || ""}`;
      const image = IMAGE_MAP[key] || IMAGE_MAP[product?.name];
      return image ? { ...product, image } : product;
    });
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(next));
  }
} catch {}

export { IMAGE_MAP };
