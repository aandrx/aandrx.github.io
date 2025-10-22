# 📊 Database Implementation Plan for aandrx.github.io
### PostgreSQL + Neon Integration for User Input & RSVP Management

---

## 📋 Executive Summary

This document outlines a comprehensive plan to integrate a PostgreSQL database (via Neon) into your existing Next.js photography portfolio website. The implementation will enable user data collection including RSVPs, contact form submissions, newsletter signups, and potentially exhibition attendance tracking.

**Current State:**
- Next.js 15.5.3 application
- Static content with Cloudflare R2 for images
- No database or backend data persistence
- Contact page exists but likely no form submission handling

**Target State:**
- Neon PostgreSQL database with connection pooling
- Prisma ORM for type-safe database queries
- API routes for data submission and retrieval
- User input forms (RSVP, contact, newsletter)
- Optional admin dashboard for data management

---

## 🎯 Use Cases & Features

Based on your photography portfolio structure, here are recommended database features:

### 1. **Contact Form Submissions**
**Purpose:** Capture inquiries from the contact page  
**Data to Collect:**
- Name
- Email
- Subject
- Message body
- Timestamp
- IP address (optional, for spam prevention)
- Status (new, read, replied)

**Value:** 
- No more missed inquiries through external services
- Centralized communication management
- Professional response tracking

### 2. **Exhibition/Event RSVP System**
**Purpose:** Manage attendance for photography exhibitions  
**Data to Collect:**
- Full name
- Email address
- Phone number (optional)
- Number of guests (+1, +2, etc.)
- Attending status (yes/no/maybe)
- Dietary restrictions (for catered events)
- Timestamp
- Confirmation sent flag

**Value:**
- Track event attendance
- Send automated confirmation emails
- Manage capacity limits
- Export guest lists for exhibitions

### 3. **Newsletter/Updates Subscription**
**Purpose:** Build mailing list for new work announcements  
**Data to Collect:**
- Email address
- Name (optional)
- Subscription preferences (new work, exhibitions, blog posts)
- Subscribe date
- Active/unsubscribed status
- Unsubscribe reason (optional)

**Value:**
- Direct communication with your audience
- Grow engaged follower base
- GDPR-compliant subscription management

### 4. **Project Interaction Analytics** (Optional)
**Purpose:** Understand which projects resonate most  
**Data to Collect:**
- Project ID/name
- View count
- Time spent on page
- Interaction type (click, scroll depth)
- Timestamp
- Session ID

**Value:**
- Data-driven portfolio curation
- Understand audience preferences
- Optimize project presentation

### 5. **Gallery Comments/Reactions** (Future Enhancement)
**Purpose:** Enable viewer engagement with work  
**Data to Collect:**
- Project ID
- User name/email
- Comment text
- Reaction type (heart, star, etc.)
- Timestamp
- Moderation status

---

## 🏗️ Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  - React Components (Contact Form, RSVP Form, etc.)     │
│  - Client-side validation                               │
│  - TypeScript for type safety                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (App Router)            │
│  - /api/contact → Handle contact submissions            │
│  - /api/rsvp → Handle event RSVPs                       │
│  - /api/newsletter → Handle subscriptions               │
│  - /api/admin → Protected admin endpoints               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   Prisma ORM Layer                      │
│  - Type-safe database queries                           │
│  - Schema validation                                    │
│  - Migration management                                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         Neon PostgreSQL Database (Serverless)           │
│  - Connection pooling enabled                           │
│  - Auto-scaling                                         │
│  - Automated backups                                    │
└─────────────────────────────────────────────────────────┘
```

### Database Schema Design

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Contact form submissions
model ContactSubmission {
  id          String   @id @default(cuid())
  name        String
  email       String
  subject     String?
  message     String   @db.Text
  ipAddress   String?
  status      SubmissionStatus @default(NEW)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@index([createdAt(sort: Desc)])
}

// Event RSVP management
model EventRSVP {
  id                String   @id @default(cuid())
  eventId           String   // Links to a specific event/exhibition
  name              String
  email             String
  phone             String?
  guestCount        Int      @default(1)
  attending         AttendanceStatus
  dietaryRestrictions String?
  message           String?  @db.Text
  confirmationSent  Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([eventId, email])
  @@index([eventId])
  @@index([attending])
}

// Newsletter subscriptions
model NewsletterSubscription {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  preferences       String[] // ["new_work", "exhibitions", "blog"]
  isActive          Boolean  @default(true)
  unsubscribeReason String?
  subscribedAt      DateTime @default(now())
  unsubscribedAt    DateTime?
  
  @@index([isActive])
}

// Project analytics (optional)
model ProjectView {
  id          String   @id @default(cuid())
  projectId   String
  sessionId   String
  viewedAt    DateTime @default(now())
  timeSpent   Int?     // seconds
  
  @@index([projectId])
  @@index([viewedAt(sort: Desc)])
}

// Enums
enum SubmissionStatus {
  NEW
  READ
  REPLIED
  ARCHIVED
}

enum AttendanceStatus {
  YES
  NO
  MAYBE
}
```

---

## 📁 Project Structure Changes

### New Files to Create

```
aandrx.github.io/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Migration history
│
├── src/
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── validations.ts     # Zod schemas for validation
│   │   └── rate-limit.ts      # Rate limiting middleware (optional)
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── contact/
│   │   │   │   └── route.ts   # Contact form API
│   │   │   ├── rsvp/
│   │   │   │   └── route.ts   # RSVP API
│   │   │   ├── newsletter/
│   │   │   │   └── route.ts   # Newsletter API
│   │   │   └── admin/
│   │   │       ├── contact/
│   │   │       │   └── route.ts
│   │   │       └── rsvp/
│   │   │           └── route.ts
│   │   │
│   │   └── admin/
│   │       ├── page.tsx        # Admin dashboard
│   │       ├── layout.tsx      # Admin layout
│   │       └── login/
│   │           └── page.tsx    # Admin login
│   │
│   └── components/
│       ├── ContactForm.tsx     # Contact form component
│       ├── RSVPForm.tsx        # RSVP form component
│       └── NewsletterSignup.tsx # Newsletter component
│
├── .env                        # Environment variables (gitignored)
├── .env.example                # Example environment file
└── database_implementation_plan.md # This file
```

---

## 🔧 Implementation Steps

### Phase 1: Database Setup (Week 1)

#### Step 1.1: Create Neon Account & Database
- [ ] Sign up at [neon.tech](https://neon.tech)
- [ ] Create new project: "aandrx-portfolio-db"
- [ ] Choose region closest to your hosting (US West for GitHub Pages → Vercel)
- [ ] Enable connection pooling
- [ ] Copy both connection strings (pooled and direct)

#### Step 1.2: Install Dependencies
```bash
npm install prisma @prisma/client
npm install zod          # For validation
npm install bcryptjs     # For admin password hashing (if needed)
npm install @types/bcryptjs --save-dev
```

#### Step 1.3: Initialize Prisma
```bash
npx prisma init
```

#### Step 1.4: Configure Environment Variables
Create `.env`:
```bash
# Database
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db"
DATABASE_URL_POOLING="postgresql://user:pass@ep-xxx-pooler.neon.tech/db"

# App
NEXT_PUBLIC_SITE_URL="https://aandrx.github.io"
NODE_ENV="development"

# Admin (for future admin panel)
ADMIN_PASSWORD_HASH="$2a$10$..." # bcrypt hash
NEXTAUTH_SECRET="your-secret-here"  # if using NextAuth
```

Create `.env.example` (commit this):
```bash
DATABASE_URL="postgresql://..."
DATABASE_URL_POOLING="postgresql://..."
NEXT_PUBLIC_SITE_URL="https://your-site.com"
ADMIN_PASSWORD_HASH="bcrypt-hash-here"
```

#### Step 1.5: Define Database Schema
Copy the schema from "Database Schema Design" section above into `prisma/schema.prisma`

#### Step 1.6: Run Initial Migration
```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### Step 1.7: Verify in Neon Dashboard
- Open Neon SQL Editor
- Run: `SELECT * FROM "ContactSubmission";`
- Confirm tables exist

---

### Phase 2: Backend API Development (Week 2)

#### Step 2.1: Create Prisma Client
Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.NODE_ENV === 'production' 
          ? process.env.DATABASE_URL_POOLING 
          : process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

#### Step 2.2: Create Validation Schemas
Create `src/lib/validations.ts`:
```typescript
import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export const rsvpFormSchema = z.object({
  eventId: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  guestCount: z.number().min(1).max(10),
  attending: z.enum(['YES', 'NO', 'MAYBE']),
  dietaryRestrictions: z.string().optional(),
  message: z.string().optional(),
})

export const newsletterSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  preferences: z.array(z.string()).default(['new_work']),
})
```

#### Step 2.3: Create API Routes

**Contact Form API** (`src/app/api/contact/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { contactFormSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = contactFormSchema.parse(body)
    
    const submission = await prisma.contactSubmission.create({
      data: {
        ...validated,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
      },
    })
    
    return NextResponse.json(
      { success: true, id: submission.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}
```

**RSVP API** (`src/app/api/rsvp/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rsvpFormSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = rsvpFormSchema.parse(body)
    
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_email: {
          eventId: validated.eventId,
          email: validated.email,
        },
      },
      update: validated,
      create: validated,
    })
    
    return NextResponse.json(
      { success: true, id: rsvp.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json(
      { error: 'Failed to submit RSVP' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId required' },
        { status: 400 }
      )
    }
    
    const count = await prisma.eventRSVP.count({
      where: { eventId, attending: 'YES' },
    })
    
    return NextResponse.json({ count })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch RSVP count' },
      { status: 500 }
    )
  }
}
```

**Newsletter API** (`src/app/api/newsletter/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { newsletterSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = newsletterSchema.parse(body)
    
    const subscription = await prisma.newsletterSubscription.upsert({
      where: { email: validated.email },
      update: {
        isActive: true,
        preferences: validated.preferences,
        name: validated.name,
      },
      create: validated,
    })
    
    return NextResponse.json(
      { success: true, id: subscription.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Newsletter error:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
```

---

### Phase 3: Frontend Forms (Week 3)

#### Step 3.1: Update Contact Page
Modify `src/app/contact/page.tsx` to include form submission:

```typescript
'use client'

import { useState } from 'react'
import './contact.css'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <div className="layout">
      <div id="container" className="contact-container">
        <div className="post contact-post">
          <div className="info">
            <div className="title section">Contact</div>
          </div>
          
          <div className="content">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
              />
              <button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
              {status === 'success' && <p>Message sent successfully!</p>}
              {status === 'error' && <p>Failed to send message. Please try again.</p>}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### Step 3.2: Create Reusable Form Components
These can be added to other pages as needed.

---

### Phase 4: Admin Dashboard (Week 4 - Optional)

#### Step 4.1: Create Protected Admin Routes
Use middleware or route protection for `/admin/*` routes

#### Step 4.2: Build Admin Dashboard UI
- List all contact submissions
- Filter by status (NEW, READ, REPLIED)
- View RSVP counts by event
- Export newsletter subscriber list

---

## 🔒 Security Considerations

### 1. Rate Limiting
Implement rate limiting to prevent spam:
```typescript
// src/lib/rate-limit.ts
import { NextRequest } from 'next/server'

const rateLimit = new Map<string, number[]>()

export function checkRateLimit(request: NextRequest, limit = 5, window = 60000) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const timestamps = rateLimit.get(ip) || []
  
  // Remove old timestamps
  const recent = timestamps.filter(t => now - t < window)
  
  if (recent.length >= limit) {
    return false
  }
  
  recent.push(now)
  rateLimit.set(ip, recent)
  return true
}
```

### 2. Input Validation
- Use Zod for all user inputs
- Sanitize HTML in messages
- Validate email formats server-side

### 3. CSRF Protection
- Next.js handles this automatically for same-origin requests
- Consider adding CSRF tokens for extra security

### 4. Admin Authentication
- Use NextAuth.js or similar for admin routes
- Hash passwords with bcrypt
- Implement session management

### 5. Database Security
- Never expose `DATABASE_URL` to client
- Use environment variables properly
- Enable SSL connections (Neon does this by default)

---

## 📊 Testing Strategy

### Unit Tests
```typescript
// __tests__/api/contact.test.ts
describe('Contact API', () => {
  it('should create contact submission', async () => {
    // Test implementation
  })
  
  it('should reject invalid email', async () => {
    // Test implementation
  })
})
```

### Integration Tests
- Test full form submission flow
- Verify database entries
- Check email validation

### Manual Testing Checklist
- [ ] Submit contact form successfully
- [ ] Verify data in Neon dashboard
- [ ] Test with invalid inputs
- [ ] Check rate limiting
- [ ] Test on mobile devices
- [ ] Verify error handling

---

## 🚀 Deployment Configuration

### Vercel Deployment
1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Set production branch to `main`
4. Enable automatic deployments

### Environment Variables to Set in Vercel:
```
DATABASE_URL=postgresql://...
DATABASE_URL_POOLING=postgresql://...pooler.neon.tech/...
NEXT_PUBLIC_SITE_URL=https://aandrx.github.io
NODE_ENV=production
```

### Build Command
```bash
npx prisma generate && next build
```

---

## 💰 Cost Analysis

### Neon (Free Tier)
- **Storage:** 10 GB (generous for this use case)
- **Compute:** 300 hours/month (sufficient for portfolio traffic)
- **Connection pooling:** Included
- **Backups:** Automated
- **Cost:** $0/month (Free tier should be sufficient)

### Vercel (Hobby Plan)
- **Bandwidth:** 100 GB/month
- **Build time:** 100 hours/month
- **Edge Functions:** Unlimited
- **Cost:** $0/month

**Total Estimated Cost:** $0/month for typical portfolio traffic

**When to Upgrade:**
- Neon: If you exceed 10GB storage or need more compute hours
- Vercel: If you get >100GB traffic/month

---

## 📈 Monitoring & Maintenance

### Database Monitoring
- Check Neon dashboard weekly for:
  - Connection pool usage
  - Query performance
  - Storage usage

### Application Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Track form submission success rates

### Backup Strategy
- Neon provides automatic daily backups
- Consider weekly exports for critical data
- Use `pg_dump` for manual backups

---

## 🎯 Success Metrics

### Key Performance Indicators (KPIs)
1. **Form Submission Rate:** Target >80% completion rate
2. **API Response Time:** <500ms average
3. **Database Query Time:** <100ms average
4. **Error Rate:** <1% of requests
5. **Newsletter Conversion:** Track signup rate from visitors

### Analytics to Track
- Number of contact submissions per week
- RSVP response rates for events
- Newsletter subscriber growth
- Most common inquiry topics

---

## 🔄 Migration Path

If you already have data from other sources:

### Step 1: Export Existing Data
- Export contact form submissions from email
- Compile any existing RSVP lists

### Step 2: Create Import Script
```typescript
// scripts/import-data.ts
import { prisma } from '../src/lib/prisma'

async function importData() {
  // Import logic here
}

importData()
```

### Step 3: Run Import
```bash
npx ts-node scripts/import-data.ts
```

---

## 🚧 Potential Challenges & Solutions

### Challenge 1: GitHub Pages Static Limitation
**Problem:** GitHub Pages only serves static files, can't run server-side code  
**Solution:** Deploy to Vercel or Netlify for serverless functions

### Challenge 2: Cold Start Latency
**Problem:** Neon/Vercel serverless functions may have cold starts  
**Solution:** Use connection pooling and keep functions warm with cron jobs

### Challenge 3: Spam Submissions
**Problem:** Bots may spam contact forms  
**Solution:** Implement rate limiting + honeypot fields + CAPTCHA (optional)

### Challenge 4: Email Deliverability
**Problem:** No email service configured for notifications  
**Solution:** Integrate Resend, SendGrid, or similar (future enhancement)

---

## 📚 Additional Resources

### Documentation
- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod Validation](https://zod.dev/)

### Tools
- [Prisma Studio](https://www.prisma.io/studio) - GUI database management
- [Neon SQL Editor](https://console.neon.tech) - Run queries
- [TablePlus](https://tableplus.com/) - Database client (optional)

---

## ✅ Pre-Implementation Checklist

Before starting implementation:

- [ ] **Backup current site** - Commit all changes to git
- [ ] **Review architecture** - Ensure you understand the data flow
- [ ] **Create Neon account** - Get database ready
- [ ] **Plan deployment** - Decide: Vercel, Netlify, or other?
- [ ] **Design forms** - Sketch out UI for contact/RSVP forms
- [ ] **Plan data model** - Review schema, adjust for your needs
- [ ] **Set up local dev environment** - Ensure Node.js 18+ installed
- [ ] **Create .env file** - Prepare environment variables
- [ ] **Schedule implementation time** - Plan 2-4 weeks for full rollout

---

## 🎬 Next Steps

1. **Review this document** with your team/collaborators
2. **Make decisions** on which features to implement first
3. **Adjust database schema** based on your specific needs
4. **Set up development environment** (Neon account, install dependencies)
5. **Start with Phase 1** (Database Setup)
6. **Implement incrementally** - test each phase before moving forward

---

**Document Version:** 1.0  
**Created:** October 22, 2025  
**Author:** AI Planning Assistant for Andrew Liu  
**Status:** Draft - Ready for Review  

---

## 📝 Notes & Considerations

### Custom Adjustments for Your Portfolio

1. **Contact Page Enhancement**
   - Current contact page has basic info
   - Add form for inquiries about prints, licensing, exhibitions
   - Consider adding categories: "Print Purchase", "Commission Work", "Exhibition Inquiry"

2. **Project-Specific Features**
   - Add "interested buyers" tracking for specific works
   - Track which projects get most inquiries
   - Enable private gallery sharing with password protection

3. **Exhibition Management**
   - Track multiple events simultaneously
   - Send automated reminders before events
   - Collect feedback after exhibitions

4. **Print Shop Integration** (Future)
   - If you sell prints, track orders
   - Inventory management for limited editions
   - Payment processing integration

### Scalability Considerations

This architecture supports growth to:
- **10,000+ contact submissions/month**
- **Multiple concurrent exhibitions**
- **50,000+ newsletter subscribers**
- **Millions of page views/month**

If you exceed these, consider:
- Upgrading Neon plan
- Adding Redis for caching
- Implementing CDN for API responses
- Moving to dedicated PostgreSQL instance

---

**Ready to implement?** Start with Phase 1 and work through systematically. Each phase builds on the previous one, so don't skip ahead. Good luck! 🚀
