-- ============================================================
-- GANADO MODULE: Schema Validation Queries
-- Run against Supabase DB to verify all 7 tables exist
-- and check referential integrity
-- ============================================================

-- 1. VERIFY ALL 7 TABLES EXIST
SELECT table_name,
       CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'categorias_animales',
    'movimientos_ganado',
    'detalle_movimiento_categorias',
    'movimiento_divergencias',
    'movimiento_archivos',
    'movimiento_estados_log',
    'pesajes_ganado'
  )
ORDER BY table_name;

-- 2. VERIFY SUPPLIER/COMPANY EXTENSIONS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'suppliers' AND column_name IN ('is_ganadero', 'senacsa_code_proveedor')
UNION ALL
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'companies' AND column_name IN ('is_frigorifico', 'senacsa_code_empresa');

-- 3. VERIFY CATEGORIAS SEED DATA
SELECT codigo, nombre, sexo, edad_min_meses, edad_max_meses
FROM categorias_animales
ORDER BY codigo;

-- 4. COUNT RECORDS PER TABLE
SELECT 'categorias_animales' as tabla, COUNT(*) as registros FROM categorias_animales
UNION ALL SELECT 'movimientos_ganado', COUNT(*) FROM movimientos_ganado
UNION ALL SELECT 'detalle_movimiento_categorias', COUNT(*) FROM detalle_movimiento_categorias
UNION ALL SELECT 'movimiento_divergencias', COUNT(*) FROM movimiento_divergencias
UNION ALL SELECT 'movimiento_archivos', COUNT(*) FROM movimiento_archivos
UNION ALL SELECT 'movimiento_estados_log', COUNT(*) FROM movimiento_estados_log
UNION ALL SELECT 'pesajes_ganado', COUNT(*) FROM pesajes_ganado;

-- 5. REFERENTIAL INTEGRITY: orphaned detail rows
SELECT 'detalle_sin_movimiento' as tipo, COUNT(*) as problemas
FROM detalle_movimiento_categorias d
LEFT JOIN movimientos_ganado m ON d.movimiento_id = m.id
WHERE m.id IS NULL

UNION ALL

SELECT 'detalle_sin_categoria', COUNT(*)
FROM detalle_movimiento_categorias d
LEFT JOIN categorias_animales c ON d.categoria_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 'pesaje_sin_movimiento', COUNT(*)
FROM pesajes_ganado p
LEFT JOIN movimientos_ganado m ON p.movimiento_id = m.id
WHERE m.id IS NULL

UNION ALL

SELECT 'divergencia_sin_movimiento', COUNT(*)
FROM movimiento_divergencias d
LEFT JOIN movimientos_ganado m ON d.movimiento_id = m.id
WHERE m.id IS NULL;

-- 6. VERIFY TRIGGERS EXIST
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table IN (
  'movimientos_ganado', 'detalle_movimiento_categorias', 'pesajes_ganado'
)
ORDER BY event_object_table, trigger_name;

-- 7. VERIFY RLS IS ENABLED
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'categorias_animales', 'movimientos_ganado', 'detalle_movimiento_categorias',
    'movimiento_divergencias', 'movimiento_archivos', 'movimiento_estados_log',
    'pesajes_ganado'
  )
ORDER BY tablename;

-- 8. VERIFY INDEXES
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%movimiento%' OR tablename LIKE '%pesaje%' OR tablename LIKE '%categori%'
ORDER BY tablename, indexname;

-- 9. DATA CONSISTENCY: totals match details
SELECT m.id, m.movimiento_number, m.cantidad_total, m.peso_total_kg,
       COALESCE(SUM(d.cantidad), 0) as sum_detalle_cantidad,
       COALESCE(SUM(d.peso_kg), 0) as sum_detalle_peso,
       CASE WHEN m.cantidad_total != COALESCE(SUM(d.cantidad), 0) THEN 'MISMATCH_CANTIDAD'
            WHEN m.peso_total_kg != COALESCE(SUM(d.peso_kg), 0) THEN 'MISMATCH_PESO'
            ELSE 'OK' END as validacion
FROM movimientos_ganado m
LEFT JOIN detalle_movimiento_categorias d ON d.movimiento_id = m.id
GROUP BY m.id, m.movimiento_number, m.cantidad_total, m.peso_total_kg
HAVING m.cantidad_total != COALESCE(SUM(d.cantidad), 0)
    OR m.peso_total_kg != COALESCE(SUM(d.peso_kg), 0);

-- 10. PESAJE vs GUIA RECONCILIATION
-- Shows movements with pesajes that have discrepancies
SELECT m.movimiento_number,
       m.cantidad_total as guia_cantidad,
       m.peso_total_kg as guia_peso,
       SUM(p.cantidad_pesada) as pesaje_cantidad,
       SUM(p.peso_neto_kg) as pesaje_peso,
       SUM(p.cantidad_pesada) - m.cantidad_total as dif_cantidad,
       SUM(p.peso_neto_kg) - m.peso_total_kg as dif_peso
FROM movimientos_ganado m
JOIN pesajes_ganado p ON p.movimiento_id = m.id
GROUP BY m.id, m.movimiento_number, m.cantidad_total, m.peso_total_kg
HAVING ABS(SUM(p.cantidad_pesada) - m.cantidad_total) > 0
    OR ABS(SUM(p.peso_neto_kg) - m.peso_total_kg) > 1;
