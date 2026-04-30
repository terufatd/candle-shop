import React, { useEffect, useState } from "react";
import { authFetch } from "../api";
import { API } from "../config";
import { etb } from "../utils/format";

export default function ProductsPage({
  styles,
  setMessage,
  handleUnauthorized,
  loadDashboard,
  loadLowStock,
}) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | price | stock
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    stock: "",
  });
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoadingProducts(true);

      const res = await authFetch(
        `${API}/products`,
        {},
        handleUnauthorized
      );
      if (!res) return;

      const data = await res.json();

      if (!res.ok) {
        setMessage("Failed to load products");
        setProducts([]);
        return;
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load products");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }

  async function addProduct(e) {
    e.preventDefault();

    try {
      const res = await authFetch(
        `${API}/products`,
        {
          method: "POST",
          body: JSON.stringify({
            name: productForm.name,
            price: parseFloat(productForm.price),
            stock: parseInt(productForm.stock, 10),
          }),
        },
        handleUnauthorized
      );

      if (!res) return;

      const data = await res.json();

      if (!res.ok) {
        setMessage("Failed to add product");
        return;
      }

      setMessage("Product added");

      setProductForm({
        name: "",
        price: "",
        stock: "",
      });

      loadProducts();
    } catch (error) {
      console.error(error);
      setMessage("Error adding product");
    }
  }

  async function deleteProduct(productId) {
    if (!window.confirm("Delete this product?")) return;

    try {
      const res = await authFetch(
        `${API}/products/${productId}`,
        {
          method: "DELETE",
        },
        handleUnauthorized
      );

      if (!res) return;

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || data.error || "Failed to delete product");
        return;
      }

      setMessage(data.message || "Product deleted");
      await loadProducts();
      await loadDashboard();
      await loadLowStock();
    } catch (error) {
      console.error(error);
      setMessage("Failed to delete product");
    }
  }

  function startEditProduct(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      price: product.price || "",
      stock: product.stock || "",
    });
  }

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  function sortArrow(column) {
    if (sortBy !== column) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  return (
    <div style={styles.grid2}>

      {/* LEFT SIDE FORM */}
      <div style={styles.card}>
        <h2>Add Product</h2>

        <form onSubmit={addProduct}>
          <input
            style={styles.input}
            placeholder="Name"
            value={productForm.name}
            onChange={(e) =>
              setProductForm({ ...productForm, name: e.target.value })
            }
          />

          <input
            style={styles.input}
            type="number"
            placeholder="Price"
            value={productForm.price}
            onChange={(e) =>
              setProductForm({ ...productForm, price: e.target.value })
            }
          />

          <input
            style={styles.input}
            type="number"
            placeholder="Stock"
            value={productForm.stock}
            onChange={(e) =>
              setProductForm({ ...productForm, stock: e.target.value })
            }
          />

          <button style={styles.button} disabled={loadingProducts}>
            {loadingProducts ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>

      {/* RIGHT SIDE TABLE */}
      <div style={styles.card}>
        <h2>Products</h2>

        {/* 🔍 SEARCH INPUT */}
        <input
          style={styles.input}
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loadingProducts ? (
          <p>Loading...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => handleSort("name")}>
                  Name{sortArrow("name")}
                </th>

                <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => handleSort("price")}>
                  Price{sortArrow("price")}
                </th>

                <th style={{ ...styles.th, cursor: "pointer" }} onClick={() => handleSort("stock")}>
                  Stock{sortArrow("stock")}
                </th>

                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter((p) => {
                  const text = `${p.name || ""} ${p.product_name || ""} ${p.scent || ""} ${p.candle_type || ""}`;
                  return text.toLowerCase().includes(search.toLowerCase());
                })
                .sort((a, b) => {
                  let A = a[sortBy];
                  let B = b[sortBy];

                  if (sortBy === "name") {
                    A = (A || "").toLowerCase();
                    B = (B || "").toLowerCase();

                    if (A < B) return sortDir === "asc" ? -1 : 1;
                    if (A > B) return sortDir === "asc" ? 1 : -1;
                    return 0;
                  }

                  A = Number(A || 0);
                  B = Number(B || 0);

                  return sortDir === "asc" ? A - B : B - A;
                })
                .map((p) => (
                  <tr key={p.id}>
                    <td style={styles.td}>{p.name}</td>
                    <td style={styles.td}>{etb(p.price)}</td>
                    <td style={styles.td}>{p.stock}</td>
                    <td style={styles.td}>
                      <button
                        style={styles.secondaryButton}
                        onClick={() => startEditProduct(p)}
                      >
                        Edit
                      </button>
                      <button
                        style={styles.dangerButton}
                        onClick={() => deleteProduct(p.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}