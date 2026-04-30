import { useEffect, useState } from "react";
import { authFetch } from "../api";
import { API } from "../config";

export default function CustomersPage({
    styles,
    setMessage,
    handleUnauthorized,
    loadDashboard,
}) {
    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [editingCustomerId, setEditingCustomerId] = useState(null);

    const [customerForm, setCustomerForm] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });
    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        try {
            setLoadingCustomers(true);

            const res = await authFetch(
                `${API}/customers`,
                {},
                handleUnauthorized
            );
            if (!res) return;

            const data = await res.json();

            if (!res.ok) {
                setMessage("Failed to load customers");
                setCustomers([]);
                return;
            }

            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setMessage("Failed to load customers");
            setCustomers([]);
        } finally {
            setLoadingCustomers(false);
        }
    }

    async function addCustomer(e) {
        e.preventDefault();

        if (!customerForm.name.trim() ||
            !customerForm.phone.trim() ||
            !customerForm.address.trim()) {
            setMessage("All fields required");
            return;
        }

        if (customerForm.email && !customerForm.email.includes("@")) {
            setMessage("Please enter a valid email address");
            return;
        }

        try {
            const isEditing = editingCustomerId !== null;

            const url = isEditing
                ? `${API}/customers/${editingCustomerId}`
                : `${API}/customers`;

            const res = await authFetch(
                url,
                {
                    method: isEditing ? "PUT" : "POST",
                    body: JSON.stringify({
                        name: customerForm.name.trim(),
                        phone: customerForm.phone.trim(),
                        email: customerForm.email.trim(),
                        address: customerForm.address.trim(),
                    }),
                },
                handleUnauthorized
            );

            if (!res) return;

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || data.error || "Failed to save customer");
                return;
            }

            setMessage(
                data.message || (isEditing ? "Customer updated" : "Customer saved")
            );

            setCustomerForm({
                name: "",
                phone: "",
                email: "",
                address: "",
            });

            setEditingCustomerId(null);

            await loadCustomers();
            await loadDashboard();
        } catch (error) {
            console.error(error);
            setMessage("Failed to save customer");
        }
    }

    function startEditCustomer(customer) {
        setEditingCustomerId(customer.id);
        setCustomerForm({
            name: customer.name || "",
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || "",
        });
    }

    async function deleteCustomer(customerId) {
        if (!window.confirm("Delete this customer?")) return;

        try {
            const res = await authFetch(
                `${API}/customers/${customerId}`,
                {
                    method: "DELETE",
                },
                handleUnauthorized
            );

            if (!res) return;

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || data.error || "Failed to delete customer");
                return;
            }

            setMessage(data.message || "Customer deleted");
            await loadCustomers();
            await loadDashboard();
        } catch (error) {
            console.error(error);
            setMessage("Failed to delete customer");
        }
    }

    return (
        <div style={styles.grid2}>
            <div style={styles.card}>
                <h2>{editingCustomerId ? "Edit Customer" : "Add Customer"}</h2>

                <form onSubmit={addCustomer}>
                    <input style={styles.input} placeholder="Name" value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    />
                    <input style={styles.input} placeholder="Phone" value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    />
                    <input style={styles.input} placeholder="Email" value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    />
                    <input style={styles.input} placeholder="Address" value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                    />

                    <button style={styles.button} type="submit">
                        {editingCustomerId ? "Update Customer" : "Save Customer"}
                    </button>
                </form>
            </div>

            <div style={styles.card}>
                <h2>Customers</h2>

                {loadingCustomers ? (
                    <p>Loading...</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Name</th>
                                <th style={styles.th}>Phone</th>
                                <th style={styles.th}>Email</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {customers.map((c) => (
                                <tr key={c.id}>
                                    <td style={styles.td}>{c.name}</td>
                                    <td style={styles.td}>{c.phone}</td>
                                    <td style={styles.td}>{c.email}</td>
                                    <td style={styles.td}>
                                        <button
                                            style={styles.secondaryButton}
                                            onClick={() => startEditCustomer(c)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            style={{ ...styles.dangerButton, marginLeft: "8px" }}
                                            onClick={() => deleteCustomer(c.id)}
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