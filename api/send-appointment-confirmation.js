/**
 * Vercel Serverless Function - Send Appointment Confirmation Email
 * Endpoint: /api/send-appointment-confirmation
 *
 * SETUP REQUIRED:
 * 1. Install nodemailer: npm install nodemailer (already installed)
 * 2. Set environment variables in Vercel:
 *    - OWNER_EMAIL (e.g., Velvetluxurysalon@gmail.com)
 *    - EMAIL_USER (Gmail account for sending)
 *    - EMAIL_PASSWORD (Gmail App Password - NOT regular password)
 */

import nodemailer from "nodemailer";

const OWNER_EMAIL =
  process.env.OWNER_EMAIL ||
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
    secure: SMTP_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
}

/**
 * Generate beautiful HTML email template for appointment confirmation
 */
function generateConfirmationEmailHTML(appointmentData) {
  const appointmentDate = new Date(appointmentData.appointmentDate);
  const formattedDate = appointmentDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = appointmentDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

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
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white; 
      padding: 40px 20px; 
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 300;
      letter-spacing: 2px;
    }
    .header .accent {
      color: #c9a227;
      font-style: italic;
    }
    .content { 
      padding: 40px; 
    }
    .confirmation-box {
      background: linear-gradient(135deg, #c9a227 0%, #d4b343 100%);
      color: white;
      padding: 20px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 30px;
    }
    .confirmation-box .status {
      font-size: 18px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .appointment-details {
      background: #f9f9f9;
      border-left: 4px solid #c9a227;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #333;
    }
    .detail-value {
      color: #666;
      text-align: right;
    }
    .info-section {
      margin: 20px 0;
    }
    .info-section h3 {
      color: #1a1a2e;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .info-section p {
      margin: 5px 0;
      color: #555;
      line-height: 1.6;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #c9a227 0%, #d4b343 100%);
      color: white;
      padding: 12px 30px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #b8921d 0%, #c3a238 100%);
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      margin: 5px 0;
      font-size: 12px;
      color: #999;
    }
    .contact-info {
      padding: 15px;
      background: #fff9f0;
      border-radius: 4px;
      margin: 15px 0;
    }
    .contact-info a {
      color: #c9a227;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Velvet <span class="accent">Luxury</span> Salon</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Appointment Confirmation</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p style="color: #333; font-size: 16px;">Dear ${appointmentData.customerName || "Valued Guest"},</p>
      
      <p style="color: #666; line-height: 1.6;">
        Thank you for booking an appointment with us! We're thrilled to welcome you to Velvet Luxury Salon. Your appointment has been <strong>confirmed</strong> and is ready for your visit.
      </p>

      <!-- Confirmation Status -->
      <div class="confirmation-box">
        <div class="status">✓ Appointment Confirmed</div>
      </div>

      <!-- Appointment Details -->
      <div class="appointment-details">
        <div class="detail-row">
          <span class="detail-label">📅 Date</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Time</span>
          <span class="detail-value">${formattedTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">💇 Service</span>
          <span class="detail-value">${appointmentData.serviceName || "Service"}</span>
        </div>
        ${
          appointmentData.stylistName
            ? `
        <div class="detail-row">
          <span class="detail-label">👤 Stylist</span>
          <span class="detail-value">${appointmentData.stylistName}</span>
        </div>
        `
            : ""
        }
        ${
          appointmentData.duration
            ? `
        <div class="detail-row">
          <span class="detail-label">⏱️ Duration</span>
          <span class="detail-value">${appointmentData.duration} minutes</span>
        </div>
        `
            : ""
        }
      </div>

      <!-- Important Information -->
      <div class="info-section">
        <h3>Important Information</h3>
        <p>
          ✓ Please arrive 5-10 minutes before your appointment time<br>
          ✓ If you need to reschedule, please contact us at least 24 hours in advance<br>
          ✓ Visit our salon with a relaxed mind and enjoy your pampering experience
        </p>
      </div>

      <!-- Contact Information -->
      <div class="contact-info">
        <strong style="color: #1a1a2e;">Need to reschedule or have questions?</strong><br>
        📧 Email: <a href="mailto:Velvetluxurysalon@gmail.com">Velvetluxurysalon@gmail.com</a><br>
        💬 WhatsApp: <a href="https://wa.me/919345678646">+91 93456 78646</a>
      </div>

      <p style="color: #666; line-height: 1.6; margin-top: 30px;">
        We look forward to providing you with an exceptional salon experience. Our team is dedicated to making you feel refreshed, rejuvenated, and absolutely beautiful.
      </p>

      <p style="color: #999; font-size: 14px; margin-top: 20px;">
        With gratitude,<br>
        <strong>Velvet Luxury Salon Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Velvet Luxury Salon</strong></p>
      <p>📧 Velvetluxurysalon@gmail.com | 💬 +91 93456 78646</p>
      <p style="margin-top: 15px; font-size: 11px; color: #bbb;">
        This is an automated confirmation email. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Main handler function
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed. Use POST request." });
  }

  console.log("\n========================================");
  console.log("📧 [APPOINTMENT CONFIRMATION EMAIL]");
  console.log("========================================\n");

  try {
    const appointmentData = req.body;

    // Validate required fields
    if (!appointmentData.customerEmail) {
      console.error("❌ Missing customer email");
      return res
        .status(400)
        .json({ error: "Customer email is required for confirmation" });
    }

    if (!appointmentData.customerName) {
      console.error("❌ Missing customer name");
      return res
        .status(400)
        .json({ error: "Customer name is required for confirmation" });
    }

    if (!appointmentData.appointmentDate) {
      console.error("❌ Missing appointment date");
      return res
        .status(400)
        .json({ error: "Appointment date is required for confirmation" });
    }

    if (!appointmentData.serviceName) {
      console.error("❌ Missing service name");
      return res
        .status(400)
        .json({ error: "Service name is required for confirmation" });
    }

    // Check email configuration
    if (!EMAIL_PASSWORD) {
      console.error(
        "❌ [EMAIL CONFIG] Missing EMAIL_PASSWORD environment variable",
      );
      return res.status(500).json({
        error:
          "Email service is not configured. Please check server configuration.",
        details:
          process.env.NODE_ENV === "development"
            ? "Missing EMAIL_PASSWORD environment variable"
            : undefined,
      });
    }

    console.log("📝 Creating email transporter...");
    const transporter = createTransporter();

    console.log("🔍 Verifying email configuration...");
    console.log(`   SMTP Host: ${SMTP_HOST}`);
    console.log(`   SMTP Port: ${SMTP_PORT}`);
    console.log(`   Sender: ${EMAIL_USER}`);

    // Generate confirmation email HTML
    const confirmationHTML = generateConfirmationEmailHTML(appointmentData);

    // Prepare customer email
    const customerEmailOptions = {
      from: `"Velvet Luxury Salon" <${EMAIL_USER}>`,
      to: appointmentData.customerEmail,
      subject: "✨ Appointment Confirmed - Velvet Luxury Salon",
      html: confirmationHTML,
    };

    console.log("\n📨 Sending confirmation email to customer...");
    console.log(`   To: ${appointmentData.customerEmail}`);
    console.log(`   Customer: ${appointmentData.customerName}`);

    const customerResponse = await transporter.sendMail(customerEmailOptions);
    console.log(
      "✅ [Customer] Confirmation email sent successfully!",
      customerResponse.messageId,
    );

    // Prepare admin notification email
    const adminEmailOptions = {
      from: `"Velvet Luxury Salon" <${EMAIL_USER}>`,
      to: OWNER_EMAIL,
      subject: `📅 New Appointment Confirmed - ${appointmentData.customerName}`,
      html: `
        <h2>Appointment Confirmed</h2>
        <p><strong>Customer:</strong> ${appointmentData.customerName}</p>
        <p><strong>Email:</strong> ${appointmentData.customerEmail}</p>
        <p><strong>Phone:</strong> ${appointmentData.customerPhone || "N/A"}</p>
        <p><strong>Service:</strong> ${appointmentData.serviceName}</p>
        <p><strong>Date:</strong> ${new Date(appointmentData.appointmentDate).toLocaleDateString("en-IN")}</p>
        <p><strong>Time:</strong> ${appointmentData.appointmentTime || "N/A"}</p>
        ${appointmentData.stylistName ? `<p><strong>Stylist:</strong> ${appointmentData.stylistName}</p>` : ""}
        ${appointmentData.notes ? `<p><strong>Customer Notes:</strong> ${appointmentData.notes}</p>` : ""}
      `,
    };

    console.log("\n📨 Sending admin notification...");
    console.log(`   To: ${OWNER_EMAIL}`);

    const adminResponse = await transporter.sendMail(adminEmailOptions);
    console.log(
      "✅ [Admin] Notification sent successfully!",
      adminResponse.messageId,
    );

    console.log("\n========================================");
    console.log("✅ [CONFIRMATION COMPLETE] Emails sent successfully!");
    console.log("========================================\n");

    return res.status(200).json({
      success: true,
      message: "Appointment confirmation email sent successfully",
      customerEmail: appointmentData.customerEmail,
      customerName: appointmentData.customerName,
      adminNotified: true,
    });
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ [APPOINTMENT CONFIRMATION FAILED]");
    console.error("========================================");
    console.error("Error Type:", error.name);
    console.error("Error Message:", error.message);
    console.error("Full Error:", error);
    console.error("==========================================\n");

    let errorMessage = error.message || "Failed to send confirmation email";

    if (error.message.includes("Invalid login")) {
      errorMessage =
        "Email authentication failed. Check EMAIL_USER and EMAIL_PASSWORD.";
    } else if (error.message.includes("ECONNREFUSED")) {
      errorMessage =
        "Cannot connect to SMTP server. Check SMTP_HOST and SMTP_PORT.";
    }

    return res.status(500).json({
      error: errorMessage,
      appointmentConfirmed: true,
      emailSendStatus: "FAILED",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
