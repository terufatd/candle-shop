import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "../api";
import { API } from "../config";
import { etb } from "../utils/format";

export default function OrdersPage({
    styles,
    setMessage,
    handleUnauthorized,
    loadDashboard,
    loadLowStock,
}) {
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    //     await loadSalesSummary();
    //    const [editingOrderId, setEditingOrderId] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState([]);

    const [orderForm, setOrderForm] = useState({
        customer_id: "",
        payment_method: "Cash",
        notes: "",
        items: [
            {
                product_id: "",
                quantity: "1",
            },
        ],
    });
    useEffect(() => {
        loadOrders();
        loadProducts();
        loadCustomers();
    }, []);

    function addOrderItem() {
        setOrderForm((prev) => ({
            ...prev,
            items: [...prev.items, { product_id: "", quantity: "1" }],
        }));
    }

    function removeOrderItem(index) {
        setOrderForm((prev) => {
            if (prev.items.length === 1) {
                return prev;
            }
            return {
                ...prev,
                items: prev.items.filter((_, i) => i !== index),
            };
        });
    }

    function updateOrderItem(index, field, value) {
        setOrderForm((prev) => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    }

    const orderPreview = useMemo(() => {
        return orderForm.items.map((item) => {
            const product = products.find(
                (p) => String(p.id) === String(item.product_id)
            );
            const quantity = parseInt(item.quantity || 0);
            const price = product ? Number(product.price) : 0;
            const lineTotal = quantity > 0 ? quantity * price : 0;

            return {
                ...item,
                productName: product ? product.name : "",
                price,
                stock: product ? product.stock : 0,
                lineTotal,
            };
        });
    }, [orderForm.items, products]);

    const orderGrandTotal = useMemo(() => {
        return orderPreview.reduce((sum, item) => sum + item.lineTotal, 0);
    }, [orderPreview]);

    async function createOrder(e) {
        e.preventDefault();

        const cleanedItems = orderForm.items
            .map((item) => ({
                product_id: parseInt(item.product_id, 10),
                quantity: parseInt(item.quantity, 10),
            }))
            .filter(
                (item) =>
                    !Number.isNaN(item.product_id) &&
                    !Number.isNaN(item.quantity) &&
                    item.quantity > 0
            );

        if (!orderForm.customer_id) {
            setMessage("Please select a customer");
            return;
        }

        if (cleanedItems.length === 0) {
            setMessage("Please add at least one valid order item");
            return;
        }
        const overStockItem = cleanedItems.find((item) => {
            const product = products.find((p) => p.id === item.product_id);
            return product && item.quantity > Number(product.stock);
        });

        if (overStockItem) {
            const product = products.find((p) => p.id === overStockItem.product_id);
            setMessage(`Not enough stock for ${product.name}`);
            return;
        }
        try {
            const res = await authFetch(`${API}/orders`, {
                method: "POST",
                body: JSON.stringify({
                    customer_id: parseInt(orderForm.customer_id, 10),
                    payment_method: orderForm.payment_method,
                    notes: orderForm.notes,
                    items: cleanedItems,
                }),
            }, handleUnauthorized
            );
            if (!res) return;

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || data.error || "Failed to create order");
                return;
            }

            setOrderForm({
                customer_id: "",
                payment_method: "Cash",
                notes: "",
                items: [
                    {
                        product_id: "",
                        quantity: "1",
                    },
                ],
            });

            await loadOrders();
            await loadLowStock();
            //            await loadSalesSummary();
            await loadDashboard();

            setMessage(`Order created successfully. Invoice downloaded for order #${data.order_id}`);
            await downloadInvoicePdfById(data.order_id);
        } catch (error) {
            console.error(error);
            setMessage("Failed to create order");
        }
    }

    async function viewInvoice(orderId) {
        try {
            const res = await authFetch(`${API}/orders/${orderId}`, {}, handleUnauthorized);
            if (!res) return;

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || data.error || "Failed to load invoice");
                return;
            }

            setSelectedInvoice(data);

        } catch (error) {
            console.error(error);
            setMessage("Failed to load invoice");
        }
    }

    async function downloadInvoicePdfById(orderId) {
        try {
            const res = await authFetch(`${API}/orders/${orderId}/invoice`, {}, handleUnauthorized);
            if (!res) return;

            if (!res.ok) {
                setMessage("Failed to download invoice");
                return;
            }

            const blob = await res.blob();
            const fileURL = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = fileURL;
            link.download = `invoice_${orderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(fileURL);
        } catch (error) {
            console.error(error);
            setMessage("Failed to download invoice");
        }
    }

    async function downloadInvoicePdf() {
        if (!selectedInvoice?.order_id) {
            setMessage("No invoice selected");
            return;
        }

        try {
            const res = await authFetch(
                `${API}/orders/${selectedInvoice.order_id}/invoice`,
                {},
                handleUnauthorized
            );
            if (!res) return;

            if (!res.ok) {
                setMessage("Failed to download invoice");
                return;
            }

            const blob = await res.blob();
            const fileURL = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = fileURL;
            link.download = `invoice_${selectedInvoice.order_id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(fileURL);
        } catch (error) {
            console.error(error);
            setMessage("Failed to download invoice");
        }
    }

    async function loadOrders() {
        try {
            setLoadingOrders(true);

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
        } finally {
            setLoadingOrders(false);
        }
    }

    async function loadProducts() {
        try {
            const res = await authFetch(`${API}/products`, {}, handleUnauthorized);
            if (!res) return;

            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setMessage("Failed to load products");
            setProducts([]);
        }
    }

    async function loadCustomers() {
        try {
            const res = await authFetch(`${API}/customers`, {}, handleUnauthorized);
            if (!res) return;

            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setMessage("Failed to load customers");
            setCustomers([]);
        }
    }
    if (selectedInvoice) {
        return (
            <div>
                {/* ✅ PRINTABLE AREA */}
                <div id="invoice-area">
                    <div style={styles.invoiceWrap}>

                        {/* HEADER */}
                        <h1 style={styles.invoiceTitle}>INVOICE</h1>
                        <div style={styles.invoiceMeta}>
                            <div><strong>Invoice #:</strong> {selectedInvoice.order_id}</div>
                            <div><strong>Date:</strong> {selectedInvoice.order_date}</div>
                            <div><strong>Status:</strong> {selectedInvoice.status}</div>
                            <div><strong>Customer:</strong> {selectedInvoice.customer_name}</div>
                        </div>

                        <div style={styles.invoiceMeta}>
                            ...
                        </div>

                        {/* ITEMS TITLE */}
                        <h3 style={{ ...styles.invoiceSectionTitle, marginTop: "20px" }}>
                            Items
                        </h3>

                        {/* ✅ TABLE GOES HERE */}
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Product</th>
                                    <th style={styles.th}>Qty</th>
                                    <th style={styles.th}>Unit Price</th>
                                    <th style={styles.th}>Line Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(selectedInvoice.items || []).map((item) => (
                                    <tr key={item.order_item_id}>
                                        <td style={styles.td}>{item.product_name}</td>
                                        <td style={styles.td}>{item.quantity}</td>
                                        <td style={styles.td}>{etb(item.unit_price)}</td>
                                        <td style={styles.td}>{etb(item.line_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* ✅ TOTAL GOES AFTER TABLE */}
                        <div style={styles.invoiceTotalBox}>
                            <div style={styles.invoiceTotalInner}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Total Amount</span>
                                    <strong>{etb(selectedInvoice.total_amount)}</strong>
                                </div>
                            </div>
                        </div>

                        {/* NOTES */}
                        {selectedInvoice.notes && (
                            <>
                                <h3 style={{ ...styles.invoiceSectionTitle, marginTop: "20px" }}>
                                    Notes
                                </h3>
                                <div style={styles.card}>{selectedInvoice.notes}</div>
                            </>
                        )}

                    </div>
                </div>

                {/* ❌ NOT PRINTED */}
                <div  className="no-print" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                    <button style={styles.button} onClick={downloadInvoicePdf}>
                        Download PDF
                    </button>

                    <button
                        style={styles.secondaryButton}
                        onClick={() => window.print()}
                    >
                        Print Invoice
                    </button>

                    <button
                        style={styles.secondaryButton}
                        onClick={() => setSelectedInvoice(null)}
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }
    return (
        <div style={styles.grid2}>
            {/* LEFT SIDE - CREATE ORDER */}
            <div style={styles.card}>
                <h2>Create Order</h2>
                <form onSubmit={createOrder}>
                    <label style={styles.label}>Customer</label>
                    <select
                        style={styles.input}
                        value={orderForm.customer_id}
                        onChange={(e) =>
                            setOrderForm({ ...orderForm, customer_id: e.target.value })
                        }
                    >
                        <option value="">Select Customer</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name || c.customer_name}
                            </option>
                        ))}
                    </select>

                    <label style={styles.label}>Order Items</label>

                    {orderForm.items.map((item, index) => (
                        <div key={index} style={styles.itemRow}>
                            {/* PRODUCT */}
                            <select
                                style={styles.input}
                                value={item.product_id}
                                onChange={(e) =>
                                    updateOrderItem(index, "product_id", e.target.value)
                                }
                            >
                                <option value="">Select Product</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name || p.product_name} ({p.stock ?? p.stock_qty})
                                    </option>
                                ))}
                            </select>

                            {/* QUANTITY */}
                            <input
                                style={styles.input}
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                    updateOrderItem(index, "quantity", e.target.value)
                                }
                            />

                            {/* LINE TOTAL */}
                            <div style={styles.input}>
                                {etb(orderPreview[index]?.lineTotal)}                            </div>

                            {/* REMOVE */}
                            <button
                                type="button"
                                style={styles.dangerButton}
                                onClick={() => removeOrderItem(index)}
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={addOrderItem}
                    >
                        + Add Item
                    </button>

                    <label style={styles.label}>Notes</label>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Notes"
                        value={orderForm.notes}
                        onChange={(e) =>
                            setOrderForm({ ...orderForm, notes: e.target.value })
                        }
                    />

                    <div style={styles.summaryBox}>
                        <strong>Total: {etb(orderGrandTotal)}</strong>                    </div>

                    <button style={styles.button} type="submit" disabled={loadingOrders}>
                        {loadingOrders ? "Creating..." : "Create Order"}
                    </button>
                </form>
            </div>

            <div style={styles.card}>
                <h2>Orders</h2>
                <input
                    style={styles.input}
                    placeholder="Search orders by customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {loadingOrders ? (
                    <p>Loading...</p>
                ) : orders.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "20px" }}>
                        No orders yet.
                    </p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Customer</th>
                                <th style={styles.th}>Total</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders
                                .filter((o) =>
                                    (o.customer_name || "").toLowerCase().includes(search.toLowerCase())
                                )
                                .map((o) => (
                                    <tr key={o.id}>
                                        <td style={styles.td}>{o.id}</td>
                                        <td style={styles.td}>{o.customer_name}</td>
                                        <td style={styles.td}>{etb(o.total_amount)}</td>                                    <td style={styles.td}>
                                            <button
                                                style={styles.secondaryButton}
                                                onClick={() => viewInvoice(o.id)}
                                            >
                                                View
                                            </button>

                                            <button
                                                style={styles.secondaryButton}
                                                onClick={() => downloadInvoicePdfById(o.id)}
                                            >
                                                PDF
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