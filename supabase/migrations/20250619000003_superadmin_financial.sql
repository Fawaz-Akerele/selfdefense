-- Super admin, admin capability grants, email verification codes, financial ledger

ALTER TYPE sydef.user_role ADD VALUE IF NOT EXISTS 'super_admin';

ALTER TABLE sydef.platform_settings
  ADD COLUMN IF NOT EXISTS super_admin_email TEXT NOT NULL DEFAULT 'oadeagbo@gmail.com';

CREATE TYPE sydef.admin_capability AS ENUM (
  'content',
  'analytics',
  'financial',
  'bookings',
  'corporate',
  'settings'
);

CREATE TABLE sydef.admin_capability_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  capability sydef.admin_capability NOT NULL,
  granted_by UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, capability)
);

CREATE TYPE sydef.verification_purpose AS ENUM (
  'superadmin_login',
  'password_change',
  'superadmin_transfer'
);

CREATE TABLE sydef.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose sydef.verification_purpose NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sydef.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'mock_sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_codes_email ON sydef.email_verification_codes(email, purpose);
CREATE INDEX idx_admin_grants_user ON sydef.admin_capability_grants(user_id);
CREATE INDEX idx_payments_created ON sydef.payments(created_at DESC) WHERE status = 'succeeded';

ALTER TABLE sydef.admin_capability_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.email_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sydef.email_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION sydef.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sydef.profiles p
    JOIN sydef.platform_settings ps ON ps.super_admin_email = (
      SELECT au.email FROM auth.users au WHERE au.id = p.id
    )
    WHERE p.id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM sydef.profiles WHERE id = auth.uid() AND role::text = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sydef.has_capability(cap sydef.admin_capability)
RETURNS BOOLEAN AS $$
  SELECT sydef.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM sydef.admin_capability_grants
    WHERE user_id = auth.uid() AND capability = cap
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE POLICY "superadmin_manage_grants" ON sydef.admin_capability_grants
  FOR ALL USING (sydef.is_super_admin());
CREATE POLICY "users_read_own_grants" ON sydef.admin_capability_grants
  FOR SELECT USING (auth.uid() = user_id OR sydef.is_super_admin());

CREATE POLICY "superadmin_email_codes" ON sydef.email_verification_codes
  FOR ALL USING (sydef.is_super_admin());
CREATE POLICY "admin_email_logs" ON sydef.email_logs
  FOR SELECT USING (sydef.is_super_admin() OR sydef.is_admin());

CREATE POLICY "superadmin_insert_email_logs" ON sydef.email_logs
  FOR INSERT WITH CHECK (true);

-- Financial view for P&L portal
CREATE OR REPLACE VIEW sydef.financial_ledger AS
SELECT
  p.id,
  p.created_at AS transaction_date,
  p.amount_ngn AS amount,
  p.currency,
  p.provider,
  p.status,
  p.metadata->>'purpose' AS purpose,
  pr.full_name AS customer_name,
  au.email AS customer_email
FROM sydef.payments p
LEFT JOIN sydef.profiles pr ON pr.id = p.user_id
LEFT JOIN auth.users au ON au.id = p.user_id
WHERE p.status IN ('succeeded', 'refunded');

UPDATE sydef.platform_settings SET super_admin_email = 'oadeagbo@gmail.com';

-- Mock seed payments for financial portal testing
INSERT INTO sydef.payments (user_id, amount_ngn, status, provider, provider_ref, metadata, created_at)
SELECT NULL, 85000, 'succeeded', 'mock', 'mock_seed_001', '{"purpose":"class_booking","class_id":"b0000001-0000-4000-8000-000000000001"}'::jsonb, now() - interval '5 days'
WHERE NOT EXISTS (SELECT 1 FROM sydef.payments WHERE provider_ref = 'mock_seed_001');

INSERT INTO sydef.payments (user_id, amount_ngn, status, provider, provider_ref, metadata, created_at)
SELECT NULL, 1500000, 'succeeded', 'paystack', 'mock_seed_002', '{"purpose":"corporate_package"}'::jsonb, now() - interval '2 days'
WHERE NOT EXISTS (SELECT 1 FROM sydef.payments WHERE provider_ref = 'mock_seed_002');

INSERT INTO sydef.payments (user_id, amount_ngn, status, provider, provider_ref, metadata, created_at)
SELECT NULL, 45000, 'succeeded', 'flutterwave', 'mock_seed_003', '{"purpose":"online_enrollment"}'::jsonb, now() - interval '1 day'
WHERE NOT EXISTS (SELECT 1 FROM sydef.payments WHERE provider_ref = 'mock_seed_003');
