import { useEffect, useMemo, useState } from "react";

const FALLBACK = {
  updatedAt: "",
  categories: ["Noodles", "Drinks", "Household", "Coffee & Milk", "Canned Goods", "Snacks"],
  products: [
    { id: 1, name: "Lucky Me! Pancit Canton", category: "Noodles", unit: "60g", price: 12.5, stock: 150, image: "", active: true },
    { id: 2, name: "Coca-Cola", category: "Drinks", unit: "1.5L", price: 75, stock: 48, image: "", active: true },
    { id: 3, name: "Surf Powder Detergent", category: "Household", unit: "1kg", price: 108, stock: 23, image: "", active: true },
    { id: 4, name: "Bear Brand Fortified", category: "Coffee & Milk", unit: "1kg", price: 265, stock: 31, image: "", active: true },
    { id: 5, name: "Argentina Corned Beef", category: "Canned Goods", unit: "175g", price: 34, stock: 72, image: "", active: true },
    { id: 6, name: "Jack 'n Jill Piattos", category: "Snacks", unit: "85g", price: 27, stock: 95, image: "", active: true }
  ]
};

const peso = (v) => `₱${Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const loadSession = () => { try { return sessionStorage.getItem("cacho-store-admin-session-v1") === "unlocked"; } catch { return false; } };

export default function CachoStore() {
  const [catalog, setCatalog] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");
  const [view, setView] = useState("shop");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState({});
  const [adminUnlocked, setAdminUnlocked] = useState(loadSession);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");

  const loadCatalog = async () => {
    try {
      const response = await fetch(`/products.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (Array.isArray(data.products)) {
        setCatalog({ products: data.products, categories: Array.isArray(data.categories) ? data.categories : [], updatedAt: data.updatedAt || "" });
        setUpdatedAt(data.updatedAt || "");
      }
    } catch {
      // Keep the last known fallback catalog when the data endpoint is unavailable.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
    const timer = window.setInterval(loadCatalog, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const products = catalog.products.filter((p) => p.active !== false);
  const categories = catalog.categories;
  const filtered = useMemo(() => products.filter((p) => (category === "All" || p.category === category) && p.name.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  const cartItems = products.filter((p) => cart[p.id]);
  const total = cartItems.reduce((sum, p) => sum + p.price * cart[p.id], 0);
  const itemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);

  const add = (p) => setCart((c) => ({ ...c, [p.id]: Math.min(p.stock, (c[p.id] || 0) + 1) }));
  const qty = (id, delta) => setCart((c) => { const p = products.find((x) => x.id === id); const next = Math.max(0, Math.min(p?.stock || 0, (c[id] || 0) + delta)); const n = { ...c }; if (!next) delete n[id]; else n[id] = next; return n; });

  const openAdmin = () => { setLoginError(""); setPin(""); setView(adminUnlocked ? "admin" : "login"); };
  const unlock = (e) => {
    e.preventDefault();
    if (pin !== "2580") { setPin(""); setLoginError("Incorrect PIN. Please try again."); return; }
    try { sessionStorage.setItem("cacho-store-admin-session-v1", "unlocked"); } catch {}
    setAdminUnlocked(true); setPin(""); setLoginError(""); setView("admin");
  };
  const lock = () => { try { sessionStorage.removeItem("cacho-store-admin-session-v1"); } catch {} setAdminUnlocked(false); setView("shop"); };

  if (view === "login") return <div className="app"><header className="topbar"><button className="brand brand-button" onClick={() => setView("shop")}><div className="brand-mark">C</div><div><strong>CACHO STORE</strong><span>Wholesale Grocery Supplier</span></div></button></header><main className="login-page"><div className="login-card"><div className="login-icon">🔐</div><p className="eyebrow">CACHO STORE</p><h1>Admin access</h1><p>Enter your admin PIN to access private store settings and management tools.</p><form onSubmit={unlock}><label>Admin PIN<input autoFocus type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setLoginError(""); }} placeholder="Enter PIN" /></label>{loginError && <div className="login-error">{loginError}</div>}<button className="primary-btn full-btn" type="submit">Unlock admin</button></form><button className="back-btn" onClick={() => setView("shop")}>← Back to catalog</button></div></main></div>;

  return <div className="app">
    <header className="topbar">
      <button className="brand brand-button" onClick={() => setView("shop")}><div className="brand-mark">C</div><div><strong>CACHO STORE</strong><span>Wholesale Grocery Supplier</span></div></button>
      <nav className="top-actions">
        <button className={view === "shop" ? "nav-btn active" : "nav-btn"} onClick={() => setView("shop")}>Catalog</button>
        {adminUnlocked && <button className={view === "settings" ? "nav-btn active" : "nav-btn"} onClick={() => setView("settings")}>Settings</button>}
        {!adminUnlocked && <button className="nav-btn" onClick={openAdmin}>Admin</button>}
        {adminUnlocked && <button className={view === "admin" ? "nav-btn active" : "nav-btn"} onClick={() => setView("admin")}>Admin</button>}
        {adminUnlocked && <button className="lock-btn" onClick={lock}>Lock</button>}
        <button className="cart-btn" onClick={() => setView("shop")}>Cart <b>{itemCount}</b></button>
      </nav>
    </header>

    {view === "settings" && adminUnlocked ? <main className="settings-page"><section className="settings-hero"><div><p className="eyebrow">CACHO STORE SETTINGS</p><h1>Store settings</h1><p>Private controls for the store owner. Product data is designed to come from Excel through the sync pipeline.</p></div></section><section className="settings-grid"><article className="settings-card"><span className="settings-icon">▤</span><h2>Excel catalog</h2><p>Your Excel workbook is the planned source of truth for product names, categories, wholesale prices, stock, and image URLs.</p><div className="status-row"><span>Connection</span><strong className="status-pending">Setup required</strong></div><div className="status-row"><span>Last catalog sync</span><strong>{updatedAt ? new Date(updatedAt).toLocaleString("en-PH") : "Not synced"}</strong></div></article><article className="settings-card"><span className="settings-icon">🔒</span><h2>Owner-only controls</h2><p>Admin access is required before private management tools are shown. Use Lock when you finish.</p><button className="secondary-btn" onClick={() => setView("admin")}>Open admin</button></article><article className="settings-card wide-card"><span className="settings-icon">↔</span><h2>How automatic sync will work</h2><div className="sync-steps"><div><b>1</b><span>Edit the Excel workbook in OneDrive/SharePoint.</span></div><div><b>2</b><span>Power Automate reads the ProductsTable and sends the rows to CACHO Store.</span></div><div><b>3</b><span>The sync endpoint updates <code>products.json</code>; Vercel then publishes the new catalog.</span></div></div><p className="muted">The Excel Online (Business) connector can read rows from an Excel table; its documentation also notes short backend delays, so updates are not necessarily instantaneous.</p></article></section></main> : view === "admin" && adminUnlocked ? <main className="admin-page"><section className="admin-hero"><div><p className="eyebrow">OWNER AREA</p><h1>Catalog control</h1><p>Excel is the source of truth. The website displays the synced catalog below so you can confirm what customers will see.</p></div></section><section className="admin-layout"><div><div className="admin-toolbar"><div className="search wide"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search synced products..."/></div><span className="result-count">{products.length} products</span></div><div className="admin-list">{products.map((p) => <article className="admin-product" key={p.id}><div className="mini-image">{p.image ? <img src={p.image} alt=""/> : <span>{p.name.charAt(0)}</span>}</div><div className="admin-product-main"><div><small>{p.category} · {p.unit}</small><h3>{p.name}</h3></div><div className="admin-price"><span>Wholesale</span><strong>{peso(p.price)}</strong></div><div className="stock-editor"><span>Stock</span><b className="read-only-stock">{p.stock}</b></div><div className="admin-product-actions"><button onClick={() => setView("settings")}>Excel settings</button></div></div></article>)}</div></div></section></main> : <main>
      <section className="hero"><div className="hero-main"><p className="eyebrow">WELCOME TO CACHO STORE</p><h1>Wholesale essentials,<br/><em>better value.</em></h1><p className="hero-copy">Your reliable source for everyday grocery products. Browse wholesale prices and order exactly the quantity your store needs.</p><div className="hero-actions"><button onClick={() => document.querySelector(".products-anchor")?.scrollIntoView({ behavior: "smooth" })}>Browse products <span>→</span></button><span>Wholesale pricing on every product</span></div></div><div className="hero-card"><div className="hero-card-icon">▦</div><span>WHOLESALE ORDERS</span><strong>Buying for your own store?</strong><small>Search the catalog, choose your products, and enter the exact quantities you need.</small></div></section>
      <section className="toolbar"><div className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."/></div><div className="wholesale-badge"><span>✓</span> Wholesale prices</div></section>
      <div className="category-row"><button className={category === "All" ? "selected" : ""} onClick={() => setCategory("All")}>All</button>{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      <section className="content-grid products-anchor"><div><div className="section-heading"><div><p className="eyebrow">WHOLESALE CATALOG</p><h2>Shop everyday essentials</h2></div><span>{filtered.length} products{loading ? " · loading" : ""}</span></div><div className="product-grid">{filtered.map((p) => <article className="product-card" key={p.id}><div className="product-image">{p.image ? <img src={p.image} alt={p.name}/> : <span>{p.name.charAt(0)}</span>}<small>{p.unit}</small></div><div className="product-info"><small className="product-category">{p.category}</small><h3>{p.name}</h3><div className="price-row"><div><span>Wholesale price</span><strong>{peso(p.price)}</strong></div><span className={p.stock < 30 ? "stock low" : "stock"}>{p.stock} available</span></div><button className="add-btn" disabled={!p.stock} onClick={() => add(p)}><span>+</span> {p.stock ? "Add to order" : "Out of stock"}</button></div></article>)}</div></div><aside className="order-panel"><div className="order-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Wholesale order</h2></div><span>{itemCount} items</span></div>{cartItems.length === 0 ? <div className="empty"><div className="empty-icon">🛒</div><strong>Your order is empty</strong><p>Add products and set the exact quantity you need.</p></div> : <div className="order-items">{cartItems.map((p) => <div className="order-item" key={p.id}><div className="order-name"><strong>{p.name}</strong><small>{peso(p.price)} each</small></div><div className="qty"><button onClick={() => qty(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => qty(p.id, 1)}>+</button></div><strong className="line-total">{peso(p.price * cart[p.id])}</strong></div>)}</div>}<div className="order-total"><span>Total</span><strong>{peso(total)}</strong></div><button className="checkout" disabled={!itemCount}>Review order <span>→</span></button></aside></section>
    </main>}
  </div>;
}
