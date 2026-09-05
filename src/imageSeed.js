const PRODUCTS_KEY = "cacho-store-products-v1";

// Public product photos matched to product name + exact unit/size whenever possible.
// Prefer real package photos; leave a product's existing image alone when no reliable exact match was found.
const IMAGE_MAP = {
  "Lucky Me! Pancit Canton": "https://cdn.mafrservices.com/sys-master-root/hfe/hfa/14787587145758/595516_main.jpg",
  "Lucky Me! Pancit Canton Original": "https://shopmetro.ph/angeles-supermarket/wp-content/uploads/2024/05/SM102169577-1-7.jpg",
  "Lucky Me! Pancit Canton Sweet & Spicy": "https://shoplilimart.com/cdn/shop/files/LuckyMePancitCantonSweet_SpicyFlavor-2.12oz.webp?v=1722184768&width=1800",
  "Lucky Me! Pancit Canton Kalamansi": "https://snfood.gr/SNFOOD_media/2025/03/10041277_lm-pc-kalamansi-80g.png",
  "Lucky Me! Pancit Canton Sweet & Spicy Kasalo Pack__120g": "https://media.pickaroo.com/media/thumb/variant_photos/2024/4/18/haKKdFwKrZUceUMe7LGZbV_watermark_400.jpg",
  "Lucky Me! Pancit Canton Kalamansi Kasalo Pack__120g": "https://shopmetro.ph/basak-supermarket/wp-content/uploads/2024/05/SM103304168-1-6.jpg",

  "Coca-Cola": "https://www.promiselandmart.com/cdn/shop/files/COKE_BOTTLED_1.5L_1024x1024%402x.jpg?v=1710311027",
  "Coca-Cola Original Taste__1.5L": "https://www.promiselandmart.com/cdn/shop/files/COKE_BOTTLED_1.5L_1024x1024%402x.jpg?v=1710311027",
  "Coca-Cola Original Taste__1L": "https://goisco.com/cdn/shop/files/4900000642-1_800x800.jpg?v=1688072892",
  "Coca-Cola Original Taste__330ml": "https://winesndrinks.com/cdn/shop/files/CokeCan.png?v=1776176441",
  "Sprite__1.5L": "https://clink.ph/cdn/shop/products/MicrosoftTeams-image_146_800x.png?v=1750646187",
  "Royal Tru-Orange__1.5L": "https://shopmetro.ph/marketmarket-supermarket/wp-content/uploads/2024/02/SM9083977.jpg",

  "Surf Powder Detergent": "https://pasal101.thulo.com.np/assets/tenant/uploads/media-uploader/pasal101/20240628012225_1553008696.jpg",
  "Bear Brand Fortified": "https://ph-test-11.slatic.net/p/3fd1183ccb8af6ee918453085d1833a7.jpg",
  "Bear Brand Fortified Powdered Milk Drink__135g": "https://smmarkets.ph/media/catalog/product/2/0/20168848_1.png",
  "Bear Brand Fortified Powdered Milk Drink__680g": "https://cdn.quicksell.co/-OASkWMKEOQ2eQzr55ZU/products/-OBB5npuVC1daxfgJ2us.jpg",
  "Alaska Powdered Milk Plain__300g": "https://ever.ph/cdn/shop/files/100000008841-Alaska-Fortified-Powdered-Milk-Drink-Original-300g-220321_d931f3e9-2b29-4ed9-af85-94ae42ca2979.jpg?v=1772341734",
  "Argentina Corned Beef__175g": "https://k2pharmacy.ph/cdn/shop/files/ArgentinaCornedBeef175g1-fotor-20240627154056_grande.jpg?v=1720416375",
  "Argentina Corned Beef__150g": "https://sdcglobalchoice.com/wp-content/uploads/2021/07/150g-argentina-corned-beef-1024x1024.jpg",
  "Argentina Corned Beef": "https://k2pharmacy.ph/cdn/shop/files/ArgentinaCornedBeef175g1-fotor-20240627154056_grande.jpg?v=1720416375",
  "Argentina Meat Loaf__100g": "https://www.citimartdelivery.com.ph/cdn/shop/files/1023075.jpg",
  "Argentina Chicken Luncheon Meat__340g": "https://ever.ph/cdn/shop/files/100000096159-Argentina-Chicken-Luncheon-Meat-340g-260508.jpg?v=1778232441&width=1445",
  "Jack 'n Jill Piattos": "https://merkadoph.se/cdn/shop/files/piattos-cheese-85g.jpg?v=1705102773&width=1445",

  "Nissin Ramen Beef__55g": "https://unlistore.ph/images/thumbs/0024614_nissin-ramen-55g-beef-chicken-creamy-seafood-seafood-spicy-beef-spicy-seafood-nis36_510.jpeg",
  "Nissin Ramen Beef": "https://unlistore.ph/images/thumbs/0024614_nissin-ramen-55g-beef-chicken-creamy-seafood-seafood-spicy-beef-spicy-seafood-nis36_510.jpeg",
  "Nissin Ramen Chicken__55g": "https://marilenminimart.com/cdn/shop/products/ramenchicken.png?v=1616569700",
  "Nissin Ramen Chicken": "https://marilenminimart.com/cdn/shop/products/ramenchicken.png?v=1616569700",
  "Nissin Cup Noodles Seafood__40g": "https://ursuki.com/cdn/shop/files/URC20210113_03.jpg?crop=center&height=1200&v=1762938554&width=1200",
  "Nissin Cup Noodles Seafood": "https://ursuki.com/cdn/shop/files/URC20210113_03.jpg?crop=center&height=1200&v=1762938554&width=1200",

  "555 Sardines Tomato Sauce": "https://img06.weeecdn.com/item/image/893/529/4BED2433D5348CBD.jpg",
  "555 Sardines Chili__155g": "https://i5.walmartimages.com/asr/91044fc3-8a8f-4df3-ae81-c6d792ee0299.9b3308a70d01bf0fa09eb7a3343312f4.jpeg",
  "Mega Sardines Tomato Sauce__155g": "https://digital.loblaws.ca/PCX/20774942_EA/en/1/20774942_en_front_400.png",
  "Ligo Sardines Tomato Sauce__155g": "https://marilenminimart.com/cdn/shop/products/4800163443043.jpg?v=1634634840",
  "Century Tuna Flakes in Oil": "https://cf.shopee.ph/file/4d968d8443c98035ad317a862059cce1",
  "Del Monte Tomato Sauce Original": "https://www.landmark.ph/_next/image?q=75&url=https%3A%2F%2Fadmin.landmark.ph%2Fwp-content%2Fuploads%2F2025%2F12%2F7240.jpg&w=3840",
  "Del Monte Tomato Paste__150g": "https://cf.shopee.ph/file/ad9e66c68eae6bb8d47fa9a451fa4253",
  "Datu Puti Soy Sauce": "https://www.dmc.com.ph/web/image/product.template/1318/image_1024?unique=87948d3",
  "Datu Puti Vinegar__385ml": "https://akabanebussan.com/product/datu-puti-vinegar-385ml/21810.jpg",
  "Silver Swan Soy Sauce__385ml": "https://shopmetro.ph/marketmarket-supermarket/wp-content/uploads/2021/03/SM6948405-1.jpg",
  "UFC Banana Ketchup__320g": "https://zbga.shopsuki.ph/cdn/shop/files/014285000068_1_1024x.jpg?v=1710383360",
  "Lady's Choice Mayonnaise__220ml": "https://down-ph.img.susercontent.com/file/ph-11134207-7rasl-m26ghw2q5sjgea",
  "Cheez Whiz Plain": "https://cdn.store-assets.com/s/377840/i/16829303.jpeg",
  "Safeguard Pure White Soap": "https://himopt.com.ua/image/cache/catalog/image/cache/catalog/products/1111111/413408175-700x700.webp",
  "Silka Soap Papaya Green": "https://medias.watsons.com.ph/publishing/WTCPH-10088249-front-zoom.jpg?version=1734003326",
  "Fita Crackers": "https://sukli.com/cdn/shop/files/M.Y.San-FitaCrackers-CheeseFlavor-10Packs-300G_1080x.jpg?v=1749668473",
  "Kopiko Brown Coffee Mix": "https://cf.shopee.ph/file/0acccfdb04e208939da7a57dc6901327",
  "Nescafe 3-in-1 Original": "https://primomart.ph/cdn/shop/files/4800361403764_58ce684c-2db6-4d1f-9398-b5170c9901a9_1024x1024.jpg?v=1754892147",
  "Great Taste White Coffee__30g": "https://i.ebayimg.com/images/g/NH4AAOSwz99n5o0c/s-l400.jpg",
  "Nescafe Classic__25g": "https://www.malvarmarketing.com/sites/default/files/styles/product/public/products/4800361420594.png?itok=nYUT78vz",
  "Dutch Mill Yoghurt Drink Mixed Fruit__90ml": "https://www.promiselandmart.com/cdn/shop/products/MI_1024x1024%402x.jpg?v=1597461827",
  "Nagaraya Cracker Nuts__50g": "https://img06.weeecdn.com/item/image/725/275/B245D9CBB9893C8.jpg%21c750x0.jpeg",
  "Oishi Prawn Crackers__90g": "https://nordictindahan.fi/cdn/shop/files/oishi-prawn-crackers-90g.png?v=1758618478",
  "Milo Chocolate Drink__24g": "https://static.wixstatic.com/media/720a1c_f2da96d3a24547df91e7083db440137c~mv2.png/v1/fill/w_518%2Ch_607%2Cal_c%2Clg_1%2Cq_85%2Cenc_avif%2Cquality_auto/720a1c_f2da96d3a24547df91e7083db440137c~mv2.png"
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
