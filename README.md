# Sydef

**Psychology of Self Defence** — A platform for booking self-defense classes (in-person, online, corporate) with a secure member portal.

## Supabase Setup

### 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Note your **Project URL**, **anon key**, and **service_role key** from **Settings → API**.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`.

### 3. Apply database schema

**Option A — Supabase CLI (recommended)**

```bash
# Install CLI: https://supabase.com/docs/guides/cli
npm install -g supabase

# Link to your remote project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npm run db:push

# Seed demo data
npm run db:seed
```

**Option B — SQL Editor (manual)**

1. Open your Supabase project → **SQL Editor**
2. Paste and run [`supabase/migrations/20250619000000_initial_schema.sql`](supabase/migrations/20250619000000_initial_schema.sql)
3. Paste and run [`supabase/seed.sql`](supabase/seed.sql)

### 4. Enable Phone Auth

In Supabase Dashboard → **Authentication → Providers → Phone**:

- Enable phone sign-in
- Configure SMS provider (Twilio recommended for Nigeria)
- In mock mode, OTP is simulated locally

### 5. Verify connection

```bash
npm run dev
curl http://localhost:3000/api/health
```

Expected response when connected:

```json
{
  "status": "healthy",
  "services": {
    "supabase": { "configured": true, "connected": true, "latencyMs": 42 }
  }
}
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:push` | Push migrations to linked Supabase project |
| `npm run db:reset` | Reset local DB and re-apply migrations + seed |
| `npm run db:seed` | Run seed data only |
| `npm run db:types` | Regenerate TypeScript types from remote schema |

## Project Structure

```
supabase/
  config.toml          # Local Supabase CLI config
  migrations/          # Versioned SQL schema + RLS
  seed.sql             # Demo data (Nigerian locations, classes, packages)
src/
  lib/supabase/        # Browser, server, admin, middleware clients
  types/database.ts    # TypeScript types matching schema
  lib/services/        # Database health, platform settings
  lib/recovery/        # Circuit breaker, retry logic
```

## Mock vs Live Mode

The platform starts in **mock mode** (see `platform_settings` table). Mock mode simulates Stripe payments and WhatsApp messages without external credentials. Toggle to live mode from the admin dashboard once integrations are configured.

## Documentation

| Document | Audience | Contents |
|----------|----------|----------|
| **[docs/APPLICATION.md](docs/APPLICATION.md)** | Product, admins, engineers | Plain-English guide: sign-in, admin roles, super admin, financial portal |
| **[docs/SYDEF_STAGING_HANDOFF.md](docs/SYDEF_STAGING_HANDOFF.md)** | AWS / DevOps | Deploy, env vars, migrations, dependency table |

## Security

- Row Level Security (RLS) enabled on all tables
- Service role key used only server-side
- Phone OTP auth via Supabase Auth
- Private storage bucket for course videos

## License

Private — Sydef
