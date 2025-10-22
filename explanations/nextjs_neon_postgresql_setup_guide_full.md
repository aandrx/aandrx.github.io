# 🧭 Next.js + Neon PostgreSQL Setup Guide
### For Cloudflare R2 image hosting + PostgreSQL (Neon) backend + scalable RSVP system

---

## 📋 Overview

This guide walks you through implementing a **PostgreSQL database (via Neon)** into your **Next.js** project, using **connection pooling** for scalability and **deployment limited to your `main` branch**.  
It assumes you already have:
- A working **Next.js** website
- **Cloudflare R2** configured for image storage

You will be adding:
- A **Neon PostgreSQL database**
- **Prisma ORM** for SQL modeling and queries
- **Connection pooling** via **Neon’s built-in pooling**
- **API routes** in Next.js for inserting and fetching RSVP data

---

## 🧰 Requirements

### ✅ Programs to Install

| Tool | Purpose | Install Command / Link |
|------|----------|------------------------|
| **Node.js (v18+)** | Runtime for Next.js | [https://nodejs.org](https://nodejs.org) |
| **pnpm / npm / yarn** | Package manager | `npm install -g pnpm` |
| **Git** | Version control | [https://git-scm.com/](https://git-scm.com/) |
| **Neon account** | Managed PostgreSQL | [https://neon.tech](https://neon.tech) |
| **VS Code** | Editor | [https://code.visualstudio.com/](https://code.visualstudio.com/) |
| **Cloudflare account** | For R2 storage | [https://dash.cloudflare.com](https://dash.cloudflare.com) |

---

## ⚙️ Step 1: Set Up Your Neon Database

1. Go to [https://neon.tech](https://neon.tech) and **create a new project**.
2. Choose:
   - **Region:** closest to your main audience
   - **PostgreSQL version:** latest stable
3. After creation, go to **Settings → Connection Details**.
4. **Enable connection pooling:**
   - Under “Connection Pooling,” ensure it’s **enabled**
   - Copy the **pooled connection string**, it will look like:
     ```
     postgresql://user:password@ep-xxxxx-pooler.neon.tech/neondb
     ```
5. Copy your **non-pooled connection string** too (for migrations).

---

## ⚙️ Step 2: Add Environment Variables

In your Next.js project root, create a `.env` file:

```bash
# Neon Database URLs
DATABASE_URL="postgresql://user:password@ep-xxxxx.neon.tech/neondb"
DATABASE_URL_POOLING="postgresql://user:password@ep-xxxxx-pooler.neon.tech/neondb"

# For production (Vercel, etc.), add these to your project environment variables
```

---

## 🧱 Step 3: Add Prisma to Your Project

Install Prisma and initialize it:

```bash
pnpm add prisma @prisma/client
npx prisma init
```

Your project will now contain a `/prisma/schema.prisma` file.  
Edit it to match your RSVP use case:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model RSVP {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  attending Boolean
  createdAt DateTime @default(now())
}
```

---

## ⚙️ Step 4: Migrate the Database

Run your first migration:
```bash
npx prisma migrate dev --name init
```

Once migrations complete, push your schema to Neon:
```bash
npx prisma db push
```

You can verify this in the **Neon SQL Editor** tab.

---

## ⚙️ Step 5: Implement Connection Pooling

Update your `prisma/client.ts` to use the **pooled connection** when running in production:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.NODE_ENV === "production"
            ? process.env.DATABASE_URL_POOLING
            : process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 🧩 Step 6: Create Next.js API Routes

Under `/app/api/rsvp/route.ts` (App Router) or `/pages/api/rsvp.ts` (Pages Router), add:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const data = await req.json();
  const { name, email, attending } = data;

  try {
    const newRSVP = await prisma.rSVP.create({
      data: { name, email, attending },
    });
    return NextResponse.json(newRSVP);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to submit RSVP" }, { status: 500 });
  }
}

export async function GET() {
  const rsvps = await prisma.rSVP.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rsvps);
}
```

---

## 🧑‍💻 Step 7: Connect Your Frontend Form

Example component for submitting RSVPs:

```tsx
"use client";
import { useState } from "react";

export default function RSVPForm() {
  const [form, setForm] = useState({ name: "", email: "", attending: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    alert("RSVP submitted!");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <label>
        <input
          type="checkbox"
          checked={form.attending}
          onChange={(e) => setForm({ ...form, attending: e.target.checked })}
        />
        Attending
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## 🚀 Step 8: Git + Deployment Configuration

1. Commit your changes and push them to your repo.
2. In your hosting provider (e.g., **Vercel**):
   - Set the **production branch** to `main`
   - Add the `.env` variables (Neon URLs)
   - Redeploy
3. Your app will now connect securely to Neon using **pooled connections**.

---

## 🧠 Step 9: Testing

To confirm everything works:
1. Visit `/api/rsvp` → Should show JSON array of RSVP entries.
2. Submit a form → Should store data in Neon.
3. In Neon’s dashboard → Confirm entries appear in your `rsvp` table.

---

## 🧩 Optional: Monitoring & Admin Access

- Use **Neon’s SQL Editor** to query live data.
- Add a **simple admin dashboard** to fetch and list all RSVP entries.
- For larger apps, consider **Neon Branching** to create isolated dev/test databases.

---

## 🏁 Summary Checklist

| Step | Description | Done |
|------|--------------|------|
| 1 | Neon database created & pooling enabled | ☐ |
| 2 | `.env` set up with connection strings | ☐ |
| 3 | Prisma installed & schema migrated | ☐ |
| 4 | Next.js API routes added | ☐ |
| 5 | Connection pooling configured | ☐ |
| 6 | Frontend form wired up | ☐ |
| 7 | Deployed on `main` branch only | ☐ |

---

## 🧩 Recommended Next Steps

- Use **Neon + Prisma Studio** (`npx prisma studio`) for GUI database management.  
- Add **Zod validation** for API inputs.  
- Enable **R2 integration** for storing related assets (profile pictures, etc.).  

---

**Author:** Setup Guide by ChatGPT for Andrew Liu  
**Version:** 2025.10  
**License:** MIT  
