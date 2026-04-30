import React, { useEffect, useState } from "react";

const API = "http://127.0.0.1:5000";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [dashboard, setDashboard] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    total_sales: 0,
  });

  useEffect(() => {
    loadProducts();
    loadDashboard();
  }, []);

  async function loadProducts() {
    const res = await fetch(`${API}/products`);
    const data = await res.json();
    setProducts(data);
  }

  async function loadDashboard() {
    const res = await fetch(`${API}/dashboard`);
    const data = await res.json();
    setDashboard(data);
  }

  const styles = {
    button: {
      padding: 10,
      marginRight: 10,
      background: "#333",
      color: "#fff",
      border: "none",
      cursor: "pointer",
    },
    card: {
      background: "#fff",
      padding: 20,
      borderRadius: 10,
      marginBottom: 10,
    },
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Candle Shop</h1>

      <div>
        <button style={styles.button} onClick={() => setPage("dashboard")}>
          Dashboard
        </button>
        <button style={styles.button} onClick={() => setPage("products")}>
          Products
        </button>
      </div>

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <div>
          <h2>Dashboard</h2>

          <div style={styles.card}>
            Total Products: {dashboard.total_products}
          </div>
          <div style={styles.card}>
            Total Customers: {dashboard.total_customers}
          </div>
          <div style={styles.card}>
            Total Orders: {dashboard.total_orders}
          </div>
          <div style={styles.card}>
            Total Sales: ETB {dashboard.total_sales}
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      {page === "products" && (
        <div>
          <h2>Products</h2>

          {products.map((p) => (
            <div key={p.id}>
              {p.name} - ETB {p.price}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}