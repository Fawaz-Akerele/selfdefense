-- Extend admin capabilities (must commit before policies reference new values)

ALTER TYPE sydef.admin_capability ADD VALUE IF NOT EXISTS 'scheduling';
ALTER TYPE sydef.admin_capability ADD VALUE IF NOT EXISTS 'plans';
ALTER TYPE sydef.admin_capability ADD VALUE IF NOT EXISTS 'security';
