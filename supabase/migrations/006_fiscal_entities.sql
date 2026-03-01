-- ============================================================
-- MIGRATION 006: Fiscal Entities + User↔Fiscal Entity Junction
-- Date: 2026-03-01
-- Purpose: Create fiscal_entities table for legal/tax entities
--          (companies and individuals with RUC). Create N:N
--          junction for user-entity relationships.
-- ============================================================

-- 1. Create fiscal_entities table
CREATE TABLE IF NOT EXISTS fiscal_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  ruc TEXT UNIQUE,
  billing_address_reference TEXT DEFAULT 'Av. Aviadores del Chaco 1410, The TOP Business Center, Asunción',
  phone TEXT DEFAULT '(021) 338 5743',
  cell_phone TEXT DEFAULT '0982 119 007',
  invoice_email TEXT DEFAULT 'contabilidad@ypoti.com',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS policies (idempotent)
ALTER TABLE fiscal_entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fiscal_entities_select ON fiscal_entities;
CREATE POLICY fiscal_entities_select ON fiscal_entities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS fiscal_entities_admin ON fiscal_entities;
CREATE POLICY fiscal_entities_admin ON fiscal_entities FOR ALL USING (is_admin());

-- 3. Insert 6 fiscal entities
INSERT INTO fiscal_entities (legal_name, ruc) VALUES
  ('Rural Bioenergia S.A.', '80050418-6'),
  ('La Constancia EAS', '80141439-3'),
  ('Chacobras S.A.', '80100684-8'),
  ('Pedro Moller', '8717666-1'),
  ('Gabriel Moller', '8719137-7'),
  ('Ana Moller', '8719136-9')
ON CONFLICT (ruc) DO UPDATE SET
  legal_name = EXCLUDED.legal_name, active = true;

-- 4. Create user_fiscal_entities junction table
CREATE TABLE IF NOT EXISTS user_fiscal_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fiscal_entity_id UUID NOT NULL REFERENCES fiscal_entities(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fiscal_entity_id)
);

-- 5. RLS policies for junction table (idempotent)
ALTER TABLE user_fiscal_entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_fiscal_entities_select ON user_fiscal_entities;
CREATE POLICY user_fiscal_entities_select ON user_fiscal_entities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS user_fiscal_entities_admin ON user_fiscal_entities;
CREATE POLICY user_fiscal_entities_admin ON user_fiscal_entities FOR ALL USING (is_admin());

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_user_fiscal_entities_user ON user_fiscal_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fiscal_entities_entity ON user_fiscal_entities(fiscal_entity_id);

-- 7. Verification
SELECT 'Fiscal entities + junction created' AS status,
       COUNT(*) AS total_fiscal_entities
FROM fiscal_entities WHERE active = true;
