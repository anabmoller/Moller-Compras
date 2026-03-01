-- ============================================================
-- MIGRATION 005: Establishments + User↔Establishment Junction
-- Date: 2026-03-01
-- Purpose: Ensure establishments table has the 6 core estancias
--          with email. Create N:N junction for user assignments.
-- ============================================================

-- 1. Add email column to establishments if it doesn't exist
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Add UNIQUE constraint on email (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'establishments_email_key'
  ) THEN
    ALTER TABLE establishments ADD CONSTRAINT establishments_email_key UNIQUE (email);
  END IF;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- 3. Upsert 6 core establishments
INSERT INTO establishments (name, email) VALUES
  ('Estancia Ypoti', 'ypoti@ypoti.com'),
  ('Estancia Cerro Memby', 'cerromemby@ypoti.com'),
  ('Estancia Lusipar', 'lusipar@ypoti.com'),
  ('Estancia Santa Clara', 'santaclara@ypoti.com'),
  ('Estancia Cielo Azul', 'cieloazul@ypoti.com'),
  ('Estancia Ybyporã', 'ybypara@ypoti.com')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, active = true;

-- 4. Create user_establishments junction table
CREATE TABLE IF NOT EXISTS user_establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, establishment_id)
);

-- 5. RLS policies for junction table (idempotent)
ALTER TABLE user_establishments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_establishments_select ON user_establishments;
CREATE POLICY user_establishments_select ON user_establishments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS user_establishments_admin ON user_establishments;
CREATE POLICY user_establishments_admin ON user_establishments FOR ALL USING (is_admin());

-- 6. Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_establishments_user ON user_establishments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_establishments_estab ON user_establishments(establishment_id);

-- 7. Verification
SELECT 'Establishments + junction created' AS status,
       COUNT(*) AS total_establishments
FROM establishments WHERE active = true;
