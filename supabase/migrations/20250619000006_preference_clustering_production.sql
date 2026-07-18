-- Sydef production: preference clustering, flexible plans, security alert pipeline, gym partners

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE sydef.session_modality AS ENUM ('in_person', 'virtual', 'hybrid');
CREATE TYPE sydef.cluster_status AS ENUM ('forming', 'ready', 'confirmed', 'expired', 'cancelled');
CREATE TYPE sydef.billing_interval AS ENUM ('monthly', 'annual', 'per_session', 'one_time');
CREATE TYPE sydef.subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'expired');
CREATE TYPE sydef.entitlement_key AS ENUM (
  'in_person_sessions_per_month',
  'virtual_access',
  'security_alerts',
  'priority_scheduling',
  'corporate_seats'
);
CREATE TYPE sydef.security_alert_status AS ENUM ('pending_review', 'approved', 'rejected', 'archived');
CREATE TYPE sydef.user_place_type AS ENUM ('home', 'work', 'frequent', 'commute_waypoint');

-- ---------------------------------------------------------------------------
-- Platform tuning
-- ---------------------------------------------------------------------------

ALTER TABLE sydef.platform_settings
  ADD COLUMN IF NOT EXISTS min_cluster_size INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS cluster_booking_window_hours INTEGER NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS default_session_capacity INTEGER NOT NULL DEFAULT 20;

-- ---------------------------------------------------------------------------
-- Gym / partner venues
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.gym_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  location_id UUID REFERENCES sydef.locations(id) ON DELETE SET NULL,
  revenue_share_percent NUMERIC(5,2) DEFAULT 0 CHECK (revenue_share_percent >= 0 AND revenue_share_percent <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Demand-first scheduling
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.scheduling_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES sydef.classes(id) ON DELETE SET NULL,
  location_id UUID NOT NULL REFERENCES sydef.locations(id) ON DELETE CASCADE,
  modality sydef.session_modality NOT NULL DEFAULT 'in_person',
  preferred_days SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  time_band_start TIME NOT NULL DEFAULT '09:00',
  time_band_end TIME NOT NULL DEFAULT '18:00',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_band CHECK (time_band_end > time_band_start)
);

CREATE TABLE sydef.demand_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES sydef.classes(id) ON DELETE SET NULL,
  location_id UUID NOT NULL REFERENCES sydef.locations(id) ON DELETE CASCADE,
  gym_partner_id UUID REFERENCES sydef.gym_partners(id) ON DELETE SET NULL,
  modality sydef.session_modality NOT NULL DEFAULT 'in_person',
  preferred_days SMALLINT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  time_band_start TIME NOT NULL,
  time_band_end TIME NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  min_size INTEGER NOT NULL DEFAULT 8,
  status sydef.cluster_status NOT NULL DEFAULT 'forming',
  proposed_starts_at TIMESTAMPTZ,
  proposed_ends_at TIMESTAMPTZ,
  confirmed_session_id UUID REFERENCES sydef.class_sessions(id) ON DELETE SET NULL,
  booking_deadline TIMESTAMPTZ,
  confirmed_by UUID REFERENCES sydef.profiles(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.cluster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES sydef.demand_clusters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  preference_id UUID REFERENCES sydef.scheduling_preferences(id) ON DELETE SET NULL,
  notified_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cluster_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Flexible billing & entitlements
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  billing_interval sydef.billing_interval NOT NULL,
  price_ngn INTEGER NOT NULL CHECK (price_ngn >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.plan_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES sydef.pricing_plans(id) ON DELETE CASCADE,
  entitlement sydef.entitlement_key NOT NULL,
  value_int INTEGER,
  value_bool BOOLEAN,
  value_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, entitlement)
);

CREATE TABLE sydef.member_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES sydef.pricing_plans(id) ON DELETE RESTRICT,
  status sydef.subscription_status NOT NULL DEFAULT 'active',
  payment_id UUID REFERENCES sydef.payments(id) ON DELETE SET NULL,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  sessions_used_this_period INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- User geography for alert matching
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.user_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  place_type sydef.user_place_type NOT NULL DEFAULT 'frequent',
  location_id UUID REFERENCES sydef.locations(id) ON DELETE SET NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  radius_km NUMERIC(6,2) NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Security intelligence pipeline (admin-gated)
-- ---------------------------------------------------------------------------

CREATE TABLE sydef.security_alert_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'general',
  source_name TEXT,
  source_url TEXT,
  location_id UUID REFERENCES sydef.locations(id) ON DELETE SET NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  radius_km NUMERIC(6,2) DEFAULT 10,
  status sydef.security_alert_status NOT NULL DEFAULT 'pending_review',
  ai_confidence NUMERIC(4,3),
  raw_payload JSONB NOT NULL DEFAULT '{}',
  reviewer_id UUID REFERENCES sydef.profiles(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_sched_prefs_user ON sydef.scheduling_preferences(user_id) WHERE is_active = true;
CREATE INDEX idx_sched_prefs_location ON sydef.scheduling_preferences(location_id, modality) WHERE is_active = true;
CREATE INDEX idx_demand_clusters_status ON sydef.demand_clusters(status, location_id);
CREATE INDEX idx_cluster_members_user ON sydef.cluster_members(user_id);
CREATE INDEX idx_member_subs_user ON sydef.member_subscriptions(user_id, status);
CREATE INDEX idx_user_places_user ON sydef.user_places(user_id) WHERE is_active = true;
CREATE INDEX idx_security_drafts_status ON sydef.security_alert_drafts(status, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE sydef.gym_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.scheduling_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.demand_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.plan_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.user_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.security_alert_drafts ENABLE ROW LEVEL SECURITY;

-- Public read active plans
CREATE POLICY "read active plans" ON sydef.pricing_plans FOR SELECT USING (is_active = true AND is_public = true);
CREATE POLICY "read plan entitlements" ON sydef.plan_entitlements FOR SELECT USING (
  EXISTS (SELECT 1 FROM sydef.pricing_plans p WHERE p.id = plan_id AND p.is_active = true)
);

-- Member owns preferences, places, subscriptions
CREATE POLICY "own scheduling prefs" ON sydef.scheduling_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own user places" ON sydef.user_places FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own subscriptions read" ON sydef.member_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Clusters: members read clusters they belong to; admins read all
CREATE POLICY "member read own clusters" ON sydef.demand_clusters FOR SELECT USING (
  sydef.has_capability('scheduling'::sydef.admin_capability)
  OR EXISTS (SELECT 1 FROM sydef.cluster_members m WHERE m.cluster_id = id AND m.user_id = auth.uid())
);

CREATE POLICY "member read cluster membership" ON sydef.cluster_members FOR SELECT USING (
  auth.uid() = user_id OR sydef.has_capability('scheduling'::sydef.admin_capability)
);

CREATE POLICY "admin manage clusters" ON sydef.demand_clusters FOR ALL
  USING (sydef.has_capability('scheduling'::sydef.admin_capability))
  WITH CHECK (sydef.has_capability('scheduling'::sydef.admin_capability));

CREATE POLICY "admin manage cluster members" ON sydef.cluster_members FOR ALL
  USING (sydef.has_capability('scheduling'::sydef.admin_capability))
  WITH CHECK (sydef.has_capability('scheduling'::sydef.admin_capability));

CREATE POLICY "admin gym partners" ON sydef.gym_partners FOR ALL
  USING (sydef.has_capability('scheduling'::sydef.admin_capability))
  WITH CHECK (sydef.has_capability('scheduling'::sydef.admin_capability));

CREATE POLICY "admin plans" ON sydef.pricing_plans FOR ALL
  USING (sydef.has_capability('plans'::sydef.admin_capability))
  WITH CHECK (sydef.has_capability('plans'::sydef.admin_capability));

CREATE POLICY "admin plan entitlements" ON sydef.plan_entitlements FOR ALL
  USING (sydef.has_capability('plans'::sydef.admin_capability))
  WITH CHECK (sydef.has_capability('plans'::sydef.admin_capability));

CREATE POLICY "admin subscriptions" ON sydef.member_subscriptions FOR ALL
  USING (sydef.has_capability('plans'::sydef.admin_capability))
  WITH CHECK (sydef.has_capability('plans'::sydef.admin_capability));

CREATE POLICY "admin security drafts" ON sydef.security_alert_drafts FOR ALL
  USING (sydef.has_capability('security'::sydef.admin_capability))
  WITH CHECK (sydef.has_capability('security'::sydef.admin_capability));

-- ---------------------------------------------------------------------------
-- Clustering: assign preference to matching cluster or create new
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sydef.upsert_scheduling_preference(
  p_user_id UUID,
  p_class_id UUID,
  p_location_id UUID,
  p_modality sydef.session_modality,
  p_preferred_days SMALLINT[],
  p_time_start TIME,
  p_time_end TIME,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pref_id UUID;
  v_cluster_id UUID;
  v_min_size INTEGER;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id AND NOT sydef.is_super_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT min_cluster_size INTO v_min_size FROM sydef.platform_settings LIMIT 1;
  IF v_min_size IS NULL THEN v_min_size := 8; END IF;

  INSERT INTO sydef.scheduling_preferences (
    user_id, class_id, location_id, modality, preferred_days,
    time_band_start, time_band_end, notes
  ) VALUES (
    p_user_id, p_class_id, p_location_id, p_modality, p_preferred_days,
    p_time_start, p_time_end, p_notes
  ) RETURNING id INTO v_pref_id;

  SELECT c.id INTO v_cluster_id
  FROM sydef.demand_clusters c
  WHERE c.location_id = p_location_id
    AND c.modality = p_modality
    AND c.status IN ('forming', 'ready')
    AND (c.class_id IS NOT DISTINCT FROM p_class_id)
    AND c.preferred_days && p_preferred_days
    AND c.time_band_start <= p_time_end
    AND c.time_band_end >= p_time_start
  ORDER BY c.member_count DESC
  LIMIT 1;

  IF v_cluster_id IS NULL THEN
    INSERT INTO sydef.demand_clusters (
      class_id, location_id, modality, preferred_days,
      time_band_start, time_band_end, min_size, member_count
    ) VALUES (
      p_class_id, p_location_id, p_modality, p_preferred_days,
      p_time_start, p_time_end, v_min_size, 0
    ) RETURNING id INTO v_cluster_id;
  END IF;

  INSERT INTO sydef.cluster_members (cluster_id, user_id, preference_id)
  VALUES (v_cluster_id, p_user_id, v_pref_id)
  ON CONFLICT (cluster_id, user_id) DO NOTHING;

  UPDATE sydef.demand_clusters
  SET member_count = (SELECT COUNT(*) FROM sydef.cluster_members WHERE cluster_id = v_cluster_id),
      updated_at = now()
  WHERE id = v_cluster_id;

  RETURN v_pref_id;
END;
$$;

-- Recompute cluster statuses (forming -> ready when threshold met)
CREATE OR REPLACE FUNCTION sydef.refresh_demand_clusters()
RETURNS TABLE(clusters_ready INTEGER, notifications_queued INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ready INTEGER := 0;
  v_notified INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.id, c.member_count, c.min_size, c.status
    FROM sydef.demand_clusters c
    WHERE c.status = 'forming' AND c.member_count >= c.min_size
  LOOP
    UPDATE sydef.demand_clusters
    SET status = 'ready', updated_at = now()
    WHERE id = r.id;
    v_ready := v_ready + 1;
  END LOOP;

  FOR r IN
    SELECT cm.user_id, c.id AS cluster_id, c.class_id, c.location_id
    FROM sydef.demand_clusters c
    JOIN sydef.cluster_members cm ON cm.cluster_id = c.id
    WHERE c.status = 'ready' AND cm.notified_at IS NULL
  LOOP
    INSERT INTO sydef.notifications (user_id, title, body, channel, metadata)
    VALUES (
      r.user_id,
      'Class demand reached — slot opening soon',
      'Enough members in your area match your preferences. An admin will confirm dates shortly. You will be notified to book.',
      'in_app',
      jsonb_build_object('type', 'cluster_ready', 'clusterId', r.cluster_id)
    );
    UPDATE sydef.cluster_members SET notified_at = now() WHERE cluster_id = r.cluster_id AND user_id = r.user_id;
    v_notified := v_notified + 1;
  END LOOP;

  RETURN QUERY SELECT v_ready, v_notified;
END;
$$;

-- Admin confirms cluster → creates session + notifies members to book
CREATE OR REPLACE FUNCTION sydef.confirm_demand_cluster(
  p_cluster_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_admin_id UUID,
  p_gym_partner_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cluster sydef.demand_clusters%ROWTYPE;
  v_session_id UUID;
  v_class_id UUID;
  v_capacity INTEGER;
  v_window_hours INTEGER;
  r RECORD;
BEGIN
  IF NOT sydef.has_capability('scheduling'::sydef.admin_capability) AND NOT sydef.is_super_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_cluster FROM sydef.demand_clusters WHERE id = p_cluster_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cluster not found'; END IF;
  IF v_cluster.status NOT IN ('ready', 'forming') THEN RAISE EXCEPTION 'Cluster not confirmable'; END IF;

  v_class_id := v_cluster.class_id;
  IF v_class_id IS NULL THEN
    SELECT id INTO v_class_id FROM sydef.classes WHERE is_published = true ORDER BY created_at LIMIT 1;
  END IF;
  IF v_class_id IS NULL THEN RAISE EXCEPTION 'No class available for cluster'; END IF;

  SELECT default_session_capacity, cluster_booking_window_hours
  INTO v_capacity, v_window_hours FROM sydef.platform_settings LIMIT 1;
  IF v_capacity IS NULL THEN v_capacity := 20; END IF;
  IF v_window_hours IS NULL THEN v_window_hours := 48; END IF;

  INSERT INTO sydef.class_sessions (
    class_id, starts_at, ends_at, capacity, location_id
  ) VALUES (
    v_class_id, p_starts_at, p_ends_at, v_capacity, v_cluster.location_id
  ) RETURNING id INTO v_session_id;

  UPDATE sydef.demand_clusters
  SET status = 'confirmed',
      proposed_starts_at = p_starts_at,
      proposed_ends_at = p_ends_at,
      confirmed_session_id = v_session_id,
      confirmed_by = p_admin_id,
      confirmed_at = now(),
      gym_partner_id = p_gym_partner_id,
      booking_deadline = now() + (v_window_hours || ' hours')::interval,
      updated_at = now()
  WHERE id = p_cluster_id;

  FOR r IN SELECT user_id FROM sydef.cluster_members WHERE cluster_id = p_cluster_id LOOP
    INSERT INTO sydef.notifications (user_id, title, body, channel, metadata)
    VALUES (
      r.user_id,
      'Your class is confirmed — book now',
      'A session matching your preferences has been scheduled. Book within ' || v_window_hours || ' hours.',
      'in_app',
      jsonb_build_object(
        'type', 'cluster_confirmed',
        'clusterId', p_cluster_id,
        'sessionId', v_session_id,
        'bookingDeadline', (now() + (v_window_hours || ' hours')::interval)
      )
    );
  END LOOP;

  RETURN v_session_id;
END;
$$;

-- Approve security alert and fan-out to matched users (admin only)
CREATE OR REPLACE FUNCTION sydef.approve_security_alert(
  p_draft_id UUID,
  p_reviewer_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_draft sydef.security_alert_drafts%ROWTYPE;
  v_sent INTEGER := 0;
  r RECORD;
BEGIN
  IF NOT sydef.has_capability('security'::sydef.admin_capability) AND NOT sydef.is_super_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_draft FROM sydef.security_alert_drafts WHERE id = p_draft_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Draft not found'; END IF;
  IF v_draft.status <> 'pending_review' THEN RAISE EXCEPTION 'Draft not pending'; END IF;

  UPDATE sydef.security_alert_drafts
  SET status = 'approved',
      reviewer_id = p_reviewer_id,
      reviewer_notes = p_notes,
      reviewed_at = now(),
      published_at = now()
  WHERE id = p_draft_id;

  FOR r IN
    SELECT DISTINCT up.user_id
    FROM sydef.user_places up
    JOIN sydef.member_subscriptions ms ON ms.user_id = up.user_id AND ms.status = 'active'
    JOIN sydef.plan_entitlements pe ON pe.plan_id = ms.plan_id
      AND pe.entitlement = 'security_alerts' AND pe.value_bool = true
    WHERE up.is_active = true
      AND (
        (v_draft.location_id IS NOT NULL AND up.location_id = v_draft.location_id)
        OR (v_draft.location_id IS NULL)
      )
  LOOP
    INSERT INTO sydef.notifications (user_id, title, body, channel, metadata)
    VALUES (
      r.user_id,
      v_draft.title,
      v_draft.summary,
      'in_app',
      jsonb_build_object(
        'type', 'security_alert',
        'alertId', p_draft_id,
        'severity', v_draft.severity,
        'category', v_draft.category
      )
    );
    v_sent := v_sent + 1;
  END LOOP;

  RETURN v_sent;
END;
$$;

-- Seed default pricing plans
INSERT INTO sydef.pricing_plans (slug, name, description, billing_interval, price_ngn, sort_order)
VALUES
  ('community-monthly', 'Community Monthly', '2 in-person sessions + security alerts', 'monthly', 15000, 1),
  ('guardian-annual', 'Guardian Annual', 'Unlimited virtual + 12 sessions/year + alerts', 'annual', 120000, 2),
  ('pay-per-session', 'Pay Per Session', 'Single confirmed class booking', 'per_session', 85000, 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO sydef.plan_entitlements (plan_id, entitlement, value_int, value_bool)
SELECT p.id, e.entitlement, e.value_int, e.value_bool
FROM sydef.pricing_plans p
JOIN (VALUES
  ('community-monthly', 'in_person_sessions_per_month'::sydef.entitlement_key, 2, NULL::boolean),
  ('community-monthly', 'security_alerts'::sydef.entitlement_key, NULL, true),
  ('community-monthly', 'virtual_access'::sydef.entitlement_key, NULL, true),
  ('guardian-annual', 'in_person_sessions_per_month'::sydef.entitlement_key, 1, NULL),
  ('guardian-annual', 'security_alerts'::sydef.entitlement_key, NULL, true),
  ('guardian-annual', 'virtual_access'::sydef.entitlement_key, NULL, true),
  ('guardian-annual', 'priority_scheduling'::sydef.entitlement_key, NULL, true),
  ('pay-per-session', 'in_person_sessions_per_month'::sydef.entitlement_key, 1, NULL)
) AS e(slug, entitlement, value_int, value_bool) ON p.slug = e.slug
ON CONFLICT (plan_id, entitlement) DO NOTHING;
