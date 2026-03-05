-- ============================================================
-- MIGRATION 019: Establishment Types — Separate Group vs External
-- Date: 2026-03-04
-- Purpose: Add tipo column to distinguish group-owned (propio)
--          establishments from external entities (proveedor,
--          frigorifico). Seed the 9 group establishments.
-- ============================================================

-- 1. Add tipo column (propio = group-owned, externo = external)
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'propio'
  CHECK (tipo IN ('propio', 'externo'));

-- 2. Add comment for clarity
COMMENT ON COLUMN establishments.tipo IS
  'propio = group-owned establishment, externo = external (provider/frigorifico)';

-- 3. Mark all existing establishments as propio (they are group-owned)
UPDATE establishments SET tipo = 'propio' WHERE tipo IS NULL;

-- 4. Upsert the 9 group establishments (tipo = propio, active = true)
INSERT INTO establishments (name, active, tipo) VALUES
  ('Cerro Moimbí',           true, 'propio'),
  ('Ypotí',                  true, 'propio'),
  ('Estancia Santa Clara',   true, 'propio'),
  ('Ouro Verde',             true, 'propio'),
  ('Santa Maria das Neves',  true, 'propio'),
  ('Vila Azul',              true, 'propio'),
  ('Ibirorã',                true, 'propio'),
  ('Ibirapitã',              true, 'propio'),
  ('Serrumbi',               true, 'propio')
ON CONFLICT (name) DO UPDATE SET
  active = true,
  tipo = 'propio';

-- 5. Ensure name has a unique constraint for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'establishments_name_key'
  ) THEN
    ALTER TABLE establishments ADD CONSTRAINT establishments_name_key UNIQUE (name);
  END IF;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- 6. Verification
SELECT 'Establishment types migration complete' AS status,
       COUNT(*) FILTER (WHERE tipo = 'propio') AS group_owned,
       COUNT(*) FILTER (WHERE tipo = 'externo') AS external
FROM establishments WHERE active = true;
