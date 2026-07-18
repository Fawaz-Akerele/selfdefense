# Sydef — Application Guide (Plain English)

**Sydef** stands for *Psychology of Self Defence*. This document explains how the application works for product owners, admins, and engineers — without technical jargon where possible.

---

## What the application does

Sydef lets people in Nigeria (and beyond) book self-defence training:

- **In-person classes** at venues across cities  
- **Online courses** with video modules and certificates  
- **Corporate packages** for companies buying training for many staff  

Members use a **portal** after booking. Staff use an **admin area** to manage content, bookings, money, and settings.

---

## Who uses what

| User type | What they do | Where they go |
|-----------|--------------|---------------|
| **Public visitor** | Browse classes, filter by location, book | Homepage, class pages |
| **Member** | View courses, progress, reminders, blog | `/portal` |
| **Granted admin** | Manage content, bookings, etc. (only what they’re allowed) | `/admin` |
| **Super admin** | Everything, plus grant admin rights and transfer ownership | Hidden admin login, then `/admin` |

---

## Sign-in: one front door for members and admins (phone)

**Preferred approach:** everyone signs in the same public way — **mobile number + one-time code (OTP)**.

- The sign-in page lives at **`/auth`**
- There is **no email/password field** on the public sign-in page
- This matches Nigeria-first use, WhatsApp invites, and corporate staff flows (phone is the identity)

After someone signs in with their phone, the **server** checks who they are:

- Ordinary member → send them to the **member portal**
- User who has been **granted admin rights** by the super admin → they can open **Admin** (same login, extra access)
- **Nobody becomes admin** just by typing a special password on the public page — that would be insecure and confusing

**Important:** Admin access is **not masked** on the public sign-in form (no secret email/password combo on the same screen as phone login). Access is decided **on the server** after phone login, based on roles and grants stored in the database.

---

## Admin login: hidden path for super admin (email)

The **super admin** is different from granted admins:

- There is only **one super admin at a time** (stored as `oadeagbo@gmail.com` initially)
- Super admin can **grant** admin capabilities to other people
- Super admin can **transfer** super-admin ownership to another email (with verification codes)
- Super admin account is tied to **email** (not only phone) for ownership and legal/control reasons

### Where super admin signs in

Super admin does **not** use the public `/auth` phone page for full control. Instead:

1. **Hidden URL** — Admin console is **not linked** from the homepage. Only people who know the path (or have it in ops docs) can open it.  
   - Staging uses something like `/admin/login`  
   - Production should use a **secret path** set in environment config (e.g. `ADMIN_LOGIN_PATH`), so the URL is not easy to guess  

2. **Sign-in steps for super admin:**  
   - Email + password  
   - Then a **6-digit code** sent to that email (in staging, the code also appears on screen and in the database for testing)  

3. After that, super admin reaches the **Admin dashboard** at `/admin`.

### Why two lanes?

| Lane | Who | How they sign in |
|------|-----|------------------|
| **Public** | Members + granted admins | Phone OTP at `/auth` |
| **Hidden** | Super admin only | Secret path + email + password + email code |

Granted admins use **phone** like everyone else. Super admin uses **email** at a **hidden** entry point. That keeps the public experience simple and keeps the most powerful account harder to find and attack.

---

## How admin rights work (only super admin can grant)

Admins **cannot give themselves** access. Only the **super admin** can assign capabilities.

Each granted admin gets one or more **capabilities**:

| Capability | What it allows |
|------------|----------------|
| **content** | Manage classes, instructors, articles, video modules |
| **analytics** | View usage and performance data |
| **financial** | Open the financial portal (profit & loss style reports, CSV download) |
| **bookings** | View and manage bookings and enrollments |
| **corporate** | Corporate packages, staff lists, WhatsApp invites |
| **settings** | Platform mode (mock/live), payment provider status |

Super admin automatically has **all** capabilities plus:

- Grant or revoke capabilities for other users  
- Change platform super-admin email (transfer ownership)  
- See financial portal regardless of grants  

Capabilities are stored in the database table `admin_capability_grants`.

---

## Super admin account (initial setup)

| Item | Value (staging) |
|------|-----------------|
| Email | `oadeagbo@gmail.com` |
| Initial password | `superadmin1@#` (change after first login) |
| Created by | Running `node scripts/create-superadmin.js` after database setup |

### Changing password

Super admin requests a verification code to their email, enters it in the admin settings, then sets a new password. No one else can do this for them.

### Transferring super admin to someone else

1. Super admin opens **Super admin settings**  
2. Ticks **“Change super admin”**  
3. Enters the **new** email address  
4. A code is sent to the **current** super admin email — they enter it to confirm  
5. Ownership moves to the new email; a code is sent to the **new** email for their first login  

There is always exactly **one** super admin email recorded in platform settings.

---

## Member portal vs admin area

| Area | URL | Who gets in |
|------|-----|-------------|
| Member portal | `/portal` | Any signed-in member |
| Admin dashboard | `/admin` | Super admin or users with granted capabilities |
| Financial portal | `/admin/financial` | Super admin or users with **financial** capability |

If someone tries to open `/admin` without permission, they are turned away (sent to portal or sign-in).

---

## Financial portal (plain English)

The financial section works like a simple **profit and loss** view:

- **Revenue** — successful payments in the date range  
- **Refunds** — money returned  
- **Net** — revenue minus refunds  
- **Transactions** — list of payments (Paystack, Flutterwave, Stripe, or mock in test mode)  

Super admin or anyone with **financial** capability can:

- Pick **from** and **to** dates  
- View totals on screen  
- **Download a CSV** for accountants or reporting  

Payment priority in live mode: **Paystack first**, then **Flutterwave**, then **Stripe**. Mock mode simulates payments without real money.

---

## Locations, calendar, and reminders

When a user picks **locations** and sees in-person sessions:

- An **in-app calendar** shows which days have classes  
- They can **set a reminder** (e.g. 1 hour or 1 day before)  
- Reminders can go to **in-app notifications** and/or **WhatsApp**  
- Optional **directions map** (tap to reveal) and map link included in the reminder  

---

## Mock mode vs live mode

The platform can run in **mock mode** (default for staging):

- Payments are simulated — no real Paystack/Flutterwave/Stripe charges  
- WhatsApp and email codes are **logged** instead of sent (codes visible in admin/staging UI)  
- Full flows can be tested without live API keys  

**Live mode** uses real payment and messaging providers. Super admin (or settings capability) toggles this when ready.

---

## Security principles (summary)

1. **Phone-first** public sign-in — one front door at `/auth`  
2. **No secret admin credentials** on the public sign-in page  
3. **Hidden super-admin URL** — not advertised on the site  
4. **Admin powers assigned by super admin only** — stored in the database, checked on every admin request  
5. **Email verification codes** for super-admin login, password change, and ownership transfer  
6. **Row-level security** in the database so users only see their own data unless admin rules allow otherwise  

---

## For engineers: where this lives in code

| Topic | Location |
|-------|----------|
| Public phone auth (to build/extend) | `src/app/(public)/auth/` |
| Super admin login (staging) | `src/app/admin/login/` |
| Admin dashboard | `src/app/admin/` |
| Capability checks | `src/lib/services/superadmin.ts`, `admin_capability_grants` table |
| Middleware (protect `/portal`, `/admin`) | `src/middleware.ts`, `src/lib/supabase/middleware.ts` |
| Financial reports | `src/app/admin/financial/`, `src/lib/services/financial.ts` |
| Staging / AWS handoff | `docs/SYDEF_STAGING_HANDOFF.md` |

**Planned production change:** move super-admin login from public `/admin/login` to a path defined by `ADMIN_LOGIN_PATH` in environment variables, and implement phone OTP at `/auth` as the only public sign-in method.

---

## Document history

- Auth model: phone public sign-in + hidden super-admin path + server-side admin grants (expert-recommended approach, documented for product and staging).
