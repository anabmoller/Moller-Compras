-- ============================================================
-- MIGRATION 026: Entity Scope — Wire user↔entity junction tables
-- Date: 2026-03-07
-- Purpose:
--   1. Ensure user_establishments and user_fiscal_entities FKs
--      work with profiles (auth.users ids).
--   2. Seed junction data for all active users based on business rules.
--   3. Create get_user_scope() function as canonical source of truth.
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- STEP 1: Ensure junction tables accept profile IDs
-- ══════════════════════════════════════════════════════════════
-- The junction tables reference users(id). Since profiles.id = auth.users.id
-- and user_id values we insert will be profile IDs (same as auth.users.id),
-- we add a parallel FK to profiles if it doesn't exist.
-- This is safe because profiles.id and auth.users.id are always the same UUID.

-- Add FK from user_establishments.user_id → profiles.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_establishments_profile_fk'
  ) THEN
    -- First check if all existing user_ids exist in profiles
    -- If not, clean up orphaned rows
    DELETE FROM user_establishments
    WHERE user_id NOT IN (SELECT id FROM profiles);

    ALTER TABLE user_establishments
      ADD CONSTRAINT user_establishments_profile_fk
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK from user_fiscal_entities.user_id → profiles.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_fiscal_entities_profile_fk'
  ) THEN
    DELETE FROM user_fiscal_entities
    WHERE user_id NOT IN (SELECT id FROM profiles);

    ALTER TABLE user_fiscal_entities
      ADD CONSTRAINT user_fiscal_entities_profile_fk
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- STEP 2: Seed user ↔ fiscal_entity mappings
-- ══════════════════════════════════════════════════════════════
-- Business rules:
--   - Ana Beatriz (admin): all 6 fiscal entities
--   - Pedro: Rural Bioenergia, Chacobras, La Constancia, Pedro Moller
--   - Gabriel: Rural Bioenergia, Chacobras, La Constancia, Gabriel Moller
--   - Ronei/other admins: all 6 fiscal entities
--   - Regular employees: Rural Bioenergia (default company) only
-- ══════════════════════════════════════════════════════════════

-- Helper: seed fiscal entity mappings for a user by username pattern + entity RUC list
-- We use a DO block for flexibility

DO $$
DECLARE
  v_user_id UUID;
  v_fe_id   UUID;
  v_username TEXT;
  -- Fiscal entity RUCs for reference:
  -- Rural Bioenergia S.A.   → 80050418-6
  -- La Constancia EAS       → 80141439-3
  -- Chacobras S.A.          → 80100684-8
  -- Pedro Moller            → 8717666-1
  -- Gabriel Moller          → 8719137-7
  -- Ana Moller              → 8719136-9
BEGIN

  -- ── FULL-SCOPE USERS (all 6 fiscal entities) ──
  -- These are admin/presidente/director users who manage all group companies
  FOR v_user_id, v_username IN
    SELECT p.id, p.username FROM profiles p
    WHERE p.active = true
      AND p.role IN ('admin', 'presidente', 'conselho', 'socio', 'super_approver', 'diretoria', 'director', 'superadmin')
  LOOP
    FOR v_fe_id IN
      SELECT fe.id FROM fiscal_entities fe WHERE fe.active = true
    LOOP
      INSERT INTO user_fiscal_entities (user_id, fiscal_entity_id, is_default)
      VALUES (v_user_id, v_fe_id, false)
      ON CONFLICT (user_id, fiscal_entity_id) DO NOTHING;
    END LOOP;

    -- Set Rural Bioenergia as default for full-scope users
    UPDATE user_fiscal_entities
    SET is_default = true
    WHERE user_id = v_user_id
      AND fiscal_entity_id = (SELECT id FROM fiscal_entities WHERE ruc = '80050418-6' LIMIT 1);
  END LOOP;

  -- ── PEDRO MOLLER ──
  -- Linked to: Rural Bioenergia, Chacobras, La Constancia, Pedro Moller
  SELECT p.id INTO v_user_id FROM profiles p
  WHERE p.username ILIKE '%pedro%' AND p.active = true LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    FOR v_fe_id IN
      SELECT fe.id FROM fiscal_entities fe
      WHERE fe.ruc IN ('80050418-6', '80100684-8', '80141439-3', '8717666-1')
    LOOP
      INSERT INTO user_fiscal_entities (user_id, fiscal_entity_id, is_default)
      VALUES (v_user_id, v_fe_id, false)
      ON CONFLICT (user_id, fiscal_entity_id) DO NOTHING;
    END LOOP;

    UPDATE user_fiscal_entities
    SET is_default = true
    WHERE user_id = v_user_id
      AND fiscal_entity_id = (SELECT id FROM fiscal_entities WHERE ruc = '80050418-6' LIMIT 1);
  END IF;

  -- ── GABRIEL MOLLER ──
  -- Linked to: Rural Bioenergia, Chacobras, La Constancia, Gabriel Moller
  SELECT p.id INTO v_user_id FROM profiles p
  WHERE p.username ILIKE '%gabriel%' AND p.active = true LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    FOR v_fe_id IN
      SELECT fe.id FROM fiscal_entities fe
      WHERE fe.ruc IN ('80050418-6', '80100684-8', '80141439-3', '8719137-7')
    LOOP
      INSERT INTO user_fiscal_entities (user_id, fiscal_entity_id, is_default)
      VALUES (v_user_id, v_fe_id, false)
      ON CONFLICT (user_id, fiscal_entity_id) DO NOTHING;
    END LOOP;

    UPDATE user_fiscal_entities
    SET is_default = true
    WHERE user_id = v_user_id
      AND fiscal_entity_id = (SELECT id FROM fiscal_entities WHERE ruc = '80050418-6' LIMIT 1);
  END IF;

  -- ── REMAINING ACTIVE USERS (gerente, lider, comprador, etc.) ──
  -- Default: link to Rural Bioenergia only
  FOR v_user_id IN
    SELECT p.id FROM profiles p
    WHERE p.active = true
      AND p.role NOT IN ('admin', 'presidente', 'conselho', 'socio', 'super_approver', 'diretoria', 'director', 'superadmin')
      AND NOT EXISTS (SELECT 1 FROM user_fiscal_entities ufe WHERE ufe.user_id = p.id)
      AND p.username NOT ILIKE '%pedro%'
      AND p.username NOT ILIKE '%gabriel%'
  LOOP
    INSERT INTO user_fiscal_entities (user_id, fiscal_entity_id, is_default)
    VALUES (
      v_user_id,
      (SELECT id FROM fiscal_entities WHERE ruc = '80050418-6' LIMIT 1),
      true
    )
    ON CONFLICT (user_id, fiscal_entity_id) DO NOTHING;
  END LOOP;

END $$;

-- ══════════════════════════════════════════════════════════════
-- STEP 3: Seed user ↔ establishment mappings
-- ══════════════════════════════════════════════════════════════
-- Business rules:
--   - Full-scope users: all group establishments (tipo_entidad = 'establecimiento')
--   - Others: match from profiles.establishment field or default to first establishment
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_user_id UUID;
  v_est_id  UUID;
  v_profile_est TEXT;
BEGIN

  -- ── FULL-SCOPE USERS: all group establishments ──
  FOR v_user_id IN
    SELECT p.id FROM profiles p
    WHERE p.active = true
      AND p.role IN ('admin', 'presidente', 'conselho', 'socio', 'super_approver', 'diretoria', 'director', 'superadmin')
  LOOP
    FOR v_est_id IN
      SELECT e.id FROM establishments e
      WHERE e.active = true
        AND (e.tipo_entidad = 'establecimiento' OR e.tipo_entidad IS NULL)
        -- Only group-owned establishments (heuristic: names matching our known farms)
        AND (
          e.name ILIKE '%ypoti%' OR e.name ILIKE '%cerro memby%' OR
          e.name ILIKE '%lusipar%' OR e.name ILIKE '%santa clara%' OR
          e.name ILIKE '%cielo azul%' OR e.name ILIKE '%ybypor%' OR
          e.name ILIKE '%oro verde%' OR e.name ILIKE '%santa maria%' OR
          e.name ILIKE '%yby p%'
        )
    LOOP
      INSERT INTO user_establishments (user_id, establishment_id, is_default)
      VALUES (v_user_id, v_est_id, false)
      ON CONFLICT (user_id, establishment_id) DO NOTHING;
    END LOOP;

    -- Set Ypoti as default for full-scope
    UPDATE user_establishments
    SET is_default = true
    WHERE user_id = v_user_id
      AND establishment_id = (
        SELECT id FROM establishments WHERE name ILIKE '%ypoti%' LIMIT 1
      );
  END LOOP;

  -- ── REMAINING USERS: map from profiles.establishment ──
  FOR v_user_id, v_profile_est IN
    SELECT p.id, p.establishment FROM profiles p
    WHERE p.active = true
      AND p.role NOT IN ('admin', 'presidente', 'conselho', 'socio', 'super_approver', 'diretoria', 'director', 'superadmin')
      AND NOT EXISTS (SELECT 1 FROM user_establishments ue WHERE ue.user_id = p.id)
  LOOP
    -- Try to match by establishment name
    SELECT e.id INTO v_est_id
    FROM establishments e
    WHERE e.active = true
      AND e.name ILIKE '%' || COALESCE(v_profile_est, 'ypoti') || '%'
    LIMIT 1;

    -- Fallback to Ypoti if no match
    IF v_est_id IS NULL THEN
      SELECT e.id INTO v_est_id
      FROM establishments e
      WHERE e.name ILIKE '%ypoti%' AND e.active = true
      LIMIT 1;
    END IF;

    IF v_est_id IS NOT NULL THEN
      INSERT INTO user_establishments (user_id, establishment_id, is_default)
      VALUES (v_user_id, v_est_id, true)
      ON CONFLICT (user_id, establishment_id) DO NOTHING;
    END IF;
  END LOOP;

END $$;

-- ══════════════════════════════════════════════════════════════
-- STEP 4: Create get_user_scope() function
-- ══════════════════════════════════════════════════════════════
-- Canonical source of truth for entity scope.
-- Returns establishment IDs and fiscal entity IDs for a given user.

CREATE OR REPLACE FUNCTION public.get_user_scope(p_user_id UUID)
RETURNS TABLE (
  establishment_ids UUID[],
  fiscal_entity_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $fn$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(
      (SELECT array_agg(ue.establishment_id)
       FROM user_establishments ue
       WHERE ue.user_id = p_user_id),
      ARRAY[]::UUID[]
    ) AS establishment_ids,
    COALESCE(
      (SELECT array_agg(ufe.fiscal_entity_id)
       FROM user_fiscal_entities ufe
       WHERE ufe.user_id = p_user_id),
      ARRAY[]::UUID[]
    ) AS fiscal_entity_ids;
END;
$fn$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_scope(UUID) TO authenticated;

-- ══════════════════════════════════════════════════════════════
-- STEP 5: Verification
-- ══════════════════════════════════════════════════════════════
SELECT
  'user_establishments' AS junction,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT user_id) AS unique_users
FROM user_establishments;

SELECT
  'user_fiscal_entities' AS junction,
  COUNT(*) AS total_rows,
  COUNT(DISTINCT user_id) AS unique_users
FROM user_fiscal_entities;
