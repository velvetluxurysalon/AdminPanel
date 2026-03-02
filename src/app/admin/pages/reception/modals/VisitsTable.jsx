import React from "react";
import {
  ShoppingCart,
  Scissors,
  Plus,
  Check,
  X,
  DollarSign,
  ChevronDown,
  Phone,
  Eye,
  Trash2,
} from "lucide-react";

const VisitsTable = ({
  visits,
  calculateTotals,
  getStatusBadge,
  expandedRow,
  setExpandedRow,
  onStartService,
  onAddItems,
  onReadyForCheckout,
  onCheckout,
  onDeleteVisit,
  onAssignStaff,
  onCompleteService,
  onRemoveItem,
  onViewBill,
  staff,
  allVisits,
}) => {
  // Check if all visits are CHECKED_IN status
  const allCheckedIn = visits.every((v) => v.status === "CHECKED_IN");

  return (
    <div
      className="glass-card"
      style={{ borderRadius: "1rem", overflow: "hidden", marginTop: "1.5rem" }}
    >
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
              }}
            >
              <th
                style={{
                  padding: "1rem 1.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                }}
              >
                Customer
              </th>
              <th
                style={{
                  padding: "1rem 1.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                }}
              >
                Contact
              </th>
              <th
                style={{
                  padding: "1rem 1.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                }}
              >
                Status
              </th>
              {!allCheckedIn && (
                <th
                  style={{
                    padding: "1rem 1.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                  }}
                >
                  Items
                </th>
              )}
              {!allCheckedIn && (
                <th
                  style={{
                    padding: "1rem 1.5rem",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "0.875rem",
                  }}
                >
                  Amount
                </th>
              )}
              <th
                style={{
                  padding: "1rem 1.5rem",
                  textAlign: "left",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => {
              const totals = calculateTotals(visit);
              const statusBadge = getStatusBadge(visit.status);
              const isExpanded = expandedRow === visit.id;

              return (
                <React.Fragment key={visit.id}>
                  <tr
                    className="table-row"
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                  >
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: "600",
                            fontSize: "0.875rem",
                          }}
                        >
                          {(
                            visit.customer?.name ||
                            visit.customerName ||
                            visit.name ||
                            "C"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#1f2937" }}>
                            {visit.customer?.name ||
                              visit.customerName ||
                              visit.name ||
                              "Unknown"}
                          </div>
                          <div
                            style={{ fontSize: "0.75rem", color: "#6b7280" }}
                          >
                            {visit.checkInTime
                              ? new Date(visit.checkInTime).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "--:--"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "#1f2937",
                          }}
                        >
                          <Phone size={14} />{" "}
                          {visit.customer?.phone ||
                            visit.customer?.contactNo ||
                            visit.customerPhone ||
                            visit.phone ||
                            "N/A"}
                        </div>
                        {(visit.customer?.email || visit.customerEmail) && (
                          <div
                            style={{ fontSize: "0.75rem", color: "#6b7280" }}
                          >
                            {visit.customer?.email || visit.customerEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <span
                        className="status-badge"
                        style={{
                          background: statusBadge.bg,
                          color: statusBadge.color,
                        }}
                      >
                        {statusBadge.icon} {statusBadge.text}
                      </span>
                    </td>
                    {!allCheckedIn && (
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              background: "rgba(102, 126, 234, 0.1)",
                              color: "#667eea",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                            }}
                          >
                            {visit.items?.length || 0}
                          </span>
                          <button
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : visit.id)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#6b7280",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <ChevronDown
                              size={18}
                              style={{
                                transform: isExpanded
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </button>
                        </div>
                      </td>
                    )}
                    {!allCheckedIn && (
                      <td style={{ padding: "1.25rem 1.5rem" }}>
                        <div
                          style={{
                            fontWeight: "700",
                            fontSize: "1.125rem",
                            color: "#10b981",
                          }}
                        >
                          {/* For COMPLETED visits, show the stored totalAmount (after discount); for others show calculated total */}
                          ₹
                          {visit.status === "COMPLETED"
                            ? (visit.totalAmount || totals.total).toFixed(2)
                            : visit.status === "IN_SERVICE"
                              ? totals.subtotal.toFixed(2)
                              : totals.total.toFixed(2)}
                        </div>
                      </td>
                    )}
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {visit.status === "CHECKED_IN" && (
                          <button
                            onClick={() => onAddItems(visit)}
                            style={{
                              background:
                                "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                              color: "white",
                              border: "none",
                              padding: "0.5rem 1rem",
                              borderRadius: "0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              cursor: "pointer",
                            }}
                          >
                            <Plus size={14} /> Add Items
                          </button>
                        )}
                        {visit.status === "READY_FOR_BILLING" && (
                          <>
                            <button
                              onClick={() => onAddItems(visit)}
                              style={{
                                background:
                                  "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                                color: "white",
                                border: "none",
                                padding: "0.5rem 1rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                cursor: "pointer",
                              }}
                            >
                              <Plus size={14} /> Add More
                            </button>
                            <button
                              onClick={() => onCheckout(visit)}
                              style={{
                                background:
                                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                color: "white",
                                border: "none",
                                padding: "0.5rem 1rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                cursor: "pointer",
                              }}
                            >
                              💳 Pay Now
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("Delete this visit?")) {
                                  onDeleteVisit(visit.id);
                                }
                              }}
                              style={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "none",
                                padding: "0.5rem",
                                borderRadius: "0.5rem",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#fecaca")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "#fee2e2")
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        {visit.status === "COMPLETED" && (
                          <button
                            onClick={() => onViewBill(visit)}
                            style={{
                              background:
                                "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
                              color: "white",
                              border: "none",
                              padding: "0.5rem 1rem",
                              borderRadius: "0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={14} /> View Bill
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED DETAILS */}
                  {isExpanded && (
                    <tr style={{ background: "#f9fafb" }}>
                      <td
                        colSpan={6}
                        style={{
                          padding: "1.5rem",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <div style={{ animation: "slideIn 0.3s ease-out" }}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "2fr 1fr",
                              gap: "2rem",
                            }}
                          >
                            {/* LEFT COLUMN - ITEMS */}
                            <div>
                              <h3
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: "600",
                                  color: "#374151",
                                  marginBottom: "1rem",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <ShoppingCart size={16} /> Items (
                                {visit.items?.length || 0})
                              </h3>

                              {visit.items && visit.items.length > 0 ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                  }}
                                >
                                  {visit.items.map((item, index) => (
                                    <div
                                      key={index}
                                      style={{
                                        padding: "1rem",
                                        background: "white",
                                        border: "1px solid #e5e7eb",
                                        borderRadius: "0.75rem",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            fontWeight: "600",
                                            color: "#1f2937",
                                          }}
                                        >
                                          {item.name}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "#6b7280",
                                          }}
                                        >
                                          {item.type}
                                        </div>
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "1rem",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontWeight: "700",
                                            color: "#1f2937",
                                          }}
                                        >
                                          ₹{item.price?.toFixed(2)}
                                        </span>
                                        <button
                                          onClick={() =>
                                            onRemoveItem(visit.id, index)
                                          }
                                          style={{
                                            background: "none",
                                            border: "1px solid #fca5a5",
                                            color: "#dc2626",
                                            padding: "0.375rem",
                                            borderRadius: "0.375rem",
                                            cursor: "pointer",
                                          }}
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p style={{ color: "#6b7280" }}>No items</p>
                              )}
                            </div>

                            {/* RIGHT COLUMN - SUMMARY */}
                            <div
                              style={{
                                background:
                                  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                color: "white",
                                padding: "1.5rem",
                                borderRadius: "0.75rem",
                              }}
                            >
                              <h3
                                style={{
                                  fontSize: "1rem",
                                  fontWeight: "600",
                                  marginBottom: "1rem",
                                }}
                              >
                                {visit.status === "COMPLETED"
                                  ? "Bill Summary"
                                  : "Subtotal"}
                              </h3>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.75rem",
                                  fontSize: "0.875rem",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <span>Items Total:</span>
                                  <span style={{ fontWeight: "600" }}>
                                    ₹
                                    {calculateTotals(visit).subtotal.toFixed(2)}
                                  </span>
                                </div>

                                {/* Show discount if COMPLETED and discount exists */}
                                {visit.status === "COMPLETED" &&
                                  visit.discountAmount > 0 && (
                                    <>
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          color: "#fca5a5",
                                        }}
                                      >
                                        <span>
                                          {visit.discountType === "coupon"
                                            ? `Coupon: ${visit.couponCode}`
                                            : visit.discountType ===
                                                "membership"
                                              ? "Member Discount"
                                              : visit.discountType === "coins"
                                                ? "Loyalty Points"
                                                : "Discount"}
                                        </span>
                                        <span style={{ fontWeight: "600" }}>
                                          -₹{visit.discountAmount.toFixed(2)}
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          borderTop:
                                            "1px solid rgba(255,255,255,0.3)",
                                          paddingTop: "0.75rem",
                                          display: "flex",
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        <span>Final Amount:</span>
                                        <span
                                          style={{
                                            fontWeight: "700",
                                            fontSize: "1rem",
                                          }}
                                        >
                                          ₹
                                          {(
                                            visit.totalAmount ||
                                            calculateTotals(visit).subtotal -
                                              visit.discountAmount
                                          ).toFixed(2)}
                                        </span>
                                      </div>
                                    </>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VisitsTable;
