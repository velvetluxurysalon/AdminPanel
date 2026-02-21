import {
  updateVisitStatus,
  assignStaffToService,
  addVisitItem,
  removeVisitItem,
  updateVisit,
  createInvoice,
  checkInAppointment,
  deleteDocument,
} from "../../utils/firebaseUtils";
import { calculateTotals } from "./utils";
import {
  sendCheckoutEmail,
  formatCheckoutDataForEmail,
} from "../../services/emailService";

export const handleDeleteVisit = async (
  visitId,
  fetchAllData,
  setSuccess,
  setError,
) => {
  try {
    await deleteDocument("visits", visitId);
    setSuccess("Visit deleted successfully");
    setTimeout(() => setSuccess(""), 3000);
    fetchAllData();
  } catch (err) {
    setError("Failed to delete visit");
  }
};

export const handleCheckInSuccess = (
  fetchAllData,
  setShowCheckIn,
  setActiveSection,
) => {
  fetchAllData();
  setShowCheckIn(false);
  setActiveSection("checkout"); // Navigate to billing tab since we skip IN_SERVICE
};

export const handleStartService = async (
  visit,
  setSuccess,
  setError,
  fetchAllData,
) => {
  try {
    await updateVisitStatus(visit.id, "IN_SERVICE");
    setSuccess(`Service started for ${visit.customer?.name}`);
    setTimeout(() => setSuccess(""), 3000);
    fetchAllData();
  } catch (err) {
    setError("Failed to start service");
  }
};

export const handleAddItemsClick = (
  visit,
  setSelectedVisit,
  setSelectedServices,
  setSelectedProducts,
  setShowAddItems,
) => {
  setSelectedVisit(visit);
  setSelectedServices([]);
  setSelectedProducts([]);
  setShowAddItems(true);
};

export const handleAssignStaff = async (
  visitId,
  serviceIndex,
  staffId,
  fetchAllData,
  setSuccess,
  setError,
) => {
  try {
    await assignStaffToService(visitId, serviceIndex, staffId);
    setSuccess("Staff assigned successfully");
    setTimeout(() => setSuccess(""), 2000);
    fetchAllData();
  } catch (err) {
    setError("Failed to assign staff");
  }
};

export const handleAddSelectedItems = async (
  selectedVisit,
  selectedServices,
  selectedProducts,
  fetchAllData,
  setSuccess,
  setShowAddItems,
  setSelectedServices,
  setSelectedProducts,
  setError,
) => {
  if (!selectedVisit) return;

  try {
    for (const service of selectedServices) {
      await addVisitItem(selectedVisit.id, {
        type: "service",
        serviceId: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration || 30,
        quantity: 1,
        staff: null,
        status: "pending",
      });
    }

    for (const product of selectedProducts) {
      await addVisitItem(selectedVisit.id, {
        type: "product",
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        status: "added",
      });
    }

    // Automatically move to READY_FOR_BILLING status if not already there
    if (
      selectedVisit.status !== "READY_FOR_BILLING" &&
      selectedVisit.status !== "COMPLETED"
    ) {
      await updateVisitStatus(selectedVisit.id, "READY_FOR_BILLING");
    }

    setSuccess("Items added successfully");
    setShowAddItems(false);
    setSelectedServices([]);
    setSelectedProducts([]);
    setTimeout(() => setSuccess(""), 3000);
    fetchAllData();
  } catch (err) {
    setError("Failed to add items");
  }
};

export const handleServiceComplete = async (
  visitId,
  serviceIndex,
  visits,
  fetchAllData,
  setSuccess,
  setError,
) => {
  try {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit || !visit.items || !visit.items[serviceIndex]) return;

    const updatedItems = [...visit.items];
    updatedItems[serviceIndex].status = "completed";

    await updateVisit(visitId, { items: updatedItems });
    setSuccess("Service marked as complete");
    setTimeout(() => setSuccess(""), 2000);
    fetchAllData();
  } catch (err) {
    setError("Failed to update service status");
  }
};

export const handleReadyForCheckout = async (
  visit,
  fetchAllData,
  setSuccess,
  setError,
  setActiveSection,
) => {
  try {
    await updateVisitStatus(visit.id, "READY_FOR_BILLING");
    setSuccess(`${visit.customer?.name} is ready for billing`);
    setTimeout(() => setSuccess(""), 3000);
    await fetchAllData();
    setActiveSection("checkout");
  } catch (err) {
    console.error("Error in handleReadyForCheckout:", err);
    setError("Failed to move to billing: " + err.message);
  }
};

export const handleCheckoutClick = (
  visit,
  setShowCheckoutModal,
  setSelectedVisitForCheckout,
) => {
  setSelectedVisitForCheckout(visit);
  setShowCheckoutModal(true);
};

export const handleCompletePayment = async (
  invoiceData,
  fetchAllData,
  setSuccess,
  setError,
  setActiveSection,
  setShowCheckoutModal,
) => {
  try {
    console.log("💳 [Handler] handleCompletePayment called with:", {
      customerName: invoiceData.customerName,
      customerEmail: invoiceData.customerEmail,
      totalAmount: invoiceData.totalAmount,
      discountAmount: invoiceData.discountAmount,
      discountType: invoiceData.discountType,
      couponCode: invoiceData.couponCode,
    });

    await createInvoice(invoiceData);

    // Update visit with ALL billing details and complete status
    // CRITICAL: Store totalAmount as the final discounted amount (not subtotal)
    await updateVisit(invoiceData.visitId, {
      paidAmount: parseFloat(invoiceData.paidAmount) || 0,
      status: "COMPLETED",
      subtotal: invoiceData.subtotal || 0,
      totalAmount: invoiceData.totalAmount || 0, // This should be after-discount amount
      discountAmount: invoiceData.discountAmount || 0,
      discountType: invoiceData.discountType || "none",
      discountPercent: invoiceData.discountPercent || 0, // For percentage-based discounts
      paymentMode: invoiceData.paymentMode || "cash",

      // ALL coupon and discount details
      couponCode: invoiceData.couponCode || null,
      couponIsCapped: invoiceData.couponIsCapped || false,
      couponOriginalDiscount: invoiceData.couponOriginalDiscount || 0,
      couponAppliedDiscount: invoiceData.couponAppliedDiscount || 0,

      // Loyalty points
      pointsUsed: invoiceData.pointsUsed || 0,
      pointsDiscountAmount: invoiceData.pointsDiscountAmount || 0,
      loyaltyPointsEarned: invoiceData.loyaltyPointsEarned || 0,

      invoiceId: invoiceData.invoiceId,
    });

    // Send checkout email to customer and admin
    try {
      console.log("📧 [Handler] Preparing email data...");
      const emailData = formatCheckoutDataForEmail(invoiceData);
      console.log("📧 [Handler] Email data prepared:", {
        customerName: emailData.customerName,
        customerEmail: emailData.customerEmail,
        totalAmount: emailData.totalAmount,
      });

      const emailResult = await sendCheckoutEmail(emailData);

      if (emailResult.success) {
        console.log("✅ [Handler] Checkout email sent successfully");
      } else {
        console.warn(
          "⚠️ [Handler] Email sent but with warning:",
          emailResult.message,
        );
      }
    } catch (emailError) {
      console.error(
        "❌ [Handler] Email sending error (non-blocking):",
        emailError,
      );
      // Don't block the checkout if email fails
    }

    setSuccess(`Payment completed for ${invoiceData.customerName}!`);
    setTimeout(() => setSuccess(""), 3000);
    await fetchAllData();
    setActiveSection("completed");
    setShowCheckoutModal(false);
  } catch (err) {
    console.error("❌ [Handler] Payment error:", err);
    setError("Payment failed: " + err.message);
  }
};

export const handleRemoveItem = async (
  visitId,
  itemIndex,
  visits,
  fetchAllData,
  setError,
) => {
  try {
    const visit = visits.find((v) => v.id === visitId);
    if (!visit || !visit.items) return;

    const updatedItems = visit.items.filter((_, index) => index !== itemIndex);
    await updateVisit(visitId, { items: updatedItems });
    fetchAllData();
  } catch (err) {
    setError("Failed to remove item");
  }
};

export const handleCheckInAppointment = async (
  appointment,
  setSuccess,
  setError,
  fetchAllData,
) => {
  try {
    await checkInAppointment(appointment);
    setSuccess(`${appointment.customerName} checked in successfully!`);
    setTimeout(() => setSuccess(""), 3000);
    fetchAllData();
  } catch (err) {
    console.error("Check-in error:", err);
    setError("Failed to check in appointment: " + err.message);
  }
};
