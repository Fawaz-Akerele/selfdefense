-- Location coordinates, venue details, session reminders & direction map support

ALTER TABLE sydef.locations
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS landmark TEXT;

CREATE TYPE sydef.reminder_channel AS ENUM ('in_app', 'whatsapp', 'both');
CREATE TYPE sydef.reminder_status AS ENUM ('scheduled', 'sent', 'cancelled', 'failed');

CREATE TABLE sydef.session_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES sydef.profiles(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sydef.class_sessions(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES sydef.bookings(id) ON DELETE SET NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  channel sydef.reminder_channel NOT NULL DEFAULT 'both',
  include_directions_map BOOLEAN NOT NULL DEFAULT true,
  status sydef.reminder_status NOT NULL DEFAULT 'scheduled',
  sent_at TIMESTAMPTZ,
  directions_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id, remind_at)
);

CREATE INDEX idx_session_reminders_due ON sydef.session_reminders(remind_at)
  WHERE status = 'scheduled';
CREATE INDEX idx_session_reminders_user ON sydef.session_reminders(user_id);

ALTER TABLE sydef.session_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_read_own" ON sydef.session_reminders
  FOR SELECT USING (auth.uid() = user_id OR sydef.is_admin());
CREATE POLICY "reminders_insert_own" ON sydef.session_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_own" ON sydef.session_reminders
  FOR UPDATE USING (auth.uid() = user_id OR sydef.is_admin());
CREATE POLICY "reminders_delete_own" ON sydef.session_reminders
  FOR DELETE USING (auth.uid() = user_id OR sydef.is_admin());
CREATE POLICY "admin_all_reminders" ON sydef.session_reminders
  FOR ALL USING (sydef.is_admin());

-- Enrich seed locations with coordinates (Lagos, Abuja, etc.)
UPDATE sydef.locations SET
  venue_name = 'Sydef Training Centre — Ikeja',
  address = '12 Allen Avenue, Ikeja',
  latitude = 6.6018,
  longitude = 3.3515,
  landmark = 'Near Ikeja City Mall'
WHERE state = 'Lagos' AND city = 'Ikeja';

UPDATE sydef.locations SET
  venue_name = 'Sydef Studio — Lekki',
  address = '45 Admiralty Way, Lekki Phase 1',
  latitude = 6.4474,
  longitude = 3.4723,
  landmark = 'Opposite Lekki Conservation Centre'
WHERE state = 'Lagos' AND city = 'Lekki';

UPDATE sydef.locations SET
  venue_name = 'Sydef HQ — Victoria Island',
  address = '8 Akin Adesola Street, VI',
  latitude = 6.4281,
  longitude = 3.4219,
  landmark = 'Near Eko Hotel'
WHERE state = 'Lagos' AND city = 'Victoria Island';

UPDATE sydef.locations SET
  venue_name = 'Sydef Academy — Abuja',
  address = '22 Adetokunbo Ademola Crescent, Wuse 2',
  latitude = 9.0765,
  longitude = 7.4898,
  landmark = 'Near Silverbird Galleria'
WHERE state = 'FCT' AND city = 'Abuja';

UPDATE sydef.locations SET
  venue_name = 'Sydef Centre — Port Harcourt',
  address = '5 Aba Road, GRA Phase 2',
  latitude = 4.8156,
  longitude = 7.0498,
  landmark = 'GRA Junction'
WHERE state = 'Rivers' AND city = 'Port Harcourt';
