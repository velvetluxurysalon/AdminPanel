import { useState, useEffect, useContext } from "react";
import {
  User,
  Phone,
  Calendar,
  DollarSign,
  Search,
  Trash,
  Edit,
} from "lucide-react";
import {
  getCustomers,
  deleteCustomer,
  searchCustomers,
  getVisitsByCustomer,
  convertTimestampToDate,
  calculateCustomerTotalSpent,
  updateCustomer,
} from "../utils/firebaseUtils";
import { AuthContext } from "../context/AuthContext";

const Customers = () => {
  const { userRole } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      performSearch();
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers(false);

      // Fetch visits for each customer
      const customersWithVisits = await Promise.all(
        data.map(async (customer) => {
          try {
            const visits = await getVisitsByCustomer(customer.id);
            return { ...customer, visits: visits || [] };
          } catch (err) {
            console.error(
              `Error fetching visits for customer ${customer.id}:`,
              err,
            );
            return { ...customer, visits: [] };
          }
        }),
      );

      setCustomers(customersWithVisits);
      setFilteredCustomers(customersWithVisits);
      setError("");
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      if (searchQuery.trim()) {
        const results = await searchCustomers(searchQuery);
        setFilteredCustomers(results);
      } else {
        setFilteredCustomers(customers);
      }
    } catch (error) {
      console.error("Error searching customers:", error);
    }
  };

  const handleDeleteCustomer = async (e, customerId) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this customer? This action cannot be undone.",
      )
    ) {
      try {
        setLoading(true);
        await deleteCustomer(customerId);
        setCustomers(customers.filter((c) => c.id !== customerId));
        setFilteredCustomers(
          filteredCustomers.filter((c) => c.id !== customerId),
        );
        if (selectedCustomer?.id === customerId) setSelectedCustomer(null);
        setError("");
      } catch (error) {
        console.error("Error deleting customer:", error);
        setError("Failed to delete customer");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditCustomer = (e, customer) => {
    e.stopPropagation();
    setEditingCustomer(customer.id);
    setEditFormData({
      name: customer.name || "",
      phone:
        customer.phone?.replace("+91", "") ||
        customer.contactNo?.replace("+91", "") ||
        "",
      email: customer.email || "",
      dateOfBirth: customer.dateOfBirth || "",
      gender: customer.gender || "Not specified",
      membershipType: customer.membershipType || "regular",
    });
  };

  const handleSaveEdit = async () => {
    if (!editFormData.name || !editFormData.phone) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const normalizedPhone = editFormData.phone
        .replace(/\D/g, "")
        .startsWith("91")
        ? "+" + editFormData.phone.replace(/\D/g, "")
        : "+91" + editFormData.phone.replace(/\D/g, "");

      await updateCustomer(editingCustomer, {
        name: editFormData.name,
        phone: normalizedPhone,
        email: editFormData.email,
        dateOfBirth: editFormData.dateOfBirth,
        gender: editFormData.gender,
        membershipType: editFormData.membershipType,
      });

      // Refresh customer list
      await fetchCustomers();
      setEditingCustomer(null);
      setEditFormData({});
      alert("Customer updated successfully!");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Failed to update customer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (visit) => {
    const receiptWindow = window.open("", "_blank");
    const itemsHtml = visit.items
      .map(
        (item) => `
            <tr>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.service?.name || item.product?.name}</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
            </tr>
        `,
      )
      .join("");

    const total = visit.invoice?.total || 0;
    const subtotal = visit.invoice?.subtotal || 0;
    const tax = visit.invoice?.tax || 0;
    const discount = visit.invoice?.discount || 0;

    receiptWindow.document.write(`
            <html>
            <head>
                <title>Receipt #${visit.id}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; }
                    .info { margin-bottom: 20px; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .totals { text-align: right; }
                    .footer { text-align: center; margin-top: 30px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">VELVET LUXURY SALON</div>
                    <div>Kalingarayanpalayam, Bhavani, Erode District, Tamil Nadu - 638301</div>
                    <div>Contact: 9667722611</div>
                </div>
                <div class="info">
                    <div><strong>Date:</strong> ${new Date(visit.date).toLocaleString()}</div>
                    <div><strong>Visit ID:</strong> #${visit.id}</div>
                    <div><strong>Customer:</strong> ${selectedCustomer.name}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left; border-bottom: 2px solid #000;">Item</th>
                            <th style="text-align: right; border-bottom: 2px solid #000;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div class="totals">
                    <div>Subtotal: ₹${subtotal.toFixed(2)}</div>
                    ${discount > 0 ? `<div>Discount: -₹${discount.toFixed(2)}</div>` : ""}
                    <div>Tax: ₹${tax.toFixed(2)}</div>
                    <div style="font-weight: bold; font-size: 18px; margin-top: 10px;">Total: ₹${total.toFixed(2)}</div>
                </div>
                <div class="footer">
                    <p>Thank you for visiting!</p>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
    receiptWindow.document.close();
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <div style={{ position: "relative", width: "300px" }}>
          <input
            type="text"
            className="input"
            placeholder="Search customers..."
            style={{ paddingLeft: "2.5rem" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "1rem",
              top: "0.75rem",
              color: "var(--muted-foreground)",
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Membership</th>
                <th>Visits</th>
                <th style={{ textAlign: "right" }}>Total Spent</th>
                <th>Loyalty Points</th>
                <th>Last Visit</th>
                <th style={{ width: "80px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  style={{ cursor: "pointer" }}
                >
                  <td
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, #d4af37 0%, #b45309 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                      }}
                    >
                      <User size={20} />
                    </div>
                    <span style={{ fontWeight: "600" }}>{customer.name}</span>
                  </td>
                  <td style={{ color: "var(--muted-foreground)" }}>
                    {customer.contactNo || customer.phone || "N/A"}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        backgroundColor:
                          customer.type === "Old"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(59, 130, 246, 0.1)",
                        color: customer.type === "Old" ? "#10b981" : "#60a5fa",
                        border: `1px solid ${customer.type === "Old" ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)"}`,
                      }}
                    >
                      {customer.type}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        backgroundColor:
                          customer.membershipType === "elite"
                            ? "rgba(251, 146, 60, 0.1)"
                            : customer.membershipType === "membership"
                              ? "rgba(139, 92, 246, 0.1)"
                              : "rgba(107, 114, 128, 0.1)",
                        color:
                          customer.membershipType === "elite"
                            ? "#fb923c"
                            : customer.membershipType === "membership"
                              ? "#8b5cf6"
                              : "#6b7280",
                        border: `1px solid ${customer.membershipType === "elite" ? "rgba(251, 146, 60, 0.2)" : customer.membershipType === "membership" ? "rgba(139, 92, 246, 0.2)" : "rgba(107, 114, 128, 0.2)"}`,
                      }}
                    >
                      {customer.membershipType === "elite"
                        ? "👑 Elite"
                        : customer.membershipType === "membership"
                          ? "⭐ Member"
                          : "Regular"}
                    </span>
                  </td>
                  <td>{customer.visits.length}</td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: "600",
                      color: "var(--primary)",
                    }}
                  >
                    {/* Calculate total spent from visits totalAmount */}₹
                    {(customer.visits || [])
                      .reduce((sum, v) => {
                        const total = v.totalAmount || 0;
                        return sum + total;
                      }, 0)
                      .toFixed(2)}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        backgroundColor: "rgba(168, 85, 247, 0.1)",
                        color: "#a855f7",
                        border: "1px solid rgba(168, 85, 247, 0.2)",
                        fontWeight: "600",
                      }}
                    >
                      {customer.loyaltyPoints || 0} pts
                    </span>
                  </td>
                  <td style={{ color: "var(--muted-foreground)" }}>
                    {customer.visits.length > 0
                      ? convertTimestampToDate(
                          customer.visits[0].date,
                        ).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={(e) => handleEditCustomer(e, customer)}
                      style={{
                        padding: "0.25rem 0.75rem",
                        background: "var(--primary)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: "0.75rem",
                      }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    {userRole === "admin" && (
                      <button
                        onClick={(e) => handleDeleteCustomer(e, customer.id)}
                        style={{
                          padding: "0.25rem 0.75rem",
                          background: "#dc2626",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        <Trash size={14} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      padding: "4rem",
                      textAlign: "center",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="card"
            style={{ width: "600px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2 className="card-title">{selectedCustomer.name}</h2>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--muted-foreground)",
                  }}
                >
                  {selectedCustomer.contactNo}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted-foreground)",
                  cursor: "pointer",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="card-content">
              {/* CUSTOMER SUMMARY STATS */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--secondary)",
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Membership
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color:
                        selectedCustomer.membershipType === "elite"
                          ? "#fb923c"
                          : selectedCustomer.membershipType === "membership"
                            ? "#8b5cf6"
                            : "#6b7280",
                    }}
                  >
                    {selectedCustomer.membershipType === "elite"
                      ? "👑 Elite"
                      : selectedCustomer.membershipType === "membership"
                        ? "⭐ Member"
                        : "Regular"}
                  </div>
                </div>
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--secondary)",
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Total Visits
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "var(--primary)",
                    }}
                  >
                    {selectedCustomer.visits.length}
                  </div>
                </div>
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--secondary)",
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Total Spent
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#10b981",
                    }}
                  >
                    ₹
                    {(selectedCustomer.visits || [])
                      .reduce((sum, v) => sum + (v.totalAmount || 0), 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div
                  style={{
                    padding: "1rem",
                    background: "var(--secondary)",
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--muted-foreground)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Loyalty Points
                  </div>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#a855f7",
                    }}
                  >
                    {selectedCustomer.loyaltyPoints || 0}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  handleEditCustomer(
                    { stopPropagation: () => {} },
                    selectedCustomer,
                  )
                }
                style={{
                  marginBottom: "1rem",
                  padding: "0.5rem 1rem",
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <Edit size={18} /> Edit Customer
              </button>

              {userRole === "admin" && (
                <button
                  onClick={(e) => {
                    handleDeleteCustomer(
                      { stopPropagation: () => {} },
                      selectedCustomer.id,
                    );
                    setSelectedCustomer(null);
                  }}
                  style={{
                    marginBottom: "1rem",
                    padding: "0.5rem 1rem",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <Trash size={18} /> Delete Customer
                </button>
              )}

              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  color: "var(--primary)",
                }}
              >
                Visit History
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {selectedCustomer.visits.map((visit) => (
                  <div
                    key={visit.id}
                    style={{
                      padding: "1rem",
                      background: "var(--secondary)",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <span style={{ fontWeight: "500" }}>
                        {convertTimestampToDate(visit.date)?.toLocaleString() ||
                          "Invalid Date"}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          background:
                            visit.status === "COMPLETED"
                              ? "rgba(16, 185, 129, 0.1)"
                              : "rgba(245, 158, 11, 0.1)",
                          color:
                            visit.status === "COMPLETED"
                              ? "#10b981"
                              : "#f59e0b",
                        }}
                      >
                        {visit.status.replace("_", " ")}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--muted-foreground)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {visit.items?.map((i) => i.name).join(", ")}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.875rem",
                      }}
                    >
                      <span>
                        Total:{" "}
                        <span style={{ color: "var(--foreground)" }}>
                          ₹{(visit.totalAmount || 0).toFixed(2)}
                        </span>
                      </span>
                      {visit.feedback && (
                        <span style={{ color: "var(--primary)" }}>
                          ★ {visit.feedback.rating}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {selectedCustomer.visits.length === 0 && (
                  <p
                    style={{
                      textAlign: "center",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    No visits yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingCustomer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001,
          }}
        >
          <div className="card" style={{ width: "500px" }}>
            <div
              className="card-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 className="card-title">Edit Customer</h2>
              <button
                onClick={() => setEditingCustomer(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted-foreground)",
                  cursor: "pointer",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="card-content">
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Phone Number
                </label>
                <div
                  style={{
                    display: "flex",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      background: "var(--secondary)",
                      padding: "0.5rem 0.75rem",
                      color: "var(--foreground)",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    placeholder="9876543210"
                    maxLength="10"
                    style={{
                      flex: 1,
                      border: "none",
                      padding: "0.5rem 0.75rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Gender
                </label>
                <select
                  value={editFormData.gender}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, gender: e.target.value })
                  }
                  className="input"
                  style={{ width: "100%" }}
                >
                  <option>Not specified</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  Membership Type
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    onClick={() =>
                      setEditFormData({
                        ...editFormData,
                        membershipType: "regular",
                      })
                    }
                    style={{
                      padding: "0.75rem",
                      background:
                        editFormData.membershipType === "regular"
                          ? "#6b7280"
                          : "#f3f4f6",
                      color:
                        editFormData.membershipType === "regular"
                          ? "white"
                          : "#374151",
                      border: "none",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                  >
                    Regular
                  </button>
                  <button
                    onClick={() =>
                      setEditFormData({
                        ...editFormData,
                        membershipType: "membership",
                      })
                    }
                    style={{
                      padding: "0.75rem",
                      background:
                        editFormData.membershipType === "membership"
                          ? "#8b5cf6"
                          : "#f3f4f6",
                      color:
                        editFormData.membershipType === "membership"
                          ? "white"
                          : "#374151",
                      border: "none",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                  >
                    ⭐ Member
                  </button>
                  <button
                    onClick={() =>
                      setEditFormData({
                        ...editFormData,
                        membershipType: "elite",
                      })
                    }
                    style={{
                      padding: "0.75rem",
                      background:
                        editFormData.membershipType === "elite"
                          ? "#fb923c"
                          : "#f3f4f6",
                      color:
                        editFormData.membershipType === "elite"
                          ? "white"
                          : "#374151",
                      border: "none",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                  >
                    👑 Elite
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "var(--primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius)",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditingCustomer(null)}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: "var(--secondary)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
