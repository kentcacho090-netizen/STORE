import { useMemo, useState } from "react";

const products = [
  { id: 1, name: "Lucky Me! Pancit Canton", category: "Noodles", unit: "60g", retail: 15, wholesale: 12.5, stock: 150 },
  { id: 2, name: "Coca-Cola", category: "Drinks", unit: "1.5L", retail: 85, wholesale: 75, stock: 48 },
  { id: 3, name: "Surf Powder Detergent", category: "Household", unit: "1kg", retail: 120, wholesale: 108, stock: 23 },
  { id: 4, name: "Bear Brand Fortified", category: "Coffee & Milk", unit: "1kg", retail: 285, wholesale: 265, stock: 31 },
  { id: 5, name: "Argentina Corned Beef", category: "Canned Goods", unit: "175g", retail: 38, wholesale: 34, stock: 72 },
  { id: 6, name: "Jack 'n Jill Piattos", category: "Snacks", unit: "85g", retail: 30, wholesale: 27, stock: 95 }
];

const categories = ["All", "Noodles", "Drinks", "Household", "Coffee & Milk", "Canned Goods", "Snacks"];

const peso = (value) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function App() {
  const [mode, setMode] = useState("wholesale");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({});

  const filtered = useMemo(() => products.filter((p) => {
    const matchesCategory = category === "All" || p.category === category;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [category, search]);

  const add = (product) => setCart((current) => ({
    ...current,
    [product.id]: (current[product.id] || 0) + 1
  }));

  const changeQty = (id, amount) => setCart((current) => {
    const next = Math.max(0, (current[id] || 0) + amount);
    const copy = { ...current };
    if (next === 0) delete copy[id]; else copy[id] = next;
    return copy;
  });

  const cartItems = products.filter((p) => cart[p.id]);
  const total = cartItems.reduce((sum, p) => sum + cart[p.id] * (mode === "wholesale" ? p.wholesale : p.retail), 0);
  const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div><strong>STORE</strong><span>Grocery & Wholesale</span></div>
        </div>
        <div className="top-actions">
          <button className="link-btn">Orders</button>
          <button className="cart-btn">Cart <b>{itemCount}</b></button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">YOUR EVERYDAY STORE</p>
            <h1>Shop for your store<br />or your home.</h1>
            <p className="hero-copy">Browse everyday grocery essentials with clear retail and wholesale pricing.</p>
          </div>
          <div className="hero-card">
            <span>WHOLESALE MODE</span>
            <strong>Better prices for bulk orders</strong>
            <small>Enter the quantity your buyer needs. We'll handle the total.</small>
          </div>
        </section>

        <section className="toolbar">
          <div className="search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." /></div>
          <div className="mode-switch">
            <button className={mode === "retail" ? "active" : ""} onClick={() => setMode("retail")}>Retail</button>
            <button className={mode === "wholesale" ? "active" : ""} onClick={() => setMode("wholesale")}>Wholesale</button>
          </div>
        </section>

        <div className="category-row">
          {categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>

        <section className="content-grid">
          <div>
            <div className="section-heading"><div><p className="eyebrow">PRODUCTS</p><h2>Everyday essentials</h2></div><span>{filtered.length} products</span></div>
            <div className="product-grid">
              {filtered.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">{product.name.charAt(0)}</div>
                  <div className="product-info">
                    <small>{product.category} · {product.unit}</small>
                    <h3>{product.name}</h3>
                    <div className="price-row">
                      <div><span>{mode === "wholesale" ? "Wholesale" : "Retail"}</span><strong>{peso(mode === "wholesale" ? product.wholesale : product.retail)}</strong></div>
                      <span className={product.stock < 30 ? "stock low" : "stock"}>{product.stock} in stock</span>
                    </div>
                    <button className="add-btn" onClick={() => add(product)}>Add to order</button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="order-panel">
            <div className="order-head"><div><p className="eyebrow">CURRENT ORDER</p><h2>{mode === "wholesale" ? "Wholesale" : "Retail"} order</h2></div><span>{itemCount} items</span></div>
            {cartItems.length === 0 ? (
              <div className="empty"><div className="empty-icon">＋</div><strong>Your order is empty</strong><p>Add products and choose the quantity your buyer needs.</p></div>
            ) : (
              <div className="order-items">
                {cartItems.map((p) => {
                  const price = mode === "wholesale" ? p.wholesale : p.retail;
                  return <div className="order-item" key={p.id}><div><strong>{p.name}</strong><small>{peso(price)} each</small></div><div className="qty"><button onClick={() => changeQty(p.id, -1)}>−</button><b>{cart[p.id]}</b><button onClick={() => changeQty(p.id, 1)}>+</button></div><strong>{peso(price * cart[p.id])}</strong></div>;
                })}
              </div>
            )}
            <div className="order-total"><span>Total</span><strong>{peso(total)}</strong></div>
            <button className="checkout" disabled={!itemCount}>Review order</button>
          </aside>
        </section>
      </main>
    </div>
  );
}