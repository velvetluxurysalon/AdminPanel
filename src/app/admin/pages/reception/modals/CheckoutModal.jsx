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
} from "lucide-react";
import {
  generateProfessionalBillPDF,
  downloadPDF,
} from "../utils/pdfGenerator";
import {
  updateDocument,
  getDocument,
  getMembership,
  generateInvoiceId,
  validateCoupon,
  incrementCouponUsage,
} from "../../../utils/firebaseUtils";
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

  const baseTotals = calculateTotals(visit);

  // Calculate discount
  let finalDiscount = 0;
  let coinsDiscount = 0;
  let discountDescription = "";

  if (discountType === "coupon" && couponData) {
    // Apply coupon discount
    finalDiscount = couponData.discountAmount || 0;
    discountDescription = `Coupon: ${couponCode} (${couponData.discountType === "percentage" ? couponData.discountValue + "%" : "₹" + couponData.discountValue})`;
    console.log("💰 [CheckoutModal] Coupon Discount Debug:", {
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
    console.log("📊 [CheckoutModal] Total Calculation:", {
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
        console.log("✅ Coupon validated:", {
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
      let currentLoyaltyPoints = availableLoyaltyPoints;
      let pointsDeducted = 0;
      let pointsEarned = 0;
      let transactionDescription = "";

      // If loyalty points are used as discount, deduct them from customer
      if (discountType === "coins" && coinsUsed) {
        pointsDeducted = parseFloat(coinsUsed) || 0;
        currentLoyaltyPoints = currentLoyaltyPoints - pointsDeducted;
      }

      // Award loyalty points based on amount paid
      // 1 point per ₹1 spent (equal value)
      const amountPaidValue = parseFloat(amountPaid) || 0;
      pointsEarned = Math.floor(amountPaidValue);
      const finalLoyaltyPoints = currentLoyaltyPoints + pointsEarned;

      // Create single transaction entry in pointsHistory
      if (pointsDeducted > 0 || pointsEarned > 0) {
        let description = "";
        if (pointsDeducted > 0 && pointsEarned > 0) {
          description = `${pointsDeducted} points used as discount, ${pointsEarned} points earned from ₹${amountPaidValue} purchase`;
        } else if (pointsDeducted > 0) {
          description = `${pointsDeducted} points used as discount`;
        } else {
          description = `${pointsEarned} points earned from ₹${amountPaidValue} purchase`;
        }

        await addDoc(
          collection(db, `customers/${visit.customerId}/pointsHistory`),
          {
            type:
              pointsDeducted > 0 && pointsEarned > 0
                ? "adjusted"
                : pointsDeducted > 0
                  ? "deducted"
                  : "earned",
            amount: pointsEarned - pointsDeducted,
            points: pointsEarned - pointsDeducted,
            pointsDeducted: pointsDeducted,
            pointsEarned: pointsEarned,
            description: description,
            invoiceId: visit.id,
            billDetails: {
              amountSpent: amountPaidValue,
              paymentMethod: paymentMethod,
              discountGiven: finalDiscount,
              itemsCount: visit.items?.length || 0,
            },
            transactionDate: serverTimestamp(),
          },
        );
      }

      // Update customer loyalty points in Firebase
      await updateDocument("customers", visit.customerId, {
        loyaltyPoints: finalLoyaltyPoints,
        totalSpent: (visit.customer?.totalSpent || 0) + amountPaidValue,
        totalVisits: (visit.customer?.totalVisits || 0) + 1,
      });

      // Generate invoice ID before creating invoice data
      const invoiceId = await generateInvoiceId();

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

      console.log("💾 [CheckoutModal] Invoice Data being created:", {
        customerName: newInvoiceData.customerName,
        customerEmail: newInvoiceData.customerEmail,
        totalAmount: newInvoiceData.totalAmount,
        invoiceId: newInvoiceData.invoiceId,
        itemsCount: newInvoiceData.items?.length,
      });

      // Increment coupon usage if a coupon was applied
      if (discountType === "coupon" && couponCode) {
        try {
          await incrementCouponUsage(couponCode);
          console.log("✅ Coupon usage incremented:", couponCode);
        } catch (error) {
          console.error("Error incrementing coupon usage:", error);
          // Don't fail the payment if coupon increment fails
        }
      }

      setInvoiceData(newInvoiceData);
      setPaymentCompleted(true);
    } catch (error) {
      console.error("Error completing payment:", error);
      alert("Error processing payment. Please try again.");
    }
  };

  const handleDoneClick = () => {
    // Reset payment state before closing
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

    // Call parent callback with invoice data
    if (invoiceData) {
      onPaymentComplete(invoiceData);
    } else {
      onClose();
    }
  };

  const generateBillTextForShare = () => {
    const balance = Math.max(0, totalAmount - (parseFloat(amountPaid) || 0));
    let text = `*VELVET PREMIUM UNISEX SALON - INVOICE*\n\n`;
    text += `👤 Customer: ${visit.customer?.name || visit.customerName}\n`;
    text += `📱 Phone: ${visit.customer?.phone || visit.customer?.contactNo || visit.customerPhone}\n`;
    text += `📧 Email: ${visit.customer?.email || visit.customerEmail || "N/A"}\n`;
    text += `📅 Date: ${new Date().toLocaleDateString("en-IN")}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*SERVICES & PRODUCTS*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    visit.items?.forEach((item) => {
      text += `• ${item.name} x${item.quantity}\n  ₹${(item.price * item.quantity).toFixed(2)}\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 Subtotal: ₹${baseTotals.subtotal.toFixed(2)}\n`;
    if (finalDiscount > 0) {
      text += `✂️ Discount: -₹${finalDiscount.toFixed(2)}\n`;
    }
    text += `\n*TOTAL: ₹${totalAmount.toFixed(2)}*\n`;
    text += `✅ Amount Paid: ₹${(parseFloat(amountPaid) || 0).toFixed(2)}\n`;
    if (balance > 0) {
      text += `⏳ Balance Due: ₹${balance.toFixed(2)}\n`;
    } else {
      text += `✓ Status: PAID IN FULL\n`;
    }
    text += `💳 Payment: ${paymentMethod.toUpperCase()}\n`;
    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✨ Thank you for choosing Velvet Premium Unisex Salon!\n`;
    text += `📞 For queries: 9345678646\n`;
    text += `✉️ Velvetluxurysalon@gmail.com\n`;
    text += `🕐 Working Hours: 8:00 AM - 9:00 PM`;

    return text;
  };

  const handlePrintBill = async () => {
    try {
      // Use existing invoiceData from state if available (after payment completion)
      // Otherwise, create a new one (for print before payment - though this shouldn't normally happen)
      const pdfInvoiceData = invoiceData || {
        invoiceId: invoiceData?.invoiceId, // Ensure invoiceId is included
        visitId: visit.id,
        customerId: visit.customerId,
        customerName: visit.customer?.name,
        customerPhone: visit.customer?.contactNo || visit.customer?.phone,
        customerEmail: visit.customer?.email || "",
        items: visit.items,
        subtotal: baseTotals.subtotal,
        totalAmount: totalAmount,
        discountAmount: finalDiscount,
        discountType: discountType,
        paidAmount: parseFloat(amountPaid) || 0,
        paymentMode: paymentMethod,
        status: amountPaid >= totalAmount ? "paid" : "partial",
      };

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
      // Use existing invoiceData from state if available (after payment completion)
      // Otherwise, create a new one (for download before payment - though this shouldn't normally happen)
      const pdfInvoiceData = invoiceData || {
        invoiceId: invoiceData?.invoiceId, // Ensure invoiceId is included
        visitId: visit.id,
        customerId: visit.customerId,
        customerName: visit.customer?.name,
        customerPhone: visit.customer?.contactNo || visit.customer?.phone,
        customerEmail: visit.customer?.email || "",
        items: visit.items,
        subtotal: baseTotals.subtotal,
        totalAmount: totalAmount,
        discountAmount: finalDiscount,
        discountType: discountType,
        paidAmount: parseFloat(amountPaid) || 0,
        paymentMode: paymentMethod,
        status: amountPaid >= totalAmount ? "paid" : "partial",
      };

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
    // Use existing invoiceData from state if available (after payment completion)
    // Otherwise, create a new one (for share before payment - though this shouldn't normally happen)
    const pdfInvoiceData = invoiceData || {
      invoiceId: invoiceData?.invoiceId, // Ensure invoiceId is included
      visitId: visit.id,
      customerId: visit.customerId,
      customerName: visit.customer?.name,
      customerPhone: visit.customer?.contactNo || visit.customer?.phone,
      customerEmail: visit.customer?.email || "",
      items: visit.items,
      subtotal: baseTotals.subtotal,
      totalAmount: totalAmount,
      discountAmount: finalDiscount,
      discountType: discountType,
      paidAmount: parseFloat(amountPaid) || 0,
      paymentMode: paymentMethod,
      status: amountPaid >= totalAmount ? "paid" : "partial",
    };
    const pdf = await generateProfessionalBillPDF(pdfInvoiceData, visit);
    return pdf.output("blob");
  };

  // Share PDF via WhatsApp (Web Share API or fallback)
  const handleShareWhatsApp = async () => {
    try {
      const phone = (
        visit.customer?.contactNo ||
        visit.customer?.phone ||
        ""
      ).replace(/\D/g, "");
      const pdfBlob = await createPDFBlob();
      const file = new File(
        [pdfBlob],
        `Velvet_Luxury_Salon_Invoice_${invoiceData?.invoiceId || visit.customer?.name || "Guest"}.pdf`,
        { type: "application/pdf" },
      );
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Velvet Premium Unisex Salon Invoice",
          text: "Please find your invoice attached.",
        });
      } else {
        // Fallback: download PDF and instruct user to attach in WhatsApp
        downloadPDF(
          await generateProfessionalBillPDF(
            invoiceData || {
              visitId: visit.id,
              customerId: visit.customerId,
              customerName: visit.customer?.name,
              customerPhone: visit.customer?.contactNo || visit.customer?.phone,
              customerEmail: visit.customer?.email || "",
              items: visit.items,
              subtotal: baseTotals.subtotal,
              totalAmount: totalAmount,
              discountAmount: finalDiscount,
              discountType: discountType,
              paidAmount: parseFloat(amountPaid) || 0,
              paymentMode: paymentMethod,
              status: amountPaid >= totalAmount ? "paid" : "partial",
            },
            visit,
          ),
          `Velvet_Luxury_Salon_Invoice_${invoiceData?.invoiceId || visit.customer?.name || "Guest"}.pdf`,
        );
        alert("PDF downloaded. Please attach and send via WhatsApp manually.");
      }
    } catch (err) {
      alert("Unable to share PDF. Please try again.");
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
        downloadPDF(
          await generateProfessionalBillPDF(
            invoiceData || {
              visitId: visit.id,
              customerId: visit.customerId,
              customerName: visit.customer?.name,
              customerPhone: visit.customer?.contactNo || visit.customer?.phone,
              customerEmail: visit.customer?.email || "",
              items: visit.items,
              subtotal: baseTotals.subtotal,
              totalAmount: totalAmount,
              discountAmount: finalDiscount,
              discountType: discountType,
              paidAmount: parseFloat(amountPaid) || 0,
              paymentMode: paymentMethod,
              status: amountPaid >= totalAmount ? "paid" : "partial",
            },
            visit,
          ),
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
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
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
            borderRadius: "1rem",
            padding: "2.5rem",
            maxWidth: "450px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "#f0fdf4",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              color: "#16a34a",
            }}
          >
            <Check size={32} />
          </div>

          <h2
            style={{
              color: "#111827",
              marginBottom: "0.5rem",
              fontSize: "1.5rem",
              fontWeight: "700",
            }}
          >
            Payment Complete
          </h2>
          <p
            style={{
              color: "#6b7280",
              marginBottom: "1.5rem",
              fontSize: "1rem",
            }}
          >
            Invoice generated for {visit.customer?.name || visit.customerName}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <button
              onClick={handlePrintBill}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                background: "#f9fafb",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <Printer size={18} /> Print
            </button>
            <button
              onClick={handleDownloadBill}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                background: "#f9fafb",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <Download size={18} /> Download
            </button>
            <button
              onClick={handleShareWhatsApp}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                background: "#f9fafb",
                color: "#16a34a",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <MessageCircle size={18} /> WhatsApp
            </button>
            <button
              onClick={handleShareEmail}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                background: "#f9fafb",
                color: "#f59e0b",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontWeight: "600",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              <Mail size={18} /> Email
            </button>
          </div>

          <button
            onClick={handleDoneClick}
            style={{
              width: "100%",
              padding: "0.875rem",
              background: "#111827",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Close
          </button>
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
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div
        style={{
          position: "relative",
          background: "white",
          borderRadius: "1rem",
          width: "90%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
            padding: "2.5rem 2rem",
            borderRadius: "1rem 1rem 0 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05" fill-rule="evenodd"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3Ccircle cx="13" cy="13" r="3"/%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.2,
            }}
          ></div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <h2
              style={{
                margin: 0,
                color: "white",
                fontSize: "1.75rem",
                fontWeight: "800",
                letterSpacing: "-0.5px",
              }}
            >
              Complete Checkout
            </h2>
            <p
              style={{
                margin: "0.5rem 0 0 0",
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.875rem",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Invoice #{visit.id?.slice(-6).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              cursor: "pointer",
              fontSize: "1.5rem",
              color: "white",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
          }}
        >
          {/* LEFT COLUMN - CUSTOMER & ITEMS */}
          <div>
            {/* CUSTOMER INFO */}
            <div
              style={{
                background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
                padding: "1.25rem",
                borderRadius: "0.875rem",
                marginBottom: "1.5rem",
                borderLeft: "4px solid #667eea",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Customer
                  </p>
                  <p
                    style={{
                      margin: "0.5rem 0 0 0",
                      fontWeight: "700",
                      color: "#1f2937",
                      fontSize: "1.125rem",
                    }}
                  >
                    {visit.customer?.name}
                  </p>
                  <p
                    style={{
                      margin: "0.25rem 0 0 0",
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    }}
                  >
                    📱 {visit.customer?.contactNo || visit.customer?.phone}
                  </p>
                </div>
                {/* MEMBERSHIP BADGE */}
                <div>
                  {(() => {
                    const membershipType =
                      customerData?.membershipType ||
                      visit.customer?.membershipType ||
                      "regular";
                    const isElite = membershipType === "elite";
                    const isMember = membershipType === "membership";

                    return (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: isElite
                            ? "0.625rem 1rem"
                            : "0.625rem 0.875rem",
                          background: isElite
                            ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                            : isMember
                              ? "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)"
                              : "linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          color: isElite
                            ? "#78350f"
                            : isMember
                              ? "#4c1d95"
                              : "#374151",
                          boxShadow: isElite
                            ? "0 4px 12px rgba(251, 191, 36, 0.25)"
                            : isMember
                              ? "0 4px 12px rgba(139, 92, 246, 0.25)"
                              : "none",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isElite
                          ? "👑 Elite"
                          : isMember
                            ? "⭐ Member"
                            : "Regular"}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* ITEMS SUMMARY */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                📦 Items Summary
              </h3>
              <div
                style={{
                  background: "#f9fafb",
                  padding: "1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.875rem",
                }}
              >
                {visit.items?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 0",
                      borderBottom:
                        idx < visit.items.length - 1
                          ? "1px solid #f3f4f6"
                          : "none",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: "500",
                          color: "#1f2937",
                        }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{
                          margin: "0.25rem 0 0 0",
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                        }}
                      >
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <span
                      style={{
                        fontWeight: "700",
                        color: "#667eea",
                        fontSize: "0.95rem",
                      }}
                    >
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PAYMENT SUMMARY */}
            <div
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                border: "1px solid #fcd34d",
                padding: "1.25rem",
                borderRadius: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                  fontSize: "0.875rem",
                }}
              >
                <span style={{ color: "#78350f" }}>Subtotal:</span>
                <span style={{ fontWeight: "600", color: "#78350f" }}>
                  ₹{baseTotals.subtotal.toFixed(2)}
                </span>
              </div>
              {finalDiscount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.75rem",
                    fontSize: "0.875rem",
                    color: "#b45309",
                  }}
                >
                  <span>{discountDescription}:</span>
                  <span style={{ fontWeight: "600" }}>
                    -₹{finalDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              {membershipData && discountType === "membership" && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#b45309",
                    marginBottom: "0.75rem",
                    padding: "0.5rem",
                    background: "rgba(251, 146, 60, 0.1)",
                    borderRadius: "0.5rem",
                  }}
                >
                  ✓ {membershipData.name} Member -{" "}
                  {membershipData.discountPercentage}% member discount applied
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.25rem",
                  fontWeight: "700",
                  color: "#92400e",
                  paddingTop: "0.75rem",
                  borderTop: "2px solid #fbbf24",
                }}
              >
                <span>Total:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - DISCOUNTS, PAYMENT, NOTES & BUTTONS */}
          <div>
            {/* DISCOUNT SECTION */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ✂️ Apply Discount (Optional)
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.5rem",
                  marginBottom: "0.75rem",
                }}
              >
                <button
                  onClick={() => setDiscountType("none")}
                  style={{
                    padding: "0.625rem 0.5rem",
                    background: discountType === "none" ? "#667eea" : "#f3f4f6",
                    color: discountType === "none" ? "white" : "#4b5563",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (discountType !== "none")
                      e.currentTarget.style.background = "#e5e7eb";
                  }}
                  onMouseLeave={(e) => {
                    if (discountType !== "none")
                      e.currentTarget.style.background = "#f3f4f6";
                  }}
                >
                  No Discount
                </button>
                {membershipData && membershipData.discountPercentage > 0 ? (
                  <button
                    onClick={() => setDiscountType("membership")}
                    style={{
                      padding: "0.625rem 0.5rem",
                      background:
                        discountType === "membership" ? "#fb923c" : "#fef3c7",
                      color:
                        discountType === "membership" ? "white" : "#b45309",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.25rem",
                    }}
                    onMouseEnter={(e) => {
                      if (discountType !== "membership")
                        e.currentTarget.style.background = "#fed7aa";
                    }}
                    onMouseLeave={(e) => {
                      if (discountType !== "membership")
                        e.currentTarget.style.background = "#fef3c7";
                    }}
                  >
                    👑 {membershipData.discountPercentage}%
                  </button>
                ) : null}
                <button
                  onClick={() => setDiscountType("percentage")}
                  style={{
                    padding: "0.625rem 0.5rem",
                    background:
                      discountType === "percentage" ? "#667eea" : "#f3f4f6",
                    color: discountType === "percentage" ? "white" : "#4b5563",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (discountType !== "percentage")
                      e.currentTarget.style.background = "#e5e7eb";
                  }}
                  onMouseLeave={(e) => {
                    if (discountType !== "percentage")
                      e.currentTarget.style.background = "#f3f4f6";
                  }}
                >
                  % Discount
                </button>
                <button
                  onClick={() => setDiscountType("flat")}
                  style={{
                    padding: "0.625rem 0.5rem",
                    background: discountType === "flat" ? "#667eea" : "#f3f4f6",
                    color: discountType === "flat" ? "white" : "#4b5563",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (discountType !== "flat")
                      e.currentTarget.style.background = "#e5e7eb";
                  }}
                  onMouseLeave={(e) => {
                    if (discountType !== "flat")
                      e.currentTarget.style.background = "#f3f4f6";
                  }}
                >
                  Flat Amount
                </button>
                <button
                  onClick={() => setDiscountType("coins")}
                  style={{
                    padding: "0.625rem 0.5rem",
                    background:
                      discountType === "coins" ? "#8b5cf6" : "#f3e8ff",
                    color: discountType === "coins" ? "white" : "#6b21a8",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                  }}
                  onMouseEnter={(e) => {
                    if (discountType !== "coins")
                      e.currentTarget.style.background = "#ede9fe";
                  }}
                  onMouseLeave={(e) => {
                    if (discountType !== "coins")
                      e.currentTarget.style.background = "#f3e8ff";
                  }}
                >
                  <Coins size={13} /> Points
                </button>
                <button
                  onClick={() => setDiscountType("coupon")}
                  style={{
                    padding: "0.625rem 0.5rem",
                    background:
                      discountType === "coupon" ? "#10b981" : "#d1fae5",
                    color: discountType === "coupon" ? "white" : "#065f46",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.25rem",
                  }}
                  onMouseEnter={(e) => {
                    if (discountType !== "coupon")
                      e.currentTarget.style.background = "#a7f3d0";
                  }}
                  onMouseLeave={(e) => {
                    if (discountType !== "coupon")
                      e.currentTarget.style.background = "#d1fae5";
                  }}
                >
                  🎟️ Coupon Code
                </button>
              </div>

              {discountType === "percentage" || discountType === "flat" ? (
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  onWheel={(e) => e.preventDefault()}
                  placeholder={
                    discountType === "percentage"
                      ? "Enter discount %"
                      : "Enter discount amount"
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                />
              ) : discountType === "coins" ? (
                <div>
                  <input
                    type="number"
                    value={coinsUsed}
                    onChange={(e) => setCoinsUsed(e.target.value)}
                    onWheel={(e) => e.preventDefault()}
                    placeholder="Enter loyalty points to use"
                    max={availableLoyaltyPoints}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      marginTop: "0.5rem",
                      textAlign: "center",
                    }}
                  >
                    Available:{" "}
                    <span style={{ fontWeight: "600", color: "#1f2937" }}>
                      {availableLoyaltyPoints}
                    </span>{" "}
                    Points → Discount:{" "}
                    <span style={{ fontWeight: "600", color: "#667eea" }}>
                      ₹{(parseFloat(coinsUsed) || 0) / 20}
                    </span>
                  </div>
                </div>
              ) : discountType === "coupon" ? (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="Enter coupon code"
                    disabled={validatingCoupon}
                    style={{
                      flex: 1,
                      padding: "0.75rem",
                      border: couponError
                        ? "2px solid #ef4444"
                        : "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      backgroundColor: validatingCoupon ? "#f3f4f6" : "white",
                      cursor: validatingCoupon ? "not-allowed" : "pointer",
                    }}
                  />
                  <button
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon || !couponCode}
                    style={{
                      padding: "0.75rem 1rem",
                      background: couponData ? "#10b981" : "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      cursor:
                        validatingCoupon || !couponCode
                          ? "not-allowed"
                          : "pointer",
                      opacity: validatingCoupon || !couponCode ? 0.6 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {validatingCoupon
                      ? "Validating..."
                      : couponData
                        ? "✓ Applied"
                        : "Validate"}
                  </button>
                </div>
              ) : null}
              {discountType === "coupon" && couponError && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    color: "#991b1b",
                    fontWeight: "500",
                  }}
                >
                  ❌ {couponError}
                </div>
              )}
              {discountType === "coupon" && couponData && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    background: "#dcfce7",
                    border: "1px solid #bbf7d0",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    color: "#166534",
                    fontWeight: "500",
                  }}
                >
                  ✓ Coupon applied:{" "}
                  {couponData.discountType === "percentage"
                    ? couponData.discountValue + "%"
                    : "₹" + couponData.discountValue}{" "}
                  discount
                  {couponData.isCapped && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.7rem",
                        color: "#047857",
                        fontWeight: "600",
                      }}
                    >
                      💡 Maximum discount of ₹
                      {couponData.discountAmount.toFixed(2)} applied
                      {couponData.originalDiscountAmount >
                        couponData.discountAmount}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* AMOUNT PAID */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                💵 Amount Paid
              </label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    fontSize: "1rem",
                    color: "#6b7280",
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
                    padding: "0.875rem 2.75rem 0.875rem 2rem",
                    border: "2px solid #e5e7eb",
                    borderRadius: "0.5rem",
                    fontSize: "1.125rem",
                    fontWeight: "700",
                    color: "#1f2937",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "#667eea")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e5e7eb")
                  }
                />
                <button
                  onClick={() => setAmountPaid(totalAmount.toString())}
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    padding: "0.5rem 0.875rem",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(102, 126, 234, 0.4)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(102, 126, 234, 0.2)")
                  }
                  title={`Set to ₹${totalAmount.toFixed(2)}`}
                >
                  Fill Total
                </button>
              </div>
              {amountPaid !== "" && balance !== 0 && (
                <p
                  style={{
                    margin: "0.5rem 0 0 0",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: balance > 0 ? "#dc2626" : "#10b981",
                  }}
                >
                  {balance > 0
                    ? `⏳ Balance Due: ₹${balance.toFixed(2)}`
                    : `✓ Overpaid: ₹${Math.abs(balance).toFixed(2)}`}
                </p>
              )}
            </div>

            {/* PAYMENT METHOD */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                💳 Payment Method
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        padding: "0.75rem",
                        background:
                          paymentMethod === method.id
                            ? method.color
                            : "#f3f4f6",
                        color:
                          paymentMethod === method.id ? "white" : "#4b5563",
                        border:
                          paymentMethod === method.id
                            ? `2px solid ${method.color}`
                            : "2px solid transparent",
                        borderRadius: "0.5rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                      onMouseEnter={(e) => {
                        if (paymentMethod !== method.id) {
                          e.currentTarget.style.background = "#e5e7eb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (paymentMethod !== method.id) {
                          e.currentTarget.style.background = "#f3f4f6";
                        }
                      }}
                    >
                      <Icon size={16} />
                      {method.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* NOTES */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                📝 Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or remarks..."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  minHeight: "70px",
                  fontFamily: "inherit",
                  resize: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* ACTION BUTTONS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr",
                gap: "1rem",
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: "0.875rem 1.5rem",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e5e7eb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCompletePayment}
                style={{
                  padding: "0.875rem 1.5rem",
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(16, 185, 129, 0.4)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(16, 185, 129, 0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
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
