-- ============================================================
-- MIGRATION 004: Functional Accounts — Ypoti Compras
-- Date: 2026-03-01
-- Purpose: Separate functional/service accounts from real users.
--          These are non-approver accounts for departments/services.
-- ============================================================

-- 1. Create functional_accounts table
CREATE TABLE IF NOT EXISTS functional_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  description TEXT,
  can_approve BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS policies (idempotent: drop-if-exists before create)
ALTER TABLE functional_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS functional_accounts_select ON functional_accounts;
CREATE POLICY functional_accounts_select ON functional_accounts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS functional_accounts_admin ON functional_accounts;
CREATE POLICY functional_accounts_admin ON functional_accounts FOR ALL USING (is_admin());

-- 3. Insert 11 functional accounts
INSERT INTO functional_accounts (name, email, description, can_approve) VALUES
  ('Administración Oficina', 'admoficina@ypoti.com', 'Conta funcional — administración de la oficina', false),
  ('Confinamiento', 'confinamiento@ypoti.com', 'Conta funcional — sector de confinamiento', false),
  ('Contabilidad', 'contabilidad@ypoti.com', 'Conta funcional — sector contable', false),
  ('Depósito', 'deposito@ypoti.com', 'Conta funcional — depósito/almacén', false),
  ('Oficina Estancia', 'oficinaestancia@ypoti.com', 'Conta funcional — oficina de la estancia', false),
  ('Obras y Mantenimiento', 'oym@ypoti.com', 'Conta funcional — obras y mantenimiento', false),
  ('Facturas', 'facturas@ypoti.com', 'Conta funcional — recepción de facturas', false),
  ('Factura Electrónica', 'factura.electronica@ypoti.com', 'Conta funcional — factura electrónica', false),
  ('Recursos Humanos', 'rrhh@ypoti.com', 'Conta funcional — RRHH', false),
  ('Tecnología de la Información', 'ti@ypoti.com', 'Conta funcional — TI', false),
  ('ChatGPT Connector', 'chatgptconnector@ypoti.com', 'Conta funcional — integración ChatGPT', false)
ON CONFLICT (email) DO NOTHING;

-- 4. Remove functional accounts from users table (if they exist there)
DELETE FROM users WHERE email IN (
  'admoficina@ypoti.com',
  'confinamiento@ypoti.com',
  'contabilidad@ypoti.com',
  'deposito@ypoti.com',
  'oficinaestancia@ypoti.com',
  'oym@ypoti.com',
  'facturas@ypoti.com',
  'factura.electronica@ypoti.com',
  'rrhh@ypoti.com',
  'ti@ypoti.com',
  'chatgptconnector@ypoti.com'
);

-- 5. Verification
SELECT 'Functional accounts created' AS status,
       COUNT(*) AS total_functional
FROM functional_accounts;
