-- Sydef (Psychology of Self Defence) — initial schema
-- Run via: supabase db push  OR  paste into Supabase SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE sydef.user_role AS ENUM ('member', 'admin', 'corporate_admin');
CREATE TYPE sydef.platform_mode AS ENUM ('mock', 'live');
CREATE TYPE sydef.class_type AS ENUM ('in_person', 'online', 'hybrid', 'corporate');
CREATE TYPE sydef.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE sydef.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE sydef.payment_provider AS ENUM ('stripe', 'mock');
CREATE TYPE sydef.article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE sydef.submission_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE sydef.notification_channel AS ENUM ('in_app', 'whatsapp', 'both');
CREATE TYPE sydef.corporate_order_status AS ENUM ('pending', 'paid', 'fulfilled', 'cancelled');
CREATE TYPE sydef.invite_status AS ENUM ('pending', 'sent', 'verified', 'redeemed', 'expired');

-- ---------------------------------------------------------------------------
-- Platform
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode sydef.platform_mode NOT NULL DEFAULT 'mock',
  site_name TEXT NOT NULL DEFAULT 'Sydef',
  site_tagline TEXT NOT NULL DEFAULT 'Psychology of Self Defence',
  stripe_configured BOOLEAN NOT NULL DEFAULT false,
  whatsapp_configured BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TABLE sydef.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (state, city)
);

-- ---------------------------------------------------------------------------
-- Profiles (linked to auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  full_name TEXT,
  role sydef.user_role NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  credentials TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  type sydef.class_type NOT NULL,
  price_ngn INTEGER NOT NULL CHECK (price_ngn >= 0),
  objectives TEXT[] NOT NULL DEFAULT '{}',
  instructor_id UUID REFERENCES sydef.instructors(id) ON DELETE SET NULL,
  location_id UUID REFERENCES sydef.locations(id) ON DELETE SET NULL,
  session_count INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_corporate_only BOOLEAN NOT NULL DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES sydef.classes(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  capacity INTEGER NOT NULL DEFAULT 20 CHECK (capacity > 0),
  seats_booked INTEGER NOT NULL DEFAULT 0 CHECK (seats_booked >= 0),
  location_id UUID REFERENCES sydef.locations(id) ON DELETE SET NULL,
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seats_within_capacity CHECK (seats_booked <= capacity)
);

CREATE TABLE sydef.class_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES sydef.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  video_storage_path TEXT,
  duration_seconds INTEGER,
  is_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  author_id UUID REFERENCES sydef.profiles(id) ON DELETE SET NULL,
  status sydef.article_status NOT NULL DEFAULT 'draft',
  tags TEXT[] NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.user_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status sydef.submission_status NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES sydef.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Commerce
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.corporate_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  staff_count INTEGER NOT NULL CHECK (staff_count > 0),
  price_ngn INTEGER NOT NULL CHECK (price_ngn >= 0),
  description TEXT,
  features TEXT[] NOT NULL DEFAULT '{}',
  class_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sydef.profiles(id) ON DELETE SET NULL,
  amount_ngn INTEGER NOT NULL CHECK (amount_ngn >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  status sydef.payment_status NOT NULL DEFAULT 'pending',
  provider sydef.payment_provider NOT NULL,
  provider_ref TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES sydef.classes(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES sydef.class_sessions(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES sydef.payments(id) ON DELETE SET NULL,
  status sydef.booking_status NOT NULL DEFAULT 'pending',
  corporate_invite_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.corporate_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES sydef.corporate_packages(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES sydef.payments(id) ON DELETE SET NULL,
  company_name TEXT,
  status sydef.corporate_order_status NOT NULL DEFAULT 'pending',
  staff_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.corporate_staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_order_id UUID NOT NULL REFERENCES sydef.corporate_orders(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status sydef.invite_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  user_id UUID REFERENCES sydef.profiles(id) ON DELETE SET NULL,
  whatsapp_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (corporate_order_id, phone)
);

ALTER TABLE sydef.bookings
  ADD CONSTRAINT bookings_corporate_invite_fkey
  FOREIGN KEY (corporate_invite_id) REFERENCES sydef.corporate_staff_invites(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Learning
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES sydef.classes(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES sydef.bookings(id) ON DELETE SET NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, class_id)
);

CREATE TABLE sydef.module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES sydef.enrollments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES sydef.class_modules(id) ON DELETE CASCADE,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, module_id)
);

CREATE TABLE sydef.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL UNIQUE REFERENCES sydef.enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES sydef.classes(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Communications & Analytics
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel sydef.notification_channel NOT NULL DEFAULT 'in_app',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  template_name TEXT,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'mock_sent',
  provider_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES sydef.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'interaction',
  page_path TEXT,
  properties JSONB NOT NULL DEFAULT '{}',
  performance_ms NUMERIC,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms NUMERIC,
  details JSONB NOT NULL DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_classes_type ON sydef.classes(type) WHERE is_published = true;
CREATE INDEX idx_classes_location ON sydef.classes(location_id) WHERE is_published = true;
CREATE INDEX idx_class_sessions_class_starts ON sydef.class_sessions(class_id, starts_at);
CREATE INDEX idx_bookings_user ON sydef.bookings(user_id);
CREATE INDEX idx_enrollments_user ON sydef.enrollments(user_id);
CREATE INDEX idx_notifications_user_unread ON sydef.notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_analytics_events_name ON sydef.analytics_events(event_name, created_at DESC);
CREATE INDEX idx_analytics_events_user ON sydef.analytics_events(user_id, created_at DESC);
CREATE INDEX idx_corporate_invites_token ON sydef.corporate_staff_invites(token);
CREATE INDEX idx_corporate_invites_phone ON sydef.corporate_staff_invites(phone);
CREATE INDEX idx_locations_state ON sydef.locations(state);

-- ---------------------------------------------------------------------------
-- Functions & Triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sydef.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON sydef.profiles
  FOR EACH ROW EXECUTE FUNCTION sydef.handle_updated_at();
CREATE TRIGGER classes_updated_at BEFORE UPDATE ON sydef.classes
  FOR EACH ROW EXECUTE FUNCTION sydef.handle_updated_at();
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON sydef.payments
  FOR EACH ROW EXECUTE FUNCTION sydef.handle_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON sydef.bookings
  FOR EACH ROW EXECUTE FUNCTION sydef.handle_updated_at();
CREATE TRIGGER corporate_orders_updated_at BEFORE UPDATE ON sydef.corporate_orders
  FOR EACH ROW EXECUTE FUNCTION sydef.handle_updated_at();
CREATE TRIGGER module_progress_updated_at BEFORE UPDATE ON sydef.module_progress
  FOR EACH ROW EXECUTE FUNCTION sydef.handle_updated_at();
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON sydef.articles
  FOR EACH ROW EXECUTE FUNCTION sydef.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION sydef.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sydef.profiles (id, phone, full_name)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.phone)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sydef.handle_new_user();

-- Role helper (avoids RLS recursion)
CREATE OR REPLACE FUNCTION sydef.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sydef.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sydef.is_corporate_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sydef.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'corporate_admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Atomic seat booking
CREATE OR REPLACE FUNCTION sydef.book_session_seat(p_session_id UUID, p_user_id UUID, p_class_id UUID, p_payment_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  UPDATE sydef.class_sessions
  SET seats_booked = seats_booked + 1
  WHERE id = p_session_id
    AND is_cancelled = false
    AND seats_booked < capacity
  RETURNING id INTO p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session full or unavailable';
  END IF;

  INSERT INTO sydef.bookings (user_id, class_id, session_id, payment_id, status)
  VALUES (p_user_id, p_class_id, p_session_id, p_payment_id, 'confirmed')
  RETURNING id INTO v_booking_id;

  INSERT INTO sydef.enrollments (user_id, class_id, booking_id)
  VALUES (p_user_id, p_class_id, v_booking_id)
  ON CONFLICT (user_id, class_id) DO NOTHING;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE sydef.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.class_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.user_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.corporate_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.corporate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.corporate_staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.health_checks ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "platform_settings_public_read" ON sydef.platform_settings FOR SELECT USING (true);
CREATE POLICY "locations_public_read" ON sydef.locations FOR SELECT USING (is_active = true);
CREATE POLICY "instructors_public_read" ON sydef.instructors FOR SELECT USING (is_active = true);
CREATE POLICY "classes_public_read" ON sydef.classes FOR SELECT USING (is_published = true);
CREATE POLICY "sessions_public_read" ON sydef.class_sessions FOR SELECT USING (is_cancelled = false);
CREATE POLICY "modules_public_read" ON sydef.class_modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM sydef.classes c WHERE c.id = class_id AND c.is_published = true)
);
CREATE POLICY "articles_public_read" ON sydef.articles FOR SELECT USING (status = 'published');
CREATE POLICY "packages_public_read" ON sydef.corporate_packages FOR SELECT USING (is_active = true);

-- Profiles
CREATE POLICY "profiles_read_own" ON sydef.profiles FOR SELECT USING (auth.uid() = id OR sydef.is_admin());
CREATE POLICY "profiles_update_own" ON sydef.profiles FOR UPDATE USING (auth.uid() = id OR sydef.is_admin());

-- Member-owned data
CREATE POLICY "bookings_read_own" ON sydef.bookings FOR SELECT USING (auth.uid() = user_id OR sydef.is_admin());
CREATE POLICY "bookings_insert_own" ON sydef.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments_read_own" ON sydef.payments FOR SELECT USING (auth.uid() = user_id OR sydef.is_admin());

CREATE POLICY "enrollments_read_own" ON sydef.enrollments FOR SELECT USING (auth.uid() = user_id OR sydef.is_admin());
CREATE POLICY "module_progress_read_own" ON sydef.module_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM sydef.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
  OR sydef.is_admin()
);
CREATE POLICY "module_progress_upsert_own" ON sydef.module_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM sydef.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
);

CREATE POLICY "certificates_read_own" ON sydef.certificates FOR SELECT USING (auth.uid() = user_id OR sydef.is_admin());

CREATE POLICY "notifications_read_own" ON sydef.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON sydef.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "submissions_read_own" ON sydef.user_submissions FOR SELECT USING (auth.uid() = user_id OR sydef.is_admin());
CREATE POLICY "submissions_insert_own" ON sydef.user_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Corporate
CREATE POLICY "corporate_orders_read" ON sydef.corporate_orders FOR SELECT USING (
  auth.uid() = buyer_id OR sydef.is_admin()
);
CREATE POLICY "corporate_invites_read" ON sydef.corporate_staff_invites FOR SELECT USING (
  sydef.is_admin()
  OR sydef.is_corporate_admin()
  OR auth.uid() = user_id
  OR phone = (SELECT phone FROM sydef.profiles WHERE id = auth.uid())
);

-- Analytics: anyone can insert (anon + auth), admins read all
CREATE POLICY "analytics_insert" ON sydef.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "analytics_admin_read" ON sydef.analytics_events FOR SELECT USING (sydef.is_admin());

-- Admin full access
CREATE POLICY "admin_all_platform_settings" ON sydef.platform_settings FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_locations" ON sydef.locations FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_instructors" ON sydef.instructors FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_classes" ON sydef.classes FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_sessions" ON sydef.class_sessions FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_modules" ON sydef.class_modules FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_articles" ON sydef.articles FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_submissions" ON sydef.user_submissions FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_packages" ON sydef.corporate_packages FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_payments" ON sydef.payments FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_bookings" ON sydef.bookings FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_corporate_orders" ON sydef.corporate_orders FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_invites" ON sydef.corporate_staff_invites FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_whatsapp" ON sydef.whatsapp_logs FOR ALL USING (sydef.is_admin());
CREATE POLICY "admin_all_health" ON sydef.health_checks FOR ALL USING (sydef.is_admin());

-- Storage bucket for course videos (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('course-videos', 'course-videos', false, 524288000)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "enrolled_users_read_videos" ON storage.objects FOR SELECT USING (
  bucket_id = 'course-videos'
  AND sydef.is_admin()
);

-- Initial platform settings row
INSERT INTO sydef.platform_settings (mode, site_name, site_tagline)
VALUES ('mock', 'Sydef', 'Psychology of Self Defence');
