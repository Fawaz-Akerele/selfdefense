# Sydef Production Build — v1.0

## What's new (preference-first production)

### Scheduling intelligence
- Members set **preferences** (location, days, time band, modality) at `/portal/preferences`
- System **clusters demand** — no fixed dates until minimum headcount met
- Cron `/api/cron/scheduling?job=clustering` promotes clusters to `ready` and notifies members
- Admins confirm clusters at `/admin/clusters` → creates `class_sessions` + booking notifications

### Billing flexibility
- `pricing_plans` + `plan_entitlements` — monthly, annual, per-session
- Member checkout at `/portal/plans` with purpose `subscription_plan`
- Server-side subscription activation on payment fulfillment

### Security notifications (admin-gated)
- AI/cron ingests into `security_alert_drafts` (status: `pending_review`)
- Admin approves at `/admin/security-alerts` → fan-out to subscribers with `security_alerts` entitlement + matching `user_places`
- Rejected drafts never reach the notification pool

### Hardening
- **Book now** on public session browser (was reminder-only)
- New admin capabilities: `scheduling`, `plans`, `security`
- Gym partners table for MYM partnerships
- Migration: `20250619000005_preference_clustering_production.sql`

## Deploy checklist

1. `supabase db push` (includes migration 00005)
2. Set env: Supabase, payment keys, `CRON_SECRET`
3. Schedule cron jobs:
   - `GET /api/cron/reminders` — session reminders
   - `GET /api/cron/scheduling?job=clustering` — demand clustering
   - `GET /api/cron/scheduling?job=security-ingest` — AI draft ingest (replace with real crawler)
4. Grant admin capabilities to staff in `admin_capability_grants`
5. `npm run build && npm run verify:production`

## Verify locally

```bash
npm run dev
npm run verify:production
npm run package:staging   # creates sydef-staging-package.zip
```

## Key routes

| Route | Role |
|-------|------|
| `/portal/preferences` | Member demand pool |
| `/portal/plans` | Subscription checkout |
| `/admin/clusters` | Confirm clusters → sessions |
| `/admin/plans` | View pricing plans |
| `/admin/security-alerts` | Approve/reject alert drafts |
