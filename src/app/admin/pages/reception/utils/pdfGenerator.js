import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a world-class premium PDF bill for Velvet Luxury Salon.
 * Optimized for full A4 page width without clipping or blank margins.
 */
export const generateProfessionalBillPDF = async (invoiceData, visit) => {
  try {
    // Scroll to top to ensure clean capture coordinates
    window.scrollTo(0, 0);

    const container = document.createElement('div');
    container.innerHTML = getProfessionalBillHTML(invoiceData, visit);
    
    // High-precision width for A4 (Approx 1024px is standard for 210mm at 96dpi * scale)
    const captureWidth = 1024;
    container.style.width = `${captureWidth}px`;
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.zIndex = '-9999';
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: captureWidth,
      windowWidth: captureWidth,
      onclone: (clonedDoc) => {
        // CRITICAL: html2canvas collapses on modern color functions like oklch()
        // We must strip these from the cloned document entirely.
        const allElements = clonedDoc.getElementsByTagName('*');
        for (let i = 0; i < allElements.length; i++) {
          const el = allElements[i];
          const styles = window.getComputedStyle(el);
          
          // Re-force static colors for the capture to bypass oklch parsing
          if (el.classList.contains('invoice-root')) {
            el.style.backgroundColor = '#ffffff';
            el.style.color = '#000000';
          }
        }

        // Remove all external stylesheets from the clone that might contain oklch
        // Our specific invoice styles are inline in the HTML template anyway.
        const styleSheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
        styleSheets.forEach(sheet => {
          if (!sheet.innerHTML.includes('Invoice Specific Styles') && !sheet.innerHTML.includes('Inter')) {
            sheet.remove();
          }
        });
      }
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Exact mapping to fill the page width
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First Page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, null, 'FAST');
    heightLeft -= pdfHeight;

    // Secondary Pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, null, 'FAST');
      heightLeft -= pdfHeight;
    }

    return pdf;
  } catch (error) {
    console.error('Ultra-Premium PDF Generation Failed:', error);
    throw error;
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const getProfessionalBillHTML = (invoiceData, visit) => {
  const itemsHTML = (visit.items || [])
    .map((item, index) => `
      <tr class="item-row">
        <td class="cell sn">${(index + 1).toString().padStart(2, '0')}</td>
        <td class="cell description">
          <div class="item-name">${item.name}</div>
          <div class="item-type">${item.type || 'Service'}</div>
        </td>
        <td class="cell qty">${item.quantity}</td>
        <td class="cell price">${formatCurrency(item.price)}</td>
        <td class="cell total">${formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
      </tr>
    `).join('');

  const discount = invoiceData.discountAmount || 0;
  const subtotal = invoiceData.subtotal || (invoiceData.totalAmount || 0);
  const total = invoiceData.totalAmount || (subtotal - discount);
  const paid = invoiceData.paidAmount || 0;
  const balance = Math.max(0, total - paid);

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
          min-height: 1448px; /* A4 aspect ratio at 1024px width */
          background: #ffffff;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #0c0c0c;
          padding: 80px;
          position: relative;
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
          margin-bottom: 80px;
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
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 5px;
          color: #b8860b;
        }

        .receipt-section {
          text-align: right;
        }

        .receipt-title {
          font-size: 56px;
          font-weight: 200;
          letter-spacing: 12px;
          color: #f2f2f2;
          text-transform: uppercase;
          line-height: 1;
          margin-bottom: 20px;
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
          gap: 40px;
          margin-bottom: 70px;
          padding: 45px;
          background: #fcfcfc;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
        }

        .info-col h3 {
          font-size: 10px;
          font-weight: 900;
          color: #b8860b;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 20px;
        }

        .info-content {
          font-size: 15px;
          line-height: 1.6;
        }

        .info-content strong {
          font-size: 20px;
          font-weight: 800;
          display: block;
          margin-bottom: 5px;
          color: #000;
        }

        .status-pill {
          display: inline-block;
          padding: 6px 15px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 15px;
          ${paid >= total 
            ? 'background: #000; color: #fff;' 
            : 'background: #b8860b; color: #fff;'}
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 60px;
        }

        .items-table th {
          text-align: left;
          padding: 20px 0;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 4px;
          color: #888;
          border-bottom: 2px solid #000;
        }

        .cell {
          padding: 28px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .sn { width: 60px; font-size: 13px; color: #aaa; }
        .description { }
        .item-name { font-size: 16px; font-weight: 800; color: #000; margin-bottom: 5px; }
        .item-type { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #b8860b; }
        .qty { width: 80px; text-align: center; font-weight: 700; }
        .price { width: 150px; text-align: right; font-weight: 500; }
        .total { width: 150px; text-align: right; font-weight: 900; font-size: 17px; }

        .summary-box {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 80px;
        }

        .summary-card {
          width: 380px;
          padding: 40px;
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
          padding-top: 25px;
          margin-top: 15px;
          border-top: 2px solid #000;
          color: #000;
          font-size: 28px;
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
          margin-bottom: 60px;
          padding: 40px;
          background: #000;
          color: #fff;
          border-radius: 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .banner-text h4 {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .banner-text p {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
        }

        .banner-link {
          text-align: right;
        }

        .banner-url {
          font-size: 24px;
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
          padding-top: 40px;
          border-top: 1px solid #f0f0f0;
        }

        .salon-info {
          font-size: 12px;
          color: #888;
          line-height: 2;
        }

        .thanks-section {
          text-align: right;
        }

        .thanks-msg {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -1px;
          margin-bottom: 5px;
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
              <img src="/velvet_logo.png" alt="Velvet Luxury Salon" onerror="this.style.visibility='hidden'">
            </div>
             <span class="salon-tag">Luxury Salon & Spa</span>
           
              </div>
          <div class="receipt-section">
            <div class="receipt-title">Receipt</div>
            <div class="meta-group">
              <span class="meta-id">#${String(new Date().getTime()).slice(-8)}</span>
              <span class="meta-date">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-col">
            <h3>Guest Information</h3>
            <div class="info-content">
              <strong>${visit.customer?.name || visit.customerName || 'Private Client'}</strong>
              ${visit.customer?.phone || visit.customerPhone || 'Verified Member'}<br>
              ${visit.customer?.email || 'membership@velvet.in'}<br>
              ${(() => {
                const membershipType = visit.customer?.membershipType || 'regular';
                if (membershipType === 'elite') {
                  return '<span style="font-weight: 700; color: #fb923c; margin-top: 8px; display: block;">👑 ELITE MEMBER</span>';
                } else if (membershipType === 'membership') {
                  return '<span style="font-weight: 700; color: #8b5cf6; margin-top: 8px; display: block;">⭐ PREMIUM MEMBER</span>';
                }
                return '';
              })()}
            </div>
          </div>
          <div class="info-col">
            <h3>Payment Protocol</h3>
            <div class="info-content">
              Transaction ID: <strong>${visit.id?.slice(-8).toUpperCase()}</strong>
              Channel: ${invoiceData.paymentMode?.toUpperCase() || 'SECURE DIGITAL'}<br>
              Status: <span class="status-pill">${paid >= total ? 'Settled' : 'Partial'}</span>
              ${invoiceData.discountType === 'membership' && visit.customer?.membershipType && visit.customer?.membershipType !== 'regular' ? '<br><span style="color: #fb923c; font-weight: 700;">✓ Member Discount Applied</span>' : ''}
            </div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description of Excellence</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-card">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            ${discount > 0 ? `
            <div class="summary-row discount">
              <span>${invoiceData.discountType === 'membership' ? 'Member Privilege Discount' : 'Privilege Discount'}</span>
              <span>-${formatCurrency(discount)}</span>
            </div>
            ` : ''}
            <div class="summary-row">
              <span>Amount Remitted</span>
              <span>${formatCurrency(paid)}</span>
            </div>
            <div class="summary-row final">
              <span>TOTAL DUE</span>
              <span>${formatCurrency(total)}</span>
            </div>
            ${balance > 0 ? `
            <div class="summary-row balance">
              <span>Outstanding</span>
              <span>${formatCurrency(balance)}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="membership-banner">
          <div class="banner-text">
            <h4>Experience the Velvet Touch</h4>
            <p>Elevate your lifestyle. Book appointments and explore<br>exclusive services through our digital boutique.</p>
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
            Direct: +91 93456 78646
          </div>
          <div class="thanks-section">
            <div class="thanks-msg">Thank You</div>
            <div class="legal-tag">Velvet Luxury Salon</div>
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