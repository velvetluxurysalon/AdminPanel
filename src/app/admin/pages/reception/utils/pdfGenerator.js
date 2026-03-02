import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generates a world-class premium PDF bill for Velvet Premium Unisex Salon.
 * Optimized for full A4 page width without clipping or blank margins.
 */
export const generateProfessionalBillPDF = async (invoiceData, visit) => {
  let container = null;
  try {
    // Scroll to top to ensure clean capture coordinates
    window.scrollTo(0, 0);

    container = document.createElement("div");
    container.innerHTML = getProfessionalBillHTML(invoiceData, visit);

    // High-precision width for A4 (Approx 1024px is standard for 210mm at 96dpi * scale)
    const captureWidth = 1024;
    container.style.width = `${captureWidth}px`;
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.zIndex = "-9999";
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: captureWidth,
      windowWidth: captureWidth,
      onclone: (clonedDoc) => {
        // CRITICAL: html2canvas collapses on modern color functions like oklch()
        // We must strip these from the cloned document entirely.
        const allElements = clonedDoc.getElementsByTagName("*");
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          // Re-force static colors for the capture to bypass oklch parsing
          if (el.classList.contains("invoice-root")) {
            el.style.backgroundColor = "#ffffff";
            el.style.color = "#000000";
          }
        }

        // Remove all external stylesheets from the clone that might contain oklch
        // Our specific invoice styles are inline in the HTML template anyway.
        const styleSheets = clonedDoc.querySelectorAll(
          'style, link[rel="stylesheet"]',
        );
        styleSheets.forEach((sheet) => {
          if (
            !sheet.innerHTML.includes("Invoice Specific Styles") &&
            !sheet.innerHTML.includes("Inter")
          ) {
            sheet.remove();
          }
        });
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    // Calculate dynamic PDF height based on canvas height
    // Canvas width is 2048px (2x scale), so canvas height needs to be converted back
    const originalWidth = 1024; // Original container width
    const originalHeight = canvas.height / 2; // Convert back from 2x scale

    // Convert pixels to mm (assuming 96 DPI)
    const mmPerPixel = 210 / originalWidth; // A4 width is 210mm
    const dynamicHeightMm = originalHeight * mmPerPixel;

    // Create custom page size that matches content height
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: [210, Math.max(297, dynamicHeightMm)], // Use at least A4 height, but allow taller
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = dynamicHeightMm;

    // Full-width image without clipping or scaling down
    pdf.addImage(
      imgData,
      "JPEG",
      0, // Starting at left edge
      0, // Starting at top edge
      pdfWidth,
      pdfHeight,
      null,
      "FAST",
    );

    return pdf;
  } catch (error) {
    console.error("Ultra-Premium PDF Generation Failed:", error);
    throw error;
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Helper to prepare standard invoice data from a visit object.
 * Centralizes the construction of the data object used by the PDF generator.
 */
export const prepareInvoiceDataFromVisit = (visit, overrides = {}) => {
  // Calculate actual discounted total
  const itemsSubtotal = (visit.items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );
  const subtotal = visit.subtotal || overrides.subtotal || itemsSubtotal || 0;
  const discountAmount = visit.discountAmount || overrides.discountAmount || 0;
  const afterDiscountTotal = subtotal - discountAmount;

  return {
    invoiceId: visit.invoiceId || overrides.invoiceId || "",
    visitId: visit.id,
    customerId: visit.customerId,
    customerName: visit.customer?.name || visit.customerName || "Guest",
    customerPhone:
      visit.customer?.phone ||
      visit.customer?.contactNo ||
      visit.customerPhone ||
      "",
    customerEmail: visit.customer?.email || visit.customerEmail || "",
    items: visit.items || [],
    subtotal: subtotal,
    // CRITICAL: totalAmount should be after discount, not subtotal
    totalAmount:
      visit.totalAmount || overrides.totalAmount || afterDiscountTotal || 0,
    discountAmount: discountAmount,
    discountType: visit.discountType || overrides.discountType || "none",
    // paidAmount should not use totalAmount as fallback (could be subtotal)
    paidAmount: visit.paidAmount || overrides.paidAmount || 0,
    paymentMode: visit.paymentMode || overrides.paymentMode || "cash",
    status:
      visit.status === "COMPLETED" ? "paid" : overrides.status || "unpaid",
    couponCode: visit.couponCode || overrides.couponCode || null,
    couponIsCapped: visit.couponIsCapped || overrides.couponIsCapped || false,
    couponOriginalDiscount:
      visit.couponOriginalDiscount || overrides.couponOriginalDiscount || 0,
    pointsUsed: visit.pointsUsed || overrides.pointsUsed || 0,
    ...overrides,
  };
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const getProfessionalBillHTML = (invoiceData, visit) => {
  const itemsHTML = (visit.items || [])
    .map(
      (item, index) => `
      <tr class="item-row">
        <td class="cell sn">${(index + 1).toString().padStart(2, "0")}</td>
        <td class="cell description">
          <div class="item-name">${item.name}</div>
          <div class="item-type">${item.type || "Service"}</div>
        </td>
        <td class="cell qty">${item.quantity}</td>
        <td class="cell price">${formatCurrency(item.price)}</td>
        <td class="cell total">${formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
      </tr>
    `,
    )
    .join("");

  const calculatedSubtotal = (visit.items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );
  const subtotal = invoiceData.subtotal || calculatedSubtotal;
  const discount = invoiceData.discountAmount || 0;

  // CRITICAL: Calculate the actual total after discount
  const actualTotal = subtotal - discount;
  // Use provided totalAmount only if it's valid (not 0 and equals calculated discounted total or is clearly different)
  // Otherwise calculate from subtotal - discount
  const total =
    invoiceData.totalAmount && invoiceData.totalAmount > 0
      ? invoiceData.totalAmount
      : actualTotal;

  const paid = invoiceData.paidAmount || 0;

  // Balance due ONLY if paid amount is less than the actual discounted total
  // Never show balance due for discounted amounts
  const isPartialPayment = paid < total;
  const balance = isPartialPayment ? Math.max(0, total - paid) : 0;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        /* Invoice Specific Styles */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .invoice-root {
          width: 1024px;
          min-height: 1448px; /* A4 height at 1024px width */
          background: #ffffff;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #0c0c0c;
          padding: 60px 80px; /* Optimized: less top/bottom padding */
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* Gold Luxury Gradient Bar */
        .top-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 12px;
          background: linear-gradient(90deg, #1a1a1a 0%, #b8860b 50%, #1a1a1a 100%);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .brand-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .logo-box img {
          max-height: 50px;
          width: auto;
          margin-bottom: 10px;
        }

        .salon-name {
          font-size: 32px;
          font-weight: 900;
          letter-spacing: -1px;
          text-transform: uppercase;
          margin: 0;
        }

        .salon-tag {
          font-size: 15px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 5px;
          color: #b8860b;
        }

        .receipt-section {
          text-align: right;
        }

        .receipt-title {
          font-size: 64px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #1a1a1a;
          text-transform: uppercase;
          line-height: 1;
          margin-bottom: 15px;
        }

        .meta-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-id {
          font-size: 16px;
          font-weight: 800;
          color: #000;
        }

        .meta-date {
          font-size: 13px;
          color: #777;
          font-weight: 500;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          padding: 25px;
          background: #fcfcfc;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
        }

        .info-col h3 {
          font-size: 14px;
          font-weight: 900;
          color: #b8860b;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 10px;
        }

        .info-content {
          font-size: 15px;
          line-height: 1.5;
        }

        .info-content strong {
          font-size: 18px;
          font-weight: 800;
          display: block;
          margin-bottom: 4px;
          color: #000;
        }

        .status-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 50px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          white-space: nowrap;
          ${
            paid >= total
              ? "background: #000; color: #fff;"
              : "background: #b8860b; color: #fff;"
          }
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          font-size: 14px;
        }

        .items-table th {
          text-align: left;
          padding: 12px 0;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #333;
          border-bottom: 2px solid #000;
        }

        .cell {
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 15px;
        }

        .sn { width: 60px; font-size: 14px; color: #aaa; }
        .description { }
        .item-name { font-size: 15px; font-weight: 800; color: #000; margin-bottom: 4px; }
        .item-type { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #b8860b; }
        .qty { width: 80px; text-align: center; font-weight: 700; }
        .price { width: 150px; text-align: right; font-weight: 500; }
        .total { width: 150px; text-align: right; font-weight: 900; font-size: 18px; }

        .summary-box {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 25px;
        }

        .signature-block {
          flex: 0 0 auto;
          padding: 12px 14px;
          background: #ffffff;
          border: 1px solid #333;
          border-radius: 2px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 200px;
        }

        .signature-checkmark {
          font-size: 40px;
          color: #10b981;
          margin-bottom: 6px;
          line-height: 1;
          order: -1;
        }

        .signature-details {
          font-size: 11px;
          color: #333;
          line-height: 1.35;
          margin-bottom: 6px;
        }

        .signature-details strong {
          font-weight: 700;
          display: block;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .signature-date {
          font-size: 9px;
          color: #666;
          margin-bottom: 0;
          font-weight: 600;
          line-height: 1.3;
        }

        .summary-card {
          width: 340px;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #000;
          border-radius: 4px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          font-size: 15px;
          color: #444;
          font-weight: 500;
        }

        .summary-row.discount { color: #b8860b; font-weight: 700; }

        .summary-row.final {
          padding-top: 20px;
          margin-top: 12px;
          border-top: 2px solid #000;
          color: #000;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .summary-row.balance {
          color: #dc3545;
          font-weight: 800;
          padding-top: 15px;
          margin-top: 10px;
          border-top: 1px dashed #ddd;
        }

        .membership-banner {
          margin-bottom: 20px;
          padding: 25px;
          background: #000;
          color: #fff;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .banner-text h4 {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .banner-text p {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
        }

        .banner-link {
          text-align: right;
        }

        .banner-url {
          font-size: 20px;
          font-weight: 900;
          color: #b8860b;
        }

        .banner-info {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(255,255,255,0.5);
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-top: 15px;
          border-top: 1px solid #f0f0f0;
          margin-top: auto;
        }

        .salon-info {
          font-size: 15px;
          color: #888;
          line-height: 2;
        }

        .thanks-section {
          text-align: right;
        }

        .thanks-msg {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 4px;
        }

        .legal-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: #b8860b;
        }



        /* Subtle Watermark Overlay */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          font-weight: 900;
          color: #fbfbfb;
          z-index: -1;
          pointer-events: none;
          text-transform: uppercase;
          letter-spacing: 20px;
        }


      </style>
    </head>
    <body>
      <div class="invoice-root">
        <div class="top-gradient"></div>
        <div class="watermark">VELVET</div>

        <div class="header">
          <div class="brand-section">
            <div class="logo-box">
              <img src="/velvet_logo.png" alt="Velvet Premium Unisex Salon" onerror="this.style.visibility='hidden'">
            </div>
             <span class="salon-tag">Premium Unisex Salon</span>
           
              </div>
          <div class="receipt-section">
            <div class="receipt-title">Receipt</div>
            <div class="meta-group">
              <span class="meta-id">${invoiceData.invoiceId || "#" + String(new Date().getTime()).slice(-8)}</span>
              <span class="meta-date">${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-col">
            <h3>Your Details</h3>
            <div class="info-content">
              <strong>${visit.customer?.name || visit.customerName || "Valued Customer"}</strong>
              ${visit.customer?.phone || visit.customerPhone || "Contact on file"}<br>
              ${visit.customer?.email || "email on file"}<br>
              ${(() => {
                const membershipType =
                  visit.customer?.membershipType || "regular";
                if (membershipType === "elite") {
                  return '<span style="font-weight: 700; color: #fb923c; margin-top: 8px; display: block;">👑 ELITE MEMBER</span>';
                } else if (membershipType === "membership") {
                  return '<span style="font-weight: 700; color: #8b5cf6; margin-top: 8px; display: block;">⭐ PREMIUM MEMBER</span>';
                }
                return "";
              })()}
            </div>
          </div>
          <div class="info-col">
            <h3>Payment Information</h3>
            <div class="info-content">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span>Payment: <strong>${(() => {
                  const paymentMap = {
                    cash: "Cash",
                    card: "Card",
                    upi: "UPI",
                    wallet: "Wallet",
                    unknown: "Cash",
                  };
                  const mode = (
                    invoiceData.paymentMode ||
                    invoiceData.paymentMethod ||
                    "cash"
                  ).toLowerCase();
                  return paymentMap[mode] || "Cash";
                })()}</strong></span>
                ${paid >= total ? '<span class="status-pill">Paid</span>' : ""}
              </div>
              ${invoiceData.discountType === "membership" && visit.customer?.membershipType && visit.customer?.membershipType !== "regular" ? '<span style="color: #fb923c; font-weight: 700;">✓ Member Discount</span>' : ""}
              ${invoiceData.couponCode ? '<br><span style="color: #10b981; font-weight: 700;">🎟️ Coupon: ' + invoiceData.couponCode + " Applied</span>" : ""}
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Service or Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary-box">
          <!-- Digital Signature Block -->
          <div class="signature-block">
            <div class="signature-checkmark">✓</div>
            <div class="signature-details">
              <strong>Digitally Signed by</strong>
              Velvet Luxury Salon & Spa
            </div>
            <div class="signature-date">
              Date: ${new Date().toLocaleDateString("en-IN")}<br>
              Time: ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            ${
              discount > 0
                ? `
            <div class="summary-row discount">
              <span>${
                invoiceData.couponCode
                  ? "Coupon Code: " + invoiceData.couponCode
                  : invoiceData.discountType === "membership"
                    ? "Member Discount"
                    : "Discount"
              }</span>
              <span>-${formatCurrency(discount)}</span>
            </div>
            ${
              invoiceData.couponIsCapped &&
              invoiceData.couponOriginalDiscount > 0
                ? `<div style="font-size: 12px; color: #b8860b; font-weight: 600; padding: 8px 0; text-align: right;">
                    💡 Max discount limit applied
                  </div>`
                : ""
            }
            `
                : ""
            }
            <div class="summary-row">
              <span>Amount Paid</span>
              <span>${formatCurrency(paid)}</span>
            </div>
            <div class="summary-row final">
              <span>Total Bill</span>
              <span>${formatCurrency(total)}</span>
            </div>
            ${
              balance > 0
                ? `
            <div class="summary-row balance">
              <span>Balance Due</span>
              <span>${formatCurrency(balance)}</span>
            </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="footer-pinned" style="margin-top: auto; padding-top: 40px;">
          <div class="membership-banner">
            <div class="banner-text">
              <h4>Experience Premium Care</h4>
              <p>Elevate your lifestyle. Book appointments and explore<br>exclusive services through our digital salon.</p>
            </div>
            <div class="banner-link">
              <div class="banner-url">velvetluxurysalon.in</div>
              <div class="banner-info">Official Digital Portal</div>
            </div>
          </div>

          <div class="footer">
            <div class="salon-info">
              Opposite ICICI Bank, Bharathi Nagar<br>
              Bhavani, Erode, Tamil Nadu 638301<br>
              Phone: +91 96677 22611
            </div>
            <div class="thanks-section">
              <div class="thanks-msg">Thank You</div>
              <div class="legal-tag">Velvet Premium Unisex Salon</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const downloadPDF = (pdf, fileName) => {
  pdf.save(fileName);
};
