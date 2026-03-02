import React, { useState, useEffect } from "react";
import { Sparkles, Cake, MessageCircle, User } from "lucide-react";
import CheckInModal from "./modals/CheckInModal";
import CheckoutModal from "./modals/CheckoutModal";
import { useReceptionData, useReceptionStates } from "./hooks";
import { calculateTotals, filterVisitsByStatus, getStatusBadge } from "./utils";
import { getTodaysBirthdayCustomers } from "../../utils/firebaseUtils";
import {
  handleCheckInSuccess,
  handleStartService,
  handleAddItemsClick,
  handleAssignStaff,
  handleAddSelectedItems,
  handleServiceComplete,
  handleReadyForCheckout,
  handleCheckoutClick,
  handleCompletePayment,
  handleRemoveItem,
  handleDeleteVisit,
} from "./handlers";
import { ReceptionHeader, LoadingState, EmptyState } from "./components.jsx";
import VisitsTable from "./modals/VisitsTable.jsx";
import AddItemsModal from "./modals/AddItemsModal.jsx";
import BillOptionsModal from "./modals/BillOptionsModal.jsx";
import ReadyForBillingView from "./modals/ReadyForBillingView.jsx";

const ReceptionComponent = () => {
  const dataState = useReceptionData();
  const uiState = useReceptionStates();
  const [birthdayCustomers, setBirthdayCustomers] = useState([]);
  const [dismissedBirthdays, setDismissedBirthdays] = useState([]);
  const [selectedBirthdayCustomer, setSelectedBirthdayCustomer] =
    useState(null);
  const [showBirthdayDetailsModal, setShowBirthdayDetailsModal] =
    useState(false);

  useEffect(() => {
    const loadBirthdays = async () => {
      try {
        const customers = await getTodaysBirthdayCustomers();
        setBirthdayCustomers(customers || []);
      } catch (error) {
        console.error("Error loading birthday customers:", error);
      }
    };

    loadBirthdays();
    // Refresh every hour
    const interval = setInterval(loadBirthdays, 3600000);
    return () => clearInterval(interval);
  }, []);

  const sendBirthdayWishViaWhatsApp = (customer) => {
    const phoneNumber = (customer.phone || customer.contactNo || "").replace(
      /\D/g,
      "",
    );
    if (!phoneNumber) {
      alert("Phone number not available for this customer");
      return;
    }

    const message = `🎉 Happy Birthday ${customer.name}! 🎂\n\nWishing you a wonderful day filled with joy, happiness, and all the beauty life has to offer.\n\nEnjoy your special day and celebrate yourself! 🎊\n\n✨ Velvet Premium Unisex Salon & Spa`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const filteredVisits = filterVisitsByStatus(
    dataState.visits,
    uiState.activeSection,
    uiState.searchTerm,
  );
  console.log(
    "📲 Filtered visits for active section",
    uiState.activeSection,
    ":",
    filteredVisits,
  );

  const calculateTotalsWrapper = (visit) =>
    calculateTotals(
      visit,
      uiState.discountAmount,
      uiState.discountPercent,
      uiState.amountPaid,
    );

  if (dataState.loading && dataState.visits.length === 0) {
    return <LoadingState />;
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        background: "var(--admin-background-gradient)",
        padding: "0",
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .table-row {
          animation: slideIn 0.3s ease-out;
          transition: all 0.2s;
        }
        .table-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div style={{ width: "100%", animation: "fadeIn 0.5s ease-out" }}>
        {/* BIRTHDAY NOTIFICATION BANNER */}
        {birthdayCustomers.length > 0 && (
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)",
              border: "2px solid rgba(236, 72, 153, 0.5)",
              padding: "1rem 1.5rem",
              borderRadius: "0.75rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              animation: "slideIn 0.5s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <Cake size={24} style={{ color: "#ec4899" }} />
              <div>
                <div
                  style={{
                    fontWeight: "700",
                    color: "#ec4899",
                    fontSize: "1rem",
                  }}
                >
                  🎉 Birthday Today!
                </div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {birthdayCustomers.map((c) => c.name).join(", ")}{" "}
                  {birthdayCustomers.length > 1 ? "are" : "is"} celebrating
                  today!
                </div>
              </div>
            </div>
            <div
              style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              {birthdayCustomers.map((customer) => (
                <div
                  key={customer.id}
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <button
                    onClick={() => {
                      setSelectedBirthdayCustomer(customer);
                      setShowBirthdayDetailsModal(true);
                    }}
                    style={{
                      background: "rgba(107, 114, 128, 0.2)",
                      border: "none",
                      borderRadius: "0.375rem",
                      color: "#374151",
                      padding: "0.5rem 0.75rem",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.75rem",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(107, 114, 128, 0.3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(107, 114, 128, 0.2)")
                    }
                    title={`View ${customer.name}'s details`}
                  >
                    <User size={14} /> Details
                  </button>
                  <button
                    onClick={() => sendBirthdayWishViaWhatsApp(customer)}
                    style={{
                      background: "rgba(34, 197, 94, 0.2)",
                      border: "none",
                      borderRadius: "0.375rem",
                      color: "#16a34a",
                      padding: "0.5rem 0.75rem",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.75rem",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(34, 197, 94, 0.3)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(34, 197, 94, 0.2)")
                    }
                    title={`Send birthday wish to ${customer.name}`}
                  >
                    <MessageCircle size={14} /> Birthday Wish
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setDismissedBirthdays([
                    ...dismissedBirthdays,
                    ...birthdayCustomers.map((c) => c.id),
                  ])
                }
                style={{
                  background: "rgba(236, 72, 153, 0.2)",
                  border: "none",
                  borderRadius: "0.375rem",
                  color: "#ec4899",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.875rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(236, 72, 153, 0.3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(236, 72, 153, 0.2)")
                }
              >
                Dismiss All
              </button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <ReceptionHeader
          onNewCheckIn={() => uiState.setShowCheckIn(true)}
          error={dataState.error}
          success={dataState.success}
          loading={dataState.loading}
          activeSection={uiState.activeSection}
          setActiveSection={uiState.setActiveSection}
          visits={dataState.visits}
          filteredVisits={filteredVisits}
          searchTerm={uiState.searchTerm}
          setSearchTerm={uiState.setSearchTerm}
        />

        <div style={{ marginTop: "1.5rem" }}>
          {dataState.loading && dataState.visits.length === 0 ? (
            <LoadingState />
          ) : filteredVisits.length === 0 ? (
            <EmptyState activeSection={uiState.activeSection} />
          ) : (
            <VisitsTable
              visits={filteredVisits}
              calculateTotals={calculateTotalsWrapper}
              getStatusBadge={getStatusBadge}
              expandedRow={uiState.expandedRow}
              setExpandedRow={uiState.setExpandedRow}
              onStartService={(visit) =>
                handleStartService(
                  visit,
                  dataState.setSuccess,
                  dataState.setError,
                  dataState.fetchAllData,
                )
              }
              onAddItems={(visit) =>
                handleAddItemsClick(
                  visit,
                  uiState.setSelectedVisit,
                  uiState.setSelectedServices,
                  uiState.setSelectedProducts,
                  uiState.setShowAddItems,
                )
              }
              onReadyForCheckout={(visit) =>
                handleReadyForCheckout(
                  visit,
                  dataState.fetchAllData,
                  dataState.setSuccess,
                  dataState.setError,
                  uiState.setActiveSection,
                )
              }
              onCheckout={(visit) =>
                handleCheckoutClick(
                  visit,
                  uiState.setShowCheckoutModal,
                  uiState.setSelectedVisitForCheckout,
                )
              }
              onDeleteVisit={(visitId) =>
                handleDeleteVisit(
                  visitId,
                  dataState.fetchAllData,
                  dataState.setSuccess,
                  dataState.setError,
                )
              }
              onAssignStaff={(visitId, serviceIndex, staffId) =>
                handleAssignStaff(
                  visitId,
                  serviceIndex,
                  staffId,
                  dataState.fetchAllData,
                  dataState.setSuccess,
                  dataState.setError,
                )
              }
              onCompleteService={(visitId, serviceIndex) =>
                handleServiceComplete(
                  visitId,
                  serviceIndex,
                  dataState.visits,
                  dataState.fetchAllData,
                  dataState.setSuccess,
                  dataState.setError,
                )
              }
              onRemoveItem={(visitId, itemIndex) =>
                handleRemoveItem(
                  visitId,
                  itemIndex,
                  dataState.visits,
                  dataState.fetchAllData,
                  dataState.setError,
                )
              }
              onViewBill={(visit) => {
                uiState.setSelectedVisit(visit);
                uiState.setShowBillOptions(true);
              }}
              staff={dataState.staff}
              allVisits={dataState.visits}
            />
          )}
        </div>
      </div>

      {/* MODALS */}

      {/* CHECK-IN MODAL */}
      {uiState.showCheckIn && (
        <CheckInModal
          onClose={() => uiState.setShowCheckIn(false)}
          onCheckIn={() =>
            handleCheckInSuccess(
              dataState.fetchAllData,
              uiState.setShowCheckIn,
              uiState.setActiveSection,
            )
          }
        />
      )}

      {/* ADD ITEMS MODAL */}
      {uiState.showAddItems && uiState.selectedVisit && (
        <AddItemsModal
          selectedVisit={uiState.selectedVisit}
          services={dataState.services}
          products={dataState.products}
          selectedServices={uiState.selectedServices}
          setSelectedServices={uiState.setSelectedServices}
          selectedProducts={uiState.selectedProducts}
          setSelectedProducts={uiState.setSelectedProducts}
          selectedCategory={uiState.selectedCategory}
          setSelectedCategory={uiState.setSelectedCategory}
          onClose={() => uiState.setShowAddItems(false)}
          onAdd={() =>
            handleAddSelectedItems(
              uiState.selectedVisit,
              uiState.selectedServices,
              uiState.selectedProducts,
              dataState.fetchAllData,
              dataState.setSuccess,
              uiState.setShowAddItems,
              uiState.setSelectedServices,
              uiState.setSelectedProducts,
              dataState.setError,
            )
          }
        />
      )}

      {/* CHECKOUT MODAL */}
      {uiState.showCheckoutModal && uiState.selectedVisitForCheckout && (
        <CheckoutModal
          visit={uiState.selectedVisitForCheckout}
          calculateTotals={calculateTotalsWrapper}
          onClose={() => uiState.setShowCheckoutModal(false)}
          onPaymentComplete={(invoiceData) =>
            handleCompletePayment(
              invoiceData,
              dataState.fetchAllData,
              dataState.setSuccess,
              dataState.setError,
              uiState.setActiveSection,
              uiState.setShowCheckoutModal,
            )
          }
        />
      )}

      {/* BILL OPTIONS MODAL */}
      {uiState.showBillOptions && uiState.selectedVisit && (
        <BillOptionsModal
          selectedVisit={uiState.selectedVisit}
          onClose={() => {
            uiState.setShowBillOptions(false);
            uiState.setSelectedVisit(null);
          }}
        />
      )}

      {/* BIRTHDAY CUSTOMER DETAILS MODAL */}
      {showBirthdayDetailsModal && selectedBirthdayCustomer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "0.75rem",
              padding: "2rem",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                🎂 {selectedBirthdayCustomer.name}'s Details
              </h2>
              <button
                onClick={() => setShowBirthdayDetailsModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  background: "#f9fafb",
                  borderRadius: "0.5rem",
                  borderLeft: "4px solid #ec4899",
                }}
              >
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#6b7280",
                  }}
                >
                  Name
                </label>
                <p
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    color: "#1f2937",
                    marginTop: "0.25rem",
                  }}
                >
                  {selectedBirthdayCustomer.name}
                </p>
              </div>

              <div
                style={{
                  padding: "1rem",
                  background: "#f9fafb",
                  borderRadius: "0.5rem",
                  borderLeft: "4px solid #ec4899",
                }}
              >
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#6b7280",
                  }}
                >
                  Phone
                </label>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#374151",
                    marginTop: "0.25rem",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedBirthdayCustomer.phone ||
                    selectedBirthdayCustomer.contactNo ||
                    "Not provided"}
                </p>
              </div>

              <div
                style={{
                  padding: "1rem",
                  background: "#f9fafb",
                  borderRadius: "0.5rem",
                  borderLeft: "4px solid #ec4899",
                }}
              >
                <label
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "#6b7280",
                  }}
                >
                  Email
                </label>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#374151",
                    marginTop: "0.25rem",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedBirthdayCustomer.email || "Not provided"}
                </p>
              </div>

              {selectedBirthdayCustomer.membershipType &&
                selectedBirthdayCustomer.membershipType !== "regular" && (
                  <div
                    style={{
                      padding: "1rem",
                      background: `${selectedBirthdayCustomer.membershipType === "elite" ? "rgba(251, 146, 60, 0.1)" : "rgba(139, 92, 246, 0.1)"}`,
                      borderRadius: "0.5rem",
                      borderLeft: `4px solid ${selectedBirthdayCustomer.membershipType === "elite" ? "#fb923c" : "#8b5cf6"}`,
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        color: "#6b7280",
                      }}
                    >
                      Membership
                    </label>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color:
                          selectedBirthdayCustomer.membershipType === "elite"
                            ? "#fb923c"
                            : "#8b5cf6",
                        marginTop: "0.25rem",
                      }}
                    >
                      {selectedBirthdayCustomer.membershipType === "elite"
                        ? "👑 Elite Member"
                        : "⭐ Premium Member"}
                    </p>
                  </div>
                )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => {
                  setShowBirthdayDetailsModal(false);
                  sendBirthdayWishViaWhatsApp(selectedBirthdayCustomer);
                }}
                style={{
                  background:
                    "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <MessageCircle size={16} /> Send Birthday Wish
              </button>
              <button
                onClick={() => setShowBirthdayDetailsModal(false)}
                style={{
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#d1d5db")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#e5e7eb")
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionComponent;
