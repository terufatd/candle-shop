import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import HomePage from "./pages/public/HomePage";
import React, { useEffect, useMemo, useState } from "react";
import { saveToken, removeToken } from "./auth";
import { authFetch } from "./api";
import ProductsPage from "./pages/ProductsPage.js";
import CustomersPage from "./pages/CustomersPage";
import OrdersPage from "./pages/OrdersPage";
import { etb } from "./utils/format";
import "./App.css";
import LoginPage from "./pages/admin/LoginPage";

import { API } from "./config";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [page, setPage] = useState("products");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    total_sales: 0,
  });

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });


  const [lowStock, setLowStock] = useState([]);
  const [salesSummary, setSalesSummary] = useState([]);


  useEffect(() => {
    if (loggedIn) {
      loadAll();
    }
  }, [loggedIn]);


  async function loadAll() {
    loadDashboard();
    loadLowStock();
    loadSalesSummary();
  }

  async function loadDashboard() {
    try {
      const res = await authFetch(`${API}/dashboard`, {}, handleUnauthorized);
      if (!res) return;

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to load dashboard");
        return;
      }

      setDashboard({
        total_products: Number(data.total_products || 0),
        total_customers: Number(data.total_customers || 0),
        total_orders: Number(data.total_orders || 0),
        total_sales: Number(data.total_sales || 0),
      });
    } catch (error) {
      console.error(error);
      setMessage("Failed to load dashboard");
    }
  }
  function handleUnauthorized() {
    setLoggedIn(false);
    setLoginForm({
      username: "",
      password: "",
    });
    setMessage("Session expired. Please login again.");
  }

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        saveToken(data.token);
        setLoggedIn(true);
        setPage("products");
        setMessage("");
        navigate("/admin", { replace: true });
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Login request failed. Check backend/API URL.");
    }
  };

  function handleLogout() {
    removeToken();
    setLoggedIn(false);
    setPage("products");
    setLoginForm({ username: "", password: "" });
    setMessage("Logged out");
    navigate("/login", { replace: true });
  }



  async function loadOrders() {
    try {
      const res = await authFetch(`${API}/orders`, {}, handleUnauthorized);
      if (!res) return;

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to load orders");
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load orders");
      setOrders([]);
    }
  }

  async function loadLowStock() {
    try {
      const res = await authFetch(`${API}/reports/low-stock`, {}, handleUnauthorized);
      if (!res) return;

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || data.error || "Failed to load low stock report");
        setLowStock([]);
        return;
      }

      setLowStock(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load low stock report");
      setLowStock([]);
    }
  }

  async function loadSalesSummary() {
    try {
      const res = await authFetch(
        `${API}/reports/sales-summary`,
        {},
        handleUnauthorized
      );
      if (!res) return;

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || data.error || "Failed to load sales summary");
        setSalesSummary([]);
        return;
      }

      setSalesSummary(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load sales summary");
      setSalesSummary([]);
    }
  }

  const styles = {
    page: {
      padding: "28px",
      fontFamily: "Arial, sans-serif",
      background: "#f6f7fb",
      minHeight: "100vh",
      color: "#1f2937",
    },
    shell: {
      maxWidth: "1150px",
      margin: "0 auto",
    },
    heading: {
      marginBottom: "10px",
    },
    topBar: {
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "20px",
    },
    button: {
      padding: "10px 16px",
      borderRadius: "10px",
      border: "none",
      background: "#111827",
      color: "white",
      cursor: "pointer",
      fontWeight: "600",
    },
    secondaryButton: {
      padding: "10px 16px",
      borderRadius: "10px",
      border: "1px solid #d1d5db",
      background: "white",
      color: "#111827",
      cursor: "pointer",
      fontWeight: "600",
    },
    dangerButton: {
      padding: "10px 16px",
      borderRadius: "10px",
      border: "none",
      background: "#dc2626",
      color: "white",
      cursor: "pointer",
      fontWeight: "600",
    },
    card: {
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      marginBottom: "20px",
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "20px",
    },
    dashboardGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "20px",
      marginBottom: "20px",
    },
    statCard: {
      background: "white",
      borderRadius: "16px",
      padding: "20px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    },
    statLabel: {
      fontSize: "14px",
      color: "#6b7280",
      marginBottom: "8px",
    },
    statValue: {
      fontSize: "30px",
      fontWeight: "700",
      color: "#111827",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: "10px",
      border: "1px solid #d1d5db",
      marginBottom: "12px",
      boxSizing: "border-box",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "6px",
    },
    message: {
      background: "#ecfdf5",
      border: "1px solid #a7f3d0",
      color: "#065f46",
      padding: "12px 14px",
      borderRadius: "12px",
      marginBottom: "20px",
      fontWeight: "600",
    },
    loginWrap: {
      maxWidth: "420px",
      margin: "80px auto",
    },
    itemRow: {
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr auto",
      gap: "12px",
      alignItems: "end",
      marginBottom: "12px",
      padding: "14px",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      background: "#f9fafb",
    },
    summaryBox: {
      background: "#f9fafb",
      borderRadius: "12px",
      padding: "16px",
      border: "1px solid #e5e7eb",
      marginTop: "12px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      textAlign: "left",
      padding: "10px",
      borderBottom: "1px solid #e5e7eb",
      background: "#f9fafb",
    },
    td: {
      padding: "10px",
      borderBottom: "1px solid #e5e7eb",
      verticalAlign: "top",
    },
    small: {
      fontSize: "12px",
      color: "#6b7280",
      marginTop: "-6px",
      marginBottom: "10px",
    },
    invoiceWrap: {
      background: "white",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    },
    invoiceHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "20px",
      marginBottom: "24px",
    },
    invoiceTitle: {
      margin: 0,
      fontSize: "30px",
    },
    invoiceMeta: {
      lineHeight: 1.8,
    },
    invoiceSectionTitle: {
      marginTop: "20px",
      marginBottom: "10px",
      fontSize: "16px",
    },
    invoiceTotalBox: {
      marginTop: "20px",
      display: "flex",
      justifyContent: "flex-end",
    },
    invoiceTotalInner: {
      minWidth: "280px",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "16px",
      background: "#f9fafb",
    },
    printHint: {
      fontSize: "13px",
      color: "#6b7280",
      marginTop: "8px",
    },
  };
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/login"
        element={
          !loggedIn ? (
            <LoginPage
              styles={styles}
              loginForm={loginForm}
              setLoginForm={setLoginForm}
              handleLogin={handleLogin}
              message={message}
            />
          ) : (
            <Navigate to="/admin" replace />
          )
        }
      />

      <Route
        path="/admin"
        element={
          loggedIn ? (
            <div style={styles.page}>
              <div style={styles.shell}>
                <h1 style={styles.heading}>Candle Shop</h1>

                {message && <div style={styles.message}>{message}</div>}

                <div style={styles.topBar}>
                  <button style={styles.button} onClick={() => setPage("products")}>
                    Products
                  </button>
                  <button style={styles.button} onClick={() => setPage("customers")}>
                    Customers
                  </button>
                  <button style={styles.button} onClick={() => setPage("orders")}>
                    Orders
                  </button>
                  <button style={styles.button} onClick={() => setPage("reports")}>
                    Reports
                  </button>
                  <button style={styles.button} onClick={() => setPage("dashboard")}>
                    Dashboard
                  </button>
                  <button style={styles.dangerButton} onClick={handleLogout}>
                    Logout
                  </button>
                </div>

                {page === "products" && (
                  <ProductsPage
                    styles={styles}
                    setMessage={setMessage}
                    handleUnauthorized={handleUnauthorized}
                    loadDashboard={loadDashboard}
                    loadLowStock={loadLowStock}
                  />
                )}

                {page === "customers" && (
                  <CustomersPage
                    styles={styles}
                    setMessage={setMessage}
                    handleUnauthorized={handleUnauthorized}
                    loadDashboard={loadDashboard}
                  />
                )}

                {page === "orders" && (
                  <OrdersPage
                    styles={styles}
                    setMessage={setMessage}
                    handleUnauthorized={handleUnauthorized}
                    loadDashboard={loadDashboard}
                    loadLowStock={loadLowStock}
                  />
                )}

                {page === "dashboard" && (
                  <div style={styles.dashboardGrid}>
                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Total Products</div>
                      <div style={styles.statValue}>{dashboard.total_products}</div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Total Customers</div>
                      <div style={styles.statValue}>{dashboard.total_customers}</div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Total Orders</div>
                      <div style={styles.statValue}>{dashboard.total_orders}</div>
                    </div>

                    <div style={styles.statCard}>
                      <div style={styles.statLabel}>Total Sales</div>
                      <div style={styles.statValue}>{etb(dashboard.total_sales)}</div>
                    </div>
                  </div>
                )}

                {page === "reports" && (
                  <div style={styles.grid2}>
                    <div style={styles.card}>
                      <h2>Low Stock Alerts</h2>

                      {lowStock.length === 0 ? (
                        <p>No low stock alerts.</p>
                      ) : (
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Item Type</th>
                              <th style={styles.th}>Item Name</th>
                              <th style={styles.th}>Qty Available</th>
                              <th style={styles.th}>Reorder Level</th>
                              <th style={styles.th}>Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lowStock.map((item, index) => (
                              <tr key={index}>
                                <td style={styles.td}>{item.item_type}</td>
                                <td style={styles.td}>{item.item_name}</td>
                                <td style={styles.td}>{item.qty_available}</td>
                                <td style={styles.td}>{item.reorder_level}</td>
                                <td style={styles.td}>{item.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div style={styles.card}>
                      <h2>Sales Summary By Product</h2>

                      {salesSummary.length === 0 ? (
                        <p>No sales summary available yet.</p>
                      ) : (
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Product ID</th>
                              <th style={styles.th}>Product Name</th>
                              <th style={styles.th}>Total Qty Sold</th>
                              <th style={styles.th}>Total Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesSummary.map((item) => (
                              <tr key={item.product_id}>
                                <td style={styles.td}>{item.product_id}</td>
                                <td style={styles.td}>{item.product_name}</td>
                                <td style={styles.td}>{item.total_qty_sold}</td>
                                <td style={styles.td}>{etb(item.total_revenue)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}