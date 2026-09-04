const KEY = "cacho-store-categories-v1";
const categories = [
  "Baby Care", "Beverages", "Biscuits", "Bread & Bakery", "Breakfast", "Baking & Ingredients",
  "Canned & Dried Goods", "Chips, Nuts & Snacks", "Chocolates & Candies", "Cooking Aids", "Fresh Produce",
  "Frozen Food", "Milk, Dairy & Eggs", "Rice, Pasta & Noodles", "Coffee & Tea", "Health & Beauty",
  "Home Care & Cleaning", "Laundry", "Paper & Tissue", "School & Office Supplies", "Pet Care",
  "Personal Care", "Condiments & Sauces", "Cooking Oil", "Spices & Seasonings", "Sugar & Sweeteners",
  "Instant Food", "Ready-to-Eat", "Meat & Seafood", "Sauces & Spreads", "Water", "Juices",
  "Soft Drinks", "Energy Drinks", "Household Essentials", "Party & Disposables", "Hardware & Utilities",
  "Mobile & Gadget Accessories", "Computing", "Other"
];
try {
  const current = JSON.parse(localStorage.getItem(KEY) || "[]");
  const merged = [...new Set([...current, ...categories])];
  localStorage.setItem(KEY, JSON.stringify(merged));
} catch {}
