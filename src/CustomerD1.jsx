import { useEffect, useMemo, useRef, useState } from "react";
import { IMAGE_MAP } from "./imageSeed";
import "./styles.css";
import "./customer-polish.css";

const peso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const CUSTOMER_ID_KEY = "cacho-customer-id-v1";
const getCustomerId = () => {
  let id = localStorage.getItem(CUSTOMER_ID_KEY);
  if (!id) {
    id = crypto?.randomUUID?.() || `cust-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(CUSTOMER_ID_KEY, id);
  }
  return id;
};
const resolveImage = (p) => {
  const key = `${p?.name || ""}__${p?.unit || ""}`;
  const mapped = IMAGE_MAP[key] || IMAGE_MAP[p?.name];
  const current = String(p?.image || "");
  return mapped && (!current || current.includes("placehold.co")) ? mapped : current || mapped || "";
};
const clean = (p) => ({ ...p, id: Number(p.id), name: String(p.name || "Product"), category: String(p.category || "Other"), unit: String(p.unit || "Each"), price: Number(p.price || 0), stock: Math.max(0, Number(p.stock || 0)), image: resolveImage(p), active: p.active !== false });

export default function CustomerD1() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});
  const [draftQty, setDraftQty] = useState({});
  const [toast, setToast] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [syncing, setSyncing] = useState(true);
  const categoryRef = useRef(null);
  const [categoryScroll, setCategoryScroll] = useState({ left: false, right: false });

  const customerId = getCustomerId();

  const loadCatalog = async () => {
    try {
      const r = await fetch(`/api/products?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error("catalog unavailable");
      const data = await r.json();
      const list = (data.products || []).map(clean).filter(p => p.active);
      setProducts(list);
      setCategories(Array.isArray(data.categories) ? data.categories : [...new Set(list.map(p => p.category))]);
    } catch {
      try {
        const r = await fetch(`/products.json?t=${Date.now()}`, { cache: "no-store" });
        const data = await r.json();
        const list = (data.products || data || []).map(clean).filter(p => p.active);
        if (list.length) setProducts(list);
      } catch {}
    } finally { setSyncing(false); }
  };

  useEffect(() => { loadCatalog(); const t = setInterval(loadCatalog, 5000); return () => clearInterval(t); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 4500); return () => clearTimeout(t); }, [toast]);

  const updateCategoryButtons = () => {
    const el = categoryRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    setCategoryScroll({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  };
  useEffect(() => {
    updateCategoryButtons();
    const el = categoryRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateCategoryButtons, { passive: true });
    const ro = new ResizeObserver(updateCategoryButtons);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateCategoryButtons); ro.disconnect(); };
  }, [categories, products]);

  const scrollCategories = (amount) => categoryRef.current?.scrollBy({ left: amount, behavior: "smooth" });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => (selectedCategory === "All" || p.category === selectedCategory) && (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
  }, [products, selectedCategory, search]);
  const cartItems = useMemo(() => products.filter(p => Number(cart[p.id]) > 0), [products, cart]);
  const itemCount = Object.values(cart).reduce((s, q) => s + Number(q || 0), 0);
  const total = cartItems.reduce((s, p) => s + Number(cart[p.id]) * p.price, 0);
  const finalCategories = [...new Set([...(categories || []), ...products.map(p => p.category)])].filter(Boolean);
  const getQty = p => { const n = Number(draftQty[p.id]); return Number.isInteger(n) && n >= 1 ? Math.min(n, Math.max(1, p.stock)) : 1; };
  const setQty = (p, value) => { const max = Math.max(1, Number(p.stock) || 1); const n = Math.floor(Number(value)); setDraftQty(c => ({ ...c, [p.id]: Math.max(1, Math.min(max, Number.isFinite(n) ? n : 1)) })); };
  const saveCart = (id, n) => setCart(c => { const x = { ...c }; if (n <= 0) delete x[id]; else x[id] = n; return x; });
  const add = p => { const requested = getQty(p), current = Number(cart[p.id] || 0), amount = Math.min(requested, Math.max(0, p.stock - current)); if (!amount || addingId === p.id) return; setAddingId(p.id); saveCart(p.id, current + amount); setToast({ name: p.name, quantity: amount }); setQty(p, 1); setTimeout(() => setAddingId(null), 450); };
  const image = p => { const src = resolveImage(p); return src ? <img src={src} alt={p.name} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement?.classList.add("image-fallback"); }} /> : <span>{p.name.charAt(0)}</span>; };

  return <div className="app">
    <header className="topbar"><button className="brand brand-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><div className="brand-mark">C</div><div><strong>CACHO STORE</strong><span>Wholesale Grocery Supplier</span></div></button><nav className="top-actions"><button className="nav-btn active">Catalog</button><button id="cacho-my-orders" className="nav-btn" type="button">My Orders <b id="cacho-orders-count">0</b></button><button className="cart-btn" onClick={() => document.querySelector(".order-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Cart <b>{itemCount}</b></button></nav></header>
    <main>
      <section className="hero"><div className="hero-main"><div className="hero-kicker"><p className="eyebrow">CACHO STORE · WHOLESALE</p><span className={syncing ? "sync-dot syncing" : "sync-dot"}>{syncing ? "Syncing catalog" : "Catalog updated automatically"}</span></div><h1>Wholesale essentials,<br/><em>better value.</em></h1><p className="hero-copy">Buy by quantity, see your wholesale price, and send your order in a few clicks.</p><div className="hero-actions"><button onClick={() => document.querySelector(".products-anchor")?.scrollIntoView({ behavior: "smooth" })}>Browse products <span>→</span></button></div></div><div className="hero-card"><div className="hero-card-icon">▦</div><span>WHOLESALE BUYING</span><strong>Built for store owners</strong><small>Choose the exact quantity you need and keep your previous orders easy to review.</small></div></section>
      <section className="toolbar"><div className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or categories..."/></div><div className="wholesale-badge"><span>✓</span> Wholesale pricing</div></section>
      <div className="category-scroller"><button className="category-scroll-btn left" type="button" onClick={() => scrollCategories(-320)} disabled={!categoryScroll.left} aria-label="Scroll categories left">‹</button><div className="category-row" ref={categoryRef}><button className={selectedCategory === "All" ? "selected" : ""} onClick={() => setSelectedCategory("All")}>All products</button>{finalCategories.map(c => <button key={c} className={selectedCategory === c ? "selected" : ""} onClick={() => setSelectedCategory(c)}>{c}</button>)}</div><button className="category-scroll-btn right" type="button" onClick={() => scrollCategories(320)} disabled={!categoryScroll.right} aria-label="Scroll categories right">›</button></div>
      <section className="content-grid products-anchor"><div><div className="section-heading"><div><p className="eyebrow">WHOLESALE CATALOG</p><h2>Shop everyday essentials</h2><p className="section-sub">Prices and availability come from the shared CACHO admin catalog.</p></div><span>{filtered.length} products</span></div><div className="product-grid">{filtered.map(p => { const q = getQty(p), inCart = Number(cart[p.id] || 0), remaining = Math.max(0, p.stock - inCart); return <article className={`product-card${inCart ? " has-cart-item" : ""}`} key={`${p.id}-${p.unit}`}><div className="product-image">{image(p)}<small>{p.unit}</small>{inCart > 0 && <span className="cart-ribbon">In order · {inCart}</span>}</div><div className="product-info"><small className="product-category">{p.category}</small><div className="product-title-row"><h3>{p.name}</h3>{inCart > 0 && <span className="selected-dot">●</span>}</div><div className="price-row"><div><span>Wholesale price</span><strong>{peso(p.price)}</strong></div><span className={remaining < 30 ? "stock low" : "stock"}>{remaining} left</span></div><div className="product-buy-label"><span>Quantity</span>{inCart > 0 && <span className="in-cart-note">{inCart} in cart</span>}</div><div className="product-buy-row"><div className="product-quantity"><button type="button" onClick={() => setQty(p, q - 1)} disabled={q <= 1}>−</button><input type="number" min="1" max={Math.max(1, remaining)} value={q} onChange={e => setQty(p, e.target.value)}/><button type="button" onClick={() => setQty(p, q + 1)} disabled={q >= Math.max(1, remaining)}>+</button></div><button className="add-btn" type="button" disabled={!remaining || addingId === p.id} onClick={() => add(p)}><span>+</span>{addingId === p.id ? " Added" : remaining ? ` Add ${q}` : " Out of stock"}</button></div></div></article>; })}</div></div>
        <aside className="order-panel"><div className="order-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Wholesale order</h2></div><span>{itemCount} units</span></div>{cartItems.length === 0 ? <div className="empty"><div className="empty-icon">🛒</div><strong>Your order is empty</strong><p>Add products and set the exact quantity you need.</p></div> : <div className="order-items">{cartItems.map(p => <div className="order-item" data-product-id={p.id} key={`${p.id}-${p.unit}`}><div className="order-name"><strong>{p.name}</strong><small>{peso(p.price)} each · {p.category}</small></div><div className="qty"><button type="button" onClick={() => saveCart(p.id, Math.max(0, Number(cart[p.id]) - 1))}>−</button><b>{cart[p.id]}</b><button type="button" onClick={() => saveCart(p.id, Math.min(p.stock, Number(cart[p.id]) + 1))}>+</button></div><strong className="line-total">{peso(p.price * Number(cart[p.id]))}</strong></div>)}</div>}<div className="order-total"><span>Total</span><strong>{peso(total)}</strong></div><button className="checkout" type="button" disabled={!itemCount}>Review order <span>→</span></button></aside>
      </section>
    </main>{toast && <div className="add-toast"><div className="add-toast-icon">✓</div><div className="add-toast-copy"><strong>{toast.name}</strong><span>{toast.quantity} added to your order</span></div><button type="button" className="add-toast-close" onClick={() => setToast(null)}>×</button></div>}
  </div>;
}
