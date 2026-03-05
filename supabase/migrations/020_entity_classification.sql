-- ============================================================
-- MIGRATION 020: Entity Classification & Extended Fields
-- Date: 2026-03-04
-- Purpose: Add tipo_entidad and regimen_control enums to classify
--          establishments vs providers vs industries. Add notas
--          and metadata_json for rich entity detail.
-- ============================================================

-- 1. Add tipo_entidad column (replaces the simple tipo column)
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS tipo_entidad TEXT DEFAULT 'establecimiento'
  CHECK (tipo_entidad IN (
    'establecimiento',      -- Ranch/farm under group management
    'proveedor_ganado',     -- External cattle supplier
    'proveedor_granos',     -- External grain/feed supplier
    'industria'             -- Frigorífico, processing plant
  ));

-- 2. Add regimen_control for group-managed entities
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS regimen_control TEXT
  CHECK (regimen_control IN (
    'propio',     -- Owned by the group
    'arrendado',  -- Leased/rented
    'cenabico'    -- CENABICO (gov co-management)
  ));

-- 3. Add notas text field for entity notes
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS notas TEXT DEFAULT '';

-- 4. Add metadata_json for extensible entity data
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS metadata_json JSONB DEFAULT '{}';

-- 5. Migrate existing tipo values to new classification
--    tipo = 'propio'  → tipo_entidad = 'establecimiento', regimen_control = 'propio'
--    tipo = 'externo' → tipo_entidad = 'proveedor_ganado' (default for external)
UPDATE establishments
  SET tipo_entidad = 'establecimiento',
      regimen_control = 'propio'
  WHERE tipo = 'propio' AND tipo_entidad IS NULL;

UPDATE establishments
  SET tipo_entidad = 'proveedor_ganado'
  WHERE tipo = 'externo' AND tipo_entidad IS NULL;

-- 6. Set any remaining NULLs
UPDATE establishments
  SET tipo_entidad = 'establecimiento'
  WHERE tipo_entidad IS NULL;

-- 7. Add comments for documentation
COMMENT ON COLUMN establishments.tipo_entidad IS
  'Entity classification: establecimiento (ranch), proveedor_ganado (cattle supplier), proveedor_granos (grain supplier), industria (processing)';

COMMENT ON COLUMN establishments.regimen_control IS
  'Control regime for group-managed entities: propio (owned), arrendado (leased), cenabico (CENABICO co-management). NULL for external entities.';

COMMENT ON COLUMN establishments.notas IS
  'Free-text notes for the entity';

COMMENT ON COLUMN establishments.metadata_json IS
  'Extensible JSON metadata (documents, contacts, etc.)';

-- 8. Verification
SELECT 'Entity classification migration complete' AS status,
       COUNT(*) FILTER (WHERE tipo_entidad = 'establecimiento') AS establecimientos,
       COUNT(*) FILTER (WHERE tipo_entidad = 'proveedor_ganado') AS proveedores_ganado,
       COUNT(*) FILTER (WHERE tipo_entidad = 'proveedor_granos') AS proveedores_granos,
       COUNT(*) FILTER (WHERE tipo_entidad = 'industria') AS industrias,
       COUNT(*) FILTER (WHERE regimen_control = 'propio') AS propios,
       COUNT(*) FILTER (WHERE regimen_control = 'arrendado') AS arrendados,
       COUNT(*) FILTER (WHERE regimen_control = 'cenabico') AS cenabicos
FROM establishments WHERE active = true;
