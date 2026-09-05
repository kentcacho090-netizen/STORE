import { useEffect, useMemo, useState } from "react";
import { IMAGE_MAP } from "./imageSeed";
import "./styles.css";
import "./customer-polish.css";

const PRODUCTS_URL = "/api/products";
const peso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
function readJson(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function resolveProductImage(p) {
  const key = `${p?.name || ""}__${p?.unit || ""}`;
  const mapped = IMAGE_MAP[key] || IMAGE_MAP[p?.name];
  const current = String(p?.image || "");
  if (mapped && (!current || current.includes("placehold.co"))) return mapped;
  return current || mapped || "";
}
function cleanProduct(p) { return { ...p, name:String(p?.name||"Product").trim(), category:String(p?.category||"Other").trim(), unit:String(p?.unit||"Each"), price:Number(p?.price||0), stock:Math.max(0,Number(p?.stock||0)), image:resolveProductImage(p), active:p?.active !== false }; }
function normalize(list) { const seen=new Set(); return (Array.isArray(list)?list:[]).map(cleanProduct).filter(p=>p.active).filter(p=>{const k=`${p.id}__${p.unit}`;if(seen.has(k))return false;seen.add(k);return true;}); }

export default function CustomerApp(){
  const seed=normalize(readJson("cacho-store-products-v1",[]));
  const [products,setProducts]=useState(seed); const [categories,setCategories]=useState([]); const [search,setSearch]=useState(""); const [selectedCategory,setSelectedCategory]=useState("All"); const [cart,setCart]=useState({}); const [draftQty,setDraftQty]=useState({}); const [toast,setToast]=useState(null); const [addingId,setAddingId]=useState(null); const [syncing,setSyncing]=useState(true);

  const loadCatalog=()=>fetch(`${PRODUCTS_URL}?t=${Date.now()}`,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{const list=normalize(data?.products||data);if(list.length){setProducts(list);localStorage.setItem("cacho-store-products-v1",JSON.stringify(list));}if(Array.isArray(data?.categories))setCategories(data.categories);setSyncing(false);}).catch(()=>setSyncing(false));
  useEffect(()=>{loadCatalog();const timer=window.setInterval(loadCatalog,3000);return()=>window.clearInterval(timer);},[]);

  const finalCategories=useMemo(()=>[...new Set([...(categories||[]),...products.map(p=>p.category)])].filter(Boolean),[categories,products]);
  const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return products.filter(p=>(selectedCategory==="All"||p.category===selectedCategory)&&(!q||p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)));},[products,selectedCategory,search]);
  const cartItems=useMemo(()=>products.filter(p=>Number(cart[p.id])>0),[products,cart]);
  const itemCount=Object.values(cart).reduce((s,q)=>s+Number(q||0),0); const total=cartItems.reduce((s,p)=>s+Number(cart[p.id])*p.price,0);
  const getQty=p=>{const n=Number(draftQty[p.id]);return Number.isInteger(n)&&n>=1?Math.min(n,Math.max(1,p.stock)):1;};
  const setQty=(p,v)=>{const n=Math.floor(Number(v));const max=Math.max(1,p.stock);setDraftQty(c=>({...c,[p.id]:Math.max(1,Math.min(max,Number.isFinite(n)?n:1))}));};
  const saveCart=(id,n)=>setCart(c=>{const x={...c};if(n<=0)delete x[id];else x[id]=n;return x;});
  const add=(p)=>{const requested=getQty(p),current=Number(cart[p.id]||0),available=Math.max(0,p.stock-current),amount=Math.min(requested,available);if(!amount||addingId===p.id)return;setAddingId(p.id);saveCart(p.id,current+amount);setToast({name:p.name,quantity:amount});setQty(p,1);setTimeout(()=>setAddingId(null),450);};
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(null),4500);return()=>clearTimeout(t);},[toast]);
  const productImage=p=>{const src=resolveProductImage(p);return src?<img src={src} alt={p.name} loading="lazy" decoding="async" onError={(e)=>{e.currentTarget.style.display="none";e.currentTarget.parentElement?.classList.add("image-fallback");}}/>:<span>{p.name.charAt(0)}</span>;};
  return <div className="app">
    <header className="topbar"><button className="brand brand-button" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} aria-label="CACHO Store home"><div className="brand-mark">C</div><div><strong>CACHO STORE</strong><span>Wholesale Grocery Supplier</span></div></button><nav className="top-actions"><button className="nav-btn active">Catalog</button><button id="cacho-my-orders" className="nav-btn" type="button">My Orders <b id="cacho-orders-count">0</b></button><button className="cart-btn" onClick={()=>document.querySelector(".order-panel")?.scrollIntoView({behavior:"smooth",block:"center"})}>Cart <b>{itemCount}</b></button></nav></header>
    <main>
      <section className="hero"><div className="hero-main"><div className="hero-kicker"><p className="eyebrow">CACHO STORE · WHOLESALE</p><span className={syncing?"sync-dot syncing":"sync-dot"}>{syncing?"Syncing catalog":"Catalog updated automatically"}</span></div><h1>Wholesale essentials,<br/><em>better value.</em></h1><p className="hero-copy">Buy by quantity, see your wholesale price, and send your order in a few clicks.</p><div className="hero-actions"><button onClick={()=>document.querySelector(".products-anchor")?.scrollIntoView({behavior:"smooth"})}>Browse products <span>→</span></button></div></div><div className="hero-card"><div className="hero-card-icon">▦</div><span>WHOLESALE BUYING</span><strong>Built for store owners</strong><small>Choose the exact quantity you need and keep your previous orders easy to review.</small></div></section>
      <section className="toolbar"><div className="search"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products or categories..."/></div><div className="wholesale-badge"><span>✓</span> Wholesale pricing</div></section>
      <div className="category-row"><button className={selectedCategory==="All"?"selected":""} onClick={()=>setSelectedCategory("All")}>All products</button>{finalCategories.map(c=><button key={c} className={selectedCategory===c?"selected":""} onClick={()=>setSelectedCategory(c)}>{c}</button>)}</div>
      <section className="content-grid products-anchor"><div><div className="section-heading"><div><p className="eyebrow">WHOLESALE CATALOG</p><h2>Shop everyday essentials</h2><p className="section-sub">Prices and availability come from the shared CACHO admin catalog.</p></div><span>{filtered.length} products</span></div><div className="product-grid">{filtered.map(p=>{const q=getQty(p),inCart=Number(cart[p.id]||0),remaining=Math.max(0,p.stock-inCart);return <article className={`product-card${inCart?" has-cart-item":""}`} key={`${p.id}-${p.unit}`}><div className="product-image">{productImage(p)}<small>{p.unit}</small>{inCart>0&&<span className="cart-ribbon">In order · {inCart}</span>}</div><div className="product-info"><small className="product-category">{p.category}</small><div className="product-title-row"><h3>{p.name}</h3>{inCart>0&&<span className="selected-dot">●</span>}</div><div className="price-row"><div><span>Wholesale price</span><strong>{peso(p.price)}</strong></div><span className={remaining<30?"stock low":"stock"}>{remaining} left</span></div><div className="product-buy-label"><span>Quantity</span>{inCart>0&&<span className="in-cart-note">{inCart} in cart</span>}</div><div className="product-buy-row"><div className="product-quantity"><button type="button" onClick={()=>setQty(p,q-1)} disabled={q<=1}>−</button><input type="number" min="1" max={Math.max(1,remaining)} value={q} onChange={e=>setQty(p,e.target.value)}/><button type="button" onClick={()=>setQty(p,q+1)} disabled={q>=Math.max(1,remaining)}>+</button></div><button className="add-btn" type="button" disabled={!remaining||addingId===p.id} onClick={()=>add(p)}><span>+</span>{addingId===p.id?" Added":remaining?` Add ${q}`:" Out of stock"}</button></div></div></article>;})}</div></div>
        <aside className="order-panel"><div className="order-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Wholesale order</h2></div><span>{itemCount} units</span></div>{cartItems.length===0?<div className="empty"><div className="empty-icon">🛒</div><strong>Your order is empty</strong><p>Add products and set the exact quantity you need.</p></div>:<div className="order-items">{cartItems.map(p=><div className="order-item" data-product-id={p.id} key={`${p.id}-${p.unit}`}><div className="order-name"><strong>{p.name}</strong><small>{peso(p.price)} each · {p.category}</small></div><div className="qty"><button type="button" onClick={()=>saveCart(p.id,Math.max(0,Number(cart[p.id])-1))}>−</button><b>{cart[p.id]}</b><button type="button" onClick={()=>saveCart(p.id,Math.min(p.stock,Number(cart[p.id])+1))}>+</button></div><strong className="line-total">{peso(p.price*Number(cart[p.id]))}</strong></div>)}</div>}<div className="order-total"><span>Total</span><strong>{peso(total)}</strong></div><button className="checkout" type="button" disabled={!itemCount}>Review order <span>→</span></button></aside>
      </section>
    </main>{toast&&<div className="add-toast"><div className="add-toast-icon">✓</div><div className="add-toast-copy"><strong>{toast.name}</strong><span>{toast.quantity} added to your order</span></div><button type="button" className="add-toast-close" onClick={()=>setToast(null)}>×</button></div>}
  </div>;
}
