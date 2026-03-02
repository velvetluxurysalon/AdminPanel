import React, { useState, useEffect } from "react";
import {
  Download,
  Printer,
  Mail,
  MessageCircle,
  X,
  CheckCircle,
} from "lucide-react";
import {
  generateProfessionalBillPDF,
  downloadPDF,
  prepareInvoiceDataFromVisit,
} from "../utils/pdfGenerator";
import { openWhatsAppDirect } from "../../../services/whatsappService";
import { getDocument } from "../../../utils/firebaseUtils";

const BillOptionsModal = ({ selectedVisit, onClose }) => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visitSnapshot, setVisitSnapshot] = useState(selectedVisit);

  // Fetch invoice data from Firestore
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        if (selectedVisit.invoiceId) {
          const invoice = await getDocument(
            "invoices",
            selectedVisit.invoiceId,
          );
          if (invoice) {
            setInvoiceData(invoice);
            console.log("📄 Invoice data loaded:", invoice);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [selectedVisit.invoiceId]);

  useEffect(() => {
    let mounted = true;
    setVisitSnapshot(selectedVisit);

    const fetchLatestVisit = async () => {
      if (!selectedVisit?.id) return;
      try {
        const visitDoc = await getDocument("visits", selectedVisit.id);
        if (visitDoc && mounted) {
          setVisitSnapshot((prev) => ({ ...prev, ...visitDoc }));
        }
      } catch (error) {
        console.error("Error fetching latest visit:", error);
      }
    };

    fetchLatestVisit();

    return () => {
      mounted = false;
    };
  }, [selectedVisit]);

  // Use invoice data if available, otherwise fall back to visit data
  const displayData = invoiceData || selectedVisit;

  // Calculate totals - prefer invoice data first
  const subtotal =
    displayData.subtotal ||
    displayData.items?.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0,
    ) ||
    0;
  const discountAmount = displayData.discountAmount || 0;
  const totalAmount =
    displayData.totalAmount || Math.max(0, subtotal - discountAmount);
  const paidAmount = displayData.paidAmount || totalAmount;
  const balance = Math.max(0, totalAmount - paidAmount);

  const handlePrintBill = async () => {
    try {
      const pdfInvoiceData = prepareInvoiceDataFromVisit(selectedVisit);

      const pdf = await generateProfessionalBillPDF(
        pdfInvoiceData,
        selectedVisit,
      );
      pdf.autoPrint();
      window.open(pdf.output("bloburi"), "_blank");
    } catch (error) {
      console.error("Error printing PDF:", error);
      alert("Error generating print preview. Please try again.");
    }
  };

  const handleDownloadBill = async () => {
    try {
      const pdfInvoiceData = prepareInvoiceDataFromVisit(selectedVisit);

      const pdf = await generateProfessionalBillPDF(
        pdfInvoiceData,
        selectedVisit,
      );
      downloadPDF(
        pdf,
        `Velvet_Premium_Invoice_${pdfInvoiceData.invoiceId || selectedVisit.customer?.name || "Guest"}_${new Date().getTime()}.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Helper to create PDF Blob
  const createPDFBlob = async () => {
    const pdfInvoiceData = prepareInvoiceDataFromVisit(selectedVisit);
    const pdf = await generateProfessionalBillPDF(
      pdfInvoiceData,
      selectedVisit,
    );
    return pdf.output("blob");
  };

  // Share PDF via WhatsApp - Direct link opener
  const handleShareWhatsApp = () => {
    try {
      const visitForShare = visitSnapshot || selectedVisit;
      if (!visitForShare) {
        alert("Unable to share the invoice right now.");
        return;
      }

      const phone = (
        visitForShare.customer?.phone ||
        visitForShare.customer?.contactNo ||
        visitForShare.customerPhone ||
        visitForShare.phone ||
        ""
      ).replace(/\D/g, "");

      if (!phone) {
        alert("No phone number available for this customer");
        return;
      }

      console.log("📱 [BillOptionsModal] Opening WhatsApp for:", phone);

      const pdfInvoiceData =
        invoiceData || prepareInvoiceDataFromVisit(visitForShare);

      const billDownloadUrl =
        invoiceData?.billDownloadUrl || visitForShare.billDownloadUrl || null;

      const result = openWhatsAppDirect(phone, pdfInvoiceData, billDownloadUrl);

      if (!result.success) {
        alert("Error: " + result.message);
      }
    } catch (error) {
      console.error("❌ [BillOptionsModal] WhatsApp open error:", error);
      alert("Error opening WhatsApp: " + error.message);
    }
  };

  // Share PDF via Email (Web Share API or fallback)
  const handleShareEmail = async () => {
    try {
      const pdfBlob = await createPDFBlob();
      const file = new File(
        [pdfBlob],
        `Velvet_Premium_Invoice_${selectedVisit.invoiceId || selectedVisit.customer?.name || "Guest"}.pdf`,
        { type: "application/pdf" },
      );
      const email = selectedVisit.customer?.email || "";
      const subject = `Invoice from Velvet Premium Unisex Salon - ${new Date().toLocaleDateString()}`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: subject,
          text: "Please find your invoice attached.",
        });
      } else {
        // Fallback: download PDF and open mailto
        const pdfInvoiceData = prepareInvoiceDataFromVisit(selectedVisit);
        downloadPDF(
          await generateProfessionalBillPDF(pdfInvoiceData, selectedVisit),
          `Velvet_Premium_Invoice_${selectedVisit.invoiceId || selectedVisit.customer?.name || "Guest"}.pdf`,
        );
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("Please find your invoice attached as PDF.")}`;
        window.location.href = mailtoLink;
        alert("PDF downloaded. Please attach it to your email.");
      }
    } catch (err) {
      alert("Unable to share PDF. Please try again.");
    }
  };

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
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* SUCCESS ICON */}
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
          <CheckCircle size={32} />
        </div>

        <h2
          style={{
            color: "#111827",
            marginBottom: "0.5rem",
            fontSize: "1.5rem",
            fontWeight: "700",
          }}
        >
          View Invoice
        </h2>
        <p
          style={{
            color: "#6b7280",
            marginBottom: "1.5rem",
            fontSize: "1rem",
          }}
        >
          {selectedVisit.customer?.name || selectedVisit.customerName}
        </p>

        {/* INVOICE DETAILS SECTION */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            textAlign: "left",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Items List */}
          {selectedVisit.items && selectedVisit.items.length > 0 && (
            <>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "1rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}
              >
                Services & Products
              </h3>
              <div
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "1rem",
                  marginBottom: "1rem",
                }}
              >
                {selectedVisit.items.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                      fontSize: "0.925rem",
                    }}
                  >
                    <span style={{ color: "#374151" }}>
                      {item.name} x{item.quantity || 1}
                    </span>
                    <span style={{ color: "#111827", fontWeight: "600" }}>
                      ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Subtotal */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              fontSize: "0.925rem",
              color: "#6b7280",
            }}
          >
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Discount */}
          {discountAmount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
                fontSize: "0.925rem",
                color: "#dc2626",
              }}
            >
              <span>
                {displayData.discountType === "coupon"
                  ? `Coupon (${displayData.couponCode || "Applied"})`
                  : displayData.discountType === "percentage"
                    ? "Percentage Discount"
                    : displayData.discountType === "membership"
                      ? "Membership Discount"
                      : displayData.discountType === "coins"
                        ? "Loyalty Points Discount"
                        : "Discount"}
              </span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "1rem",
              borderTop: "2px solid #e5e7eb",
              fontSize: "1.125rem",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            <span>TOTAL</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>

          {/* Payment Status */}
          <div
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid #e5e7eb",
              fontSize: "0.9rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ color: "#6b7280" }}>Paid Amount</span>
              <span
                style={{
                  color: "#16a34a",
                  fontWeight: "600",
                }}
              >
                ₹{paidAmount.toFixed(2)}
              </span>
            </div>
            {balance > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#6b7280" }}>Balance Due</span>
                <span
                  style={{
                    color: "#dc2626",
                    fontWeight: "600",
                  }}
                >
                  ₹{balance.toFixed(2)}
                </span>
              </div>
            )}
            {balance === 0 && (
              <div
                style={{
                  color: "#16a34a",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                }}
              >
                ✓ PAID IN FULL
              </div>
            )}
          </div>

          {/* Show if loading invoice data */}
          {loading && (
            <div
              style={{
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid #e5e7eb",
                fontSize: "0.85rem",
                color: "#9ca3af",
                fontStyle: "italic",
              }}
            >
              Loading complete invoice details...
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
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
          onClick={onClose}
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
};

export default BillOptionsModal;
