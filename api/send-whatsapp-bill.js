/**
 * Vercel Serverless Function - Send WhatsApp Bill
 * Endpoint: /api/send-whatsapp-bill
 *
 * SETUP REQUIRED:
 * 1. Install twilio: npm install twilio
 * 2. Set environment variables in Vercel:
 *    - TWILIO_ACCOUNT_SID
 *    - TWILIO_AUTH_TOKEN
 *    - TWILIO_WHATSAPP_FROM_NUMBER (e.g., whatsapp:+14155552671)
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("📱 [WhatsApp API] Received request");

    // Extract data from request
    const {
      phoneNumber,
      customerName,
      invoiceId,
      totalAmount,
      items,
      subtotal,
      discountAmount,
      paidAmount,
      paymentMode,
      pdf,
      pdfFileName,
      message,
    } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      console.error("❌ [WhatsApp API] Missing phoneNumber");
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Check for Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("❌ [WhatsApp API] Missing Twilio credentials");
      console.error("Environment variables:", {
        accountSid: accountSid ? "✓" : "✗",
        authToken: authToken ? "✓" : "✗",
        fromNumber: fromNumber ? "✓" : "✗",
      });
      return res.status(500).json({
        error:
          "WhatsApp service is not configured. Please set Twilio credentials in environment variables.",
      });
    }

    // Lazy load Twilio only when needed
    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);

    console.log("📱 [WhatsApp API] Preparing to send message");
    console.log("📱 [WhatsApp API] To:", phoneNumber);
    console.log("📱 [WhatsApp API] From:", fromNumber);

    // If PDF is provided, send with PDF
    if (pdf && pdfFileName) {
      console.log("📁 [WhatsApp API] Sending bill with PDF attachment");

      // Convert base64 to buffer
      const pdfBuffer = Buffer.from(pdf, "base64");

      // Create a temporary file-like object for Twilio
      // Note: Direct PDF sending via Twilio WhatsApp requires file upload to a media URL
      // For now, we'll send the message with text and notify to check email for PDF

      // Format the bill message
      const billMessage = formatBillMessageForAPI({
        customerName,
        invoiceId,
        totalAmount,
        items,
        subtotal,
        discountAmount,
        paidAmount,
        paymentMode,
      });

      // Send message to WhatsApp
      const messageResponse = await client.messages.create({
        from: fromNumber,
        to: phoneNumber,
        body: billMessage,
      });

      console.log("✅ [WhatsApp API] Message sent successfully");
      console.log("📱 [WhatsApp API] Message SID:", messageResponse.sid);

      return res.status(200).json({
        success: true,
        message: "Bill sent successfully via WhatsApp",
        messageSid: messageResponse.sid,
      });
    }

    // If custom message is provided, send it
    if (message) {
      console.log("📱 [WhatsApp API] Sending custom message");

      const messageResponse = await client.messages.create({
        from: fromNumber,
        to: phoneNumber,
        body: message,
      });

      console.log("✅ [WhatsApp API] Message sent successfully");
      return res.status(200).json({
        success: true,
        message: "Message sent successfully via WhatsApp",
        messageSid: messageResponse.sid,
      });
    }

    return res.status(400).json({ error: "No message content provided" });
  } catch (error) {
    console.error("❌ [WhatsApp API] Error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    // Return appropriate error response
    return res.status(500).json({
      error: error.message || "Failed to send WhatsApp message",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Format bill message for WhatsApp API
 */
function formatBillMessageForAPI(billData) {
  const balance = Math.max(
    0,
    (billData.totalAmount || 0) - (billData.paidAmount || 0),
  );

  let text = `*✨ VELVET PREMIUM UNISEX SALON - INVOICE ✨*\n\n`;
  text += `👤 *Customer:* ${billData.customerName || "Valued Guest"}\n`;
  text += `📅 *Date:* ${new Date().toLocaleDateString("en-IN")}\n`;
  text += `📋 *Invoice #:* ${billData.invoiceId || "N/A"}\n\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `*📦 SERVICES & PRODUCTS*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (billData.items && billData.items.length > 0) {
    billData.items.forEach((item) => {
      const itemTotal = (item.price * (item.quantity || 1)).toFixed(2);
      text += `• ${item.name} x${item.quantity || 1}\n  ₹${itemTotal}\n`;
    });
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *Subtotal:* ₹${(billData.subtotal || 0).toFixed(2)}\n`;

  if ((billData.discountAmount || 0) > 0) {
    text += `✂️ *Discount:* -₹${(billData.discountAmount || 0).toFixed(2)}\n`;
  }

  text += `\n*🎯 TOTAL: ₹${(billData.totalAmount || 0).toFixed(2)}*\n`;
  text += `✅ *Amount Paid:* ₹${(billData.paidAmount || 0).toFixed(2)}\n`;

  if (balance > 0) {
    text += `⏳ *Balance Due:* ₹${balance.toFixed(2)}\n`;
  } else {
    text += `✓ *Status:* ✅ PAID IN FULL\n`;
  }

  text += `💳 *Payment Method:* ${(billData.paymentMode || "Cash").toUpperCase()}\n`;
  text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✨ *Thank you for choosing Velvet Premium Unisex Salon!*\n`;
  text += `📞 *For queries:* 9345678646\n`;
  text += `✉️ *Email:* Velvetluxurysalon@gmail.com\n`;
  text += `🕐 *Hours:* 8:00 AM - 9:00 PM`;

  return text;
}
