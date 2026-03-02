/**
 * Email Service - Handles sending checkout emails to admin and customer
 * Works with both local development (vercel dev) and Vercel serverless backend
 */

// For Vercel: API endpoint is automatically at /api/send-checkout-email
// For local: Must run "vercel dev" to emulate serverless functions locally
const getEmailEndpoint = () => {
  // If running on Vercel (production), use the API route
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api/send-checkout-email`;
  }
  
  // For local development with vercel dev
  // The endpoint is the same - vercel dev will handle routing to /api
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // Try to use the API route directly (works with vercel dev)
    return '/api/send-checkout-email';
  }
  
  return '/api/send-checkout-email';
};

export const sendCheckoutEmail = async (checkoutData) => {
  try {
    console.log('📧 [Frontend] Starting checkout email send...');
    
    // Validate required fields - only customer name needed
    if (!checkoutData.customerName) {
      throw new Error('Customer name is required');
    }

    const endpoint = getEmailEndpoint();
    console.log('📬 [Frontend] Email endpoint:', endpoint);
    console.log('👤 [Frontend] Customer:', checkoutData.customerName);
    console.log('💰 [Frontend] Amount:', checkoutData.totalAmount);

    console.log('🚀 [Frontend] Sending checkout data to API...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: checkoutData.customerName || 'Guest',
        customerEmail: checkoutData.customerEmail,
        customerPhone: checkoutData.customerPhone || '',
        items: checkoutData.items || [],
        subtotal: checkoutData.subtotal || 0,
        tax: checkoutData.tax || 0,
        discount: checkoutData.discount || 0,
        totalAmount: checkoutData.totalAmount || 0,
        paidAmount: checkoutData.paidAmount || 0,
        paymentMethod: checkoutData.paymentMethod || 'Cash',
        checkoutDate: checkoutData.checkoutDate || new Date().toLocaleDateString(),
        notes: checkoutData.notes || ''
      })
    });
    console.log('📬 [Frontend] API Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [Frontend] API Error:', errorData);
      throw new Error(errorData.error || 'Failed to send email');
    }

    const data = await response.json();
    console.log('✅ [Frontend] Email sent successfully:', data.message);
    return {
      success: true,
      message: data.message || 'Email sent successfully'
    };
  } catch (error) {
    console.error('❌ [Frontend] Email service error:', error);
    console.error('❌ [Frontend] Error details:', {
      message: error.message,
      type: error.constructor.name
    });
    
    // Check if it's a connection error
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
      console.warn('⚠️  [Frontend] Email server not responding.');
      console.warn('📝 [Frontend] For LOCAL TESTING: Run "vercel dev" instead of "npm run dev"');
      console.warn('📝 [Frontend] This will emulate the Vercel serverless environment');
    }
    
    // Return error but don't prevent checkout - emails are supplementary
    return {
      success: false,
      message: error.message || 'Failed to send confirmation email',
      error: error
    };
  }
};

/**
 * Format checkout data for email
 * Transforms visit/invoice data into email-friendly format
 * Note: Sends to salon owner only, not to customer email
 */
export const formatCheckoutDataForEmail = (invoiceData, visitData = null) => {
  console.log('🔄 [EmailService] Formatting checkout data for email...');
  console.log('🔄 [EmailService] Input invoiceData:', {
    customerName: invoiceData.customerName,
    totalAmount: invoiceData.totalAmount
  });
  
  const formattedData = {
    customerName: invoiceData.customerName || 'Guest',
    customerEmail: invoiceData.customerEmail || '', // Not used for sending, only for reference
    customerPhone: invoiceData.customerPhone || '',
    items: invoiceData.items || [],
    subtotal: invoiceData.subtotal || 0,
    tax: invoiceData.tax || 0,
    discount: invoiceData.discount || 0,
    totalAmount: invoiceData.totalAmount || 0,
    paidAmount: parseFloat(invoiceData.paidAmount) || 0,
    paymentMethod: invoiceData.paymentMethod || invoiceData.paymentMode || 'Cash',
    checkoutDate: new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    notes: invoiceData.notes || visitData?.notes || ''
  };
  
  console.log('✅ [EmailService] Formatted data ready:', {
    customerName: formattedData.customerName,
    totalAmount: formattedData.totalAmount
  });
  
  return formattedData;
};

/**
 * Check if email server is running (local development only)
 */
export const checkEmailServerHealth = async () => {
  try {
    // Skip health check on production (Vercel)
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      return true; // Assume Vercel serverless is healthy
    }

    const endpoint = import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:5000';
    const response = await fetch(`${endpoint}/api/health`);
    return response.ok;
  } catch (error) {
    console.warn('Email server health check failed:', error.message);
    return false;
  }
};
