-- ============================================================
-- MIGRATION 003: Normalize Users Table — Ypoti Compras
-- Date: 2026-03-01
-- Purpose: Consolidate users table to 21 real people with
--          proper roles, clean duplicates, enforce UNIQUE email.
-- ============================================================

-- 1. BACKUP: Create snapshot of current users table
CREATE TABLE IF NOT EXISTS _backup_users_20260301 AS
SELECT * FROM users;

-- 2. Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_approver BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_approve BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Clean duplicate emails (keep most recent by created_at)
DELETE FROM users a USING users b
WHERE a.id < b.id
  AND LOWER(a.email) = LOWER(b.email);

-- 4. Normalize all emails to lowercase
UPDATE users SET email = LOWER(email) WHERE email <> LOWER(email);

-- 5. Ensure UNIQUE constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- 6. UPSERT 21 real users
-- Ana Beatriz Moller — Presidente
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Ana Beatriz Moller', 'anabmoller@ypoti.com', '+595982164005', 'presidente', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Ana Karina Ticianelli Moller — Conselho
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Ana Karina Ticianelli Moller', 'anakticianelli@ypoti.com', '+595982104010', 'conselho', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Gabriel Moller — Sócio
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Gabriel Moller', 'gmoller@ypoti.com', '+595986180832', 'socio', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Pedro Moller — Sócio
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Pedro Moller', 'pedromoller@ypoti.com', '+595983796436', 'socio', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Mauricio Moller — Super-Approver
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Mauricio Moller', 'mauriciomoller@ypoti.com', '+595982798122', 'super_approver', true, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Paulo Becker — Gerente
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Paulo Becker', 'paulo@ypoti.com', '+5567996526585', 'gerente', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Fabiano Squeruque — Gerente
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Fabiano Squeruque', 'fabiano@ypoti.com', '+595975366371', 'gerente', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Ronei Barrios — Director
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Ronei Barrios', 'ronei@ypoti.com', '+5567992125955', 'director', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Laura Rivas — Compras
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Laura Rivas', 'laura@ypoti.com', '+595987166668', 'compras', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Henrique Martins — Solicitante
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Henrique Martins', 'henrique@ypoti.com', '+595975293081', 'solicitante', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Ramón Sosa — Solicitante
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Ramón Sosa', 'ramon@ypoti.com', '+595975576161', 'solicitante', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Liz Freitas — Administrativo
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Liz Freitas', 'liz@ypoti.com', NULL, 'administrativo', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Lucas Moller — Gerente
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Lucas Moller', 'lucasmoller@ypoti.com', NULL, 'gerente', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Ivan Olivetti — Operacional
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Ivan Olivetti', 'ivan@ypoti.com', NULL, 'operacional', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Rodrigo Bottazzo — Conselheiro
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Rodrigo Bottazzo', 'rodrigobottazzo@ypoti.com', NULL, 'conselho', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Juan Diego Paranderi Monges — Operacional
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Juan Diego Paranderi Monges', 'juan.diego@ypoti.com', NULL, 'operacional', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Alex Samudio — Solicitante
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Alex Samudio', 'alexsamudio@ypoti.com', NULL, 'solicitante', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Anahi Aguirre — Lider
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Anahi Aguirre', 'anahiaguirre@ypoti.com', NULL, 'lider', false, true, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Kelin Bradshaw — Solicitante
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Kelin Bradshaw', 'kelin@ypoti.com', NULL, 'solicitante', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- Santiago Campos — Solicitante
INSERT INTO users (name, email, phone, role, is_super_approver, can_approve, active)
VALUES ('Santiago Campos', 'santiagocampos@ypoti.com', NULL, 'solicitante', false, false, true)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name, phone = EXCLUDED.phone, role = EXCLUDED.role,
  is_super_approver = EXCLUDED.is_super_approver, can_approve = EXCLUDED.can_approve,
  active = EXCLUDED.active, updated_at = now();

-- 7. Verification
SELECT 'Users normalization complete' AS status,
       COUNT(*) AS total_active_users
FROM users WHERE active = true;
