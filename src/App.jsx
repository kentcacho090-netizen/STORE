import { useMemo, useState } from "react";

const products = [
  { id: 1, name: "Lucky Me! Pancit Canton", category: "Noodles", unit: "60g", price: 12.5, stock: 150 },
  { id: 2, name: "Coca-Cola", category: "Drinks", unit: "1.5L", price: 75, stock: 48 },
  { id: 3, name: "Surf Powder Detergent", category: "Household", unit: "1kg", price: 108, stock: 23 },
  { id: 4, name: "Bear Brand Fortified", category: "Coffee & Milk", unit: "1kg", price: 265, stock: 31 },
  { id: 5, name: "Argentina Corned Beef", category: "Canned Goods", unit: "175g", price: 34, stock: 72 },
  { id: 6, name: "Jack 'n Jill Piattos", category: "Snacks", unit: "85g", price: 27, stock: 95 }
];

const categories = ["All", "Noodles", "Drinks", "Household", "Coffee & Milk", "Canned Goods", "Snacks"];
const peso = (value) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function App() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});

  const filtered = useMemo(() => products.filter((p) =>
    (category === "All" || p.category === category) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [category, search]);

  const add = (product) => setCart((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 }));
  const changeQty = (id, amount) => setCart((current) => {
    const next = Math.max(0, (current[id] || 0) + amount);
    const copy = { ...current };
    if (next === 0) delete copy[id]; else copy[id] = next;
    return copy;
  });

  const cartItems = products.filter((p) => cart[p.id]);
  const total = cartItems.reduce((sum, p) => sum + cart[p.id] * p.price, 0);
  const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div><strong>CACHO STORE</strong><span>Wholesale Grocery Supplier</span></div>
        </div>
        <nav className="top-actions">
          <button className="link-btn">Orders</button>
          <button className="cart-btn">Cart <b>{itemCount}</b></button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-main">
            <p className="eyebrow">WELCOME TO CACHO STORE</p>
            <h1>Wholesale essentials,<br /><em>better value.</em></h1>
            <p className="hero-copy">Your reliable source for everyday grocery products. Shop wholesale prices and order exactly the quantity your store needs.</p>
            <div className="hero-actions"><button onClick={() => document.querySelector(".products-anchor")?.scrollIntoView({ behavior: "smooth" })}>Browse products <span>→</span></button><span>Wholesale pricing on every product</span></div>
          </div>
          <div className="hero-card">
            <div className="hero-card-icon">▦</div>
            <span>WHOLESALE ORDERS</span>
            <strong>Buying for your own store?</strong>
            <small>Enter exactly how many items you need. No minimum quantity is required in the system.</small>
          </div>
        </section>

        <section className="toolbar">
          <div className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." /></div>
          <div className="wholesale-badge"><span>✓</span> Wholesale prices</div>
        </section>

        <div className="category-row">{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>

        <section className="content-grid products-anchor">
          <div>
            <div className="section-heading"><div><p className="eyebrow">WHOLESALE CATALOG</p><h2>Shop everyday essentials</h2></div><span>{filtered.length} products</span></div>
            <div className="product-grid">
              {filtered.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image"><span>{product.name.charAt(0)}</span><small>{product.unit}</small></div>
                  <div className="product-info">
                    <small className="product-category">{product.category}</small>
                    <h3>{product.name}</h3>
                    <div className="price-row">
                      <div><span>Wholesale price</span><strong>{peso(product.price)}</strong></div>
                      <span className={product.stock < 30 ? "stock low" : "stock"}>{product.stock} available</span>
                    </div>
                    <button className="add-btn" onClick={() => add(product)}><span>+</span> Add to order</button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="order-panel">
            <div className="order-head"><div><p className="eyebrow">YOUR ORDER</p><h2>Wholesale order</h2></div><span>{itemCount} items</span></div>
            {cartItems.length === 0 ? (
              <div className="empty"><div className="empty-icon">🛒</div><strong>Your order is empty</strong><p>Add products and set the exact quantity you need.</p></div>
            ) : (
              <div className="order-items">{cartItems.map((p) => (
                <div className="order-item" key={p.id}><div className="order-name"><strong>{p.name}</strong><small>{peso(p.price)} each</small></div><div className="qty"><button onClick={() => changeQty(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => changeQty(p.id, 1)}>+</button></div><strong className="line-total">{peso(p.price * cart[p.id])}</strong></div>
              ))}</div>
            )}
            <div className="order-total"><span>Total</span><strong>{peso(total)}</strong></div>
            <button className="checkout" disabled={!itemCount}>Review order <span>→</span></button>
          </aside>
        </section>
      </main>
    </div>
  );
}