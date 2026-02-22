import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Tag,
  CreditCard,
  Smartphone,
  Wallet,
  X,
  Printer,
  Download,
  MessageCircle,
  Mail,
  Coins,
  Check,
  Loader,
} from "lucide-react";
import {
  generateProfessionalBillPDF,
  downloadPDF,
  prepareInvoiceDataFromVisit,
} from "../utils/pdfGenerator";
import {
  updateDocument,
  getDocument,
  getMembership,
  generateInvoiceId,
  validateCoupon,
  incrementCouponUsage,
} from "../../../utils/firebaseUtils";
import {
  sendBillViaWhatsApp,
  openWhatsAppDirect,
} from "../../../services/whatsappService";
import { generateAndStoreBillPDFWithRetry } from "../../../services/billService";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../firebaseConfig";

const CheckoutModal = ({
  visit,
  calculateTotals,
  onClose,
  onPaymentComplete,
}) => {
  const [discountType, setDiscountType] = useState("none"); // 'none', 'percentage', 'flat', 'coins', 'membership', 'coupon'
  const [discountValue, setDiscountValue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [notes, setNotes] = useState("");
  const [coinsUsed, setCoinsUsed] = useState("");
  const [availableLoyaltyPoints, setAvailableLoyaltyPoints] = useState(0);
  const [invoiceData, setInvoiceData] = React.useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [membershipData, setMembershipData] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  // WhatsApp auto-send states
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [whatsappError, setWhatsappError] = useState("");
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState(false); // Disabled temporarily

  // Fetch latest customer data including loyaltyPoints and membershipType
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        if (visit?.customerId) {
          const latestCustomer = await getDocument(
            "customers",
            visit.customerId,
          );
          if (latestCustomer) {
            setAvailableLoyaltyPoints(latestCustomer.loyaltyPoints || 0);
            setCustomerData(latestCustomer);

            // Fetch membership details
            if (
              latestCustomer.membershipType &&
              latestCustomer.membershipType !== "regular"
            ) {
              const membership = await getMembership(
                latestCustomer.membershipType,
              );
              setMembershipData(membership);
              // Auto-set discount type to membership on first load
              setDiscountType("membership");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setAvailableLoyaltyPoints(visit.customer?.loyaltyPoints || 0);
        setCustomerData(visit.customer);
      }
    };

    fetchCustomerData();
  }, [visit?.customerId, visit?.customer?.loyaltyPoints]);

  // Reset coupon data when discount type changes away from coupon
  useEffect(() => {
    if (discountType !== "coupon") {
      setCouponCode("");
      setCouponData(null);
      setCouponError("");
    }
  }, [discountType]);

  // Auto-send WhatsApp bill when payment is completed
  // TEMPORARILY DISABLED: Twilio API endpoint not yet configured
  useEffect(() => {
    // Auto-send disabled until backend API is ready
    // if (
    //   paymentCompleted &&
    //   invoiceData &&
    //   autoSendWhatsApp &&
    //   !whatsappSent &&
    //   !sendingWhatsApp
    // ) {
    //   handleAutoSendWhatsApp();
    // }
  }, [paymentCompleted, invoiceData, autoSendWhatsApp]);

  // Function to handle automatic WhatsApp sending
  const handleAutoSendWhatsApp = async () => {
    try {
      setSendingWhatsApp(true);
      setWhatsappError("");

      const phoneNumber =
        visit.customer?.phone ||
        visit.customer?.contactNo ||
        invoiceData?.customerPhone ||
        "";

      if (!phoneNumber) {
        setWhatsappError("No phone number available for WhatsApp");
        setSendingWhatsApp(false);
        return;
      }

      console.log(
        "?? [CheckoutModal] Auto-sending WhatsApp bill to:",
        phoneNumber,
      );

      // Create PDF blob
      const pdf = await generateProfessionalBillPDF(invoiceData, visit);
      const pdfBlob = pdf.output("blob");

      // Send via WhatsApp service
      const result = await sendBillViaWhatsApp(
        invoiceData,
        phoneNumber,
        pdfBlob,
      );

      if (result.success) {
        console.log("? [CheckoutModal] WhatsApp sent successfully");
        setWhatsappSent(true);
        setWhatsappError("");
      } else {
        console.error("? [CheckoutModal] WhatsApp send failed:", result.error);
        setWhatsappError(result.message || "Failed to send WhatsApp");
      }
    } catch (error) {
      console.error("? [CheckoutModal] Error auto-sending WhatsApp:", error);
      setWhatsappError(error.message || "Error sending WhatsApp bill");
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const baseTotals = calculateTotals(visit);

  // Calculate discount
  let finalDiscount = 0;
  let coinsDiscount = 0;
  let discountDescription = "";

  if (discountType === "coupon" && couponData) {
    // Apply coupon discount
    finalDiscount = couponData.discountAmount || 0;
    discountDescription = `Coupon: ${couponCode} (${couponData.discountType === "percentage" ? couponData.discountValue + "%" : "₹" + couponData.discountValue})`;
    console.log("?? [CheckoutModal] Coupon Discount Debug:", {
      discountType,
      couponCode,
      couponData,
      finalDiscount,
      subtotal: baseTotals.subtotal,
    });
  } else if (discountType === "membership" && membershipData) {
    // Apply membership discount
    const membershipDiscount = membershipData.discountPercentage || 0;
    finalDiscount = (baseTotals.subtotal * membershipDiscount) / 100;
    discountDescription = `Membership Discount (${membershipDiscount}%)`;
  } else if (discountType === "percentage") {
    const percentValue = parseFloat(discountValue) || 0;
    finalDiscount = (baseTotals.subtotal * percentValue) / 100;
    discountDescription = `Discount (${percentValue}%)`;
  } else if (discountType === "flat") {
    finalDiscount = parseFloat(discountValue) || 0;
    discountDescription = "Flat Discount";
  } else if (discountType === "coins") {
    // 20 loyalty points = 1 rupee
    const points = parseFloat(coinsUsed) || 0;
    coinsDiscount = points / 20;
    finalDiscount = coinsDiscount;
    discountDescription = `Loyalty Points Discount`;
  }

  // Calculate final totals
  const totalAmount = baseTotals.subtotal - finalDiscount;
  const amountPaidValue = parseFloat(amountPaid) || 0;
  const balance = totalAmount - amountPaidValue;

  // Debug logging
  if (discountType === "coupon" && couponData) {
    console.log("?? [CheckoutModal] Total Calculation:", {
      subtotal: baseTotals.subtotal,
      finalDiscount,
      totalAmount,
      discountType,
      couponCode,
    });
  }

  const paymentMethods = [
    { id: "cash", label: "Cash", icon: DollarSign, color: "#10b981" },
    { id: "card", label: "Card", icon: CreditCard, color: "#3b82f6" },
    { id: "upi", label: "UPI", icon: Smartphone, color: "#8b5cf6" },
    { id: "wallet", label: "Wallet", icon: Wallet, color: "#f59e0b" },
  ];

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    try {
      setValidatingCoupon(true);
      setCouponError("");
      setCouponData(null);

      const result = await validateCoupon(couponCode, baseTotals.subtotal);

      if (result.valid) {
        // Store the complete result with discount details
        setCouponData({
          ...result.coupon,
          discountAmount: result.discountAmount,
          originalDiscountAmount: result.originalDiscountAmount,
          isCapped: result.isCapped,
          discountType: result.discountType,
          discountValue: result.discountValue,
        });
        setCouponError("");
        console.log("? Coupon validated:", {
          code: couponCode,
          discountAmount: result.discountAmount,
          originalDiscountAmount: result.originalDiscountAmount,
          isCapped: result.isCapped,
          discountType: result.discountType,
          discountValue: result.discountValue,
          subtotal: baseTotals.subtotal,
        });
      } else {
        setCouponError(result.error || "Coupon is not valid");
        setCouponData(null);
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setCouponError("Error validating coupon. Please try again.");
      setCouponData(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCompletePayment = async () => {
    try {
      // Use customerData from state if available, otherwise fetch it again
      let latestCustomer = customerData;
      const customerId = visit.customerId || visit.customer?.id;

      if (!latestCustomer && customerId) {
        latestCustomer = await getDocument("customers", customerId);
      }

      if (!latestCustomer && customerId) {
        throw new Error(
          "Could not retrieve customer profile for loyalty points update",
        );
      }

      const currentPoints = latestCustomer?.loyaltyPoints || 0;
      let pointsDeducted = 0;
      let pointsEarned = 0;
      const amountPaidValue = parseFloat(amountPaid) || 0;

      // Deduct points if used as discount
      if (discountType === "coins" && coinsUsed) {
        pointsDeducted = Math.floor(parseFloat(coinsUsed) || 0);
      }

      // Award points only for newly paid amount (not from points)
      // 1 point per 1 rupee spent
      pointsEarned = Math.floor(amountPaidValue);

      // Final calculation: Starting Balance - Deducted + Earned
      const finalLoyaltyPoints = currentPoints - pointsDeducted + pointsEarned;

      console.log("?? [Points Update Debug]", {
        currentPoints,
        pointsDeducted,
        pointsEarned,
        finalLoyaltyPoints,
        amountPaidValue,
        customerId,
      });

      // Generate formatted invoice ID (VELVET0001 format)
      const invoiceId = await generateInvoiceId();

      // Log transactions separately if both happen, or one if only one
      if (pointsDeducted > 0) {
        await addDoc(collection(db, `customers/${customerId}/pointsHistory`), {
          type: "deducted",
          points: -pointsDeducted,
          amount: -pointsDeducted,
          description: `Used as discount for invoice ${invoiceId}`,
          invoiceId: invoiceId,
          transactionDate: serverTimestamp(),
        });
      }

      if (pointsEarned > 0) {
        await addDoc(collection(db, `customers/${customerId}/pointsHistory`), {
          type: "earned",
          points: pointsEarned,
          amount: pointsEarned,
          description: `Earned from ₹${amountPaidValue} payment for invoice ${invoiceId}`,
          invoiceId: invoiceId,
          transactionDate: serverTimestamp(),
        });
      }

      // Update customer document using FRESH data for totalSpent and totalVisits
      const updatedTotalSpent =
        (latestCustomer?.totalSpent || 0) + amountPaidValue;
      const updatedTotalVisits = (latestCustomer?.totalVisits || 0) + 1;

      await updateDocument("customers", customerId, {
        loyaltyPoints: finalLoyaltyPoints,
        totalSpent: parseFloat(updatedTotalSpent.toFixed(2)),
        totalVisits: updatedTotalVisits,
      });

      const newInvoiceData = {
        invoiceId: invoiceId, // Include the generated invoice ID
        visitId: visit.id,
        customerId: visit.customerId,
        customerName: visit.customer?.name || visit.customerName,
        customerPhone:
          visit.customer?.phone ||
          visit.customer?.contactNo ||
          visit.customerPhone,
        customerEmail:
          visit.customer?.email ||
          visit.customerEmail ||
          customerData?.email ||
          "",
        items: visit.items,
        totalAmount: totalAmount,
        paidAmount: amountPaid,
        discountPercent: discountType === "percentage" ? discountValue : 0,
        discountType: discountType,
        discountAmount: finalDiscount,
        pointsUsed: discountType === "coins" ? parseFloat(coinsUsed) : 0,
        pointsDiscountAmount: coinsDiscount,
        loyaltyPointsEarned: pointsEarned,
        paymentMode: paymentMethod,
        status: amountPaidValue >= totalAmount ? "paid" : "partial",
        notes: notes,
        timestamp: new Date(),
        subtotal: baseTotals.subtotal,
        couponCode: discountType === "coupon" ? couponCode : null,
        couponAppliedDiscount: discountType === "coupon" ? finalDiscount : 0,
        couponIsCapped:
          discountType === "coupon" && couponData?.isCapped ? true : false,
        couponOriginalDiscount:
          discountType === "coupon" && couponData?.originalDiscountAmount
            ? couponData.originalDiscountAmount
            : 0,
      };

      console.log("?? [CheckoutModal] Invoice Data being created:", {
        customerName: newInvoiceData.customerName,
        customerEmail: newInvoiceData.customerEmail,
        totalAmount: newInvoiceData.totalAmount,
        invoiceId: newInvoiceData.invoiceId,
        itemsCount: newInvoiceData.items?.length,
      });

      // Set payment completed immediately (before PDF generation)
      setInvoiceData(newInvoiceData);
      setPaymentCompleted(true);

      // Generate and store bill PDF in Firebase Storage (asynchronously in background)
      // Don't await this - let it happen while user sees the success screen
      (async () => {
        try {
          console.log(
            "?? [CheckoutModal] Generating and storing bill PDF in background...",
          );
          const billResult = await generateAndStoreBillPDFWithRetry(
            newInvoiceData,
            visit,
          );

          if (billResult.success) {
            // Update invoice data with PDF URL after generation completes
            setInvoiceData((prevData) => ({
              ...prevData,
              billDownloadUrl: billResult.url,
              billStorageRef: billResult.storageRef,
            }));
            console.log(
              "? [CheckoutModal] Bill PDF stored successfully:",
              billResult.url,
            );
          } else {
            console.warn(
              "?? [CheckoutModal] Failed to generate/store bill PDF:",
              billResult.error,
            );
          }
        } catch (pdfError) {
          console.error("? [CheckoutModal] PDF generation error:", pdfError);
        }
      })();

      // Increment coupon usage if a coupon was applied
      if (discountType === "coupon" && couponCode) {
        try {
          await incrementCouponUsage(couponCode);
          console.log("? Coupon usage incremented:", couponCode);
        } catch (error) {
          console.error("Error incrementing coupon usage:", error);
        }
      }
    } catch (error) {
      console.error("Error completing payment:", error);
      alert("Error processing payment. Please try again.");
    }
  };

  const handleCloseModal = () => {
    // Reset all state before closing
    setPaymentCompleted(false);
    setDiscountType("none");
    setDiscountValue("");
    setAmountPaid("");
    setPaymentMethod("cash");
    setNotes("");
    setCoinsUsed("");
    setCouponCode("");
    setCouponData(null);
    setCouponError("");
    setInvoiceData(null);

    // Close the modal
    onClose();
  };

  const handleDoneClick = () => {
    // Call parent callback first to close the modal immediately
    if (invoiceData) {
      onPaymentComplete(invoiceData);
    } else {
      onClose();
    }

    // Reset payment state after closing
    setPaymentCompleted(false);
    setDiscountType("none");
    setDiscountValue("");
    setAmountPaid("");
    setPaymentMethod("cash");
    setNotes("");
    setCoinsUsed("");
    setCouponCode("");
    setCouponData(null);
    setCouponError("");
    setInvoiceData(null);
  };

  const generateBillTextForShare = () => {
    const balance = Math.max(0, totalAmount - (parseFloat(amountPaid) || 0));
    let text = `*VELVET PREMIUM UNISEX SALON - INVOICE*\n\n`;
    text += `?? Customer: ${visit.customer?.name || visit.customerName}\n`;
    text += `?? Phone: ${visit.customer?.phone || visit.customer?.contactNo || visit.customerPhone}\n`;
    text += `?? Email: ${visit.customer?.email || visit.customerEmail || "N/A"}\n`;
    text += `?? Date: ${new Date().toLocaleDateString("en-IN")}\n\n`;
    text += `???????????????????????????\n`;
    text += `*SERVICES & PRODUCTS*\n`;
    text += `???????????????????????????\n`;

    visit.items?.forEach((item) => {
      text += `? ${item.name} x${item.quantity}\n  ?${(item.price * item.quantity).toFixed(2)}\n`;
    });

    text += `\n???????????????????????????\n`;
    text += `?? Subtotal: ?${baseTotals.subtotal.toFixed(2)}\n`;
    if (finalDiscount > 0) {
      text += `?? Discount: -?${finalDiscount.toFixed(2)}\n`;
    }
    text += `\n*TOTAL: ₹${totalAmount.toFixed(2)}*\n`;
    text += `💳 Amount Paid: ₹${(parseFloat(amountPaid) || 0).toFixed(2)}\n`;
    if (balance > 0) {
      text += `⚠️ Balance Due: ₹${balance.toFixed(2)}\n`;
    } else {
      text += `? Status: PAID IN FULL\n`;
    }
    text += `?? Payment: ${paymentMethod.toUpperCase()}\n`;
    text += `\n???????????????????????????\n`;
    text += `? Thank you for choosing Velvet Premium Unisex Salon!\n`;
    text += `?? For queries: 9345678646\n`;
    text += `?? Velvetluxurysalon@gmail.com\n`;
    text += `?? Working Hours: 8:00 AM - 9:00 PM`;

    return text;
  };

  const handlePrintBill = async () => {
    try {
      // Use helper to prepare data - falls back to current UI state if payment not yet finalized
      const pdfInvoiceData =
        invoiceData ||
        prepareInvoiceDataFromVisit(visit, {
          totalAmount: totalAmount,
          subtotal: baseTotals.subtotal,
          discountAmount: finalDiscount,
          discountType: discountType,
          paidAmount: parseFloat(amountPaid) || 0,
          paymentMode: paymentMethod,
          status: amountPaid >= totalAmount ? "paid" : "partial",
        });

      const pdf = await generateProfessionalBillPDF(pdfInvoiceData, visit);
      pdf.autoPrint();
      window.open(pdf.output("bloburi"), "_blank");
    } catch (error) {
      console.error("Error printing PDF:", error);
      alert("Error generating print preview. Please try again.");
    }
  };

  const handleDownloadBill = async () => {
    try {
      const pdfInvoiceData =
        invoiceData ||
        prepareInvoiceDataFromVisit(visit, {
          totalAmount: totalAmount,
          subtotal: baseTotals.subtotal,
          discountAmount: finalDiscount,
          discountType: discountType,
          paidAmount: parseFloat(amountPaid) || 0,
          paymentMode: paymentMethod,
          status: amountPaid >= totalAmount ? "paid" : "partial",
        });

      const pdf = await generateProfessionalBillPDF(pdfInvoiceData, visit);
      downloadPDF(
        pdf,
        `Velvet_Premium_Invoice_${pdfInvoiceData.invoiceId || visit.customer?.name || "Guest"}_${new Date().getTime()}.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Helper to create PDF Blob
  const createPDFBlob = async () => {
    const pdfInvoiceData =
      invoiceData ||
      prepareInvoiceDataFromVisit(visit, {
        totalAmount: totalAmount,
        subtotal: baseTotals.subtotal,
        discountAmount: finalDiscount,
        discountType: discountType,
        paidAmount: parseFloat(amountPaid) || 0,
        paymentMode: paymentMethod,
        status: amountPaid >= totalAmount ? "paid" : "partial",
      });
    const pdf = await generateProfessionalBillPDF(pdfInvoiceData, visit);
    return pdf.output("blob");
  };

  // Share PDF via WhatsApp (Web Share API or fallback)
  const handleShareWhatsApp = () => {
    try {
      const phone = (
        visit.customer?.contactNo ||
        visit.customer?.phone ||
        ""
      ).replace(/\D/g, "");

      if (!phone) {
        alert("No phone number available for WhatsApp");
        return;
      }

      // Prepare invoice data with current checkout details
      const shareInvoiceData =
        invoiceData ||
        prepareInvoiceDataFromVisit(visit, {
          totalAmount: totalAmount,
          subtotal: baseTotals.subtotal,
          discountAmount: finalDiscount,
          discountType: discountType,
          paidAmount: parseFloat(amountPaid) || 0,
          paymentMode: paymentMethod,
          status: amountPaid >= totalAmount ? "paid" : "partial",
        });

      // Get bill download URL if available from invoiceData
      const billDownloadUrl = invoiceData?.billDownloadUrl || null;

      // Open WhatsApp directly with formatted message including bill link
      const result = openWhatsAppDirect(
        phone,
        shareInvoiceData,
        billDownloadUrl,
      );

      if (!result.success) {
        alert("Error: " + result.message);
      }
    } catch (err) {
      alert("Error opening WhatsApp: " + err.message);
    }
  };

  // Share PDF via Email (Web Share API or fallback)
  const handleShareEmail = async () => {
    try {
      const pdfBlob = await createPDFBlob();
      const file = new File(
        [pdfBlob],
        `Velvet_Luxury_Salon_Invoice_${invoiceData?.invoiceId || visit.customer?.name || "Guest"}.pdf`,
        { type: "application/pdf" },
      );
      const email = visit.customer?.email || "";
      const subject = `Invoice from Velvet Premium Unisex Salon - ${new Date().toLocaleDateString()}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: subject,
          text: "Please find your invoice attached.",
        });
      } else {
        // Fallback: download PDF and open mailto
        const pdfInvoiceData =
          invoiceData ||
          prepareInvoiceDataFromVisit(visit, {
            totalAmount: totalAmount,
            subtotal: baseTotals.subtotal,
            discountAmount: finalDiscount,
            discountType: discountType,
            paidAmount: parseFloat(amountPaid) || 0,
            paymentMode: paymentMethod,
            status: amountPaid >= totalAmount ? "paid" : "partial",
          });

        downloadPDF(
          await generateProfessionalBillPDF(pdfInvoiceData, visit),
          `Velvet_Luxury_Salon_Invoice_${invoiceData?.invoiceId || visit.customer?.name || "Guest"}.pdf`,
        );
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Please find your invoice attached as PDF.")}`;
        window.location.href = mailtoLink;
        alert("PDF downloaded. Please attach it to your email.");
      }
    } catch (err) {
      alert("Unable to share PDF. Please try again.");
    }
  };

  if (paymentCompleted) {
    const paidAmount = parseFloat(amountPaid) || 0;
    const balanceDue = Math.max(0, totalAmount - paidAmount);

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(2px)",
        }}
      >
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div
          style={{
            background: "white",
            borderRadius: "0.75rem",
            width: "90%",
            maxWidth: "480px",
            maxHeight: "88vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.875rem 1.125rem",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={13} color="#16a34a" />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "0.9rem",
                    color: "#111827",
                  }}
                >
                  Payment Complete
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                  {visit.customer?.name || visit.customerName} ₹{" "}
                  {invoiceData?.invoiceId || ""}
                </div>
              </div>
            </div>
            <button
              onClick={handleDoneClick}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                padding: "0.25rem",
                display: "flex",
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Items */}
          <div style={{ padding: "0.875rem 1.125rem" }}>
            <p
              style={{
                margin: "0 0 0.4rem 0",
                fontSize: "0.65rem",
                fontWeight: "700",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Items
            </p>
            <div style={{ maxHeight: "130px", overflowY: "auto" }}>
              {visit.items?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.275rem 0",
                    borderBottom: "1px solid #f3f4f6",
                    fontSize: "0.8125rem",
                  }}
                >
                  <span style={{ color: "#374151" }}>
                    {item.name} ₹{item.quantity || 1}
                  </span>
                  <span style={{ color: "#111827", fontWeight: "600" }}>
                    ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div
            style={{
              padding: "0.75rem 1.125rem",
              background: "#f9fafb",
              borderTop: "1px solid #f3f4f6",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            {[
              {
                label: "Subtotal",
                value: `₹${baseTotals.subtotal.toFixed(2)}`,
                muted: true,
              },
              ...(finalDiscount > 0
                ? [
                    {
                      label: "Discount",
                      value: `-₹${finalDiscount.toFixed(2)}`,
                      color: "#dc2626",
                      muted: false,
                    },
                  ]
                : []),
              {
                label: "Total",
                value: `₹${totalAmount.toFixed(2)}`,
                bold: true,
              },
              {
                label: "Paid",
                value: `₹${paidAmount.toFixed(2)}`,
                color: "#059669",
                bold: true,
              },
              balanceDue > 0
                ? {
                    label: "Balance Due",
                    value: `₹${balanceDue.toFixed(2)}`,
                    color: "#dc2626",
                  }
                : { label: "Status", value: "✅ Fully Paid", color: "#059669" },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: row.bold ? "0.875rem" : "0.8rem",
                  fontWeight: row.bold ? "700" : "400",
                  marginBottom: "0.25rem",
                  paddingTop: row.bold && i > 0 ? "0.35rem" : 0,
                  borderTop: row.bold && i > 0 ? "1px solid #e5e7eb" : "none",
                }}
              >
                <span style={{ color: "#6b7280" }}>{row.label}</span>
                <span style={{ color: row.color || "#111827" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Share actions */}
          <div
            style={{
              padding: "0.875rem 1.125rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.4rem",
            }}
          >
            {[
              { label: "Print", icon: Printer, onClick: handlePrintBill },
              {
                label: "Download",
                icon: Download,
                onClick: handleDownloadBill,
              },
              {
                label: invoiceData?.billDownloadUrl ? "WhatsApp" : "Preparing?",
                icon: invoiceData?.billDownloadUrl ? MessageCircle : Loader,
                onClick: invoiceData?.billDownloadUrl
                  ? handleShareWhatsApp
                  : undefined,
                disabled: !invoiceData?.billDownloadUrl,
                color: invoiceData?.billDownloadUrl ? "#16a34a" : "#9ca3af",
              },
              { label: "Email", icon: Mail, onClick: handleShareEmail },
            ].map((btn) => {
              const Ic = btn.icon;
              return (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                    padding: "0.5rem",
                    background: btn.disabled ? "#f9fafb" : "white",
                    color: btn.color || "#374151",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.375rem",
                    fontWeight: "600",
                    fontSize: "0.8rem",
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!btn.disabled)
                      e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!btn.disabled)
                      e.currentTarget.style.background = "white";
                  }}
                >
                  <Ic
                    size={14}
                    style={
                      btn.disabled
                        ? { animation: "spin 1s linear infinite" }
                        : {}
                    }
                  />{" "}
                  {btn.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "0 1.125rem 1rem" }}>
            <button
              onClick={handleDoneClick}
              style={{
                width: "100%",
                padding: "0.6rem",
                background: "#111827",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(2px)",
      }}
    >
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        input[type="number"] { -moz-appearance:textfield; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      {/* Modal card ? two-column layout */}
      <div
        style={{
          background: "white",
          borderRadius: "0.75rem",
          width: "96%",
          maxWidth: "860px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "0.875rem 1.125rem",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "white",
            flexShrink: 0,
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
              Checkout
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "0.7rem",
                color: "#9ca3af",
                marginTop: "1px",
              }}
            >
              {visit.customer?.name} &nbsp;·&nbsp; #
              {visit.id?.slice(-6).toUpperCase()}
            </p>
          </div>
          <button
            onClick={handleCloseModal}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY ? two columns */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* LEFT ? customer + items + totals */}
          <div
            style={{
              width: "300px",
              minWidth: "300px",
              borderRight: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Customer strip */}
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid #f3f4f6",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: "600",
                      fontSize: "0.9rem",
                      color: "#111827",
                    }}
                  >
                    {visit.customer?.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      marginTop: "1px",
                    }}
                  >
                    {visit.customer?.contactNo || visit.customer?.phone}
                  </div>
                </div>
                {(() => {
                  const mt =
                    customerData?.membershipType ||
                    visit.customer?.membershipType ||
                    "regular";
                  const label =
                    mt === "elite"
                      ? "Elite"
                      : mt === "membership"
                        ? "Member"
                        : "Regular";
                  return (
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        background: "#f3f4f6",
                        border: "1px solid #e5e7eb",
                        borderRadius: "9999px",
                        fontSize: "0.65rem",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Items list */}
            <div
              style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem" }}
            >
              <p
                style={{
                  margin: "0 0 0.4rem 0",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Items
              </p>
              {visit.items?.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.3rem 0",
                    borderBottom: "1px solid #f9fafb",
                    fontSize: "0.8125rem",
                  }}
                >
                  <span style={{ color: "#374151" }}>
                    {item.name}{" "}
                    <span style={{ color: "#9ca3af" }}>
                      ×{item.quantity || 1}
                    </span>
                  </span>
                  <span style={{ color: "#111827", fontWeight: "600" }}>
                    ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div
              style={{
                padding: "0.75rem 1rem",
                borderTop: "1px solid #e5e7eb",
                background: "#f9fafb",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                }}
              >
                <span>Subtotal</span>
                <span>₹{baseTotals.subtotal.toFixed(2)}</span>
              </div>
              {finalDiscount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    color: "#dc2626",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span>{discountDescription}</span>
                  <span>-₹{finalDiscount.toFixed(2)}</span>
                </div>
              )}
              {membershipData && discountType === "membership" && (
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "#9ca3af",
                    marginBottom: "0.25rem",
                  }}
                >
                  {membershipData.name} ? {membershipData.discountPercentage}%
                  off
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "#111827",
                  paddingTop: "0.375rem",
                  borderTop: "1px solid #e5e7eb",
                  marginTop: "0.25rem",
                }}
              >
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              {amountPaid !== "" && balance !== 0 && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: balance > 0 ? "#dc2626" : "#059669",
                    marginTop: "0.3rem",
                  }}
                >
                  {balance > 0
                    ? `Balance: ₹${balance.toFixed(2)}`
                    : `Overpaid: ₹${Math.abs(balance).toFixed(2)}`}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT ? discount + payment + actions */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{ flex: 1, overflowY: "auto", padding: "0.875rem 1rem" }}
            >
              {/* Discount */}
              <p
                style={{
                  margin: "0 0 0.4rem 0",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Discount
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.3rem",
                  marginBottom: "0.625rem",
                }}
              >
                {[
                  { id: "none", label: "None" },
                  ...(membershipData && membershipData.discountPercentage > 0
                    ? [
                        {
                          id: "membership",
                          label: `${membershipData.discountPercentage}% Member`,
                        },
                      ]
                    : []),
                  { id: "percentage", label: "%" },
                  { id: "flat", label: "₹ Flat" },
                  { id: "coins", label: "Points" },
                  { id: "coupon", label: "Coupon" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDiscountType(opt.id)}
                    style={{
                      padding: "0.3rem 0.65rem",
                      background:
                        discountType === opt.id ? "#111827" : "#f3f4f6",
                      color: discountType === opt.id ? "white" : "#6b7280",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {(discountType === "percentage" || discountType === "flat") && (
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  onWheel={(e) => e.preventDefault()}
                  placeholder={
                    discountType === "percentage" ? "Enter %" : "Enter amount"
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.625rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    marginBottom: "0.625rem",
                  }}
                />
              )}
              {discountType === "coins" && (
                <div style={{ marginBottom: "0.625rem" }}>
                  <input
                    type="number"
                    value={coinsUsed}
                    onChange={(e) => setCoinsUsed(e.target.value)}
                    onWheel={(e) => e.preventDefault()}
                    placeholder="Points to redeem"
                    max={availableLoyaltyPoints}
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.625rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      fontSize: "0.8125rem",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "#9ca3af",
                      marginTop: "0.25rem",
                    }}
                  >
                    Available:{" "}
                    <b style={{ color: "#111827" }}>{availableLoyaltyPoints}</b>{" "}
                    pts ? ₹{(parseFloat(coinsUsed) || 0) / 20} discount
                  </div>
                </div>
              )}
              {discountType === "coupon" && (
                <div style={{ marginBottom: "0.625rem" }}>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="Coupon code"
                      disabled={validatingCoupon}
                      style={{
                        flex: 1,
                        padding: "0.5rem 0.625rem",
                        border: `1px solid ${couponError ? "#ef4444" : "#d1d5db"}`,
                        borderRadius: "0.375rem",
                        fontSize: "0.8125rem",
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={handleValidateCoupon}
                      disabled={validatingCoupon || !couponCode}
                      style={{
                        padding: "0.5rem 0.75rem",
                        background: couponData ? "#111827" : "#f3f4f6",
                        color: couponData ? "white" : "#6b7280",
                        border: "none",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor:
                          validatingCoupon || !couponCode
                            ? "not-allowed"
                            : "pointer",
                        whiteSpace: "nowrap",
                        opacity: validatingCoupon || !couponCode ? 0.5 : 1,
                      }}
                    >
                      {validatingCoupon
                        ? "?"
                        : couponData
                          ? "? Applied"
                          : "Apply"}
                    </button>
                  </div>
                  {couponError && (
                    <div
                      style={{
                        marginTop: "0.25rem",
                        fontSize: "0.72rem",
                        color: "#dc2626",
                      }}
                    >
                      {couponError}
                    </div>
                  )}
                  {couponData && (
                    <div
                      style={{
                        marginTop: "0.25rem",
                        fontSize: "0.72rem",
                        color: "#16a34a",
                      }}
                    >
                      {couponData.discountType === "percentage"
                        ? couponData.discountValue + "%"
                        : "₹" + couponData.discountValue}{" "}
                      off
                      {couponData.isCapped &&
                        ` (capped at ₹${couponData.discountAmount.toFixed(2)})`}
                    </div>
                  )}
                </div>
              )}

              {/* Amount Paid */}
              <p
                style={{
                  margin: "0.75rem 0 0.4rem 0",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Amount Paid
              </p>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "0.625rem",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "0.625rem",
                    color: "#9ca3af",
                    fontSize: "0.875rem",
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  onWheel={(e) => e.preventDefault()}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "0.6rem 5rem 0.6rem 1.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#111827",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#9ca3af")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#d1d5db")
                  }
                />
                <button
                  onClick={() => setAmountPaid(totalAmount.toString())}
                  style={{
                    position: "absolute",
                    right: "0.375rem",
                    padding: "0.3rem 0.6rem",
                    background: "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "0.25rem",
                    fontSize: "0.65rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  Fill
                </button>
              </div>

              {/* Payment Method */}
              <p
                style={{
                  margin: "0 0 0.4rem 0",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Payment Method
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.3rem",
                  marginBottom: "0.75rem",
                }}
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const active = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        padding: "0.5rem",
                        background: active ? method.color : "#f3f4f6",
                        color: active ? "white" : "#6b7280",
                        border: active
                          ? `2px solid ${method.color}`
                          : "2px solid transparent",
                        borderRadius: "0.375rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.375rem",
                        fontSize: "0.8125rem",
                      }}
                      onMouseEnter={(e) => {
                        if (!active)
                          e.currentTarget.style.background = "#e5e7eb";
                      }}
                      onMouseLeave={(e) => {
                        if (!active)
                          e.currentTarget.style.background = "#f3f4f6";
                      }}
                    >
                      <Icon size={14} />
                      {method.label}
                    </button>
                  );
                })}
              </div>

              {/* Notes */}
              <p
                style={{
                  margin: "0 0 0.4rem 0",
                  fontSize: "0.65rem",
                  fontWeight: "700",
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Notes
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes…"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.625rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.375rem",
                  fontSize: "0.8rem",
                  minHeight: "54px",
                  fontFamily: "inherit",
                  resize: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#9ca3af")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Footer actions */}
            <div
              style={{
                padding: "0.75rem 1rem",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: "0.5rem",
                flexShrink: 0,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "0.6rem",
                  background: "white",
                  border: "1px solid #d1d5db",
                  color: "#374151",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f9fafb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "white")
                }
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePayment}
                style={{
                  flex: 2,
                  padding: "0.6rem",
                  background: "#111827",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  fontSize: "0.8125rem",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1f2937")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#111827")
                }
              >
                ✓ Complete Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
