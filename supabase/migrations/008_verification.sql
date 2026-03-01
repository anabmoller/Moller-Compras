-- ============================================================
-- MIGRATION 008: Verification — Full Database Audit
-- Date: 2026-03-01
-- Purpose: Run after all migrations (003–007) to verify the
--          restructured database is correct and consistent.
-- ============================================================

-- 1. Count real users (migration 003 inserts 20; may be more if pre-existing)
SELECT 'Real users' AS check,
       COUNT(*) AS total,
       CASE WHEN COUNT(*) >= 20 THEN 'PASS' ELSE 'FAIL — expected ≥20' END AS result
FROM users WHERE active = true;

-- 2. Count functional accounts (should be 11)
SELECT 'Functional accounts' AS check,
       COUNT(*) AS total,
       CASE WHEN COUNT(*) = 11 THEN 'PASS' ELSE 'FAIL — expected 11' END AS result
FROM functional_accounts WHERE active = true;

-- 3. Count establishments (should be 6)
SELECT 'Establishments' AS check,
       COUNT(*) AS total,
       CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL — expected 6' END AS result
FROM establishments WHERE active = true;

-- 4. Count fiscal entities (should be 6)
SELECT 'Fiscal entities' AS check,
       COUNT(*) AS total,
       CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL — expected 6' END AS result
FROM fiscal_entities WHERE active = true;

-- 5. Verify no functional accounts remain in users table
SELECT 'No functional in users' AS check,
       COUNT(*) AS found,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL — functional accounts still in users' END AS result
FROM users WHERE email IN (
  'admoficina@ypoti.com', 'confinamiento@ypoti.com', 'contabilidad@ypoti.com',
  'deposito@ypoti.com', 'oficinaestancia@ypoti.com', 'oym@ypoti.com',
  'facturas@ypoti.com', 'factura.electronica@ypoti.com', 'rrhh@ypoti.com',
  'ti@ypoti.com', 'chatgptconnector@ypoti.com'
);

-- 6. Verify email uniqueness
SELECT 'Email uniqueness' AS check,
       COUNT(*) AS duplicates,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL — duplicate emails' END AS result
FROM (
  SELECT email, COUNT(*) AS cnt FROM users GROUP BY email HAVING COUNT(*) > 1
) dupes;

-- 7. Verify views exist
SELECT 'Views exist' AS check,
       COUNT(*) AS total,
       CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL — expected 3 views' END AS result
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('v_active_approvers', 'v_users_with_entities', 'v_users_with_establishments');

-- 8. Verify indexes exist
SELECT 'Indexes on users' AS check,
       COUNT(*) AS total,
       CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL — expected ≥5 indexes' END AS result
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname LIKE 'idx_users_%';

-- 9. Verify junction tables have correct schema
SELECT 'Junction tables' AS check,
       COUNT(*) AS total,
       CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL — expected 2 junction tables' END AS result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_establishments', 'user_fiscal_entities');

-- 10. Verify key approval roles exist (MANAGER_MAP + SUPER_APPROVERS)
SELECT 'Key approval users' AS check,
       COUNT(*) AS found,
       CASE WHEN COUNT(*) >= 4 THEN 'PASS' ELSE 'WARN — check paulo, fabiano, ronei, mauricio' END AS result
FROM users WHERE email IN (
  'paulo@ypoti.com', 'fabiano@ypoti.com', 'ronei@ypoti.com', 'mauriciomoller@ypoti.com'
) AND active = true;

-- 11. List all users with roles for manual review
-- NOTE: Verify that profiles.username values match approval engine usernames
-- (e.g., profiles.username='ronei' maps to MANAGER_MAP/SUPER_APPROVERS['ronei'])
-- NOTE: VET_APPROVER='rodrigo.ferreira' must exist in profiles table
SELECT id, name, email, role, phone, is_super_approver, can_approve, active
FROM users
ORDER BY name;

-- 12. Summary
SELECT '✅ Verification complete — run in Supabase SQL Editor' AS status;
