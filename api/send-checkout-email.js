/**
 * Vercel Serverless Function - Send Checkout Email
 * Endpoint: /api/send-checkout-email
 *
 * SETUP REQUIRED:
 * 1. Install nodemailer: npm install nodemailer (already installed)
 * 2. Set environment variables in Vercel:
 *    - OWNER_EMAIL (e.g., Velvetluxurysalon@gmail.com)
 *    - EMAIL_USER (Gmail account for sending)
 *    - EMAIL_PASSWORD (Gmail App Password - NOT regular password)
 *    - SMTP_HOST (e.g., smtp.gmail.com - optional, defaults to Gmail)
 *    - SMTP_PORT (e.g., 587 - optional, defaults to 587)
 */

import nodemailer from "nodemailer";

// Email configuration
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ||
  process.env.VITE_EMAIL_USER ||
  "velvetluxurysalon@gmail.com";
const EMAIL_USER =
  process.env.EMAIL_USER ||
  process.env.VITE_EMAIL_USER ||
  "velvetluxurysalon@gmail.com";
const EMAIL_PASSWORD =
  process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");

/**
 * Create email transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
}

/**
 * Generate beautiful HTML email template for checkout bill
 */
function generateCheckoutEmailHTML(checkoutData) {
  const itemsHTML = (checkoutData.items || [])
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; text-align: left;">${item.name || "Item"}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 12px; text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
      <td style="padding: 12px; text-align: right;">₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  const discountHTML = checkoutData.discount
    ? `
    <tr>
      <td colspan="3" style="padding: 8px; text-align: right; font-weight: 500;">Discount:</td>
      <td style="padding: 8px; text-align: right; color: #4caf50;">-₹${checkoutData.discount.toFixed(2)}</td>
    </tr>
  `
    : "";

  const taxHTML = checkoutData.tax
    ? `
    <tr>
      <td colspan="3" style="padding: 8px; text-align: right; font-weight: 500;">Tax (GST):</td>
      <td style="padding: 8px; text-align: right;">+₹${checkoutData.tax.toFixed(2)}</td>
    </tr>
  `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #f5f5f5 0%, #f9f9f9 100%);
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header { 
      background: linear-gradient(135deg, #2c3e50 0%, #3d5a6a 100%);
      color: white; 
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px;
      letter-spacing: 0.5px;
    }
    .header p { 
      margin: 5px 0 0 0; 
      font-size: 12px;
      opacity: 0.9;
    }
    .content { 
      padding: 30px 20px;
    }
    .greeting { 
      font-size: 16px; 
      margin-bottom: 20px;
      color: #333;
    }
    .section-title {
      font-weight: 600;
      color: #2c3e50;
      margin: 20px 0 10px 0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
      background: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
    }
    .detail-item label{
      display: block;
      font-size: 12px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 4px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .detail-item span{
      display: block;
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
      background: #fafafa;
    }
    .items-table th {
      background: #2c3e50;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .items-table td {
      padding: 12px;
    }
    .total-section {
      background: #f0f4f8;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .total-row.final {
      border-top: 2px solid #2c3e50;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #2c3e50;
    }
    .footer-note {
      background: #e8f5e9;
      border-left: 4px solid #4caf50;
      padding: 12px 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 13px;
      color: #2e7d32;
    }
    .contact-info {
      text-align: center;
      padding: 20px;
      border-top: 1px solid #e0e0e0;
      background: #f9f9f9;
      font-size: 12px;
      color: #666;
    }
    .contact-info a {
      color: #2c3e50;
      text-decoration: none;
    }
    .status-badge {
      display: inline-block;
      background: #4caf50;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Velvet Premium Unisex Salon</h1>
      <p>Checkout Confirmation & Bill</p>
    </div>

    <div class="content">
      <div class="greeting">
        <strong>Hi ${checkoutData.customerName || "Valued Customer"},</strong>
        <p>Thank you for your visit! Here's your checkout details.</p>
      </div>

      <div class="section-title">Customer Information</div>
      <div class="details-grid">
        <div class="detail-item">
          <label>Customer Name</label>
          <span>${checkoutData.customerName || "N/A"}</span>
        </div>
        <div class="detail-item">
          <label>Phone</label>
          <span>${checkoutData.customerPhone || "N/A"}</span>
        </div>
        <div class="detail-item">
          <label>Checkout Date</label>
          <span>${checkoutData.checkoutDate || new Date().toLocaleDateString("en-IN")}</span>
        </div>
        <div class="detail-item">
          <label>Payment Method</label>
          <span>${checkoutData.paymentMethod || "N/A"}</span>
        </div>
      </div>

      <div class="section-title">Services/Products</div>
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">No items</td></tr>'}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${(checkoutData.subtotal || 0).toFixed(2)}</span>
        </div>
        ${discountHTML}
        ${taxHTML}
        <div class="total-row final">
          <span>Total Amount:</span>
          <span>₹${(checkoutData.totalAmount || 0).toFixed(2)}</span>
        </div>
        <div class="total-row" style="margin-top: 8px;">
          <span>Amount Paid:</span>
          <span style="color: #4caf50; font-weight: 600;">₹${(checkoutData.paidAmount || 0).toFixed(2)}</span>
        </div>
        ${
          checkoutData.totalAmount > checkoutData.paidAmount
            ? `<div class="total-row" style="color: #f44336;">
                <span>Outstanding Balance:</span>
                <span>₹${(checkoutData.totalAmount - checkoutData.paidAmount).toFixed(2)}</span>
              </div>`
            : `<div class="total-row" style="color: #4caf50; margin-top: 10px;">
                <span style="font-size: 14px;">✓ Payment Complete</span>
              </div>`
        }
      </div>

      ${
        checkoutData.notes
          ? `<div class="footer-note">
        <strong>Notes:</strong> ${checkoutData.notes}
      </div>`
          : ""
      }

      <div class="footer-note">
        Thank you for choosing Velvet Premium Unisex Salon! We hope to see you again soon.
      </div>
    </div>

    <div class="contact-info">
      <p style="margin: 0 0 8px 0;">
        <strong>Velvet Premium Unisex Salon</strong><br>
        Kalingarayanpalayam, Bhavani<br>
        Erode District, Tamil Nadu - 638301
      </p>
      <p style="margin: 8px 0;">
        📞 <a href="tel:9667722611">9667722611</a> | 
        ✉️ <a href="mailto:Velvetluxurysalon@gmail.com">Velvetluxurysalon@gmail.com</a><br>
        🌐 <a href="https://velvetluxurysalon.in">velvetluxurysalon.in</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Send checkout email to owner
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("📧 [Email API] Received checkout email request");

    // Extract data from request
    const {
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      tax,
      discount,
      totalAmount,
      paidAmount,
      paymentMethod,
      checkoutDate,
      notes,
    } = req.body;

    // Validate required fields
    if (!customerName || !totalAmount) {
      console.error("❌ [Email API] Missing required fields");
      return res.status(400).json({
        error: "Customer name and total amount are required",
      });
    }

    // Check for email credentials
    if (!EMAIL_PASSWORD) {
      console.warn(
        "⚠️ [Email API] Missing EMAIL_PASSWORD - emails will not be sent",
      );
      console.warn(
        "Set EMAIL_PASSWORD environment variable for email functionality",
      );
      return res.status(500).json({
        error:
          "Email service is not configured. Please set EMAIL_PASSWORD in environment variables.",
        note: "This is OK for local testing but emails won't be sent.",
      });
    }

    console.log("📧 [Email API] Email credentials found");
    console.log("📧 [Email API] Sending to admin:", ADMIN_EMAIL);

    // Create transporter
    const transporter = createTransporter();

    // Prepare email content
    const htmlContent = generateCheckoutEmailHTML({
      customerName,
      customerPhone,
      items,
      subtotal: parseFloat(subtotal) || 0,
      tax: parseFloat(tax) || 0,
      discount: parseFloat(discount) || 0,
      totalAmount: parseFloat(totalAmount) || 0,
      paidAmount: parseFloat(paidAmount) || 0,
      paymentMethod,
      checkoutDate,
      notes,
    });

    // Email to admin
    const adminMailOptions = {
      from: EMAIL_USER,
      to: ADMIN_EMAIL,
      subject: `🧴 New Checkout - ${customerName} - ₹${parseFloat(totalAmount).toFixed(2)}`,
      html: htmlContent,
      text: `Checkout from ${customerName} for ₹${parseFloat(totalAmount).toFixed(2)}. Payment Method: ${paymentMethod || "N/A"}`,
    };

    // Send email to admin
    console.log("📬 [Email API] Sending email to admin...");
    const adminResponse = await transporter.sendMail(adminMailOptions);
    console.log("✅ [Email API] Email sent to admin:", adminResponse.messageId);

    // Optionally send to customer if email provided
    if (customerEmail) {
      try {
        console.log("📬 [Email API] Sending copy to customer:", customerEmail);
        const customerMailOptions = {
          from: EMAIL_USER,
          to: customerEmail,
          subject: `Your Velvet Premium Salon Receipt`,
          html: htmlContent,
          text: `Your checkout receipt for ₹${parseFloat(totalAmount).toFixed(2)}`,
        };

        const customerResponse =
          await transporter.sendMail(customerMailOptions);
        console.log(
          "✅ [Email API] Email sent to customer:",
          customerResponse.messageId,
        );
      } catch (customerError) {
        console.warn(
          "⚠️ [Email API] Failed to send to customer:",
          customerError.message,
        );
        // Don't fail the entire request if customer email fails
      }
    }

    return res.status(200).json({
      success: true,
      message: `Checkout confirmation email sent successfully to ${ADMIN_EMAIL}`,
      billAmount: parseFloat(totalAmount).toFixed(2),
      customerName: customerName,
    });
  } catch (error) {
    console.error("❌ [Email API] Error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
    });

    // Common Nodemailer errors
    let errorMessage = error.message || "Failed to send email";

    if (error.message.includes("Invalid login")) {
      errorMessage =
        "Email authentication failed. Check EMAIL_USER and EMAIL_PASSWORD.";
    } else if (error.message.includes("ECONNREFUSED")) {
      errorMessage =
        "Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT.";
    }

    return res.status(500).json({
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
