import {
  updateVisitStatus,
  assignStaffToService,
  addVisitItem,
  removeVisitItem,
  updateVisit,
  createInvoice,
  checkInAppointment,
  deleteDocument,
  getDocument,
  completeStaffWork,
} from "../../utils/firebaseUtils";
import { calculateTotals } from "./utils";
import {
  sendCheckoutEmail,
  formatCheckoutDataForEmail,
} from "../../services/emailService";
import { generateAndStoreBillPDFWithRetry } from "../../services/billService";

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

    // ⚠️ SAFEGUARD: Check if visit is already completed to prevent duplicate processing
    const existingVisit = await getDocument("visits", invoiceData.visitId);
    if (existingVisit?.status === "COMPLETED") {
      console.warn(
        "⚠️ [Handler] Visit already completed. Skipping duplicate payment processing.",
        invoiceData.visitId,
      );
      setShowCheckoutModal(false);
      return;
    }

    // ⚡ CRITICAL OPERATIONS (must await):
    // 1. Create invoice in database
    const invoiceId = await createInvoice(invoiceData);

    // 2. Complete staff work for all staff members who worked on this visit
    // Get the visit to find all staff members
    const visit = await getDocument("visits", invoiceData.visitId);
    if (visit && visit.items) {
      const staffIds = new Set(); // Track unique staff IDs
      visit.items.forEach((item) => {
        if (item.staff) {
          let staffData = item.staff;
          if (typeof staffData === "string") {
            try {
              staffData = JSON.parse(staffData);
            } catch (e) {
              console.warn("Could not parse staff data:", item.staff);
              return;
            }
          }
          if (staffData.id) {
            staffIds.add(staffData.id);
          }
        }
      });

      // Call completeStaffWork for each unique staff member
      for (const staffId of staffIds) {
        try {
          await completeStaffWork(invoiceId, invoiceData.visitId, staffId);
        } catch (err) {
          console.warn(
            `Warning: Could not complete staff work for staff ${staffId}:`,
            err,
          );
        }
      }
    }

    // 3. Update visit status to COMPLETED immediately
    // This is the most important operation for UI responsiveness
    await updateVisit(invoiceData.visitId, {
      paidAmount: parseFloat(invoiceData.paidAmount) || 0,
      status: "COMPLETED",
      subtotal: invoiceData.subtotal || 0,
      totalAmount: invoiceData.totalAmount || 0,
      discountAmount: invoiceData.discountAmount || 0,
      discountType: invoiceData.discountType || "none",
      discountPercent: invoiceData.discountPercent || 0,
      paymentMode: invoiceData.paymentMode || "cash",
      couponCode: invoiceData.couponCode || null,
      couponIsCapped: invoiceData.couponIsCapped || false,
      couponOriginalDiscount: invoiceData.couponOriginalDiscount || 0,
      couponAppliedDiscount: invoiceData.couponAppliedDiscount || 0,
      pointsUsed: invoiceData.pointsUsed || 0,
      pointsDiscountAmount: invoiceData.pointsDiscountAmount || 0,
      loyaltyPointsEarned: invoiceData.loyaltyPointsEarned || 0,
      invoiceId: invoiceData.invoiceId,
    });

    // ✅ Show success and close modal IMMEDIATELY (before background tasks)
    setSuccess(`Payment completed for ${invoiceData.customerName}!`);
    setActiveSection("completed");
    setShowCheckoutModal(false);

    // ⏰ BACKGROUND OPERATIONS (run in parallel, don't await):
    // These happen while the UI updates and modal closes
    (async () => {
      try {
        // Generate and store bill PDF (slow operation - background)
        console.log("📄 [Handler] Generating bill PDF in background...");
        const visit = await getDocument("visits", invoiceData.visitId);
        const billResult = await generateAndStoreBillPDFWithRetry(
          invoiceData,
          visit,
        );

        if (billResult.success) {
          console.log(
            "✅ [Handler] Bill PDF stored successfully:",
            billResult.url,
          );
          // Update with PDF URL
          await updateVisit(invoiceData.visitId, {
            billDownloadUrl: billResult.url,
            billStorageRef: billResult.storageRef,
          });
        } else {
          console.warn(
            "⚠️ [Handler] Failed to generate/store bill PDF:",
            billResult.error,
          );
        }
      } catch (pdfError) {
        console.error("❌ [Handler] PDF generation error:", pdfError);
      }

      try {
        // Send email (slow operation - background)
        console.log("📧 [Handler] Sending checkout email in background...");
        const emailData = {
          ...invoiceData,
          billDownloadUrl: invoiceData.billDownloadUrl || null,
        };
        const checkoutEmailData = formatCheckoutDataForEmail(emailData);
        const emailResult = await sendCheckoutEmail(checkoutEmailData);

        if (emailResult.success) {
          console.log("✅ [Handler] Checkout email sent successfully");
        } else {
          console.warn(
            "⚠️ [Handler] Email sent but with warning:",
            emailResult.message,
          );
        }
      } catch (emailError) {
        console.error("❌ [Handler] Email sending error:", emailError);
      }

      try {
        // Refresh data (background)
        console.log("🔄 [Handler] Refreshing data in background...");
        await fetchAllData();
        console.log("✅ [Handler] Data refreshed");
      } catch (refreshError) {
        console.error("❌ [Handler] Error refreshing data:", refreshError);
      }
    })();

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(""), 3000);
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
