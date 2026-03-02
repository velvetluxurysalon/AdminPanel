import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  Scissors,
  ShoppingCart,
  Check,
  Flame,
  AlertCircle,
} from "lucide-react";
import {
  getCustomers,
  createVisit,
  addCustomer,
  getServices,
  getProducts,
} from "../../../utils/firebaseUtils";

const CheckInModal = ({ onClose, onCheckIn }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // New success message state
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: "",
    phone: "",
    email: "",
    dateOfBirth: "",
  });

  // Services and Products
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("services");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [frequentlyUsedIds, setFrequentlyUsedIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allCustomers, servicesData, productsData] = await Promise.all([
          getCustomers(),
          getServices(false),
          getProducts(),
        ]);
        setCustomers(allCustomers || []);
        setServices(servicesData || []);
        setProducts(productsData || []);

        // Load frequently used services
        const storedFrequent = localStorage.getItem("frequentlyUsedServices");
        if (storedFrequent) {
          try {
            setFrequentlyUsedIds(JSON.parse(storedFrequent).slice(0, 5));
          } catch (e) {
            console.log("Error reading frequently used services");
          }
        }
      } catch (err) {
        setError("Failed to load data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm),
  );

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name || "");
    setShowDropdown(false);
  };

  const trackServiceUsage = (serviceId) => {
    const storedFrequent = localStorage.getItem("frequentlyUsedServices");
    let frequentList = storedFrequent ? JSON.parse(storedFrequent) : [];
    frequentList = frequentList.filter((id) => id !== serviceId);
    frequentList.unshift(serviceId);
    frequentList = frequentList.slice(0, 10);
    localStorage.setItem(
      "frequentlyUsedServices",
      JSON.stringify(frequentList),
    );
    setFrequentlyUsedIds(frequentList.slice(0, 5));
  };

  const toggleItem = (item, type) => {
    trackServiceUsage(item.id);

    if (type === "service") {
      setSelectedServices((prev) =>
        prev.some((s) => s.id === item.id)
          ? prev.filter((s) => s.id !== item.id)
          : [...prev, item],
      );
    } else {
      setSelectedProducts((prev) =>
        prev.some((p) => p.id === item.id)
          ? prev.filter((p) => p.id !== item.id)
          : [...prev, item],
      );
    }
  };

  const handleCheckIn = async () => {
    if (!selectedCustomer) {
      setError("Please select a customer");
      return;
    }

    if (selectedServices.length === 0 && selectedProducts.length === 0) {
      setError("Please select at least one service or product");
      return;
    }

    try {
      setLoading(true);

      // Create items array
      const items = [
        ...selectedServices.map((service) => ({
          type: "service",
          serviceId: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration || 30,
          quantity: 1,
          staff: null,
          status: "pending",
        })),
        ...selectedProducts.map((product) => ({
          type: "product",
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          status: "added",
        })),
      ];

      await createVisit({
        customerId: selectedCustomer.id,
        customer: {
          id: selectedCustomer.id,
          name: selectedCustomer.name || "",
          phone: selectedCustomer.phone || "",
          email: selectedCustomer.email || "",
        },
        items: items,
        status: "READY_FOR_BILLING", // Skip IN_SERVICE, go directly to billing
        notes: "",
      });

      setError("");
      onCheckIn();
      onClose();
    } catch (err) {
      setError("Failed to check in customer: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustomerData.name.trim()) {
      setError("Please enter customer name");
      return;
    }

    if (!newCustomerData.phone.trim()) {
      setError("Please enter phone number (required)");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(""); // Clear previous success messages

      console.log(
        "ðŸ‘¤ [CheckIn] Creating new customer with data:",
        newCustomerData,
      );

      const newCustomer = await addCustomer({
        name: newCustomerData.name.trim(),
        phone: newCustomerData.phone.trim(),
        email: newCustomerData.email.trim(),
        dateOfBirth: newCustomerData.dateOfBirth || null,
      });

      console.log(
        "✓ [CheckIn] New customer created successfully:",
        newCustomer,
      );

      setSelectedCustomer(newCustomer);
      setSearchTerm(newCustomer.name);
      setShowNewCustomerForm(false);
      setNewCustomerData({ name: "", phone: "", email: "", dateOfBirth: "" });
      setSuccess(
        `✓ Customer '${newCustomer.name}' created successfully! Now select services and click "Check In"`,
      ); // Show success message

      // Refresh the customer list to include the new customer
      const allCustomers = await getCustomers();
      console.log(
        "ðŸ”„ [CheckIn] Customer list refreshed, total customers:",
        allCustomers?.length,
      );
      setCustomers(allCustomers || []);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("âŒ [CheckIn] Failed to create customer:", err);
      setError("Failed to create customer: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openNewCustomerForm = () => {
    const isPhoneNumber = /^\d+$/.test(searchTerm.replace(/[\s\-()]/g, ""));
    setShowNewCustomerForm(true);
    setShowDropdown(false);

    if (isPhoneNumber) {
      setNewCustomerData({
        name: "",
        phone: searchTerm,
        email: "",
        dateOfBirth: "",
      });
    } else {
      setNewCustomerData({
        name: searchTerm,
        phone: "",
        email: "",
        dateOfBirth: "",
      });
    }
  };

  const items = activeTab === "services" ? services : products;
  const selectedItems =
    activeTab === "services" ? selectedServices : selectedProducts;

  const frequentItems = items.filter((item) =>
    frequentlyUsedIds.includes(item.id),
  );

  const filteredItems =
    itemSearchTerm.trim() === ""
      ? items
      : items.filter(
          (item) =>
            item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
            (item.category &&
              item.category
                .toLowerCase()
                .includes(itemSearchTerm.toLowerCase())),
        );

  const frequentFiltered = filteredItems.filter((item) =>
    frequentlyUsedIds.includes(item.id),
  );
  const otherFiltered = filteredItems.filter(
    (item) => !frequentlyUsedIds.includes(item.id),
  );

  const isItemSelected = (item) => {
    if (activeTab === "services") {
      return selectedServices.some((s) => s.id === item.id);
    } else {
      return selectedProducts.some((p) => p.id === item.id);
    }
  };

  const totalAmount = [...selectedServices, ...selectedProducts].reduce(
    (sum, item) => sum + (item.price || 0),
    0,
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(2px)",
      }}
    >
      <style>{``}</style>

      <div
        style={{
          background: "white",
          width: "95%",
          maxWidth: "900px",
          maxHeight: "90vh",
          borderRadius: "0.75rem",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "0.875rem 1.25rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "white",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "1rem",
                fontWeight: "600",
                color: "#111827",
              }}
            >
              New Check-In
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: "#9ca3af",
                marginTop: "2px",
              }}
            >
              Select customer and services
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "0.375rem",
              borderRadius: "0.375rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY - 2 columns side by side */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* LEFT â€” Customer panel */}
          <div
            style={{
              width: "272px",
              minWidth: "272px",
              borderRight: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{ padding: "0.875rem 1rem", overflowY: "auto", flex: 1 }}
            >
              {/* Search */}
              <p
                style={{
                  margin: "0 0 0.375rem 0",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Customer
              </p>
              <div style={{ position: "relative", zIndex: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem",
                    background: "white",
                  }}
                >
                  <Search size={14} color="#9ca3af" />
                  <input
                    type="text"
                    placeholder="Name or phone..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                      setSelectedCustomer(null);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: "0.8125rem",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                {showDropdown && filteredCustomers.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "white",
                      border: "1px solid #d1d5db",
                      borderTop: "none",
                      borderRadius: "0 0 0.5rem 0.5rem",
                      maxHeight: "180px",
                      overflowY: "auto",
                      zIndex: 50,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  >
                    {filteredCustomers.map((customer, index) => (
                      <div
                        key={customer.id || index}
                        onClick={() => handleSelectCustomer(customer)}
                        style={{
                          padding: "0.5rem 0.75rem",
                          borderBottom:
                            index < filteredCustomers.length - 1
                              ? "1px solid #f3f4f6"
                              : "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "white")
                        }
                      >
                        <div
                          style={{
                            fontWeight: "600",
                            color: "#111827",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {customer.name || "Unknown"}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                          {customer.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showDropdown &&
                  filteredCustomers.length === 0 &&
                  searchTerm && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #d1d5db",
                        borderTop: "none",
                        borderRadius: "0 0 0.5rem 0.5rem",
                        padding: "0.75rem",
                        zIndex: 50,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    >
                      <div
                        style={{
                          color: "#9ca3af",
                          fontSize: "0.75rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        No customers found
                      </div>
                      <button
                        onClick={openNewCustomerForm}
                        style={{
                          width: "100%",
                          padding: "0.4rem 0.75rem",
                          background: "#f9fafb",
                          color: "#374151",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.375rem",
                        }}
                      >
                        <Plus size={13} /> Add New Customer
                      </button>
                    </div>
                  )}
              </div>

              {/* New Customer Form */}
              {showNewCustomerForm && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.75rem",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    New Customer
                  </p>
                  {[
                    {
                      placeholder: "Name *",
                      key: "name",
                      type: "text",
                    },
                    {
                      placeholder: "Phone *",
                      key: "phone",
                      type: "tel",
                    },
                    {
                      placeholder: "Email (optional)",
                      key: "email",
                      type: "text",
                    },
                    {
                      placeholder: "Date of Birth",
                      key: "dateOfBirth",
                      type: "date",
                    },
                  ].map((f) => (
                    <input
                      key={f.key}
                      type={f.type}
                      placeholder={f.placeholder}
                      value={newCustomerData[f.key]}
                      onChange={(e) =>
                        setNewCustomerData({
                          ...newCustomerData,
                          [f.key]: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.4rem 0.5rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "0.375rem",
                        fontSize: "0.775rem",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        marginBottom: "0.375rem",
                      }}
                    />
                  ))}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    <button
                      onClick={handleCreateNewCustomer}
                      disabled={loading || !newCustomerData.name.trim()}
                      style={{
                        flex: 1,
                        padding: "0.4rem",
                        background:
                          loading || !newCustomerData.name.trim()
                            ? "#e5e7eb"
                            : "#111827",
                        color: "white",
                        border: "none",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor:
                          loading || !newCustomerData.name.trim()
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {loading ? "..." : "Create"}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewCustomerForm(false);
                        setNewCustomerData({
                          name: "",
                          phone: "",
                          email: "",
                        });
                      }}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: "0.4rem",
                        background: "white",
                        border: "1px solid #d1d5db",
                        color: "#374151",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Customer Badge */}
              {selectedCustomer && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "#059669",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ✓“ Selected
                  </div>
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#111827",
                      fontSize: "0.875rem",
                      marginTop: "1px",
                    }}
                  >
                    {selectedCustomer.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    {selectedCustomer.phone}
                  </div>
                </div>
              )}

              {/* Selected Items Summary */}
              {selectedServices.length + selectedProducts.length > 0 && (
                <div style={{ marginTop: "0.75rem" }}>
                  <p
                    style={{
                      margin: "0 0 0.35rem 0",
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Selected (
                    {selectedServices.length + selectedProducts.length})
                  </p>
                  <div style={{ maxHeight: "130px", overflowY: "auto" }}>
                    {[...selectedServices, ...selectedProducts].map(
                      (item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0.3rem 0",
                            borderBottom: "1px solid #f3f4f6",
                            fontSize: "0.775rem",
                          }}
                        >
                          <span style={{ color: "#374151" }}>{item.name}</span>
                          <span
                            style={{
                              color: "#111827",
                              fontWeight: "600",
                            }}
                          >
                            ₹{item.price}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
              {success && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 0.625rem",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                    color: "#15803d",
                  }}
                >
                  {success}
                </div>
              )}
              {error && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.5rem 0.625rem",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                    color: "#dc2626",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Footer: Total + Actions */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                padding: "0.75rem 1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.625rem",
                }}
              >
                <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                  Total
                </span>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "0.55rem",
                    background: "white",
                    border: "1px solid #d1d5db",
                    color: "#374151",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={
                    !selectedCustomer ||
                    (selectedServices.length === 0 &&
                      selectedProducts.length === 0) ||
                    loading
                  }
                  style={{
                    flex: 2,
                    padding: "0.55rem",
                    background:
                      !selectedCustomer ||
                      (selectedServices.length === 0 &&
                        selectedProducts.length === 0) ||
                      loading
                        ? "#e5e7eb"
                        : "#111827",
                    color:
                      !selectedCustomer ||
                      (selectedServices.length === 0 &&
                        selectedProducts.length === 0) ||
                      loading
                        ? "#9ca3af"
                        : "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    fontSize: "0.8125rem",
                    cursor:
                      !selectedCustomer ||
                      (selectedServices.length === 0 &&
                        selectedProducts.length === 0) ||
                      loading
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {loading ? "Processing..." : "✓“ Check In"}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT â€” Services & Products */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Tabs + Search */}
            <div
              style={{
                padding: "0.875rem 1rem",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  margin: "0 0 0.5rem 0",
                  fontSize: "0.7rem",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Services & Products
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.375rem",
                  marginBottom: "0.625rem",
                }}
              >
                {["services", "products"].map((type) => {
                  const isActive = activeTab === type;
                  const Icon = type === "services" ? Scissors : ShoppingCart;
                  const count =
                    type === "services"
                      ? selectedServices.length
                      : selectedProducts.length;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        setActiveTab(type);
                        setItemSearchTerm("");
                      }}
                      style={{
                        flex: 1,
                        padding: "0.4rem 0.75rem",
                        background: isActive ? "#111827" : "#f3f4f6",
                        color: isActive ? "white" : "#6b7280",
                        border: "none",
                        borderRadius: "0.375rem",
                        fontWeight: "600",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.375rem",
                      }}
                    >
                      <Icon size={14} />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                      {count > 0 && (
                        <span
                          style={{
                            background: isActive
                              ? "rgba(255,255,255,0.25)"
                              : "#e5e7eb",
                            color: isActive ? "white" : "#6b7280",
                            borderRadius: "9999px",
                            padding: "0 5px",
                            fontSize: "0.65rem",
                            fontWeight: "700",
                          }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "0.6rem",
                    top: "0.5rem",
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={itemSearchTerm}
                  onChange={(e) => setItemSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.75rem 0.45rem 2rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Items Grid */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0.75rem 1rem",
              }}
            >
              {/* Frequently Used */}
              {frequentFiltered.length > 0 && itemSearchTerm === "" && (
                <div style={{ marginBottom: "0.875rem" }}>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: "#b45309",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "0.4rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Flame size={12} /> Frequent
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(110px, 1fr))",
                      gap: "0.4rem",
                    }}
                  >
                    {frequentFiltered.map((item) => {
                      const sel = isItemSelected(item);
                      return (
                        <div
                          key={item.id}
                          onClick={() =>
                            toggleItem(
                              item,
                              activeTab === "services" ? "service" : "product",
                            )
                          }
                          style={{
                            padding: "0.45rem 0.5rem",
                            background: sel ? "#f0fdf4" : "#fffbeb",
                            border: `1.5px solid ${sel ? "#86efac" : "#fde68a"}`,
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            position: "relative",
                          }}
                        >
                          {sel && (
                            <Check
                              size={11}
                              color="#16a34a"
                              style={{
                                position: "absolute",
                                top: "0.3rem",
                                right: "0.3rem",
                              }}
                            />
                          )}
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#111827",
                              fontSize: "0.75rem",
                              marginBottom: "2px",
                              paddingRight: sel ? "0.9rem" : 0,
                              lineHeight: 1.3,
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "#059669",
                              fontWeight: "700",
                            }}
                          >
                            ₹{item.price}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Items */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                  gap: "0.4rem",
                }}
              >
                {(itemSearchTerm !== "" ? filteredItems : otherFiltered).map(
                  (item) => {
                    const sel = isItemSelected(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          toggleItem(
                            item,
                            activeTab === "services" ? "service" : "product",
                          )
                        }
                        style={{
                          padding: "0.45rem 0.5rem",
                          background: sel ? "#f0f9ff" : "white",
                          border: `1.5px solid ${sel ? "#93c5fd" : "#e5e7eb"}`,
                          borderRadius: "0.375rem",
                          cursor: "pointer",
                          position: "relative",
                        }}
                      >
                        {sel && (
                          <Check
                            size={11}
                            color="#2563eb"
                            style={{
                              position: "absolute",
                              top: "0.3rem",
                              right: "0.3rem",
                            }}
                          />
                        )}
                        <div
                          style={{
                            fontWeight: "600",
                            color: "#111827",
                            fontSize: "0.75rem",
                            marginBottom: "2px",
                            paddingRight: sel ? "0.9rem" : 0,
                            lineHeight: 1.3,
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "#059669",
                            fontWeight: "700",
                          }}
                        >
                          ₹{item.price}
                        </div>
                      </div>
                    );
                  },
                )}
                {filteredItems.length === 0 && (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "2rem",
                      color: "#9ca3af",
                      fontSize: "0.8125rem",
                    }}
                  >
                    No {activeTab} found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;


