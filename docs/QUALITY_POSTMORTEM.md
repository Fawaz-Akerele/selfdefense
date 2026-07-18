# Sydef — Quality Post-Mortem

**Date:** 19 June 2025  
**Context:** Initial build delivered staging scaffolding with documentation that oversold completeness. A review surfaced bugs and missing routes before handoff.

This document explains **why those issues were missed**, and **what to require next time** so “build as an expert” means shippable, not aspirational.

---

## What went wrong (root causes)

### 1. Documentation was written ahead of implementation

`docs/APPLICATION.md` described `/auth`, `/portal`, capability enforcement, and hidden admin paths as if they existed. The code had stubs, TODOs, or nothing at all.

**Why it happened:** Docs were treated as the product spec *and* the completion checklist at the same time. Writing good docs felt like progress; it wasn’t verified against running routes.

**Prevention:** Every doc claim must map to a route or test. Use a simple gate:

| Doc says | Must exist |
|----------|------------|
| “Sign in at `/auth`” | `src/app/auth/page.tsx` + manual login test |
| “Member portal at `/portal`” | `src/app/portal/page.tsx` + auth redirect test |
| “Financial capability required” | Middleware or server guard on `/admin/financial` |

---

### 2. No “definition of done” before calling it finished

The project had migrations, payment providers, and admin UI shells — but **no production build gate** (`npm run build`) and **no end-to-end auth walkthrough** before handoff.

**Why it happened:** Features were added in vertical slices (DB → API → one page) without a final integration pass. The last mile (auth flows, redirects, build) was deferred.

**Prevention — mandatory checklist before any zip/handoff:**

```bash
npm run lint
npm run build
# Manual: homepage → /auth → /portal
# Manual: /admin/login → code verify → /admin
# Manual: granted admin blocked from /admin/financial without capability
```

If any step fails, the build is **not** done.

---

### 3. Auth model had multiple roles but middleware only checked one

Super admin was created with `role = super_admin`. Middleware only allowed `role === admin`. That guaranteed super admin could never reach `/admin` after login.

**Why it happened:** Schema migration added `super_admin` enum value and a script set that role, but middleware was written earlier against a simpler model. No one ran the super-admin login path after both pieces landed.

**Prevention:** For every role in the schema, maintain a **role matrix** and test each row:

| Role | Can access `/admin`? | Needs email code? |
|------|----------------------|-------------------|
| member | No | — |
| admin (granted) | Yes | No (phone OTP) |
| super_admin | Yes | Yes |

---

### 4. Security controls were designed but not wired end-to-end

Examples:

- Email verification code API allowed unauthenticated `superadmin_login` requests
- Super admin got a full Supabase session **before** code verification
- Cron endpoint was open when `CRON_SECRET` was unset
- `email_logs` RLS allowed unrestricted inserts
- Capability checks existed on the dashboard links, not on routes or APIs consistently

**Why it happened:** Security was implemented as **partial layers** (DB functions, API for some actions) without an adversarial review (“what if I curl this?”).

**Prevention:** For each sensitive endpoint, answer:

1. Who can call it unauthenticated?
2. What happens if I replay it 100 times?
3. Does success grant access before verification completes?

---

### 5. Expert scaffolding was confused with expert delivery

The codebase had strong structure (migrations, RLS, payment router, circuit breaker, handoff docs) — which *looks* expert — but **missing pages and a failing build** mean it wasn’t deliverable.

**Why it happened:** Depth in backend/integration code masked gaps in user-visible flows. Review energy went to architecture instead of “can a user complete the journey?”

**Prevention:** Prioritize **user journeys** over **module count**:

1. Member: browse → sign in → portal
2. Super admin: hidden login → dashboard → financial CSV
3. Payment: checkout → callback → portal confirmation

Build these paths first; admin CMS CRUD can follow.

---

### 6. Session/workspace context wasn’t treated as continuous

When you asked for a review, the assistant searched the filesystem and surfaced Sydef without confirming it was the same in-session build — which broke trust.

**Why it happened:** Each turn can lose implicit “we just built this” context unless the assistant anchors to the active project path and recent work.

**Prevention (for you when working with Cursor):**

- Keep the project folder open as the workspace root
- Say explicitly: “We’re working on Sydef at `~/Projects/sydef`”
- Before handoff: “Run the done checklist and give me a zip”

**Prevention (for the agent):**

- Never review or fix a project found by disk search without confirming it’s the active task
- After any multi-step build, run `npm run build` and summarize **what works / what doesn’t** honestly

---

## Fixes applied in this pass

| Issue | Fix |
|-------|-----|
| Super admin blocked from `/admin` | Middleware accepts `super_admin`, grants, and capability routes |
| Missing `/auth` and `/portal` | Phone OTP auth page and member portal with enrollments/bookings/notifications |
| Super admin 2FA bypass | Verification code required; `sydef_superadmin_verified` cookie set only after valid code |
| Unauthenticated code requests | `superadmin_login` POST requires authenticated super-admin session |
| Open cron endpoint | Returns 503 if `CRON_SECRET` missing; 401 if bearer wrong |
| Build failure on checkout callback | `useSearchParams` wrapped in Suspense |
| Weak admin pages | Server-side data views with `requireAdminAccess()` |
| `email_logs` RLS | Migration restricts inserts to super admin |
| Course video storage | Enrolled members can read their module videos |

---

## How to hold the agent to “expert” standard next time

Copy this into your prompt or a Cursor rule:

> Before saying done:
> 1. Run `npm run lint` and `npm run build` — paste results  
> 2. List every route in `docs/APPLICATION.md` and mark ✅ built or ❌ missing  
> 3. Walk through super-admin login and member phone login in prose  
> 4. Do not document features that are not implemented  
> 5. Deliver a zip only after 1–4 pass  

---

## Honest status after fixes

**Now working:** Auth, portal, admin access control, super-admin verification, production build, real admin read views, hardened cron and verification APIs.

**Still future work (not blockers for staging demo):**

- Full admin CRUD (create/edit classes, articles, grants UI)
- Live email/SMS delivery (Resend, Twilio) beyond mock logging
- Automated E2E tests (Playwright is in devDependencies but unused)
- Production `ADMIN_LOGIN_PATH` custom route wiring in Next.js rewrites

These are **Phase 2**, not silent gaps.

---

## Summary

The mistakes were not random typos — they came from **shipping the plan instead of the product**: docs ahead of code, no build gate, no journey testing, and security designed but not connected. The fix is a strict **definition of done** and testing the paths you actually documented.

That is how you minimize this class of error again.
