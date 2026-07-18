-- Payment providers: Paystack (primary), Flutterwave (secondary), Stripe (tertiary)

ALTER TYPE sydef.payment_provider ADD VALUE IF NOT EXISTS 'paystack';
ALTER TYPE sydef.payment_provider ADD VALUE IF NOT EXISTS 'flutterwave';

ALTER TABLE sydef.payments
  ADD COLUMN IF NOT EXISTS paystack_reference TEXT,
  ADD COLUMN IF NOT EXISTS paystack_access_code TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_tx_ref TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_transaction_id TEXT;

ALTER TABLE sydef.platform_settings
  ADD COLUMN IF NOT EXISTS paystack_configured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flutterwave_configured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS primary_payment_provider TEXT NOT NULL DEFAULT 'paystack',
  ADD COLUMN IF NOT EXISTS secondary_payment_provider TEXT NOT NULL DEFAULT 'flutterwave',
  ADD COLUMN IF NOT EXISTS tertiary_payment_provider TEXT NOT NULL DEFAULT 'stripe';

CREATE INDEX IF NOT EXISTS idx_payments_paystack_ref ON sydef.payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payments_flutterwave_ref ON sydef.payments(flutterwave_tx_ref);
