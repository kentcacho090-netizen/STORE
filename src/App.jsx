import { useEffect, useMemo, useState } from "react";
import "./admin.css";

const PRODUCTS_KEY = "cacho-store-products-v1";
const CATEGORIES_KEY = "cacho-store-categories-v1";
const ADMIN_SESSION_KEY = "cacho-store-admin-session-v1";
const ADMIN_PIN = "2580";

const starterProducts = [
  { id: 1, name: "Lucky Me! Pancit Canton", category: "Noodles", unit: "60g", price: 12.5, stock: 150, image: "" },
  { id: 2, name: "Coca-Cola", category: "Drinks", unit: "1.5L", price: 75, stock: 48, image: "" },
  { id: 3, name: "Surf Powder Detergent", category: "Household", unit: "1kg", price: 108, stock: 23, image: "" },
  { id: 4, name: "Bear Brand Fortified", category: "Coffee & Milk", unit: "1kg", price: 265, stock: 31, image: "" },
  { id: 5, name: "Argentina Corned Beef", category: "Canned Goods", unit: "175g", price: 34, stock: 72, image: "" },
  { id: 6, name: "Jack 'n Jill Piattos", category: "Snacks", unit: "85g", price: 27, stock: 95, image: "" }
];
const starterCategories = ["Noodles", "Drinks", "Household", "Coffee & Milk", "Canned Goods", "Snacks"];
const peso = (value) => `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const loadJson = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const readAdminSession = () => { try { return sessionStorage.getItem(ADMIN_SESSION_KEY) === "unlocked"; } catch { return false; } };

export default function App() {
  const [products, setProducts] = useState(() => loadJson(PRODUCTS_KEY, starterProducts));
  const [categories, setCategories] = useState(() => loadJson(CATEGORIES_KEY, starterCategories));
  const [view, setView] = useState("shop");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [adminUnlocked, setAdminUnlocked] = useState(readAdminSession);
  const [adminPin, setAdminPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [editing, setEditing] = useState(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() => products.filter((p) => (category === "All" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  const adminProducts = useMemo(() => products.filter((p) => p.name.toLowerCase().includes(adminSearch.toLowerCase()) || p.category.toLowerCase().includes(adminSearch.toLowerCase())), [products, adminSearch]);
  const cartItems = products.filter((p) => cart[p.id]);
  const total = cartItems.reduce((sum, p) => sum + cart[p.id] * p.price, 0);
  const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const saveState = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const add = (product) => {
    setCart((current) => ({ ...current, [product.id]: Math.min(product.stock, (current[product.id] || 0) + 1) }));
    setToast({ id: product.id, name: product.name });
  };
  const undoAdd = () => {
    if (!toast) return;
    changeQty(toast.id, -1);
    setToast(null);
  };
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const changeQty = (id, amount) => setCart((current) => { const p = products.find((item) => item.id === id); const next = Math.max(0, Math.min(p?.stock ?? 0, (current[id] || 0) + amount)); const copy = { ...current }; if (!next) delete copy[id]; else copy[id] = next; return copy; });

  const unlockAdmin = (event) => {
    event?.preventDefault();
    if (adminPin.trim() !== ADMIN_PIN) { setAdminPin(""); setLoginError("Incorrect PIN. Please try again."); return; }
    try { sessionStorage.setItem(ADMIN_SESSION_KEY, "unlocked"); } catch {}
    setAdminUnlocked(true); setLoginError(""); setAdminPin(""); setView("admin");
  };
  const openAdmin = () => { setLoginError(""); setAdminPin(""); setView(adminUnlocked ? "admin" : "login"); };
  const lockAdmin = () => { try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch {} setAdminUnlocked(false); setEditing(null); setView("settings"); };

  const resetForm = () => { setEditing({ id: null, name: "", category: categories[0] || "Uncategorized", unit: "", price: "", stock: "", image: "" }); setImagePreview(""); };
  const startEdit = (product) => { setEditing({ ...product, price: String(product.price), stock: String(product.stock) }); setImagePreview(product.image || ""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const saveProduct = (event) => {
    event.preventDefault();
    const name = editing.name.trim(), categoryValue = editing.category.trim(), unit = editing.unit.trim(), price = Number(editing.price), stock = Number(editing.stock);
    if (!name || !categoryValue || !unit || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return window.alert("Please enter a product name, category, unit, valid price, and whole-number stock.");
    const nextProduct = { ...editing, name, category: categoryValue, unit, price, stock, image: imagePreview || "" };
    setProducts((current) => { const next = nextProduct.id ? current.map((p) => p.id === nextProduct.id ? nextProduct : p) : [...current, { ...nextProduct, id: Date.now() }]; saveState(PRODUCTS_KEY, next); return next; });
    if (!categories.includes(categoryValue)) setCategories((current) => { const next = [...current, categoryValue]; saveState(CATEGORIES_KEY, next); return next; });
    setEditing(null); setImagePreview("");
  };
  const removeProduct = (product) => { if (!window.confirm(`Delete ${product.name}?`)) return; setProducts((current) => { const next = current.filter((p) => p.id !== product.id); saveState(PRODUCTS_KEY, next); return next; }); setCart((current) => { const next = { ...current }; delete next[product.id]; return next; }); };
  const updateStock = (id, delta) => setProducts((current) => { const next = current.map((p) => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p); saveState(PRODUCTS_KEY, next); return next; });
  const handleImage = (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setImagePreview(String(reader.result)); reader.readAsDataURL(file); };
  const exportProducts = () => { const blob = new Blob([JSON.stringify({ products, categories }, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "cacho-store-backup.json"; a.click(); URL.revokeObjectURL(url); };
  const importProducts = (event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(String(reader.result)); if (!Array.isArray(data.products)) throw new Error(); setProducts(data.products); saveState(PRODUCTS_KEY, data.products); if (Array.isArray(data.categories)) { setCategories(data.categories); saveState(CATEGORIES_KEY, data.categories); } window.alert("Store data imported successfully."); } catch { window.alert("That file is not a valid CACHO Store backup."); } event.target.value = ""; }; reader.readAsText(file); };
  const addCategory = () => { const name = window.prompt("New category name:")?.trim(); if (!name || categories.includes(name)) return; setCategories((current) => { const next = [...current, name]; saveState(CATEGORIES_KEY, next); return next; }); };
  const deleteCategory = (name) => { if (products.some((p) => p.category === name)) return window.alert("This category is still used by products. Move or delete those products first."); setCategories((current) => { const next = current.filter((item) => item !== name); saveState(CATEGORIES_KEY, next); return next; }); };
  const productImage = (product) => product.image ? <img src={product.image} alt={product.name} /> : <span>{product.name.charAt(0)}</span>;

  return <div className="app">
    <header className="topbar">
      <button className="brand brand-button" onClick={() => setView("shop")}><div className="brand-mark">C</div><div><strong>CACHO STORE</strong><span>Wholesale Grocery Supplier</span></div></button>
      <nav className="top-actions">
        <button className={view === "shop" ? "nav-btn active" : "nav-btn"} onClick={() => setView("shop")}>Catalog</button>
        <button className={view === "settings" ? "nav-btn active" : "nav-btn"} onClick={() => setView("settings")}>Settings</button>
        {adminUnlocked && <button className={view === "admin" ? "nav-btn active" : "nav-btn"} onClick={() => setView("admin")}>Admin</button>}
        {adminUnlocked && <button className="lock-btn" onClick={lockAdmin}>Lock</button>}
        <button className="cart-btn" onClick={() => {
          setView("shop");
          window.setTimeout(() => document.querySelector(".order-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        }}>Cart <b>{itemCount}</b></button>
      </nav>
    </header>

    {view === "login" ? <main className="login-page"><div className="login-card"><div className="login-icon">🔐</div><p className="eyebrow">CACHO STORE</p><h1>Admin access</h1><p>Enter your admin PIN to manage products, prices, stock, and categories.</p><form onSubmit={unlockAdmin}><label>Admin PIN<input autoFocus type="password" inputMode="numeric" autoComplete="off" value={adminPin} onChange={(e) => { setAdminPin(e.target.value); setLoginError(""); }} placeholder="Enter PIN" /></label>{loginError && <div className="login-error">{loginError}</div>}<button className="primary-btn full-btn" type="submit">Unlock admin</button></form><button className="back-btn" onClick={() => setView("settings")}>← Back to settings</button></div></main>
      : view === "settings" ? <main className="settings-page"><section className="settings-hero"><div><p className="eyebrow">SETTINGS</p><h1>CACHO Store settings.</h1><p>Store preferences and owner-only controls live here. Customer ordering stays in the catalog.</p></div></section><section className="settings-grid"><article className="settings-card"><div className="settings-card-icon">🏪</div><div><p className="eyebrow">STORE</p><h2>Wholesale catalog</h2><p>CACHO Store is configured for wholesale ordering. Product prices and inventory are managed from the owner area.</p><span className="settings-status">✓ Wholesale only</span></div></article><article className="settings-card owner-card"><div className="settings-card-icon">🔒</div><div><p className="eyebrow">OWNER ONLY</p><h2>Admin controls</h2><p>Products, prices, stock, images, categories, and backups are available only after owner verification.</p><button className="primary-btn" onClick={openAdmin}>{adminUnlocked ? "Open admin" : "Unlock admin"} <span>→</span></button></div></article></section></main>
      : view === "admin" && adminUnlocked ? <main className="admin-page"><section className="admin-hero"><div><p className="eyebrow">OWNER CONTROLS</p><h1>Manage your products.</h1><p>Add products, change wholesale prices, update stock, upload photos, and keep the catalog current.</p></div><div className="admin-actions"><button className="primary-btn" onClick={resetForm}>+ Add product</button><button className="secondary-btn" onClick={exportProducts}>Export backup</button><label className="secondary-btn file-btn">Import backup<input type="file" accept="application/json" onChange={importProducts}/></label></div></section><section className="admin-layout"><div><div className="admin-toolbar"><div className="search wide"><span>⌕</span><input value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} placeholder="Search products to edit..." /></div><span className="result-count">{adminProducts.length} products</span></div><div className="admin-list">{adminProducts.map((product) => <article className="admin-product" key={product.id}><div className="mini-image">{productImage(product)}</div><div className="admin-product-main"><div><small>{product.category} · {product.unit}</small><h3>{product.name}</h3></div><div className="admin-price"><span>Wholesale</span><strong>{peso(product.price)}</strong></div><div className="stock-editor"><span>Stock</span><div><button onClick={() => updateStock(product.id, -1)}>−</button><b>{product.stock}</b><button onClick={() => updateStock(product.id, 1)}>+</button></div></div><div className="admin-product-actions"><button onClick={() => startEdit(product)}>Edit</button><button className="danger" onClick={() => removeProduct(product)}>Delete</button></div></div></article>)}{!adminProducts.length && <div className="empty-admin">No products match your search.</div>}</div></div><aside className="manager-panel">{editing ? <><div className="panel-head"><div><p className="eyebrow">PRODUCT EDITOR</p><h2>{editing.id ? "Edit product" : "Add product"}</h2></div><button className="close-btn" onClick={() => setEditing(null)}>×</button></div><form onSubmit={saveProduct} className="product-form"><label>Product name<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Lucky Me Pancit Canton" /></label><label>Category<select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Unit / size<input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} placeholder="e.g. 60g, 1L, 1 box" /></label><div className="form-grid"><label>Wholesale price<input type="number" min="0" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></label><label>Stock quantity<input type="number" min="0" step="1" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></label></div><label>Product image<div className="upload-area" onClick={() => document.getElementById("product-image-upload")?.click()}>{imagePreview ? <img src={imagePreview} alt="Preview"/> : <><strong>Upload a photo</strong><span>PNG, JPG or WEBP</span></>}</div><input id="product-image-upload" className="hidden-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage}/></label><div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="primary-btn">Save product</button></div></form></> : <div className="panel-empty"><div className="panel-empty-icon">✎</div><h2>Product editor</h2><p>Choose a product to edit, or click <strong>Add product</strong> to create another item.</p></div>}</aside></section><section className="categories-panel"><div><p className="eyebrow">CATEGORIES</p><h2>Organize your catalog</h2></div><div className="category-manager">{categories.map((item) => <div className="category-chip" key={item}><span>{item}</span><button onClick={() => deleteCategory(item)}>×</button></div>)}<button className="add-category" onClick={addCategory}>+ New category</button></div></section></main>
      : <main><section className="hero"><div className="hero-main"><p className="eyebrow">WELCOME TO CACHO STORE</p><h1>Wholesale essentials,<br/><em>better value.</em></h1><p className="hero-copy">Your reliable source for everyday grocery products. Browse wholesale prices and order exactly the quantity your store needs.</p><div className="hero-actions"><button onClick={() => document.querySelector(".products-anchor")?.scrollIntoView({ behavior: "smooth" })}>Browse products <span>→</span></button><span>Wholesale pricing on every product</span></div></div><div className="hero-card"><div className="hero-card-icon">▦</div><span>WHOLESALE ORDERS</span><strong>Buying for your own store?</strong><small>Search the catalog, choose your products, and enter the exact quantities you need.</small></div></section><section className="toolbar"><div className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." /></div><div className="wholesale-badge"><span>✓</span> Wholesale prices</div></section><div className="category-row"><button className={category === "All" ? "selected" : ""} onClick={() => setCategory("All")}>All</button>{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><section className="content-grid products-anchor"><div><div className="section-heading"><div><p className="eyebrow">WHOLESALE CATALOG</p><h2>Shop everyday essentials</h2></div><span>{filtered.length} products</span></div><div className="product-grid">{filtered.map((product) => <article className="product-card" key={product.id}><div className="product-image">{productImage(product)}<small>{product.unit}</small></div><div className="product-info"><small className="product-category">{product.category}</small><h3>{product.name}</h3><div className="price-row"><div><span>Wholesale price</span><strong>{peso(product.price)}</strong></div><span className={product.stock < 30 ? "stock low" : "stock"}>{product.stock} available</span></div><button className="add-btn" disabled={!product.stock} onClick={() => add(product)}><span>+</span> {product.stock ? "Add to order" : "Out of stock"}</button></div></article>)}</div></div><aside className="order-panel"><div className="order-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Wholesale order</h2></div><span>{itemCount} items</span></div>{cartItems.length > 0 && <div className="cart-category-bar"><span className="cart-category-title">Categories</span>{[...new Set(cartItems.map((p) => p.category))].map((item) => <span className="cart-category-pill" key={item}>{item}</span>)}</div>}{cartItems.length === 0 ? <div className="empty"><div className="empty-icon">🛒</div><strong>Your order is empty</strong><p>Add products and set the exact quantity you need.</p></div> : <div className="order-items">{cartItems.map((p) => <div className="order-item" key={p.id}><div className="order-name"><strong>{p.name}</strong><small>{peso(p.price)} each</small></div><div className="qty"><button onClick={() => changeQty(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => changeQty(p.id, 1)}>+</button></div><strong className="line-total">{peso(p.price * cart[p.id])}</strong></div>)}</div>}<div className="order-total"><span>Total</span><strong>{peso(total)}</strong></div><button className="checkout" disabled={!itemCount}>Review order <span>→</span></button></aside></section></main>}
    {toast && <div className="add-toast" role="status" aria-live="polite">
      <div className="add-toast-icon">✓</div>
      <div className="add-toast-copy"><strong>{toast.name}</strong><span>Added to your order</span></div>
      <button type="button" className="add-toast-undo" onClick={undoAdd}>Undo</button>
      <button type="button" className="add-toast-close" onClick={() => setToast(null)} aria-label="Dismiss">×</button>
    </div>}
  </div>;
}
