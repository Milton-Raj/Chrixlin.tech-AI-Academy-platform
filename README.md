# Chrixlin.tech — Premium AI Academy Platform

Phase 1 (MVP) of the Chrixlin.tech AI Academy: a public landing page that converts visitors into
paid students, plus a private admin portal that runs the whole business — batches, payments,
emails, certificates and analytics.

**Stack:** Next.js 15 (App Router) • TypeScript • Tailwind CSS v4 • Framer Motion • Prisma •
PostgreSQL • Razorpay • Resend • JWT (jose) • pdf-lib • Recharts

---

## Quick Start

You need a PostgreSQL database (e.g. [Neon](https://neon.tech) or
[Supabase](https://supabase.com) free tier, or Vercel → Storage → Create Database).

```bash
cp .env.example .env # set DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD, CRON_SECRET
npm install          # also runs prisma generate
npm run db:migrate   # create the tables
npm run db:seed      # admin login, course, batches, FAQs, testimonials
npm run dev          # http://localhost:3000
```

Add `SEED_SAMPLE_DATA=true` before `npm run db:seed` to also insert six demo
students so the dashboard isn't empty. Leave it off for production.

**Admin portal:** http://localhost:3000/admin
Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env` (seeding fails if
`ADMIN_PASSWORD` is unset, so there is no default password to forget about).

**Certificate verification (public):** `/certificate/CHX-2026-000001`

> Dev conveniences: with empty Razorpay keys the checkout runs in **simulated payment mode**
> (full flow works, no real money). With an empty Resend key, emails are **logged to the
> EmailLog table** instead of sent. Add real keys in `.env` to go live.

### Browsing the database in DBeaver

New Connection → **PostgreSQL** → fill host, database, user and password from
your `DATABASE_URL`. For hosted databases set SSL to `require`.

### Reset all data

```bash
npm run db:reset   # drops, re-migrates and re-seeds
```

---

## What's Implemented (Phase 1)

### Landing page (`/`)
Hero with animated AI particle field and floating tool chips • admin-controlled trust counters •
who-is-this-for • 11 skill cards • dream-outcome cards • 15-day roadmap timeline • 7 projects •
certification showcase • **live batch picker** (real seats from DB) • pricing with strike-through
offer • testimonials • FAQ accordion • contact (WhatsApp/email/socials + form) — all CMS-editable.

### Enrollment (`/enroll/[batchId]`)
3-step wizard: batch summary → student details → Razorpay checkout (or simulated in dev) →
success page with receipt. Payment verification is HMAC-checked server-side; a Razorpay webhook
(`/api/payment/webhook`, event `payment.captured`) is the safety net. Seats increment atomically.

### Batch automation
`syncBatches()` (runs on landing page, admin, and cron): rolls statuses OPEN → RUNNING →
COMPLETED by date and always keeps N future batches open (N, capacity, spacing all editable in
Admin → CMS → Batch Automation). No manual batch creation needed.

### Email automation (Resend)
1. **Welcome + receipt** — instantly on payment
2. **Reminder** — 1 day before batch start
3. **Class start + meeting link** — when the batch begins
4. **Certificate** — on completion approval

Emails 2–3 are sent by `GET /api/cron/emails` (protect with `Authorization: Bearer $CRON_SECRET`).
Schedule it daily — on Vercel add to `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/emails", "schedule": "0 3 * * *" }] }
```

All sends are deduplicated via the EmailLog table, so extra runs are safe.

### Certificates
Admin approves completion → unique number `CHX-YYYY-NNNNNN` + verification code generated,
student emailed. PDF is rendered on demand (`/api/certificates/[number]/pdf`) so it works on
serverless with zero file storage. Public verification page at `/certificate/[number]`.

### Admin portal (`/admin`, JWT cookie auth, protected by middleware)
- **Dashboard** — revenue (total/today/month/year), registrations, active/completed students,
  conversion rate, revenue & registration charts, batch fill rates, upcoming batches
- **Students** — search, status filter, edit, deactivate, CSV/Excel export
- **Batches** — create/edit/pause/close/delete (delete blocked if paid students exist)
- **Meetings** — per-batch Zoom / Google Meet / Teams link + dates; emailed automatically
- **Certificates** — approve & issue, resend, download PDF, verify
- **Pricing** — price/discount/offer/duration with live landing-page preview
- **CMS** — hero text, trust counters, batch automation config, contact/socials, FAQs,
  testimonials — all without code changes

---

## Going to Production

1. **PostgreSQL** — set `DATABASE_URL` to your hosted Postgres.

   Migrations are **not** run during the Vercel build. Neon's pooled connection
   can't take the advisory lock Prisma Migrate needs, so an automatic build-time
   migration fails intermittently. Apply schema changes deliberately instead:

   ```bash
   DATABASE_URL="<production-url>" npm run db:deploy
   ```

   Run it before deploying a release that contains a new migration.
2. **Razorpay** — set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`;
   add a webhook for `payment.captured` → `https://your-domain/api/payment/webhook` and set
   `RAZORPAY_WEBHOOK_SECRET`.
3. **Resend** — set `RESEND_API_KEY` and a verified `EMAIL_FROM` domain.
4. **Secrets** — generate strong `JWT_SECRET` and `CRON_SECRET`; change the admin password
   (`ADMIN_PASSWORD` + re-seed, or update the Admin row).
5. **Deploy to Vercel** — set all env vars, `NEXT_PUBLIC_APP_URL` to your domain, add the cron
   entry above.

## Phase 2 backlog (from spec)
Student portal (assignments, recordings, certificates dashboard), referral & affiliate programs,
WhatsApp notifications, mobile app, AI career assistant / resume builder / interview coach.
