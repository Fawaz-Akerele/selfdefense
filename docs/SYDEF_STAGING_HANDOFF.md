# Sydef — AWS Staging Handoff Package

**Product:** Sydef (Psychology of Self Defence)  
**Version:** 0.1.0 staging  
**Prepared for:** AWS engineer — deploy and test ASAP  
**Initial super admin:** `oadeagbo@gmail.com`

---

## 1. Sign-in and admin access (see APPLICATION.md)

Full plain-English guide: **[docs/APPLICATION.md](docs/APPLICATION.md)**

**Summary:**

- **Members & granted admins:** sign in with **phone OTP** at `/auth` (public). Admin access is granted by super admin in the database — not by a secret password on the sign-in form.
- **Super admin:** uses a **hidden** login path (staging: `/admin/login`; production: env `ADMIN_LOGIN_PATH`) with **email + password + email verification code**.
- Initial super admin: `oadeagbo@gmail.com` / `superadmin1@#` via `scripts/create-superadmin.js`.

---

## 2. Super Admin model (technical)

| Rule | Implementation |
|------|----------------|
| **One super admin at a time** | Stored in `platform_settings.super_admin_email` (default: `oadeagbo@gmail.com`) |
| **Initial credentials** | Email: `oadeagbo@gmail.com` / Password: `superadmin1@#` (created via `scripts/create-superadmin.js`) |
| **Login flow** | Email + password → 6-digit app-generated code emailed (mock: shown in UI + `email_logs` table) |
| **Password change** | Super admin requests code to their email → enters code to confirm change |
| **Transfer super admin** | Tick **"Change super admin"** → enter new email → code sent to **current** super admin email → on verify, `super_admin_email` updates → code sent to **new** email for first login |
| **Admin rights** | Only super admin can grant capabilities via `admin_capability_grants` — admins cannot self-elevate |
| **Financial portal** | P&L-style view; date-filtered; CSV download — requires `financial` capability or super admin |

---

## 2. Admin capability matrix

| Capability | Access | Granted by |
|------------|--------|------------|
| `content` | Classes, instructors, articles, modules CMS | Super admin only |
| `analytics` | `analytics_events`, performance & interaction metrics | Super admin only |
| `financial` | Financial portal (revenue, refunds, net, CSV export) | Super admin only |
| `bookings` | Bookings & enrollments management | Super admin only |
| `corporate` | Corporate packages, orders, staff invites | Super admin only |
| `settings` | Mock/live mode, payment provider config | Super admin only |
| **Super admin** | All of the above + grant/revoke admin + transfer super admin | Built-in for `super_admin_email` |

API to grant: `PATCH /api/admin/superadmin` with `{ userId, capability }`.

---

## 3. Feature map — what works and where

### Public site
| Feature | Code location | Database |
|---------|---------------|----------|
| Landing + location filter | `src/app/page.tsx`, `src/components/locations/*` | `locations`, `classes`, `class_sessions` |
| Session calendar | `src/components/calendar/session-calendar.tsx` | `class_sessions` |
| Reminders + directions map | `src/components/calendar/reminder-picker.tsx`, `src/components/maps/directions-map.tsx` | `session_reminders`, `notifications`, `whatsapp_logs` |
| Location API | `src/app/api/locations/sessions/route.ts` | — |

### Payments (NGN)
| Priority | Provider | Code | Webhook |
|----------|----------|------|---------|
| 1 Primary | Paystack | `src/lib/integrations/payments/paystack.ts` | `POST /api/webhooks/paystack` |
| 2 Secondary | Flutterwave | `src/lib/integrations/payments/flutterwave.ts` | `POST /api/webhooks/flutterwave` |
| 3 Tertiary | Stripe | `src/lib/integrations/payments/stripe.ts` | `POST /api/webhooks/stripe` |
| Dev | Mock | `src/lib/integrations/payments/mock.ts` | `/checkout/mock` |

Router: `src/lib/integrations/payments/router.ts` — selects provider by priority when `platform_settings.mode = live`.

Checkout: `POST /api/checkout/initialize` → `src/lib/services/checkout.ts`  
Fulfillment: `src/lib/services/payment-fulfillment.ts`

### Admin
| Feature | Route | Code |
|---------|-------|------|
| Login | `/admin/login` | `src/app/admin/login/page.tsx` |
| Dashboard | `/admin` | `src/app/admin/page.tsx` |
| Financial P&L | `/admin/financial` | `src/app/admin/financial/page.tsx` |
| Super admin settings | `/admin/settings/superadmin` | `src/app/admin/settings/superadmin/page.tsx` |
| Grant capabilities | API | `src/app/api/admin/superadmin/route.ts` |
| Financial API + CSV | API | `src/app/api/admin/financial/route.ts` |

### Infrastructure
| Feature | Code |
|---------|------|
| Supabase clients | `src/lib/supabase/*` |
| Health check | `GET /api/health` |
| Circuit breaker / recovery | `src/lib/recovery/circuit-breaker.ts` |
| Reminder cron | `GET /api/cron/reminders` (header: `Authorization: Bearer CRON_SECRET`) |

---

## 4. Dependency table

### Runtime (npm — see package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.9 | App framework (App Router) |
| react / react-dom | 19.2.4 | UI |
| @supabase/ssr | ^0.12.0 | Auth + DB server/client |
| @supabase/supabase-js | ^2.108.2 | Admin/service client |
| stripe | ^22.2.2 | Tertiary payments |
| zod | ^4.4.3 | Request validation |
| date-fns | ^4.4.0 | Calendar/date formatting |
| lucide-react | ^1.21.0 | Icons |
| clsx / tailwind-merge | latest | CSS utilities |
| react-hook-form | ^7.79.0 | Forms (extend) |
| @hookform/resolvers | ^5.4.0 | Zod form resolver |
| papaparse | ^5.5.3 | CSV parsing (corporate staff) |
| jspdf | ^4.2.1 | Certificates (extend) |
| geist | ^1.7.2 | Typography |
| web-vitals | ^5.3.0 | Performance analytics |
| @radix-ui/* | various | Accessible UI primitives |

### Dev

| Package | Purpose |
|---------|---------|
| typescript | Type checking |
| tailwindcss ^4 | Styling |
| vitest | Unit tests |
| @playwright/test | E2E tests |
| eslint / eslint-config-next | Linting |

### External services (not npm)

| Service | Required for staging? | Env vars |
|---------|----------------------|----------|
| **Supabase** | **Yes** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Paystack | Optional (mock works) | `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` |
| Flutterwave | Optional | `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_SECRET` |
| Stripe | Optional (tertiary) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| WhatsApp Business | Optional | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| Email (production) | Optional for staging | `RESEND_API_KEY` (extend) — staging uses mock email logs |

---

## 5. Database — apply in order

```bash
supabase link --project-ref YOUR_REF
npm run db:push
npm run db:seed
node scripts/create-superadmin.js
```

| Migration file | Contents |
|----------------|----------|
| `20250619000000_initial_schema.sql` | Core schema, RLS, auth hooks |
| `20250619000001_location_calendar_reminders.sql` | Location coords, session reminders |
| `20250619000002_payment_providers.sql` | Paystack, Flutterwave, Stripe columns |
| `20250619000003_superadmin_financial.sql` | Super admin, capability grants, financial seed |

---

## 6. AWS staging deployment

### Amplify (fastest)
Build: `npm ci && npm run build` | Start: `npm start` | Set env from `.env.example`

### Post-deploy checklist
- [ ] Migrations + seed applied
- [ ] Super admin created (`node scripts/create-superadmin.js`)
- [ ] `/api/health` healthy
- [ ] `/admin/login` works
- [ ] Financial CSV download works

---

## 7. Staging credentials

| Role | Email | Password |
|------|-------|----------|
| Super admin | oadeagbo@gmail.com | superadmin1@# |

Verification codes in staging: admin UI banner, server console, `email_logs` table.

---

## 8. Package location

**ZIP:** `/Users/olufemiadeagbo/Projects/sydef-staging-package.zip`  
Regenerate: `npm run package:staging`

Excluded: `node_modules/`, `.next/`, `.git/`, secrets
