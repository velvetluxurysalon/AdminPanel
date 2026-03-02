/**
 * Bill Service - Handles PDF generation, Firebase storage, and bill management
 */

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebaseConfig";
import {
  generateProfessionalBillPDF,
  prepareInvoiceDataFromVisit,
} from "../pages/reception/utils/pdfGenerator";

/**
 * Generate bill PDF, store in Firebase Storage, and return download URL
 * @param {Object} invoiceData - Invoice data with customer and payment details
 * @param {Object} visit - Visit object from Firestore
 * @returns {Promise<Object>} Returns { success: boolean, url: string, fileName: string, error?: string }
 */
export const generateAndStoreBillPDF = async (invoiceData, visit) => {
  try {
    if (!invoiceData || !invoiceData.invoiceId) {
      throw new Error("Invalid invoice data - missing invoiceId");
    }

    console.log("📄 [BillService] Starting PDF generation and storage...");

    // Generate PDF
    const pdfInvoiceData =
      invoiceData.items && invoiceData.items.length > 0
        ? invoiceData
        : prepareInvoiceDataFromVisit(visit, invoiceData);

    const pdf = await generateProfessionalBillPDF(pdfInvoiceData, visit);
    const pdfBlob = pdf.output("blob");

    // Create filename with invoice ID and timestamp
    const fileName = `bills/${invoiceData.invoiceId}_${new Date().getTime()}.pdf`;

    console.log("📤 [BillService] Uploading to Firebase Storage:", fileName);

    // Upload to Firebase Storage
    const fileRef = ref(storage, fileName);
    await uploadBytes(fileRef, pdfBlob);

    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);

    console.log("✅ [BillService] PDF stored successfully:", downloadURL);

    return {
      success: true,
      url: downloadURL,
      fileName: `Velvet_Invoice_${invoiceData.invoiceId}.pdf`,
      storageRef: fileName,
      error: null,
    };
  } catch (error) {
    console.error("❌ [BillService] Error generating/storing bill PDF:", error);
    return {
      success: false,
      url: null,
      fileName: null,
      storageRef: null,
      error: error.message || "Failed to generate and store bill PDF",
    };
  }
};

/**
 * Create a message with bill download link for WhatsApp sharing
 * @param {Object} billData - The bill/invoice data
 * @param {string} billDownloadUrl - Firebase Storage download URL for the PDF
 * @returns {string} Formatted WhatsApp message with bill link
 */
export const createWhatsAppBillMessage = (billData, billDownloadUrl) => {
  try {
    // Calculate totals with numeric conversion
    const subtotal = Number(billData.subtotal || 0);
    const discountAmount = Number(billData.discountAmount || 0);
    const totalAmount =
      Number(billData.totalAmount || 0) ||
      Math.max(0, subtotal - discountAmount);
    const paidAmount = Number(billData.paidAmount || 0) || totalAmount;
    const balance = Math.max(0, totalAmount - paidAmount);

    let message = `*VELVET PREMIUM UNISEX SALON - INVOICE*\n\n`;
    message += `*Customer:* ${billData.customerName || "Valued Guest"}\n`;
    message += `*Date:* ${new Date().toLocaleDateString("en-IN")}\n`;
    message += `*Invoice #:* ${billData.invoiceId || "N/A"}\n\n`;

    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*SERVICES & PRODUCTS*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (billData.items && billData.items.length > 0) {
      billData.items.forEach((item) => {
        const itemPrice = Number(item.price || 0);
        const itemQuantity = Number(item.quantity || 1);
        const itemTotal = (itemPrice * itemQuantity).toFixed(2);
        message += `• ${item.name} x${itemQuantity}\n  ₹${itemTotal}\n`;
      });
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `*Subtotal:* ₹${subtotal.toFixed(2)}\n`;

    if (discountAmount > 0) {
      const discountLabel =
        billData.discountType === "coupon"
          ? `Coupon (${billData.couponCode || "Applied"})`
          : billData.discountType === "percentage"
            ? "Percentage Discount"
            : billData.discountType === "membership"
              ? "Membership Discount"
              : billData.discountType === "coins"
                ? "Loyalty Points Discount"
                : "Discount";
      message += `*${discountLabel}:* -₹${discountAmount.toFixed(2)}\n`;
    }

    message += `\n*TOTAL: ₹${totalAmount.toFixed(2)}*\n`;
    message += `*Amount Paid:* ₹${paidAmount.toFixed(2)}\n`;

    if (balance > 0.01) {
      message += `*Balance Due:* ₹${balance.toFixed(2)}\n`;
    } else {
      message += `*Status:* PAID IN FULL\n`;
    }

    message += `*Payment Method:* ${(billData.paymentMode || "Cash").toUpperCase()}\n`;

    // Add bill download link
    message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (billDownloadUrl) {
      message += `*Download Bill:* ${billDownloadUrl}\n\n`;
    }
    message += `*Thank you for choosing Velvet Premium Unisex Salon!*\n`;
    message += `*Book Your Next Appointment:* https://velvetluxurysalon.in\n`;
    message += `*For queries:* 9345678646\n`;
    message += `*Email:* Velvetluxurysalon@gmail.com`;

    return message;
  } catch (error) {
    console.error("❌ [BillService] Error creating WhatsApp message:", error);
    return "Thank you for your purchase at Velvet Premium Unisex Salon!";
  }
};

/**
 * Retry PDF generation if it fails during payment completion
 * @param {Object} invoiceData - Invoice data
 * @param {Object} visit - Visit object
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @returns {Promise<Object>} Returns result object with success status and URL
 */
export const generateAndStoreBillPDFWithRetry = async (
  invoiceData,
  visit,
  maxRetries = 3,
) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📄 [BillService] PDF generation attempt ${attempt}/${maxRetries}...`,
      );
      const result = await generateAndStoreBillPDF(invoiceData, visit);

      if (result.success) {
        return result;
      }

      lastError = result.error;
      console.warn(`⚠️ [BillService] Attempt ${attempt} failed:`, lastError);

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)),
        );
      }
    } catch (error) {
      lastError = error.message;
      console.error(
        `❌ [BillService] Attempt ${attempt} error:`,
        error.message,
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)),
        );
      }
    }
  }

  return {
    success: false,
    url: null,
    fileName: null,
    storageRef: null,
    error: lastError || "Failed to generate and store bill PDF after retries",
  };
};
