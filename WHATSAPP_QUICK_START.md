# ✨ WhatsApp Bill Sharing - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Twilio Package

```bash
npm install twilio
```

### Step 2: Get Twilio Credentials (2 minutes)

1. Go to https://www.twilio.com/try-twilio
2. Sign up for free trial (no credit card required initially)
3. Accept account setup
4. Open Twilio Console: https://www.twilio.com/console
5. Copy your **Account SID** and **Auth Token**
6. Go to WhatsApp Sandbox: https://www.twilio.com/console/sms/whatsapp/sandbox
7. Copy your **WhatsApp From Number** (e.g., `whatsapp:+14155552671`)

### Step 3: Create `.env.local` File

In your project root (`admin/` folder), create `.env.local`:

```env
TWILIO_ACCOUNT_SID=paste_your_sid_here
TWILIO_AUTH_TOKEN=paste_your_token_here
TWILIO_WHATSAPP_FROM_NUMBER=whatsapp:+14155552671
```

### Step 4: Test Locally

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Run with serverless functions emulation
vercel dev

# Then open http://localhost:3000 in your browser
```

### Step 5: Join WhatsApp Sandbox

1. Open your WhatsApp app
2. Send a message to the sandbox number: `join [two-word code]`
   - The code is shown on https://www.twilio.com/console/sms/whatsapp/sandbox
   - Example: `join lucky-lion`
3. You'll get confirmation that you're authorized

### Step 6: Test the Feature

1. Go to Reception → Checkout
2. Create a bill and complete payment with your phone number
3. Check your WhatsApp - you should receive the bill!

---

## 🌐 Deploy to Vercel (Production)

### Step 1: Push to Git

```bash
git add .
git commit -m "Add WhatsApp bill sharing feature"
git push
```

### Step 2: Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Open your project
3. Settings → Environment Variables
4. Add these 3 variables:
   - `TWILIO_ACCOUNT_SID` = your Account SID
   - `TWILIO_AUTH_TOKEN` = your Auth Token
   - `TWILIO_WHATSAPP_FROM_NUMBER` = your WhatsApp number
5. Save and redeploy

### Step 3: Test in Production

Once deployed, complete a payment and check the customer's WhatsApp!

---

## 📋 What Customers Will Receive

When a payment is confirmed, the customer gets a WhatsApp message like:

```
✨ VELVET PREMIUM UNISEX SALON - INVOICE ✨

👤 Customer: Sarah
📅 Date: 2/20/2026
📋 Invoice #: INV-001

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 SERVICES & PRODUCTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Hair Cut x1
  ₹500.00
• Color Treatment x1
  ₹1500.00

💰 Subtotal: ₹2000.00

🎯 TOTAL: ₹1800.00
✅ Amount Paid: ₹1800.00
✓ Status: ✅ PAID IN FULL
💳 Payment Method: CASH

✨ Thank you for choosing Velvet Premium Unisex Salon!
📞 For queries: 9345678646
✉️ Email: Velvetluxurysalon@gmail.com
🕐 Hours: 8:00 AM - 9:00 PM
```

---

## 🎛️ Features You Can Control

### Auto-Send Toggle

When bill is confirmed, you'll see a checkbox to enable/disable automatic WhatsApp send for that transaction.

### Retry Button

If WhatsApp sending fails, there's a retry button without having to redo the payment.

### Manual Sharing

Even with auto-send, customers can still manually share bill via:

- Print
- Download PDF
- Email
- WhatsApp (Web Share API)

---

## ⚠️ Common Issues & Fixes

### Issue: "error: TWILIO_ACCOUNT_SID not found"

**Fix:**

- Make sure `.env.local` file exists in the admin folder
- Restart `vercel dev` after creating `.env.local`

### Issue: WhatsApp message not received

**Fix:**

- Make sure you've logged into Twilio Sandbox with `join` command
- Check your phone number is correct
- Wait a minute and try again

### Issue: "Method not allowed" error

**Fix:**

- Make sure you're using `vercel dev` not `npm run dev`
- The API endpoint needs serverless function emulation

### Issue: "Invalid phone number format"

**Fix:**

- Customer phone should be Indian format (10 digits or +91...)
- The system auto-converts: `9876543210` → `+919876543210`

---

## 📚 Learn More

For detailed information, see:

- **Setup Guide:** `WHATSAPP_SETUP_GUIDE.md`
- **Implementation Details:** `WHATSAPP_IMPLEMENTATION.md`
- **Code Comments:** Check inline comments in service files

---

## 💰 Costs

### Free Tier (Development)

- Twilio Sandbox: **Completely FREE** for testing
- Includes: Unlimited test messages
- Perfect for: Development and testing

### Production

- WhatsApp Messages: ~₹0.60-1.00 per message (varies)
- You pay only for messages actually sent
- Typical salon: 50-100 messages/month = ₹30-100/month

---

## 🔒 Security Checklist

✅ Never commit `.env.local` to Git (already in `.gitignore`)  
✅ Keep Twilio credentials private  
✅ Use HTTPS only (Vercel handles this)  
✅ Validate phone numbers (system does this automatically)  
✅ Only send to customers with valid phone numbers

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the logs:**

   ```bash
   # Local: Look at vercel dev output
   # Production: Vercel Dashboard → Deployments → Logs
   ```

2. **Read the full setup guide:** `WHATSAPP_SETUP_GUIDE.md`

3. **Verify credentials:**
   - Account SID starts with "AC"
   - Auth Token is 32 characters
   - WhatsApp From Number starts with "whatsapp:+"

4. **Twilio Support:** https://www.twilio.com/help/contact

---

## 🎉 You're All Set!

Your salon can now:
✅ Automatically send bills via WhatsApp  
✅ First contact with customer after purchase  
✅ Professional invoice format  
✅ Non-intrusive (doesn't affect checkout process)  
✅ Works on both mobile and desktop

Enjoy! 🚀
