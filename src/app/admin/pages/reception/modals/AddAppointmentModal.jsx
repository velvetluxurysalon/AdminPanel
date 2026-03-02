import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  getCustomers,
  addCustomer,
  getServices,
  getStaff,
  addManualAppointment,
} from "../../../utils/firebaseUtils";

const AddAppointmentModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Customer, 2: Service & Date, 3: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Customer selection
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Service selection
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Appointment details
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
  });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [customersData, servicesData, staffData] = await Promise.all([
          getCustomers(),
          getServices(false),
          getStaff(),
        ]);
        setCustomers(customersData || []);
        setServices(servicesData || []);
        setStaff(staffData || []);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm),
  );

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchTerm(customer.name || "");
    setShowDropdown(false);
    setShowNewCustomerForm(false);
  };

  const handleCreateNewCustomer = async (e) => {
    e.preventDefault();

    if (!newCustomer.name || !newCustomer.phone) {
      setError("Name and phone are required");
      return;
    }

    try {
      setLoading(true);
      const customer = await addCustomer({
        name: newCustomer.name,
        contactNo: newCustomer.phone,
        email: newCustomer.email,
        gender: newCustomer.gender,
      });

      setSelectedCustomer(customer);
      setSearchTerm(customer.name);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: "", phone: "", email: "", gender: "" });
      setError("");
    } catch (err) {
      if (err.message.includes("already exists")) {
        // Customer already exists, find and select them
        const existing = customers.find((c) => c.phone === newCustomer.phone);
        if (existing) {
          handleSelectCustomer(existing);
          setShowNewCustomerForm(false);
          setNewCustomer({ name: "", phone: "", email: "", gender: "" });
        } else {
          setError("This customer already exists");
        }
      } else {
        setError("Failed to create customer: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedCustomer) {
        setError("Please select or create a customer");
        return;
      }
      setError("");
      setStep(2);
    } else if (step === 2) {
      if (!selectedService || !appointmentDate || !appointmentTime) {
        setError("Please select service, date, and time");
        return;
      }
      setError("");
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      await addManualAppointment({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerEmail: selectedCustomer.email || "",
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        stylistId: selectedStaff?.id || null,
        stylistName: selectedStaff?.name || "Any Stylist",
        appointmentDate: new Date(appointmentDate),
        appointmentTime: appointmentTime,
        duration: selectedService.duration || 30,
        notes: notes,
        status: "pending",
      });

      setSuccess("Appointment added successfully!");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error adding appointment:", err);
      setError("Failed to add appointment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get min date (today)
  const minDate = getTodayDate();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--admin-card-bg)",
          borderRadius: "var(--admin-radius)",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          border: "1px solid var(--admin-border)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid var(--admin-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: "var(--admin-foreground)",
            }}
          >
            Add Manual Appointment
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              color: "var(--admin-muted-foreground)",
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem" }}>
          {error && (
            <div
              style={{
                background: "var(--admin-danger-light)",
                border: "1px solid #fca5a5",
                color: "var(--admin-danger)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--admin-radius-sm)",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "var(--admin-success-light)",
                border: "1px solid #a7f3d0",
                color: "var(--admin-success)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--admin-radius-sm)",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <CheckCircle size={18} /> {success}
            </div>
          )}

          {/* Step Indicator */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "2rem",
              position: "relative",
            }}
          >
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background:
                      step >= num
                        ? "var(--admin-primary)"
                        : "var(--admin-muted)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  {num}
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    textAlign: "center",
                    color: "var(--admin-muted-foreground)",
                  }}
                >
                  {num === 1
                    ? "Customer"
                    : num === 2
                      ? "Service & Date"
                      : "Review"}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Customer Selection */}
          {step === 1 && (
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: 600,
                  color: "var(--admin-foreground)",
                }}
              >
                Select Customer
              </label>

              {!showNewCustomerForm ? (
                <>
                  <div style={{ position: "relative", marginBottom: "1rem" }}>
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: "1px solid var(--admin-border)",
                        borderRadius: "var(--admin-radius-sm)",
                        background: "var(--admin-input-bg)",
                        color: "var(--admin-foreground)",
                        fontSize: "0.875rem",
                      }}
                    />

                    {showDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "var(--admin-card-bg)",
                          border: "1px solid var(--admin-border)",
                          borderTopWidth: 0,
                          borderRadius:
                            "0 0 var(--admin-radius-sm) var(--admin-radius-sm)",
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 10,
                        }}
                      >
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            style={{
                              padding: "0.75rem",
                              borderBottom: "1px solid var(--admin-border)",
                              cursor: "pointer",
                              background:
                                selectedCustomer?.id === customer.id
                                  ? "var(--admin-muted)"
                                  : "transparent",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--admin-foreground)",
                              }}
                            >
                              {customer.name}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--admin-muted-foreground)",
                              }}
                            >
                              {customer.phone}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowNewCustomerForm(true)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "transparent",
                      border: "1px dashed var(--admin-primary)",
                      color: "var(--admin-primary)",
                      borderRadius: "var(--admin-radius-sm)",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <Plus size={18} /> Create New Customer
                  </button>
                </>
              ) : (
                <form onSubmit={handleCreateNewCustomer}>
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.25rem",
                        fontSize: "0.875rem",
                        color: "var(--admin-muted-foreground)",
                      }}
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid var(--admin-border)",
                        borderRadius: "var(--admin-radius-sm)",
                        background: "var(--admin-input-bg)",
                        color: "var(--admin-foreground)",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.25rem",
                        fontSize: "0.875rem",
                        color: "var(--admin-muted-foreground)",
                      }}
                    >
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newCustomer.phone}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          phone: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid var(--admin-border)",
                        borderRadius: "var(--admin-radius-sm)",
                        background: "var(--admin-input-bg)",
                        color: "var(--admin-foreground)",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.25rem",
                        fontSize: "0.875rem",
                        color: "var(--admin-muted-foreground)",
                      }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          email: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid var(--admin-border)",
                        borderRadius: "var(--admin-radius-sm)",
                        background: "var(--admin-input-bg)",
                        color: "var(--admin-foreground)",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.25rem",
                        fontSize: "0.875rem",
                        color: "var(--admin-muted-foreground)",
                      }}
                    >
                      Gender
                    </label>
                    <select
                      value={newCustomer.gender}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          gender: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid var(--admin-border)",
                        borderRadius: "var(--admin-radius-sm)",
                        background: "var(--admin-input-bg)",
                        color: "var(--admin-foreground)",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="">Not specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCustomerForm(false);
                        setNewCustomer({
                          name: "",
                          phone: "",
                          email: "",
                          gender: "",
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        background: "transparent",
                        border: "1px solid var(--admin-border)",
                        color: "var(--admin-foreground)",
                        borderRadius: "var(--admin-radius-sm)",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        background: "var(--admin-primary)",
                        border: "none",
                        color: "white",
                        borderRadius: "var(--admin-radius-sm)",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading ? "Creating..." : "Create Customer"}
                    </button>
                  </div>
                </form>
              )}

              {selectedCustomer && !showNewCustomerForm && (
                <div
                  style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    background: "var(--admin-muted)",
                    borderRadius: "var(--admin-radius-sm)",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "0.875rem",
                      color: "var(--admin-muted-foreground)",
                    }}
                  >
                    Selected Customer
                  </h4>
                  <div
                    style={{
                      color: "var(--admin-foreground)",
                      fontWeight: 600,
                    }}
                  >
                    {selectedCustomer.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--admin-muted-foreground)",
                    }}
                  >
                    {selectedCustomer.phone}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Service & Date */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "var(--admin-foreground)",
                  }}
                >
                  Select Service
                </label>
                <select
                  value={selectedService?.id || ""}
                  onChange={(e) => {
                    const service = services.find(
                      (s) => s.id === e.target.value,
                    );
                    setSelectedService(service);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "var(--admin-radius-sm)",
                    background: "var(--admin-input-bg)",
                    color: "var(--admin-foreground)",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">-- Select a service --</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration}min) - ₹{service.price}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "var(--admin-foreground)",
                  }}
                >
                  Appointment Date
                </label>
                <input
                  type="date"
                  min={minDate}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "var(--admin-radius-sm)",
                    background: "var(--admin-input-bg)",
                    color: "var(--admin-foreground)",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "var(--admin-foreground)",
                  }}
                >
                  Appointment Time
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "var(--admin-radius-sm)",
                    background: "var(--admin-input-bg)",
                    color: "var(--admin-foreground)",
                    fontSize: "0.875rem",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "var(--admin-foreground)",
                  }}
                >
                  Stylist (Optional)
                </label>
                <select
                  value={selectedStaff?.id || ""}
                  onChange={(e) => {
                    const s = staff.find((st) => st.id === e.target.value);
                    setSelectedStaff(s || null);
                  }}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "var(--admin-radius-sm)",
                    background: "var(--admin-input-bg)",
                    color: "var(--admin-foreground)",
                    fontSize: "0.875rem",
                  }}
                >
                  <option value="">-- Any Stylist --</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 600,
                    color: "var(--admin-foreground)",
                  }}
                >
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any special notes for this appointment..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid var(--admin-border)",
                    borderRadius: "var(--admin-radius-sm)",
                    background: "var(--admin-input-bg)",
                    color: "var(--admin-foreground)",
                    fontSize: "0.875rem",
                    minHeight: "100px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <div
                style={{
                  background: "var(--admin-muted)",
                  borderRadius: "var(--admin-radius-sm)",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 1rem 0",
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--admin-foreground)",
                  }}
                >
                  Review Appointment Details
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-muted-foreground)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Customer Name
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--admin-foreground)",
                      }}
                    >
                      {selectedCustomer.name}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-muted-foreground)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Phone
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--admin-foreground)",
                      }}
                    >
                      {selectedCustomer.phone}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-muted-foreground)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Service
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--admin-foreground)",
                      }}
                    >
                      {selectedService.name}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-muted-foreground)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Duration
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--admin-foreground)",
                      }}
                    >
                      {selectedService.duration} minutes
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-muted-foreground)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Date & Time
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--admin-foreground)",
                      }}
                    >
                      {new Date(appointmentDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      at {appointmentTime}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-muted-foreground)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Stylist
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--admin-foreground)",
                      }}
                    >
                      {selectedStaff?.name || "Any Stylist"}
                    </div>
                  </div>
                </div>

                {notes && (
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid var(--admin-border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--admin-muted-foreground)",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Notes
                    </div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--admin-foreground)",
                      }}
                    >
                      {notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid var(--admin-border)",
            padding: "1rem 1.5rem",
            display: "flex",
            gap: "0.5rem",
            justifyContent: "flex-end",
          }}
        >
          {step > 1 && (
            <button
              onClick={handlePrevStep}
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                background: "transparent",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-foreground)",
                borderRadius: "var(--admin-radius-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
            >
              Back
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 1rem",
              background: "transparent",
              border: "1px solid var(--admin-border)",
              color: "var(--admin-foreground)",
              borderRadius: "var(--admin-radius-sm)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          >
            Cancel
          </button>

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                background: "var(--admin-primary)",
                border: "none",
                color: "white",
                borderRadius: "var(--admin-radius-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: "0.5rem 1rem",
                background: "var(--admin-success)",
                border: "none",
                color: "white",
                borderRadius: "var(--admin-radius-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Adding..." : "Add Appointment"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAppointmentModal;
