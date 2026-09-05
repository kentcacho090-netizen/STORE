import { useEffect, useMemo, useState } from "react";
import "./admin.css";
import "./styles.css";

const PRODUCTS_KEY = "cacho-store-products-v1";
const CATEGORIES_KEY = "cacho-store-categories-v1";
const ADMIN_SESSION_KEY = "cacho-store-admin-session-v1";
const ADMIN_PIN = "2580";

const seedCategories = [
  "Baby Care", "Beverages", "Biscuits", "Bread & Bakery", "Breakfast", "Baking & Ingredients",
  "Canned & Dried Goods", "Chips, Nuts & Snacks", "Chocolates & Candies", "Cooking Aids", "Fresh Produce",
  "Frozen Food", "Milk, Dairy & Eggs", "Rice, Pasta & Noodles", "Coffee & Tea", "Health & Beauty",
  "Home Care & Cleaning", "Laundry", "Paper & Tissue", "School & Office Supplies", "Pet Care",
  "Personal Care", "Condiments & Sauces", "Cooking Oil", "Spices & Seasonings", "Sugar & Sweeteners",
  "Instant Food", "Ready-to-Eat", "Meat & Seafood", "Sauces & Spreads", "Water", "Juices", "Soft Drinks",
  "Energy Drinks", "Household Essentials", "Party & Disposables", "Hardware & Utilities",
  "Mobile & Gadget Accessories", "Computing", "Other"
];

const fallbackProducts = [
  { id: 1, name: "Lucky Me! Pancit Canton", category: "Rice, Pasta & Noodles", unit: "60g", price: 12.5, stock: 150, image: "" },
  { id: 2, name: "Coca-Cola", category: "Soft Drinks", unit: "1.5L", price: 75, stock: 150, image: "" },
  { id: 3, name: "Surf Powder Detergent", category: "Laundry", unit: "1kg", price: 108, stock: 150, image: "" }
];

const peso = (value) => `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function cleanProduct(product) {
  const name = String(product?.name || "Product").trim();
  const category = String(product?.category || "Other").trim();
  let cleaned = name;
  const lower = cleaned.toLowerCase();
  const cat = category.toLowerCase();
  if (cat && lower.split(cat).length - 1 >= 2) {
    while (cleaned.toLowerCase().split(cat).length - 1 >= 2) {
      const at = cleaned.toLowerCase().indexOf(cat);
      if (at < 0) break;
      cleaned = `${cleaned.slice(0, at)} ${cleaned.slice(at + category.length)}`.replace(/\s+/g, " ").trim();
    }
  }
  return {
    ...product,
    name: cleaned || "Product",
    category,
    unit: String(product?.unit || "Each"),
    price: Number.isFinite(Number(product?.price)) ? Number(product.price) : 0,
    stock: Math.max(0, Number.isFinite(Number(product?.stock)) ? Number(product.stock) : 0),
    image: String(product?.image || "")
  };
}

function normalizeProducts(list) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).map(cleanProduct).filter((product) => {
    const key = `${product.id}__${product.unit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AppClean() {
  const initialProducts = normalizeProducts(readJson(PRODUCTS_KEY, fallbackProducts));
  const initialCategories = [...new Set([...(Array.isArray(readJson(CATEGORIES_KEY, [])) ? readJson(CATEGORIES_KEY, []) : []), ...seedCategories, ...initialProducts.map((p) => p.category)])];

  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [view, setView] = useState("shop");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [draftQty, setDraftQty] = useState({});
  const [toast, setToast] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [adminUnlocked, setAdminUnlocked] = useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === "unlocked");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [editing, setEditing] = useState(null);
  const [adminSearch, setAdminSearch] = useState("");

  useEffect(() => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    fetch(`/products.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const remote = normalizeProducts(data?.products || data);
        if (!remote.length) return;
        setProducts((current) => {
          const currentKeys = new Set(current.map((p) => `${p.id}__${p.unit}`));
          const merged = [...current];
          remote.forEach((p) => {
            const key = `${p.id}__${p.unit}`;
            if (!currentKeys.has(key)) merged.push(p);
          });
          return normalizeProducts(merged);
        });
        if (Array.isArray(data?.categories)) setCategories((current) => [...new Set([...current, ...data.categories])]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((p) => {
      const categoryMatch = selectedCategory === "All" || p.category === selectedCategory;
      const textMatch = !query || p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
      return categoryMatch && textMatch;
    });
  }, [products, selectedCategory, search]);

  const cartItems = useMemo(() => products.filter((p) => Number(cart[p.id]) > 0), [products, cart]);
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + Number(quantity || 0), 0);
  const total = cartItems.reduce((sum, p) => sum + Number(cart[p.id]) * p.price, 0);
  const cartCategories = [...new Set(cartItems.map((p) => p.category).filter(Boolean))];

  const getDraftQty = (product) => {
    const value = Number(draftQty[product.id]);
    return Number.isInteger(value) && value >= 1 ? Math.min(value, Math.max(1, product.stock)) : 1;
  };

  const setProductDraftQty = (product, value) => {
    const max = Math.max(1, Number(product.stock) || 1);
    const parsed = Number(value);
    const next = Number.isFinite(parsed) ? Math.floor(parsed) : 1;
    setDraftQty((current) => ({ ...current, [product.id]: Math.max(1, Math.min(max, next || 1)) }));
  };

  const saveCartChange = (id, nextQuantity) => {
    setCart((current) => {
      const copy = { ...current };
      if (nextQuantity <= 0) delete copy[id];
      else copy[id] = nextQuantity;
      return copy;
    });
  };

  const changeQty = (id, delta) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const current = Number(cart[id] || 0);
    const next = Math.max(0, Math.min(product.stock, current + delta));
    saveCartChange(id, next);
  };

  const addToOrder = (product) => {
    if (!product.stock || addingId === product.id) return;
    const requested = getDraftQty(product);
    const current = Number(cart[product.id] || 0);
    const available = Math.max(0, product.stock - current);
    const amount = Math.min(requested, available);
    if (amount <= 0) return;
    setAddingId(product.id);
    saveCartChange(product.id, current + amount);
    setToast({ id: product.id, name: product.name, quantity: amount });
    setDraftQty((currentDraft) => ({ ...currentDraft, [product.id]: 1 }));
    window.setTimeout(() => setAddingId(null), 450);
  };

  const undoAdd = () => {
    if (!toast) return;
    const current = Number(cart[toast.id] || 0);
    saveCartChange(toast.id, Math.max(0, current - toast.quantity));
    setToast(null);
  };

  const unlockAdmin = (event) => {
    event.preventDefault();
    if (pin.trim() !== ADMIN_PIN) {
      setPin("");
      setPinError("Incorrect PIN. Please try again.");
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "unlocked");
    setAdminUnlocked(true);
    setPin("");
    setPinError("");
    setView("admin");
  };

  const lockAdmin = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminUnlocked(false);
    setEditing(null);
    setView("settings");
  };

  const saveProduct = (event) => {
    event.preventDefault();
    if (!editing) return;
    const next = cleanProduct({
      ...editing,
      price: Number(editing.price),
      stock: Number(editing.stock)
    });
    if (!next.name || !next.unit || !Number.isFinite(next.price) || next.price < 0 || !Number.isInteger(next.stock) || next.stock < 0) return;
    setProducts((current) => {
      const exists = current.some((p) => String(p.id) === String(next.id));
      return exists ? current.map((p) => String(p.id) === String(next.id) ? next : p) : [...current, { ...next, id: Date.now() }];
    });
    setCategories((current) => current.includes(next.category) ? current : [...current, next.category]);
    setEditing(null);
  };

  const removeProduct = (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setProducts((current) => current.filter((p) => p.id !== product.id));
    setCart((current) => {
      const copy = { ...current };
      delete copy[product.id];
      return copy;
    });
  };

  const adminProducts = products.filter((p) => {
    const q = adminSearch.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const productImage = (product) => product.image ? <img src={product.image} alt={product.name} loading="lazy" /> : <span>{product.name.charAt(0)}</span>;

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setView("shop")} aria-label="CACHO Store home">
          <div className="brand-mark">C</div>
          <div><strong>CACHO STORE</strong><span>Wholesale Grocery Supplier</span></div>
        </button>
        <nav className="top-actions" aria-label="Main navigation">
          <button className={view === "shop" ? "nav-btn active" : "nav-btn"} onClick={() => setView("shop")}>Catalog</button>
          <button className={view === "settings" ? "nav-btn active" : "nav-btn"} onClick={() => setView("settings")}>Settings</button>
          {adminUnlocked && <button className={view === "admin" ? "nav-btn active" : "nav-btn"} onClick={() => setView("admin")}>Admin</button>}
          {adminUnlocked && <button className="lock-btn" onClick={lockAdmin}>Lock</button>}
          <button className="cart-btn" onClick={() => document.querySelector(".order-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Cart <b>{itemCount}</b></button>
        </nav>
      </header>

      {view === "settings" ? (
        <main className="settings-page">
          <section className="settings-hero"><p className="eyebrow">SETTINGS</p><h1>CACHO Store settings.</h1><p>Owner controls are kept separate from customer ordering.</p></section>
          <section className="settings-grid">
            <article className="settings-card"><div className="settings-card-icon">🏪</div><div><p className="eyebrow">STORE</p><h2>Wholesale catalog</h2><p>Every item is presented with wholesale pricing and stock availability.</p><span className="settings-status">✓ Wholesale only</span></div></article>
            <article className="settings-card owner-card"><div className="settings-card-icon">🔒</div><div><p className="eyebrow">OWNER ONLY</p><h2>Admin controls</h2><p>Manage products, pricing, stock, images and categories.</p><button className="primary-btn" onClick={() => setView(adminUnlocked ? "admin" : "login")}>{adminUnlocked ? "Open admin" : "Unlock admin"} →</button></div></article>
          </section>
        </main>
      ) : view === "login" ? (
        <main className="login-page"><div className="login-card"><div className="login-icon">🔐</div><p className="eyebrow">CACHO STORE</p><h1>Admin access</h1><p>Enter the owner PIN to manage the catalog.</p><form onSubmit={unlockAdmin}><label>Admin PIN<input autoFocus type="password" inputMode="numeric" value={pin} onChange={(e) => { setPin(e.target.value); setPinError(""); }} placeholder="Enter PIN" /></label>{pinError && <div className="login-error">{pinError}</div>}<button className="primary-btn full-btn" type="submit">Unlock admin</button></form><button className="back-btn" onClick={() => setView("settings")}>← Back to settings</button></div></main>
      ) : view === "admin" && adminUnlocked ? (
        <main className="admin-page">
          <section className="admin-hero"><div><p className="eyebrow">OWNER CONTROLS</p><h1>Manage your products.</h1><p>Edit wholesale prices, stock, product details and photos.</p></div><div className="admin-actions"><button className="primary-btn" onClick={() => setEditing({ id: null, name: "", category: categories[0] || "Other", unit: "", price: "", stock: 0, image: "" })}>+ Add product</button></div></section>
          <section className="admin-layout"><div><div className="admin-toolbar"><div className="search wide"><span>⌕</span><input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Search products to edit..." /></div><span className="result-count">{adminProducts.length} products</span></div><div className="admin-list">{adminProducts.map((product) => <article className="admin-product" key={`${product.id}-${product.unit}`}><div className="mini-image">{productImage(product)}</div><div className="admin-product-main"><div><small>{product.category} · {product.unit}</small><h3>{product.name}</h3></div><div className="admin-price"><span>Wholesale</span><strong>{peso(product.price)}</strong></div><div className="stock-editor"><span>Stock</span><div><b className="read-only-stock">{product.stock}</b></div></div><div className="admin-product-actions"><button onClick={() => setEditing({ ...product, price: String(product.price), stock: String(product.stock) })}>Edit</button><button className="danger" onClick={() => removeProduct(product)}>Delete</button></div></div></article>)}</div></div><aside className="manager-panel">{editing ? <><div className="panel-head"><div><p className="eyebrow">PRODUCT EDITOR</p><h2>{editing.id ? "Edit product" : "Add product"}</h2></div><button className="close-btn" onClick={() => setEditing(null)}>×</button></div><form onSubmit={saveProduct} className="product-form"><label>Product name<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label><label>Category<input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label><label>Unit / size<input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} /></label><div className="form-grid"><label>Wholesale price<input type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></label><label>Stock quantity<input type="number" min="0" step="1" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></label></div><label>Image URL<input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://..." /></label><div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancel</button><button className="primary-btn" type="submit">Save product</button></div></form></> : <div className="panel-empty"><div className="panel-empty-icon">✎</div><h2>Product editor</h2><p>Select a product or add a new one.</p></div>}</aside></section>
          <section className="categories-panel"><div><p className="eyebrow">CATEGORIES</p><h2>Organize your catalog</h2></div><div className="category-manager">{categories.map((item) => <div className="category-chip" key={item}><span>{item}</span></div>)}</div></section>
        </main>
      ) : (
        <main>
          <section className="hero"><div className="hero-main"><p className="eyebrow">WELCOME TO CACHO STORE</p><h1>Wholesale essentials,<br/><em>better value.</em></h1><p className="hero-copy">Browse wholesale prices and order exactly the quantity your store needs.</p><div className="hero-actions"><button onClick={() => document.querySelector(".products-anchor")?.scrollIntoView({ behavior: "smooth" })}>Browse products <span>→</span></button></div></div><div className="hero-card"><div className="hero-card-icon">▦</div><span>WHOLESALE ORDERS</span><strong>Buying for your own store?</strong><small>Select your products and enter the exact quantities you need.</small></div></section>
          <section className="toolbar"><div className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." /></div><div className="wholesale-badge"><span>✓</span> Wholesale prices</div></section>
          <div className="category-row"><button className={selectedCategory === "All" ? "selected" : ""} onClick={() => setSelectedCategory("All")}>All</button>{categories.map((item) => <button key={item} className={selectedCategory === item ? "selected" : ""} onClick={() => setSelectedCategory(item)}>{item}</button>)}</div>
          <section className="content-grid products-anchor"><div><div className="section-heading"><div><p className="eyebrow">WHOLESALE CATALOG</p><h2>Shop everyday essentials</h2></div><span>{filtered.length} products</span></div><div className="product-grid">{filtered.map((product) => {
            const quantity = getDraftQty(product);
            const inCart = Number(cart[product.id] || 0);
            const remaining = Math.max(0, product.stock - inCart);
            return <article className={`product-card${inCart > 0 ? " has-cart-item" : ""}`} key={`${product.id}-${product.unit}`}>
              <div className="product-image">{productImage(product)}<small>{product.unit}</small>{inCart > 0 && <span className="cart-ribbon">In order · {inCart}</span>}</div>
              <div className="product-info">
                <small className="product-category">{product.category}</small>
                <div className="product-title-row"><h3>{product.name}</h3>{inCart > 0 && <span className="selected-dot" aria-label="Already in order">●</span>}</div>
                <div className="price-row"><div><span>Wholesale price</span><strong>{peso(product.price)}</strong></div><span className={remaining < 30 ? "stock low" : "stock"}>{remaining} left</span></div>
                <div className="product-buy-label"><span>Quantity to add</span><span className="in-cart-note">{inCart ? `${inCart} already in order` : ""}</span></div>
                <div className="product-buy-row">
                  <div className="product-quantity" aria-label={`Quantity to add for ${product.name}`}>
                    <button type="button" onClick={() => setProductDraftQty(product, quantity - 1)} disabled={quantity <= 1} aria-label={`Decrease quantity for ${product.name}`}>−</button>
                    <input type="number" inputMode="numeric" min="1" max={Math.max(1, remaining)} value={quantity} onChange={(e) => setProductDraftQty(product, e.target.value)} aria-label={`Quantity to add for ${product.name}`} />
                    <button type="button" onClick={() => setProductDraftQty(product, quantity + 1)} disabled={quantity >= Math.max(1, remaining)} aria-label={`Increase quantity for ${product.name}`}>+</button>
                  </div>
                  <button className="add-btn" type="button" disabled={!remaining || addingId === product.id} onClick={() => addToOrder(product)}><span>+</span>{addingId === product.id ? " Added" : remaining ? ` Add ${quantity} to order` : " Out of stock"}</button>
                </div>
              </div>
            </article>;
          })}</div></div>
            <aside className="order-panel"><div className="order-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Wholesale order</h2></div><span>{itemCount} items</span></div>{cartItems.length > 0 && <div className="cart-category-bar"><span className="cart-category-title">Categories</span>{cartCategories.map((item) => <span className="cart-category-pill" key={item}>{item}</span>)}</div>}{cartItems.length === 0 ? <div className="empty"><div className="empty-icon">🛒</div><strong>Your order is empty</strong><p>Add products and set the exact quantity you need.</p></div> : <div className="order-items">{cartItems.map((product) => <div className="order-item" key={`${product.id}-${product.unit}`}><div className="order-name"><strong>{product.name}</strong><small>{peso(product.price)} each · {product.category}</small></div><div className="qty"><button type="button" onClick={() => changeQty(product.id, -1)} aria-label={`Remove one ${product.name}`}>−</button><b>{cart[product.id]}</b><button type="button" onClick={() => changeQty(product.id, 1)} aria-label={`Add one ${product.name}`}>+</button></div><strong className="line-total">{peso(product.price * Number(cart[product.id]))}</strong></div>)}</div>}<div className="order-total"><span>Total</span><strong>{peso(total)}</strong></div><button className="checkout" type="button" disabled={!itemCount}>Review order <span>→</span></button></aside>
          </section>
        </main>
      )}

      {toast && <div className="add-toast" role="status" aria-live="polite"><div className="add-toast-icon">✓</div><div className="add-toast-copy"><strong>{toast.name}</strong><span>{toast.quantity} added to your order</span></div><button type="button" className="add-toast-undo" onClick={undoAdd}>Undo</button><button type="button" className="add-toast-close" onClick={() => setToast(null)} aria-label="Dismiss">×</button></div>}
    </div>
  );
}
