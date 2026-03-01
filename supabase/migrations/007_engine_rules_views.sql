-- ============================================================
-- MIGRATION 007: Engine Rules — Views, Filters, Indexes
-- Date: 2026-03-01
-- Purpose: Create useful views for the app to query users with
--          their entities/establishments. These views enforce
--          the separation between real users and functional accounts.
-- ============================================================

-- 1. Active approvers view (for dropdowns, assignment, notifications)
CREATE OR REPLACE VIEW v_active_approvers AS
SELECT id, name, email, role, is_super_approver
FROM users
WHERE active = true AND can_approve = true;

-- 2. Users with fiscal entities (for invoice/billing contexts)
CREATE OR REPLACE VIEW v_users_with_entities AS
SELECT
  u.id, u.name, u.email, u.role,
  fe.legal_name AS fiscal_entity,
  fe.ruc,
  ufe.is_default AS is_default_entity
FROM users u
LEFT JOIN user_fiscal_entities ufe ON u.id = ufe.user_id
LEFT JOIN fiscal_entities fe ON ufe.fiscal_entity_id = fe.id
WHERE u.active = true;

-- 3. Users with establishments (for location-based queries)
CREATE OR REPLACE VIEW v_users_with_establishments AS
SELECT
  u.id, u.name, u.email, u.role,
  e.name AS establishment_name,
  e.email AS establishment_email,
  ue.is_default AS is_default_establishment
FROM users u
LEFT JOIN user_establishments ue ON u.id = ue.user_id
LEFT JOIN establishments e ON ue.establishment_id = e.id
WHERE u.active = true;

-- 4. Index on users for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_can_approve ON users(can_approve) WHERE can_approve = true;
CREATE INDEX IF NOT EXISTS idx_users_super_approver ON users(is_super_approver) WHERE is_super_approver = true;

-- 5. Verification
SELECT 'Views and indexes created' AS status;
