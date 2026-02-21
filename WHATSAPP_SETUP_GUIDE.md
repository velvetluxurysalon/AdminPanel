# WhatsApp Bill Sharing Integration Setup Guide

## Overview

This guide walks you through setting up automatic WhatsApp bill sharing for the Velvet Premium Unisex Salon admin panel. Customers will automatically receive their bill PDFs via WhatsApp immediately after payment confirmation.

## Prerequisites

- Twilio Account (Free trial available at https://www.twilio.com/try-twilio)
- Twilio WhatsApp Sandbox (for testing) or WhatsApp Business Account
- Node.js and npm installed

## Installation Steps

### 1. Install Dependencies

```bash
npm install twilio
```

The Twilio package has already been added to `package.json`. Run the above command to install it.

### 2. Get Twilio Credentials

#### Option A: Using Twilio Sandbox (Free, for Testing)

1. Go to https://www.twilio.com/console/sms/whatsapp/sandbox
2. You'll see a sandbox number like `whatsapp:+14155552671`
3. Note your:
   - **Account SID** (from https://www.twilio.com/console)
   - **Auth Token** (from https://www.twilio.com/console)
   - **Sandbox From Number** (e.g., `whatsapp:+14155552671`)

#### Option B: Using WhatsApp Business Account (Production)

1. Contact Twilio sales for WhatsApp Business Account integration
2. Request a WhatsApp Phone Number
3. Get your Account SID and Auth Token from Twilio Console

### 3. Configure Environment Variables

#### Local Development (.env.local)

Create a `.env.local` file in the root of the admin project:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM_NUMBER=whatsapp:+14155552671

# Example with actual values (replace with your credentials)
# TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID_HERE
# TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN_HERE
# TWILIO_WHATSAPP_FROM_NUMBER=whatsapp:+14155552671
```

#### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `TWILIO_ACCOUNT_SID` = Your Account SID
   - `TWILIO_AUTH_TOKEN` = Your Auth Token
   - `TWILIO_WHATSAPP_FROM_NUMBER` = Your WhatsApp number (e.g., whatsapp:+14155552671)
4. Deploy your project for changes to take effect

### 4. Test Your Setup

#### For Local Development

```bash
# Run with Vercel dev to emulate serverless functions
vercel dev

# This will start both your frontend (Vite) and backend (Vercel Functions)
```

#### For Vercel Production

1. Ensure all environment variables are set in Vercel
2. Deploy your changes:
   ```bash
   git push
   ```

## How It Works

### Flow Diagram

```
1. Customer completes bill payment
   ↓
2. Invoice created in Firebase
   ↓
3. CheckoutModal generates PDF from invoice data
   ↓
4. WhatsApp service calls /api/send-whatsapp-bill endpoint
   ↓
5. Vercel function connects to Twilio API
   ↓
6. Bill sent to customer's WhatsApp with formatted invoice text
   ↓
7. Success/error status displayed to user
```

### Component Details

#### `src/app/admin/services/whatsappService.js`

- **sendBillViaWhatsApp()** - Sends bill PDF as WhatsApp message
- **sendWhatsAppMessage()** - Sends plain text message
- **formatBillMessage()** - Creates formatted invoice text

#### `api/send-whatsapp-bill.js`

- Vercel serverless function
- Validates phone numbers
- Connects to Twilio API
- Handles PDF conversion

#### CheckoutModal Updates

- Auto-sends WhatsApp after payment if enabled
- Shows sending, success, and error states
- Option to toggle auto-send and retry manually

## Features

### ✅ Automatic Bill Sending

- Bills send automatically after payment confirmation
- Can be toggled on/off per transaction
- Non-blocking - errors won't prevent checkout completion

### 📱 Phone Number Handling

- Automatically normalizes various phone formats:
  - `9876543210` → `+919876543210`
  - `09876543210` → `+919876543210`
  - `+919876543210` → `+919876543210`
  - `919876543210` → `+919876543210`

### 📋 Professional Invoice Format

Includes:

- Customer name and date
- Service/product details with quantities
- Subtotal, discounts, and final total
- Amount paid and balance due (if any)
- Payment method
- Salon contact information

### 🔄 Error Handling

- Validates phone numbers before sending
- Shows user-friendly error messages
- Provides retry button if sending fails
- Graceful fallback if Twilio is unavailable

### 🎨 Status Indicators

- Loading spinner while sending
- Success message with checkmark
- Error messages with retry option

## Setup Checklist

- [ ] Install Twilio package (`npm install twilio`)
- [ ] Create Twilio account at https://www.twilio.com/console
- [ ] Get Account SID and Auth Token
- [ ] Verify WhatsApp number (sandbox or production)
- [ ] Create `.env.local` with Twilio credentials
- [ ] Test with `vercel dev`
- [ ] Configure environment variables in Vercel
- [ ] Deploy to production

## Testing WhatsApp Sandbox

### Get Sandbox Access

1. Visit https://www.twilio.com/console/sms/whatsapp/sandbox
2. You'll see: "To get started, send a WhatsApp message..."
3. Send `join [two-word code]` to the sandbox number
4. You're now authorized to receive messages in sandbox

### Testing the Integration

1. Run `vercel dev`
2. Create a test bill with your phone number
3. Complete payment
4. Check your WhatsApp for the bill message

## Troubleshooting

### "WhatsApp service is not configured"

**Solution:** Ensure all three environment variables are set:

```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM_NUMBER=whatsapp:+1234567890
```

### "Invalid phone number format"

**Solution:** Ensure the customer has a valid Indian phone number (starts with digits 0-9 or country code 91/+91)

### "Failed to send WhatsApp message"

**Possible causes:**

- Phone number not registered on sandbox
- Twilio account doesn't have WhatsApp enabled
- Sandbox credentials are wrong
- Rate limiting (too many messages too fast)

**Solutions:**

1. Verify phone with sandbox (see "Testing WhatsApp Sandbox")
2. Check credentials in .env.local or Vercel
3. Wait a minute before retrying
4. Check Twilio Console for error logs

### Local testing shows "WhatsApp server not responding"

**Solution:** Use `vercel dev` instead of `npm run dev` to properly emulate serverless functions:

```bash
npm install -g vercel  # Install Vercel CLI if needed
vercel dev
```

### Production not sending WhatsApp

**Solution:**

1. Verify environment variables are set in Vercel dashboard
2. Check Vercel logs for errors:
   - Go to project → Deployments → Recent deployment → Logs
3. Look for `/api/send-whatsapp-bill` errors
4. Verify Twilio credentials are correctly set

## Costs

### Twilio WhatsApp Pricing (as of 2026)

- **Sandbox:** Free (test only)
- **Production:** $0.0079 per message (varies by country)
- Monthly charges apply only when you send/receive messages

### Recommended for Testing

Use the Twilio Sandbox during development. It's free and fully functional for testing.

## Security Best Practices

1. **Never commit environment variables** to git
2. Use `.env.local` for local development only
3. Keep Twilio credentials private
4. Rotate tokens regularly in production
5. Monitor Twilio console for unauthorized access
6. Use HTTPS in production (Vercel handles this)

## File Structure

```
admin/
├── api/
│   └── send-whatsapp-bill.js          (Vercel serverless function)
├── src/
│   └── app/
│       └── admin/
│           ├── services/
│           │   └── whatsappService.js (Client-side WhatsApp service)
│           └── pages/
│               └── reception/
│                   └── modals/
│                       └── CheckoutModal.jsx (Updated to use WhatsApp)
├── .env.local                           (Local environment variables)
├── .env.example                         (Example configuration)
└── package.json                         (Includes twilio dependency)
```

## Next Steps

1. Follow the setup steps above
2. Test with the Twilio Sandbox
3. Monitor the Vercel logs for any issues
4. Once confirmed working, upgrade to production WhatsApp account
5. Update the `TWILIO_WHATSAPP_FROM_NUMBER` to your business number

## Support & Resources

- **Twilio Documentation:** https://www.twilio.com/docs/whatsapp/api
- **WhatsApp API Guide:** https://www.twilio.com/docs/whatsapp
- **Twilio Console:** https://www.twilio.com/console
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

## Version Info

- **WhatsApp Integration Version:** 1.0.0
- **Twilio API Version:** v1
- **Compatible with:** Velvet Luxury Salon Admin v1.0+

---

For questions or issues, refer to the troubleshooting section above or contact Twilio support at https://www.twilio.com/help/contact
