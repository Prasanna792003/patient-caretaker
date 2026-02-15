# EmailJS Setup Guide for Missed Medication Alerts

This guide explains how to set up EmailJS to send email alerts when patients miss their medications.

## Overview

EmailJS allows you to send emails directly from the browser without needing a backend server. The free tier includes **200 emails per month**.

## Setup Steps

### 1. Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### 2. Add an Email Service

1. In your EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended)
   - Outlook/Hotmail
   - Yahoo
   - Or any other provider
4. Connect your email account
5. **Copy the Service ID** (e.g., `service_abc123`)

### 3. Create an Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template:

**Subject:**
```
⚠️ Missed Medication Alert - {{medicine_name}}
```

**Body (HTML):**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #e74c3c;">⚠️ Missed Medication Alert</h2>
  
  <p>A patient has missed their scheduled medication:</p>
  
  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Medicine:</strong> {{medicine_name}}</p>
    <p><strong>Dosage:</strong> {{dosage}}</p>
    <p><strong>Scheduled Time:</strong> {{scheduled_time}}</p>
    <p><strong>Patient Email:</strong> {{patient_email}}</p>
  </div>
  
  <p><strong>Alert Generated:</strong> {{current_date}} at {{current_time}}</p>
  
  <p style="color: #666;">Please follow up with your patient to ensure they take their medication.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
  
  <p style="font-size: 12px; color: #999;">
    This is an automated message from Medicare App.
  </p>
</div>
```

4. Set **To Email** field to: `{{to_email}}`
5. **Save the template**
6. **Copy the Template ID** (e.g., `template_xyz789`)

### 4. Get Your Public Key

1. Go to **Account** > **General**
2. Find **Public Key** section
3. **Copy your Public Key**

### 5. Configure Your App

Create a `.env` file in your project root (copy from `.env.example`):

```env
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
```

### 6. Restart Your Development Server

```bash
npm run dev
```

## How It Works

1. When a caretaker opens their dashboard, the app checks all assigned patients' medications
2. For each medication that is:
   - Past its scheduled time
   - Not marked as taken
   - Not already alerted today
3. An email is sent to the caretaker with details about the missed medication
4. The `lastAlertSent` timestamp is updated to prevent duplicate alerts

## Template Variables

The following variables are available in your email template:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_email}}` | Caretaker's email | caretaker@example.com |
| `{{patient_email}}` | Patient's email | patient@example.com |
| `{{medicine_name}}` | Name of the medicine | Aspirin |
| `{{dosage}}` | Dosage information | 1 tablet |
| `{{scheduled_time}}` | Scheduled time | 08:00 |
| `{{current_date}}` | Current date | 1/15/2024 |
| `{{current_time}}` | Current time | 2:30:45 PM |

## Troubleshooting

### Emails not sending?

1. Check browser console for errors
2. Verify all three environment variables are set correctly
3. Make sure your EmailJS service is connected and active
4. Check your EmailJS dashboard for error logs

### Rate limiting?

The free tier has a 200 emails/month limit. If you exceed this:
- Upgrade to a paid plan, or
- The app will continue to show alerts in the dashboard (just won't send emails)

### Gmail "Less secure apps" warning?

If using Gmail, you may need to:
1. Enable 2-Factor Authentication on your Google account
2. Generate an "App Password" for EmailJS
3. Use the app password when connecting your email service

## Testing

To test the email functionality:

1. Create a patient account
2. Create a caretaker account and assign the patient
3. Add a medication with a time in the past (e.g., 09:00 if it's currently 10:00)
4. Log out and log back in as the caretaker
5. You should see the missed medication alert and receive an email
