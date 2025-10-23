# 🔍 Sentry Setup Guide

## ✅ Installation Complete!

I've installed and configured Sentry for your Next.js project. Now you need to get your credentials from Sentry.

---

## 📝 Next Steps:

### 1. Create Sentry Account & Project

1. Go to **https://sentry.io/signup/**
2. Sign up (free tier includes 5,000 errors/month)
3. Create a new project:
   - Choose **Next.js** as the platform
   - Name it: `aandrx-portfolio` (or whatever you prefer)

### 2. Get Your Sentry DSN

After creating the project, Sentry will show you a **DSN** that looks like:
```
https://abc123def456@o123456.ingest.sentry.io/123456
```

### 3. Add Environment Variables

Update your **`.env`** file (not `.env.example`):

```bash
# Add these at the bottom of your .env file
NEXT_PUBLIC_SENTRY_DSN="https://your-actual-dsn-here@o123456.ingest.sentry.io/123456"
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="aandrx-portfolio"
SENTRY_AUTH_TOKEN="your-auth-token"
```

**Where to find these:**
- **DSN:** Project Settings → Client Keys (DSN)
- **ORG Slug:** Settings → General Settings → Organization Slug
- **Project Slug:** Settings → Projects → Your Project Name
- **Auth Token:** Settings → Auth Tokens → Create New Token
  - Scopes needed: `project:read`, `project:releases`, `org:read`

### 4. Update next.config.js

Open `next.config.js` and replace:
```javascript
org: "your-org-slug",
project: "your-project-slug",
```

With your actual org and project slugs from Sentry.

### 5. Add to Vercel Environment Variables

In your Vercel dashboard:
1. Go to **Settings → Environment Variables**
2. Add these variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN
   SENTRY_ORG
   SENTRY_PROJECT
   SENTRY_AUTH_TOKEN
   ```
3. Set them for **Production**, **Preview**, and **Development**

---

## 🧪 Test Sentry

### Create a Test Error

Add this to any page temporarily:

```tsx
<button onClick={() => {
  throw new Error("Test Sentry error!");
}}>
  Trigger Test Error
</button>
```

Click it and check your Sentry dashboard - you should see the error!

---

## 📊 What Sentry Will Monitor:

### ✅ Automatically Tracked:
- **Frontend errors** - React component crashes, unhandled errors
- **API errors** - Failed API route requests
- **Performance** - Slow page loads, API response times
- **Session replays** - Watch user sessions when errors occur (privacy-safe)
- **Breadcrumbs** - User actions leading up to errors

### 🔔 Alerts:
- Email notifications for new errors
- Slack/Discord integration available
- Custom alert rules by severity

### 📈 Dashboards:
- Error frequency over time
- Most common errors
- Affected users
- Browser/OS breakdown
- Release tracking

---

## 🎯 Features Enabled:

1. **Error Tracking** - All JS errors captured
2. **Performance Monitoring** - Track slow pages/APIs
3. **Session Replay** - See what users did before error
4. **Source Maps** - Get readable stack traces
5. **Vercel Integration** - Automatic deployment tracking

---

## 🚀 Optional: Advanced Setup

### Track Custom Events

```typescript
import * as Sentry from "@sentry/nextjs";

// Track custom error
Sentry.captureException(new Error("Something went wrong"));

// Track custom message
Sentry.captureMessage("User clicked subscribe", "info");

// Add user context
Sentry.setUser({ email: "user@example.com" });

// Add custom tags
Sentry.setTag("page_locale", "en-us");
```

### Track Contact Form Submissions

In your API routes:

```typescript
try {
  // Your code
  await prisma.contactSubmission.create(...)
  
  Sentry.captureMessage("Contact form submitted", {
    level: "info",
    tags: { form: "contact" }
  });
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

## 💰 Pricing:

**Free Tier Includes:**
- 5,000 errors/month
- 10,000 performance units/month
- 50 replays/month
- 90 days data retention
- Unlimited team members

**Paid Plans:** Start at $26/month for more errors and features

---

## 🔧 Troubleshooting:

### Build failing?
- Make sure `SENTRY_AUTH_TOKEN` is set in Vercel
- Check org/project slugs are correct in `next.config.js`

### No errors showing?
- Verify `NEXT_PUBLIC_SENTRY_DSN` starts with `NEXT_PUBLIC_`
- Check browser console for Sentry initialization
- Trigger a test error to verify

### Source maps not working?
- Ensure `SENTRY_AUTH_TOKEN` has correct permissions
- Check Vercel build logs for upload errors

---

## 📚 Resources:

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel + Sentry Integration](https://vercel.com/integrations/sentry)
- [Sentry Dashboard](https://sentry.io/)

---

**Created:** October 22, 2025  
**Status:** Installation Complete - Awaiting Credentials
