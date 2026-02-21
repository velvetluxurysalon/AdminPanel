/**
 * WhatsApp Service - Handles sending bills via WhatsApp using Twilio API
 * Supports sending PDF files and formatted messages to customers
 */

const getWhatsAppEndpoint = () => {
  // If running on Vercel (production), use the API route
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost"
  ) {
    return `${window.location.origin}/api/send-whatsapp-bill`;
  }

  // For local development with vercel dev
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "/api/send-whatsapp-bill";
  }

  return "/api/send-whatsapp-bill";
};

/**
 * Normalize phone number to E.164 format required by Twilio
 * Accepts: 9876543210, +919876543210, 919876543210
 * Returns: +919876543210
 */
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If it's empty after cleaning, return null
  if (!cleaned) return null;

  // Add country code if not present
  if (!cleaned.startsWith("91")) {
    cleaned = "91" + cleaned;
  }

  return "+" + cleaned;
};

/**
 * Send bill as PDF via WhatsApp using Twilio
 * @param {Object} billData - The bill/invoice data
 * @param {string} phoneNumber - Customer phone number
 * @param {Blob} pdfBlob - PDF file as blob
 * @returns {Promise<Object>} Response with status and message
 */
export const sendBillViaWhatsApp = async (billData, phoneNumber, pdfBlob) => {
  try {
    console.log("📱 [WhatsAppService] Starting WhatsApp bill send...");

    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    if (!pdfBlob) {
      throw new Error("PDF file is required");
    }

    // Validate phone number format
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      throw new Error("Invalid phone number format");
    }

    console.log("📱 [WhatsAppService] Normalized phone:", normalizedPhone);
    console.log("📱 [WhatsAppService] Customer:", billData.customerName);
    console.log("📱 [WhatsAppService] Amount:", billData.totalAmount);

    // Convert blob to base64
    const base64PDF = await blobToBase64(pdfBlob);

    const endpoint = getWhatsAppEndpoint();
    console.log("📬 [WhatsAppService] WhatsApp endpoint:", endpoint);

    const payload = {
      phoneNumber: normalizedPhone,
      customerName: billData.customerName || "Valued Customer",
      customerPhone: normalizedPhone,
      invoiceId: billData.invoiceId || "N/A",
      totalAmount: billData.totalAmount || 0,
      items: billData.items || [],
      subtotal: billData.subtotal || 0,
      discountAmount: billData.discountAmount || 0,
      paidAmount: billData.paidAmount || 0,
      paymentMode: billData.paymentMode || "Cash",
      pdf: base64PDF, // base64 encoded PDF
      pdfFileName: `Velvet_Invoice_${billData.invoiceId || "Bill"}.pdf`,
    };

    console.log("🚀 [WhatsAppService] Sending WhatsApp request...");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(
      "📬 [WhatsAppService] API Response status:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ [WhatsAppService] API Error:", errorData);
      throw new Error(errorData.error || "Failed to send WhatsApp message");
    }

    const data = await response.json();
    console.log(
      "✅ [WhatsAppService] WhatsApp message sent successfully:",
      data,
    );
    return {
      success: true,
      message: data.message || "Bill sent successfully via WhatsApp",
      messageSid: data.messageSid || null,
    };
  } catch (error) {
    console.error("❌ [WhatsAppService] Error:", error.message);
    console.error("❌ [WhatsAppService] Error details:", {
      message: error.message,
      type: error.constructor.name,
    });

    // Check if it's a connection error
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("ERR_CONNECTION_REFUSED")
    ) {
      console.warn("⚠️  [WhatsAppService] WhatsApp server not responding.");
      console.warn(
        '📝 [WhatsAppService] For LOCAL TESTING: Run "vercel dev" instead of "npm run dev"',
      );
      console.warn(
        "📝 [WhatsAppService] Ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in .env.local",
      );
    }

    return {
      success: false,
      message: error.message || "Failed to send bill via WhatsApp",
      error: error.message,
    };
  }
};

/**
 * Convert Blob to Base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} Base64 encoded string
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Return base64 string without the data:application/pdf;base64, prefix
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Send WhatsApp message with custom text (for alerts/notifications)
 * @param {string} phoneNumber - Customer phone number
 * @param {string} message - Message text
 * @returns {Promise<Object>} Response with status
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    if (!message) {
      throw new Error("Message is required");
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      throw new Error("Invalid phone number format");
    }

    const endpoint = getWhatsAppEndpoint();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: normalizedPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send message");
    }

    const data = await response.json();
    return {
      success: true,
      message: "Message sent successfully",
      messageSid: data.messageSid || null,
    };
  } catch (error) {
    console.error("❌ [WhatsAppService] Message send error:", error);
    return {
      success: false,
      message: error.message || "Failed to send message",
      error: error.message,
    };
  }
};

/**
 * Format a bill message for WhatsApp
 * @param {Object} billData - The bill data
 * @returns {string} Formatted WhatsApp message
 */
export const formatBillMessage = (billData) => {
  // Calculate subtotal from items if not provided or is 0
  let calculatedSubtotal = billData.subtotal || 0;
  if (calculatedSubtotal === 0 && billData.items && billData.items.length > 0) {
    calculatedSubtotal = billData.items.reduce((sum, item) => {
      return sum + item.price * (item.quantity || 1);
    }, 0);
  }

  // Use provided totalAmount or calculate from subtotal minus discount
  const discountAmount = billData.discountAmount || 0;
  const calculatedTotal =
    billData.totalAmount || Math.max(0, calculatedSubtotal - discountAmount);

  const balance = Math.max(0, calculatedTotal - (billData.paidAmount || 0));

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
  text += `💰 *Subtotal:* ₹${calculatedSubtotal.toFixed(2)}\n`;

  if (discountAmount > 0) {
    text += `✂️ *Discount:* -₹${discountAmount.toFixed(2)}\n`;
  }

  text += `\n*🎯 TOTAL: ₹${calculatedTotal.toFixed(2)}*\n`;
  text += `✅ *Amount Paid:* ₹${(billData.paidAmount || 0).toFixed(2)}\n`;

  if (balance > 0.01) {
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
};

/**
 * Direct WhatsApp Web link opener - Opens chat with formatted message
 * @param {string} phoneNumber - Customer phone number
 * @param {Object} billData - Bill data for formatted message
 */
export const openWhatsAppDirect = (phoneNumber, billData) => {
  try {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    // Normalize phone number to remove non-digits
    const cleanedPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanedPhone) {
      throw new Error("Invalid phone number");
    }

    // Add country code if not present (assuming India +91)
    const finalPhone = cleanedPhone.startsWith("91")
      ? cleanedPhone
      : "91" + cleanedPhone;

    // Format message
    const message = billData
      ? formatBillMessage(billData)
      : "Hello! I have your invoice ready.";

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp Web link directly
    const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`;

    console.log(
      "🟢 [WhatsAppService] Opening WhatsApp Web with link:",
      whatsappUrl.substring(0, 50) + "...",
    );

    // Open in new tab
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    return {
      success: true,
      message: "Opening WhatsApp Web...",
    };
  } catch (error) {
    console.error("❌ [WhatsAppService] Direct WhatsApp open error:", error);
    return {
      success: false,
      message: error.message,
      error: error.message,
    };
  }
};
