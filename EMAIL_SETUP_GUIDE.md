# Email Bill Forwarding Setup Guide

## Problem Solved ✅

The email bill forwarding that was set up has now been fixed. The API endpoint `/api/send-checkout-email` was **missing** - it has now been created.

## How It Works

When a customer checks out:

1. **Frontend** calls the email service with checkout data
2. **API Endpoint** (`/api/send-checkout-email`) processes the request
3. **Email sent to owner** at `Velvetluxurysalon@gmail.com` with complete bill details
4. **Optional**: Copy sent to customer if their email is available

## Environment Variables Required

To enable email forwarding, set these variables in Vercel:

```
OWNER_EMAIL=Velvetluxurysalon@gmail.com
EMAIL_USER=Velvetluxurysalon@gmail.com
EMAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## Step-by-Step Setup

### 1. Verify Owner Email

The owner email is currently set to: `Velvetluxurysalon@gmail.com`

If you want to change it, update the `OWNER_EMAIL` environment variable.

### 2. Create Gmail App Password (IMPORTANT!)

**⚠️ DO NOT use your regular Gmail password!**

Instead, create an **App Password**:

1. Go to Google Account: https://myaccount.google.com/
2. Click "Security" in the left menu
3. Enable "2-Step Verification" if not already enabled
4. Scroll down and find "App passwords"
5. Select "Mail" and "Windows Computer"
6. Google will generate a 16-character password like: `xxxx xxxx xxxx xxxx`
7. Copy this password and remove spaces: `xxxxxxxxxxxxxxxx`

### 3. Add to Vercel

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

| Variable         | Value                                |
| ---------------- | ------------------------------------ |
| `OWNER_EMAIL`    | `Velvetluxurysalon@gmail.com`        |
| `EMAIL_USER`     | `Velvetluxurysalon@gmail.com`        |
| `EMAIL_PASSWORD` | `(16-char App Password from step 2)` |
| `SMTP_HOST`      | `smtp.gmail.com`                     |
| `SMTP_PORT`      | `587`                                |

5. Click "Save" and redeploy your application

### 4. Test the Setup

After deployment, perform a test checkout:

1. Go to Reception → Complete a test bill
2. Click "Complete Checkout"
3. Check the owner email inbox for the bill notification
4. If received, the setup is working! ✅

## What Gets Sent

The email includes:

✅ Customer name and phone  
✅ Checkout date and time  
✅ All items/services with prices  
✅ Subtotal, discount, tax breakdown  
✅ Payment method  
✅ Total amount and amount paid  
✅ Outstanding balance (if any)  
✅ Formatted HTML with salon branding

## Troubleshooting

### Email Not Received

**Check 1: Email credentials**

- Verify `EMAIL_PASSWORD` is the 16-character **App Password**, not your Gmail password
- Verify `EMAIL_USER` matches a real Gmail account

**Check 2: SMTP Settings**

- Ensure `SMTP_HOST=smtp.gmail.com`
- Ensure `SMTP_PORT=587`

**Check 3: Browser Console**
Check the browser console for error messages:

1. Open Receipt/Appointment page
2. Perform a checkout
3. Check Console (F12) for `[Frontend] Email service error` messages

**Check 4: Server Logs**
In Vercel:

1. Go to your project's Functions tab
2. View logs for `send-checkout-email` function
3. Look for error messages

### 500 Error on Checkout

If you get "Email service not configured" error:

- The `EMAIL_PASSWORD` environment variable is missing or empty
- Add it to Vercel as described in Step 3

### "Invalid Login" Error

- The email credentials are incorrect
- Regenerate the App Password from Google Account
- Make sure you're using the App Password, NOT your Gmail password

## Local Development

For local testing with `vercel dev`:

1. Create a local `.env.local` file in your project root:

```
OWNER_EMAIL=Velvetluxurysalon@gmail.com
EMAIL_USER=Velvetluxurysalon@gmail.com
EMAIL_PASSWORD=xxxxxxxxxxxxxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

2. Run `vercel dev` instead of `npm run dev`
3. Test checkout - you should see emails in the owner inbox

## Security Notes

🔒 **App Password** is safer than your actual Gmail password

- Store it securely (Vercel environment variables)
- Never commit it to Git
- Never share it

## Files Modified

- ✅ Created: `api/send-checkout-email.js` - The missing API endpoint
- ✅ Existing: `src/app/admin/services/emailService.js` - Frontend caller (no changes needed)
- ✅ Existing: `src/app/admin/pages/reception/handlers.js` - Triggers email (no changes needed)

## Support

If emails still aren't working after following this guide:

1. Check the Vercel function logs
2. Verify all environment variables are set
3. Try regenerating the Gmail App Password
4. Ensure 2-Step Verification is enabled on your Google Account

---

**Last Updated:** 2026-02-26  
**Status:** ✅ Email forwarding is now fully implemented
