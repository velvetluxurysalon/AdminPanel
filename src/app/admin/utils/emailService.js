// Email service for sending invoices and receipts
// Note: For production, use Firebase Cloud Functions with Nodemailer
// This is a client-side implementation that shows the email content

export const generateInvoiceHTML = (invoice) => {
  const itemsHTML = invoice.items
    .map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .invoice-container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 15px; }
        .header h1 { color: #007bff; margin: 0; }
        .salon-info { font-size: 12px; color: #666; margin-top: 5px; }
        .invoice-details { margin: 20px 0; font-size: 14px; }
        .invoice-details p { margin: 5px 0; }
        .table-header { background-color: #f8f9fa; font-weight: bold; }
        .total-row { background-color: #f8f9fa; font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px; }
        .status-paid { color: green; font-weight: bold; }
        .status-pending { color: red; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <h1>Velvet Luxury Salon</h1>
          <p class="salon-info">Kalingarayanpalayam, Bhavani<br>Erode District, Tamil Nadu - 638301<br>Contact: 9667722611</p>
        </div>

        <div class="invoice-details">
          <p><strong>Invoice #:</strong> ${invoice.id}</p>
          <p><strong>Date:</strong> ${new Date(invoice.invoiceDate?.toDate?.() || invoice.invoiceDate).toLocaleDateString()}</p>
          <p><strong>Customer Name:</strong> ${invoice.customerName}</p>
          <p><strong>Customer Email:</strong> ${invoice.customerEmail}</p>
          <p><strong>Customer Phone:</strong> ${invoice.customerPhone}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr class="table-header">
              <th style="padding: 10px; text-align: left;">Service/Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr class="total-row">
              <td colspan="3" style="padding: 15px; text-align: right;">Subtotal:</td>
              <td style="padding: 15px; text-align: right;">₹${invoice.totalAmount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="padding: 15px; text-align: right;">Paid:</td>
              <td style="padding: 15px; text-align: right;">₹${invoice.paidAmount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="padding: 15px; text-align: right;">Outstanding:</td>
              <td style="padding: 15px; text-align: right;">₹${(invoice.totalAmount - invoice.paidAmount).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: right; margin: 20px 0;">
          <p><strong>Status:</strong> 
            <span class="${invoice.status === 'paid' ? 'status-paid' : 'status-pending'}">
              ${invoice.status.toUpperCase()}
            </span>
          </p>
        </div>

        <div class="footer">
          <p>Thank you for your business! For any queries, please contact us.</p>
          <p>This is an automatically generated invoice. Please keep it safe for your records.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const downloadInvoicePDF = (invoice) => {
  // This would require a PDF library like jsPDF
  console.log('PDF download functionality requires jsPDF library');
  console.log('Invoice:', invoice);
};

export const printInvoice = (invoice) => {
  const html = generateInvoiceHTML(invoice);
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};

export const copyInvoiceToClipboard = async (invoice) => {
  const html = generateInvoiceHTML(invoice);
  try {
    await navigator.clipboard.writeText(html);
    return { success: true, message: 'Invoice copied to clipboard' };
  } catch (error) {
    return { success: false, error: 'Failed to copy invoice' };
  }
};

// For production: Use Firebase Cloud Functions
// This would be a Firebase Cloud Function that sends emails
export const sendInvoiceEmail = async (invoice) => {
  // In production, this would call a Firebase Cloud Function
  // that uses Nodemailer to send the actual email
  
  const emailContent = {
    to: invoice.customerEmail,
    subject: `Invoice #${invoice.id} - Velvet Luxury Salon`,
    html: generateInvoiceHTML(invoice),
    customerName: invoice.customerName,
    invoiceId: invoice.id
  };

  // Log for debugging
  console.log('Email to be sent:', emailContent);
  
  // For now, return success (in production, call cloud function)
  return { 
    success: true, 
    message: 'Invoice email prepared (Cloud Function needed for actual delivery)',
    email: emailContent 
  };
};

export const sendReceiptEmail = async (invoice, paymentDetails) => {
  const receiptContent = {
    to: invoice.customerEmail,
    subject: `Receipt #${invoice.id} - Velvet Luxury Salon`,
    html: generateInvoiceHTML(invoice),
    paymentMethod: paymentDetails.paymentMethod,
    paymentDate: paymentDetails.paymentDate
  };

  console.log('Receipt to be sent:', receiptContent);
  
  return { 
    success: true, 
    message: 'Receipt email prepared (Cloud Function needed for actual delivery)',
    email: receiptContent 
  };
};
