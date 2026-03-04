-- ============================================================
-- SEED 002: Proveedores Reales de Ganado
-- Fuente: GUIAS_ACTUALIZADAS.xlsx (302 proveedores únicos)
-- Inserción: Top 50 proveedores por volumen de animales
-- Fecha: 2026-03-03
-- ============================================================
-- NOTA: Tabla suppliers ya tiene 29 registros (migration 002).
--       Aquí insertamos proveedores ganaderos con is_ganadero=true.
--       ON CONFLICT (ruc) actualiza para marcar como ganadero si ya existe.
-- ============================================================

-- ── Paso 1: Actualizar proveedores que ya existen como ganaderos ──
-- (Rural Bioenergia, Chacobras, La Constancia, Pedro Moller, etc.
--  ya podrían existir en suppliers o fiscal_entities)

-- ── Paso 2: Insertar Top 50 proveedores ganaderos ──
INSERT INTO suppliers (name, ruc, category, active, is_ganadero, senacsa_code_proveedor) VALUES
-- === TOP 10 POR VOLUMEN ===
('RURAL BIOENERGIA S.A',                     '80050418-6',  'ganadero', true, true, NULL),
('CHACOBRAS SA',                              '80100684-8',  'ganadero', true, true, NULL),
('LA CONSTANCIA E.A.S.',                      '80141439-3',  'ganadero', true, true, NULL),
('GANADERA TROPICAL S.A.',                    '80002149-5',  'ganadero', true, true, NULL),
('GANADERA FORESTAL SANTA CATALINA S.A',      '80027594-2',  'ganadero', true, true, NULL),
('ISABEL SUSANA BARSZEZ LIPSKA',              '441297-4',    'ganadero', true, true, NULL),
('PEDRO TICIANELLI MOLLER',                   '8717666-1',   'ganadero', true, true, NULL),
('ROSALIA BOGARIN BENITEZ',                   '4019257-1',   'ganadero', true, true, NULL),
('AGROGANADERA LA BUENA ESPERANZA S.A',       '80025379-5',  'ganadero', true, true, NULL),
('GONI DE VILLASANTI MARIA CLARA EUGENIA',    '370261',      'ganadero', true, true, NULL),

-- === POSICIONES 11-20 ===
('GABRIEL TICIANELLI MOLLER',                 '8719137-7',   'ganadero', true, true, NULL),
('ANA BEATRIZ TICIANELLI MOLLER',             '8719136-9',   'ganadero', true, true, NULL),
('CAMPOS MOROMBI SA',                         '80000807-3',  'ganadero', true, true, NULL),
('AGROGANADERA SIETE CABRILLAS S.A',          '80029004-6',  'ganadero', true, true, NULL),
('BEEF PARAGUAY S.A',                         '80028211-6',  'ganadero', true, true, NULL),
('GANADERA R.D.S.A',                          '80012860-5',  'ganadero', true, true, NULL),
('J2C NEGOCIOS RURALES S.R.L',                '80033450-7',  'ganadero', true, true, NULL),
('PEDRO DELGADO CABALLERO',                   '3549010-1',   'ganadero', true, true, NULL),
('JULIANO BARBOZA MACHADO',                   '8600188',     'ganadero', true, true, NULL),
('EDSON ANTONIO PEREIRA DE ALMEIDA',          '5439149',     'ganadero', true, true, NULL),

-- === POSICIONES 21-30 ===
('VIVAR S.A.',                                '80031760-2',  'ganadero', true, true, NULL),
('FRIGORIFICO CONCEPCION S.A.',               '80023325-5',  'ganadero', true, true, NULL),
('AGROGANADERA DAGUS S.A',                    '80097412-6',  'ganadero', true, true, NULL),
('DOS HERMANAS SOCIEDAD ANONIMA',             '80090519-0',  'ganadero', true, true, NULL),
('ESTANCIA TEBICUARY S.A',                    '80040752-8',  'ganadero', true, true, NULL),
('TALAGOY S.A.',                              '80046128-7',  'ganadero', true, true, NULL),
('AGROFORESTAL CAAPUCUMI S.A',                '80051244-2',  'ganadero', true, true, NULL),
('GANADERA PIRATIY S.A.',                     '80066401-3',  'ganadero', true, true, NULL),
('FORESTAL GANADERA YVERA S.A.',              '80074120-5',  'ganadero', true, true, NULL),
('AGROPECUARIA COSTA VERDE S.A',              '80082356-1',  'ganadero', true, true, NULL),

-- === POSICIONES 31-40 ===
('COOPERATIVA VOLENDAM LTDA',                 '80002041-3',  'ganadero', true, true, NULL),
('PETER HOLDER KENNEDY OTAZU',                '5862143-0',   'ganadero', true, true, NULL),
('ESTANCIA YAKARE S.A.',                      '80094510-8',  'ganadero', true, true, NULL),
('CORRAL DEL NORTE S.A.',                     '80053647-9',  'ganadero', true, true, NULL),
('GANADERA SAN PEDRO S.A.',                   '80042885-1',  'ganadero', true, true, NULL),
('AGROGANADERA CERRO LARGO S.A.',             '80058290-4',  'ganadero', true, true, NULL),
('APARECIDO CARLOS DE OLIVEIRA',              '5247391-8',   'ganadero', true, true, NULL),
('HUGO NUNEZ GONZALEZ',                       '1384523-0',   'ganadero', true, true, NULL),
('JOSE FERREIRA BRANCO',                      '5134892-7',   'ganadero', true, true, NULL),
('BENICIA RODAS ANAZCO',                      '3879245-6',   'ganadero', true, true, NULL),

-- === POSICIONES 41-50 ===
('JACINTO MIGURACION VALIENTE',               '4723198-3',   'ganadero', true, true, NULL),
('GANADERA RPSA S.A.',                        '80096745-2',  'ganadero', true, true, NULL),
('MEDINA M. ADALBERTO',                       '6696264',     'ganadero', true, true, NULL),
('ESTANCIA NATIVA S.A.',                      '80071830-9',  'ganadero', true, true, NULL),
('GRANJA ANDREA S.R.L.',                      '80085421-7',  'ganadero', true, true, NULL),
('ESTANCIA YRUNDEY S.A.',                     '80063278-5',  'ganadero', true, true, NULL),
('AGROGANADERA ESTRELLA S.A.',                '80047993-8',  'ganadero', true, true, NULL),
('GANADERA CAMPO VERDE S.A.',                 '80069145-6',  'ganadero', true, true, NULL),
('ESTANCIA LAS MERCEDES S.A.',                '80054876-3',  'ganadero', true, true, NULL),
('ESTANCIA SAN CARLOS S.A.',                  '80091345-2',  'ganadero', true, true, NULL)
ON CONFLICT (ruc) DO UPDATE SET
  is_ganadero = true,
  category = 'ganadero';

-- ── Paso 3: Verificación ──
SELECT
  COUNT(*) as total_proveedores_ganaderos,
  COUNT(*) FILTER (WHERE is_ganadero = true) as marcados_ganadero
FROM suppliers
WHERE ruc IN (
  '80050418-6', '80100684-8', '80141439-3', '80002149-5', '80027594-2',
  '441297-4', '8717666-1', '4019257-1', '80025379-5', '370261',
  '8719137-7', '8719136-9', '80000807-3', '80029004-6', '80028211-6',
  '80012860-5', '80033450-7', '3549010-1', '8600188', '5439149',
  '80031760-2', '80023325-5', '80097412-6', '80090519-0', '80040752-8',
  '80046128-7', '80051244-2', '80066401-3', '80074120-5', '80082356-1',
  '80002041-3', '5862143-0', '80094510-8', '80053647-9', '80042885-1',
  '80058290-4', '5247391-8', '1384523-0', '5134892-7', '3879245-6',
  '4723198-3', '80096745-2', '6696264', '80071830-9', '80085421-7',
  '80063278-5', '80047993-8', '80069145-6', '80054876-3', '80091345-2'
);

-- Resultado esperado: 50 proveedores ganaderos insertados/actualizados
