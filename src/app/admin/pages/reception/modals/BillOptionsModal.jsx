import React from "react";
import { Download, Printer, Mail, MessageCircle, X } from "lucide-react";
import {
  generateProfessionalBillPDF,
  downloadPDF,
} from "../utils/pdfGenerator";

const BillOptionsModal = ({ selectedVisit, onClose }) => {
  const handlePrintBill = async () => {
    try {
      const invoiceData = {
        invoiceId: selectedVisit.invoiceId, // Get invoiceId from visit data
        visitId: selectedVisit.id,
        customerId: selectedVisit.customerId,
        customerName: selectedVisit.customer?.name,
        customerPhone:
          selectedVisit.customer?.phone || selectedVisit.customer?.contactNo,
        customerEmail: selectedVisit.customer?.email || "",
        items: selectedVisit.items,
        totalAmount: selectedVisit.totalAmount,
        discountAmount: 0,
        paidAmount: selectedVisit.paidAmount || selectedVisit.totalAmount,
        paymentMode: selectedVisit.paymentMode || "cash",
        status: "paid",
      };

      const pdf = await generateProfessionalBillPDF(invoiceData, selectedVisit);
      pdf.autoPrint();
      window.open(pdf.output("bloburi"), "_blank");
    } catch (error) {
      console.error("Error printing PDF:", error);
      alert("Error generating print preview. Please try again.");
    }
  };

  const handleDownloadBill = async () => {
    try {
      const invoiceData = {
        invoiceId: selectedVisit.invoiceId, // Get invoiceId from visit data
        visitId: selectedVisit.id,
        customerId: selectedVisit.customerId,
        customerName: selectedVisit.customer?.name,
        customerPhone:
          selectedVisit.customer?.phone || selectedVisit.customer?.contactNo,
        customerEmail: selectedVisit.customer?.email || "",
        items: selectedVisit.items,
        totalAmount: selectedVisit.totalAmount,
        discountAmount: 0,
        paidAmount: selectedVisit.paidAmount || selectedVisit.totalAmount,
        paymentMode: selectedVisit.paymentMode || "cash",
        status: "paid",
      };

      const pdf = await generateProfessionalBillPDF(invoiceData, selectedVisit);
      downloadPDF(
        pdf,
        `Velvet_Premium_Invoice_${invoiceData.invoiceId || selectedVisit.customer?.name || "Guest"}_${new Date().getTime()}.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Helper to create PDF Blob
  const createPDFBlob = async () => {
    const invoiceData = {
      invoiceId: selectedVisit.invoiceId, // Get invoiceId from visit data
      visitId: selectedVisit.id,
      customerId: selectedVisit.customerId,
      customerName: selectedVisit.customer?.name,
      customerPhone:
        selectedVisit.customer?.phone || selectedVisit.customer?.contactNo,
      customerEmail: selectedVisit.customer?.email || "",
      items: selectedVisit.items,
      totalAmount: selectedVisit.totalAmount,
      discountAmount: 0,
      paidAmount: selectedVisit.paidAmount || selectedVisit.totalAmount,
      paymentMode: selectedVisit.paymentMode || "cash",
      status: "paid",
    };
    const pdf = await generateProfessionalBillPDF(invoiceData, selectedVisit);
    return pdf.output("blob");
  };

  // Share PDF via WhatsApp (Web Share API or fallback)
  const handleShareWhatsApp = async () => {
    try {
      const phone = (
        selectedVisit.customer?.phone ||
        selectedVisit.customer?.contactNo ||
        ""
      ).replace(/\D/g, "");
      const pdfBlob = await createPDFBlob();
      const file = new File(
        [pdfBlob],
        `Velvet_Premium_Invoice_${selectedVisit.invoiceId || selectedVisit.customer?.name || "Guest"}.pdf`,
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
            {
              invoiceId: selectedVisit.invoiceId,
              visitId: selectedVisit.id,
              customerId: selectedVisit.customerId,
              customerName: selectedVisit.customer?.name,
              customerPhone:
                selectedVisit.customer?.phone ||
                selectedVisit.customer?.contactNo,
              customerEmail: selectedVisit.customer?.email || "",
              items: selectedVisit.items,
              totalAmount: selectedVisit.totalAmount,
              discountAmount: 0,
              paidAmount: selectedVisit.paidAmount || selectedVisit.totalAmount,
              paymentMode: selectedVisit.paymentMode || "cash",
              status: "paid",
            },
            selectedVisit,
          ),
          `Velvet_Premium_Invoice_${selectedVisit.invoiceId || selectedVisit.customer?.name || "Guest"}.pdf`,
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
        downloadPDF(
          await generateProfessionalBillPDF(
            {
              invoiceId: selectedVisit.invoiceId,
              visitId: selectedVisit.id,
              customerId: selectedVisit.customerId,
              customerName: selectedVisit.customer?.name,
              customerPhone:
                selectedVisit.customer?.phone ||
                selectedVisit.customer?.contactNo,
              customerEmail: selectedVisit.customer?.email || "",
              items: selectedVisit.items,
              totalAmount: selectedVisit.totalAmount,
              discountAmount: 0,
              paidAmount: selectedVisit.paidAmount || selectedVisit.totalAmount,
              paymentMode: selectedVisit.paymentMode || "cash",
              status: "paid",
            },
            selectedVisit,
          ),
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

  const generateSimpleTextBill = () => {
    let text = `VELVET PREMIUM UNISEX SALON - INVOICE\n\n`;
    text += `Customer: ${selectedVisit.customer?.name}\n`;
    text += `Phone: ${selectedVisit.customer?.contactNo || selectedVisit.customer?.phone}\n`;
    text += `Email: ${selectedVisit.customer?.email || "N/A"}\n`;
    text += `Date: ${new Date().toLocaleDateString("en-IN")}\n\n`;
    text += `SERVICES & PRODUCTS:\n`;
    text += `${"-".repeat(50)}\n`;

    selectedVisit.items?.forEach((item) => {
      text += `${item.name} x${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}\n`;
    });

    text += `${"-".repeat(50)}\n`;
    text += `Subtotal:        ₹${selectedVisit.totalAmount?.toFixed(2)}\n`;
    text += `${"-".repeat(50)}\n`;
    text += `Total:           ₹${selectedVisit.totalAmount?.toFixed(2)}\n`;
    text += `Amount Paid:     ₹${(selectedVisit.paidAmount || selectedVisit.totalAmount)?.toFixed(2)}\n`;
    text += `${"-".repeat(50)}\n`;
    text += `Thank you for choosing Velvet Premium Unisex Salon!\n`;

    return text;
  };

  return (
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
          borderRadius: "1rem",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
          animation: "slideInScale 0.4s ease-out",
        }}
      >
        <style>{`
          @keyframes slideInScale {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>

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
              color: "#1f2937",
              marginBottom: 0,
              fontSize: "1.5rem",
              fontWeight: "700",
            }}
          >
            Bill Options
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: 0,
            }}
          >
            <X size={24} />
          </button>
        </div>

        <p
          style={{
            color: "#6b7280",
            marginBottom: "2rem",
            fontSize: "0.95rem",
          }}
        >
          Choose how you want to manage your invoice
        </p>

        {/* ACTION BUTTONS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <button
            onClick={handlePrintBill}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.9rem",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#2563eb")}
            onMouseLeave={(e) => (e.target.style.background = "#3b82f6")}
            title="Print Bill"
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
              padding: "0.75rem 1rem",
              background: "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.9rem",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#7c3aed")}
            onMouseLeave={(e) => (e.target.style.background = "#8b5cf6")}
            title="Download as PDF"
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
              padding: "0.75rem 1rem",
              background: "#25d366",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.9rem",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#20ba58")}
            onMouseLeave={(e) => (e.target.style.background = "#25d366")}
            title="Share on WhatsApp"
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
              padding: "0.75rem 1rem",
              background: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.9rem",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#d97706")}
            onMouseLeave={(e) => (e.target.style.background = "#f59e0b")}
            title="Send via Email"
          >
            <Mail size={18} /> Email
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)")
          }
          onMouseLeave={(e) => (e.target.style.boxShadow = "none")}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BillOptionsModal;
