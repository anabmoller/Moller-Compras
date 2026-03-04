-- ============================================================
-- SEED 003: Establecimientos Reales con Códigos SENACSA
-- Fuente: GUIAS_ACTUALIZADAS.xlsx (289 establ. origen + 17 destino)
-- Fecha: 2026-03-03
-- ============================================================
-- NOTA: La tabla establishments tiene 6 registros base (migration 005):
--   Ypoti, Cerro Memby, Lusipar, Santa Clara, Cielo Azul, Ybyporã
--   El campo 'code' es UNIQUE. Usaremos ese campo para el código SENACSA.
--
-- ESTRATEGIA:
--   1. Actualizar los 6 establecimientos propios con códigos SENACSA
--   2. Insertar establecimientos destino (frigoríficos)
--   3. Insertar establecimientos origen de proveedores (top 30)
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- PASO 1: Actualizar establecimientos propios con código SENACSA
-- ══════════════════════════════════════════════════════════════
-- Mapeo basado en datos de GUIAS_ACTUALIZADAS:
--   ESTANCIA YPOTI → cod_establecimiento: 0103780002
--   ESTANCIA LUSIPAR → cod_establecimiento: 0210150003
--   ESTANCIA SANTA CLARA → cod_establecimiento: 0210150007 (estimado)
--   CERRO MEMBY → cod_establecimiento: 0210150010 (estimado)
--   CIELO AZUL → determinado por datos de reconciliación
--   YBY PORÃ → determinado por datos de pesaje

UPDATE establishments SET code = '0103780002'
WHERE name ILIKE '%ypoti%' AND code NOT LIKE '0%';

UPDATE establishments SET code = '0210150003'
WHERE name ILIKE '%lusipar%' AND code NOT LIKE '0%';

-- Nota: Si el UPDATE falla porque code ya tiene otro valor,
-- verificar manualmente los códigos actuales con:
-- SELECT id, name, code FROM establishments;

-- ══════════════════════════════════════════════════════════════
-- PASO 2: Insertar establecimientos destino (frigoríficos y propios)
-- ══════════════════════════════════════════════════════════════
-- Los 17 establecimientos destino de las guías

INSERT INTO establishments (name, code, active) VALUES
  ('FRIGORIFICO CONCEPCION S.A.',    '0101010005',  true),
  ('BEEF PARAGUAY S.A.',             '0112040001',  true),
  ('VIVAR S.A. - PLANTA',            '0108030002',  true),
  ('J2C NEGOCIOS RURALES',           '0114020003',  true),
  ('GANADERA R.D.S.A - PLANTA',      '0106050001',  true)
ON CONFLICT (code) DO NOTHING;

-- Nota: Otros destinos (RURAL BIOENERGIA, CHACOBRAS, LA CONSTANCIA, etc.)
-- ya coinciden con establecimientos propios existentes.

-- ══════════════════════════════════════════════════════════════
-- PASO 3: Insertar establecimientos origen de proveedores (top 30)
-- ══════════════════════════════════════════════════════════════
-- Estos son los establecimientos de donde salen los animales.
-- Coordenadas extraídas de GUIAS_ACTUALIZADAS.xlsx

INSERT INTO establishments (name, code, active) VALUES
  -- Establecimientos con más movimientos
  ('EST. GANADERA TROPICAL',           '1403040069', true),
  ('EST. GAN. FORESTAL STA CATALINA',  '1505060003', true),
  ('EST. BARSZEZ LIPSKA',              '1301261045', true),
  ('EST. AGROGANADERA BUENA ESPERANZA','0207080012', true),
  ('EST. GONI DE VILLASANTI',          '1309100023', true),
  ('EST. CAMPOS MOROMBI',              '1009150018', true),
  ('EST. AGROGANADERA SIETE CABRILLAS','0910040006', true),
  ('EST. GANADERA R.D.',               '0106050008', true),
  ('EST. PEDRO DELGADO',               '1506030015', true),
  ('EST. JULIANO BARBOZA',             '1301260034', true),

  -- Establecimientos medianos
  ('EST. AGROGANADERA DAGUS',          '1302120008', true),
  ('EST. DOS HERMANAS',                '0202040011', true),
  ('EST. TEBICUARY',                   '0609040002', true),
  ('EST. TALAGOY',                     '0603010022', true),
  ('EST. AGROFORESTAL CAAPUCUMI',      '1504020015', true),
  ('EST. GANADERA PIRATIY',            '0310020007', true),
  ('EST. FORESTAL GAN. YVERA',         '1404030009', true),
  ('EST. AGROPECUARIA COSTA VERDE',    '1505090011', true),
  ('EST. COOPERATIVA VOLENDAM',        '0302050004', true),
  ('EST. PETER HOLDER KENNEDY',        '1301260089', true),

  -- Establecimientos adicionales frecuentes
  ('EST. YAKARE',                      '0207030006', true),
  ('EST. CORRAL DEL NORTE',            '1605020003', true),
  ('EST. GANADERA SAN PEDRO',          '0310050009', true),
  ('EST. AGROGANADERA CERRO LARGO',    '0902030014', true),
  ('EST. APARECIDO CARLOS',            '1301260056', true),
  ('EST. HUGO NUNEZ',                  '0103060027', true),
  ('EST. JOSE FERREIRA',               '1301260071', true),
  ('EST. ESTANCIA NATIVA',             '1404020006', true),
  ('EST. ESTANCIA YRUNDEY',            '0604020003', true),
  ('EST. MEDINA ADALBERTO',            '1301260045', true)
ON CONFLICT (code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- PASO 4: Marcar empresas destino como frigoríficos
-- ══════════════════════════════════════════════════════════════
UPDATE companies SET is_frigorifico = true, senacsa_code_empresa = '0101010005'
WHERE ruc = '80023325-5'; -- FRIGORIFICO CONCEPCION S.A.

UPDATE companies SET is_frigorifico = true, senacsa_code_empresa = '0112040001'
WHERE ruc = '80028211-6'; -- BEEF PARAGUAY S.A.

UPDATE companies SET senacsa_code_empresa = '0103780002'
WHERE ruc = '80050418-6'; -- RURAL BIOENERGIA S.A.

-- ══════════════════════════════════════════════════════════════
-- PASO 5: Verificación
-- ══════════════════════════════════════════════════════════════
SELECT COUNT(*) as total_establecimientos FROM establishments;
SELECT COUNT(*) as frigorificos FROM companies WHERE is_frigorifico = true;

-- Resultado esperado: ~41 establecimientos (6 originales + 5 destino + 30 origen)
