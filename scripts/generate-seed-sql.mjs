#!/usr/bin/env node
// ============================================================
// YPOTI — Generate seed SQL from codebase constants
// Reads JS source files and produces SQL INSERT statements
// ============================================================

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src', 'constants');

// ---- Helper: escape single quotes for SQL ----
const esc = (s) => s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
const escOrNull = (s) => s == null || s === '---' ? 'NULL' : esc(s);

// ---- 1. Parse defaultUsers.js to extract the array ----
function parseDefaultUsers() {
  const raw = readFileSync(resolve(SRC, 'defaultUsers.js'), 'utf8');
  // Extract the array between [ and ];
  const match = raw.match(/export\s+const\s+DEFAULT_USERS\s*=\s*\[([\s\S]*?)\];/);
  if (!match) throw new Error('Could not parse DEFAULT_USERS');

  const users = [];
  // Match each object block
  const objRegex = /\{([^}]+)\}/g;
  let m;
  while ((m = objRegex.exec(match[1])) !== null) {
    const block = m[1];
    const get = (key) => {
      const r = new RegExp(`"${key}"\\s*:\\s*(?:DEFAULT_PASSWORD_HASH|"([^"]*)"|(true|false))`);
      const v = r.exec(block);
      if (!v) return null;
      if (v[2]) return v[2] === 'true';
      return v[1] ?? null;
    };
    users.push({
      id: get('id'),
      name: get('name'),
      email: get('email'),
      role: get('role'),
      establishment: get('establishment'),
      position: get('position'),
      avatar: get('avatar'),
      active: get('active'),
    });
  }
  return users;
}

// ============================================================
// Generate SQL
// ============================================================

let sql = `-- ============================================================
-- YPOTI Compras — Phase 2: Seed Reference Data
-- Version: 002
-- Date: 2026-02-28
-- Generated automatically from src/constants/*
-- ============================================================

BEGIN;

-- ============================================================
-- PART A: COMPANIES (7 records)
-- ============================================================
INSERT INTO companies (name, ruc, type, activity, active) VALUES
  ('Rural Bioenergia S.A.', '80092156-9', 'empresa', 'Cria, recria y engorde bovino, agricultura, confinamiento', true),
  ('Chacobras S.A.', '80055203-2', 'empresa', 'Recria, engorde, hoteleria bovina, nucleos proteicos', true),
  ('La Constancia S.A.', '80119386-9', 'empresa', 'Ganaderia y agricultura', true),
  ('Control Pasto S.A.', NULL, 'empresa', 'Servicios agricolas', true),
  ('Ana Moller', NULL, 'persona_fisica', 'Inversiones ganaderas', true),
  ('Gabriel Moller', NULL, 'persona_fisica', 'Inversiones ganaderas', true),
  ('Pedro Moller', NULL, 'persona_fisica', 'Inversiones ganaderas', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART B: ESTABLISHMENTS (9 records)
-- Depends on companies — uses subquery for company_id
-- ============================================================
INSERT INTO establishments (name, code, company_id, manager, location, active) VALUES
  ('Ypoti',       'YPT', (SELECT id FROM companies WHERE name='Rural Bioenergia S.A.' LIMIT 1), 'Fabiano',  'Alto Parana',  true),
  ('Cerro Memby', 'CMB', (SELECT id FROM companies WHERE name='Rural Bioenergia S.A.' LIMIT 1), 'Fabiano',  'Alto Parana',  true),
  ('Cielo Azul',  'CAZ', (SELECT id FROM companies WHERE name='Rural Bioenergia S.A.' LIMIT 1), 'Mauricio', 'Canindeyú',    true),
  ('Lusipar',     'LSP', (SELECT id FROM companies WHERE name='Rural Bioenergia S.A.' LIMIT 1), 'Ronei',    'San Pedro',    true),
  ('Santa Maria', 'STM', (SELECT id FROM companies WHERE name='Rural Bioenergia S.A.' LIMIT 1), 'Ronei',    'Itapúa',       true),
  ('Ybypora',     'YBP', (SELECT id FROM companies WHERE name='Rural Bioenergia S.A.' LIMIT 1), 'Fabiano',  'Alto Parana',  true),
  ('Santa Clara', 'STC', (SELECT id FROM companies WHERE name='La Constancia S.A.' LIMIT 1),    'Mauricio', 'Canindeyú',    true),
  ('Yby Pyta',    'YPY', (SELECT id FROM companies WHERE name='Rural Bioenergia S.A.' LIMIT 1), 'Mauricio', 'Canindeyú',    true),
  ('Oro Verde',   'ORV', (SELECT id FROM companies WHERE name='Rural Bioenergia S.A.' LIMIT 1), 'Ronei',    'Itapúa',       true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART C: SECTORS (11 records)
-- ============================================================
INSERT INTO sectors (name, icon, description, active) VALUES
  ('Recria',             'cattle',   'Cria y recria de ganado', true),
  ('Confinamiento',      'building', 'Engorde a corral', true),
  ('Agricultura',        'wheat',    'Produccion agricola', true),
  ('Administrativo',     'office',   'Administracion general', true),
  ('Mantenimiento',      'wrench',   'Mantenimiento de equipos y estructuras', true),
  ('Veterinaria',        'syringe',  'Sanidad animal', true),
  ('Logística',          'truck',    'Transporte y combustible', true),
  ('Oficina/Taller',     'tools',    'Taller mecanico y oficina', true),
  ('Farmacia',           'pill',     'Productos farmaceuticos veterinarios', true),
  ('Feedlot',            'building', 'Engorde intensivo', true),
  ('Fabrica Balanceados','factory',  'Produccion de alimento balanceado', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART D: PRODUCT TYPES (14 records)
-- ============================================================
INSERT INTO product_types (name, icon, description, active) VALUES
  ('Insumo Agricola',         'box',     'Insumos generales de operacion', true),
  ('Repuesto',                'gear',    'Repuestos para maquinaria y equipos', true),
  ('Equipamiento',            'bolt',    'Equipamiento nuevo', true),
  ('Maquinaria',              'tractor', 'Maquinaria pesada', true),
  ('Herramienta',             'hammer',  'Herramientas manuales y electricas', true),
  ('Medicamento Veterinario', 'pill',    'Medicamentos y vacunas', true),
  ('Herbicida',               'flask',   'Herbicidas y agroquimicos', true),
  ('Provista',                'rice',    'Provisiones y alimentos', true),
  ('Uniformes',               'shirt',   'Uniformes e indumentaria', true),
  ('Utiles de Oficina',       'clip',    'Material de oficina', true),
  ('Combustible',             'fuel',    'Combustible diesel y nafta', true),
  ('Lubricante',              'oil',     'Aceites y lubricantes', true),
  ('Suplemento Nutricional',  'leaf',    'Suplementos nutricionales animales', true),
  ('Material de Limpieza',    'spray',   'Productos de limpieza', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART E: SUPPLIERS (21 records — 6 contact + 15 SAP top)
-- ============================================================
INSERT INTO suppliers (name, ruc, phone, email, category, active) VALUES
  ('Agropecuaria Don Mario',        '80012345-6', '0983 456 789', 'ventas@donmario.com.py',        'Insumos Agricolas',    true),
  ('Veterinaria Central',           '80023456-7', '0971 234 567', 'pedidos@vetcentral.com.py',      'Farmacia Veterinaria', true),
  ('Repuestos Guarani',             '80034567-8', '0961 345 678', 'info@repuestosguarani.com.py',   'Repuestos Maquinaria', true),
  ('COPETROL S.A.',                 '80045678-9', '0984 567 890', 'corporativo@copetrol.com.py',    'Combustible',          true),
  ('Ferreteria Industrial PY',      '80056789-0', '0975 678 901', 'ventas@ferreteriapy.com',        'Herramientas',         true),
  ('Nutricion Animal S.A.',         '80067890-1', '0982 789 012', 'pedidos@nutrianimal.com.py',     'Nutricion',            true),
  ('INPASA DEL PARAGUAY S.A.',       NULL, NULL, NULL, 'Nutricion', true),
  ('ADM PARAGUAY S.R.L.',            NULL, NULL, NULL, 'Nutricion', true),
  ('CHACOBRAS S.A.',                 NULL, NULL, NULL, 'Nutricion', true),
  ('SILOS 7 RIO VERDE S.A.',         NULL, NULL, NULL, 'Almacenaje', true),
  ('AGRO ALIANZA S.A.',              NULL, NULL, NULL, 'Nutricion', true),
  ('AGROFERTIL S.A.',                NULL, NULL, NULL, 'Insumos Agricolas', true),
  ('AGROTEC S.A.',                   NULL, NULL, NULL, 'Insumos Agricolas', true),
  ('TRANSPORTE SGC',                 NULL, NULL, NULL, 'Logistica', true),
  ('COMERCIAL OBREGON S.A.',         NULL, NULL, NULL, 'Comercio General', true),
  ('AGROZAFRA S.A.',                 NULL, NULL, NULL, 'Nutricion', true),
  ('FERUSA NEGOCIOS S.A.',           NULL, NULL, NULL, 'Ferreteria Industrial', true),
  ('VILLA OLIVA RICE S.A.',          NULL, NULL, NULL, 'Nutricion', true),
  ('REPUESTOS RIO VERDE S.A.',       NULL, NULL, NULL, 'Repuestos Maquinaria', true),
  ('AGROVETERINARIA CONSULT-PEC',    NULL, NULL, NULL, 'Veterinaria', true),
  ('COOPERATIVA CHORTITZER LTDA.',   NULL, NULL, NULL, 'Cooperativa', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART F: INVENTORY CATALOG (40 items)
-- ============================================================
INSERT INTO inventory_catalog (code, name, type, "group", active) VALUES
  ('AGRO-000004', 'MAIZ HUMEDO',             'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000009', 'BURLANDA (DDGS)',          'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000010', 'AFRECHO DE ARROZ',         'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000003', 'MAIZ SECO',               'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000008', 'CASCARILLA DE SOJA',       'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000020', 'BAGAZO DE CANA',           'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000012', 'CALCAREO CALCITICO',       'Insumo Agricola',   'Agricola',      true),
  ('AGRO-000043', 'SEMILLA DE ALGODON',       'Insumo Agricola',   'Agricola',      true),
  ('AGRO-000006', 'AVENA',                   'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000005', 'SORGO',                   'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000007', 'HARINA DE SOJA',           'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000015', 'UREA',                    'Insumo Agricola',   'Agricola',      true),
  ('AGRO-000011', 'SAL MARINA',              'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000047', 'ABONO',                   'Insumo Agricola',   'Agricola',      true),
  ('AGRO-000050', 'NUCLEO F1',               'Suplemento',        'Nutricion',     true),
  ('AGRO-000056', 'RURAL 90 CRIA',            'Suplemento',        'Nutricion',     true),
  ('AGRO-000045', 'TRIGUILLO',               'Insumo Agricola',   'Nutricion',     true),
  ('AGRO-000018', 'SEMILLA DE NABO',          'Insumo Agricola',   'Agricola',      true),
  ('MER-000004',  'SEMILLA PASTURA',          'Insumo Agricola',   'Agricola',      true),
  ('MER-000034',  'SILO BOLSAS',             'Insumo Agricola',   'Agricola',      true),
  ('HAC-000001',  'DESMAMANTE MACHO',         'Hacienda',          'Hacienda',      true),
  ('HAC-000005',  'TORO',                    'Hacienda',          'Hacienda',      true),
  ('HAC-000012',  'TORETON',                 'Hacienda',          'Hacienda',      true),
  ('HAC-000007',  'TERNERO',                 'Hacienda',          'Hacienda',      true),
  ('HAC-000009',  'EQUINO',                  'Hacienda',          'Hacienda',      true),
  ('MER-000001',  'COMBUSTIBLE DIESEL',       'Combustible',       'Combustible',   true),
  ('MER-000073',  'COMBUSTIBLE NAFTA',        'Combustible',       'Combustible',   true),
  ('MER-000043',  'ACEITE 15W40',            'Lubricante',        'Mantenimiento', true),
  ('MER-000042',  'ACEITE 10W30',            'Lubricante',        'Mantenimiento', true),
  ('VET-000002',  'CLOSTRISAN',              'Medicamento Vet.',  'Veterinaria',   true),
  ('VET-000009',  'NEUMOSAN 20/50 DOSIS',     'Medicamento Vet.',  'Veterinaria',   true),
  ('MER-000029',  'AFTOMUNE',                'Medicamento Vet.',  'Veterinaria',   true),
  ('MER-000019',  'VACUNA POLI-STAR',         'Medicamento Vet.',  'Veterinaria',   true),
  ('MER-000005',  'VACUNA IR9',              'Medicamento Vet.',  'Veterinaria',   true),
  ('MER-000025',  'MOTOSIERRA HUSQVARNA',     'Equipamiento',      'Operacional',   true),
  ('MER-000028',  'HIDROLAVADORA',            'Equipamiento',      'Mantenimiento', true),
  ('MER-000016',  'TALADRO IRWIN',           'Herramienta',       'Taller',        true),
  ('MER-000014',  'CARAVANA MACHO',          'Equipamiento',      'Ganaderia',     true),
  ('MER-000020',  'CAPA DE LLUVIA 1.60M',     'Uniformes',         'Personal',      true),
  ('MER-000021',  'CAPA DE LLUVIA 1.80M',     'Uniformes',         'Personal',      true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART G: SAP WAREHOUSES (21 records)
-- ============================================================
INSERT INTO sap_warehouses (code, name, category, establishment_id, active) VALUES
  ('DIESEL-YPOTI',  'Diesel Ypoti',            'Combustibles', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('DIESEL-CM',     'Diesel Cerro Memby',       'Combustibles', (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), true),
  ('DIESEL-CA',     'Diesel Cielo Azul',        'Combustibles', (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1),  true),
  ('DIESEL-LUS',    'Diesel Lusipar',           'Combustibles', (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1),     true),
  ('NAFTA-YPOTI',   'Nafta Ypoti',             'Combustibles', (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('RECRIA-YPOTI',  'Recria Ypoti',            'Recria',       (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('RECRIA-CM',     'Recria Cerro Memby',       'Recria',       (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), true),
  ('RECRIA-CA',     'Recria Cielo Azul',        'Recria',       (SELECT id FROM establishments WHERE name='Cielo Azul' LIMIT 1),  true),
  ('RECRIA-LUS',    'Recria Lusipar',           'Recria',       (SELECT id FROM establishments WHERE name='Lusipar' LIMIT 1),     true),
  ('RECRIA-SC',     'Recria Santa Clara',       'Recria',       (SELECT id FROM establishments WHERE name='Santa Clara' LIMIT 1), true),
  ('RECRIA-SMS',    'Recria Santa Maria',       'Recria',       (SELECT id FROM establishments WHERE name='Santa Maria' LIMIT 1), true),
  ('RECRIA-OV',     'Recria Oro Verde',         'Recria',       (SELECT id FROM establishments WHERE name='Oro Verde' LIMIT 1),   true),
  ('RECRIA-YBP',    'Recria Ybypora',           'Recria',       (SELECT id FROM establishments WHERE name='Ybypora' LIMIT 1),     true),
  ('FAB-BAL',       'Fabrica Balanceados',      'Produccion',   (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('FEEDLOT-YPOTI', 'Feedlot Ypoti',           'Produccion',   (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('AGRI',          'Agricultura',             'Produccion',   (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('ALM-AGR-CM',    'Almacen Agricola C.M.',    'Produccion',   (SELECT id FROM establishments WHERE name='Cerro Memby' LIMIT 1), true),
  ('TALLER',        'Taller',                  'Soporte',      (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('FARMACIA',      'Farmacia',                'Soporte',      (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('ALM-GEN',       'Almacen General',          'Soporte',      (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true),
  ('COMPRAS-TEMP',  'Compras Temporal',         'Soporte',      (SELECT id FROM establishments WHERE name='Ypoti' LIMIT 1),       true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART H: APPROVAL CONFIG (thresholds + mappings)
-- ============================================================
INSERT INTO approval_config (key, value, description) VALUES
  ('THRESHOLD_DIRECTOR_REQUIRED', '5000000', 'Valor >= 5M PYG requiere aprobacion Director'),
  ('THRESHOLD_OVERBUDGET',        '50000000', 'Valor >= 50M PYG requiere Ana Moller'),
  ('SLA_MANAGER_NORMAL',          '24', 'SLA gerente normal (horas)'),
  ('SLA_MANAGER_EMERGENCY',       '4', 'SLA gerente emergencia (horas)'),
  ('SLA_DIRECTOR_NORMAL',         '48', 'SLA director normal (horas)'),
  ('SLA_DIRECTOR_EMERGENCY',      '8', 'SLA director emergencia (horas)'),
  ('SLA_OVERBUDGET',              '48', 'SLA overbudget (horas)'),
  ('OVERBUDGET_APPROVER',         'ana.moller', 'Username del aprobador overbudget'),
  ('VET_APPROVER',                'rodrigo.ferreira', 'Username del especialista veterinario'),
  ('VET_SECTORS',                 'Veterinaria,Farmacia', 'Sectores que requieren especialista vet'),
  ('MANAGER_Ypoti',               'fabiano', 'Gerente de area: Ypoti'),
  ('MANAGER_Cerro Memby',         'fabiano', 'Gerente de area: Cerro Memby'),
  ('MANAGER_Ybypora',             'fabiano', 'Gerente de area: Ybypora'),
  ('MANAGER_Cielo Azul',          'mauricio', 'Gerente de area: Cielo Azul'),
  ('MANAGER_Santa Clara',         'mauricio', 'Gerente de area: Santa Clara'),
  ('MANAGER_Yby Pyta',            'mauricio', 'Gerente de area: Yby Pyta'),
  ('MANAGER_Lusipar',             'ronei', 'Gerente de area: Lusipar'),
  ('MANAGER_Santa Maria',         'ronei', 'Gerente de area: Santa Maria'),
  ('MANAGER_Oro Verde',            'ronei', 'Gerente de area: Oro Verde'),
  ('MANAGER_General',             'fabiano', 'Gerente de area: General'),
  ('DIRECTOR_rb',                 'paulo', 'Director: Rural Bioenergia'),
  ('DIRECTOR_ch',                 'gabriel', 'Director: Chacobras'),
  ('DIRECTOR_lc',                 'pedro.moller', 'Director: La Constancia'),
  ('DIRECTOR_cp',                 'gabriel', 'Director: Control Pasto'),
  ('DIRECTOR_am',                 'ana.moller', 'Director: Ana Moller PF'),
  ('DIRECTOR_gm',                 'gabriel', 'Director: Gabriel Moller PF'),
  ('DIRECTOR_pm',                 'pedro.moller', 'Director: Pedro Moller PF')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- PART I: BUDGETS (18 records)
-- Uses subqueries to resolve establishment_id and sector_id
-- ============================================================
`;

// Budget data
const budgets = [
  { name: 'Taller Ypoti',             estab: 'Ypoti',       sector: 'Oficina/Taller',  period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 60000000,  consumed: 15000000 },
  { name: 'Veterinaria Ypoti',        estab: 'Ypoti',       sector: 'Veterinaria',     period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 120000000, consumed: 45000000 },
  { name: 'Nutrición Ypoti',          estab: 'Ypoti',       sector: 'Confinamiento',   period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 250000000, consumed: 80000000 },
  { name: 'Agricultura Ypoti',        estab: 'Ypoti',       sector: 'Agricultura',     period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 180000000, consumed: 55000000 },
  { name: 'Mantenimiento Ypoti',      estab: 'Ypoti',       sector: 'Mantenimiento',   period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 40000000,  consumed: 12000000 },
  { name: 'Combustible Ypoti',        estab: 'Ypoti',       sector: 'Logística',       period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 200000000, consumed: 78000000 },
  { name: 'Admin Ypoti',              estab: 'Ypoti',       sector: 'Administrativo',  period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 30000000,  consumed: 8000000 },
  { name: 'Operacional Cerro Memby',  estab: 'Cerro Memby', sector: 'Recria',          period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 80000000,  consumed: 22000000 },
  { name: 'Veterinaria Cerro Memby',  estab: 'Cerro Memby', sector: 'Veterinaria',     period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 50000000,  consumed: 18000000 },
  { name: 'Operacional Cielo Azul',   estab: 'Cielo Azul',  sector: 'Recria',          period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 70000000,  consumed: 20000000 },
  { name: 'Veterinaria Cielo Azul',   estab: 'Cielo Azul',  sector: 'Veterinaria',     period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 45000000,  consumed: 15000000 },
  { name: 'Operacional Lusipar',      estab: 'Lusipar',     sector: 'Confinamiento',   period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 150000000, consumed: 50000000 },
  { name: 'Veterinaria Lusipar',      estab: 'Lusipar',     sector: 'Veterinaria',     period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 60000000,  consumed: 20000000 },
  { name: 'Operacional Santa Maria',  estab: 'Santa Maria', sector: 'Recria',          period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 65000000,  consumed: 18000000 },
  { name: 'Operacional Ybypora',      estab: 'Ybypora',     sector: 'Recria',          period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 55000000,  consumed: 15000000 },
  { name: 'Operacional Santa Clara',  estab: 'Santa Clara', sector: 'Recria',          period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 50000000,  consumed: 12000000 },
  { name: 'Agricultura Oro Verde',    estab: 'Oro Verde',   sector: 'Agricultura',     period: '2026', start: '2026-01-01', end: '2026-12-31', planned: 90000000,  consumed: 30000000 },
];

for (const b of budgets) {
  // Handle the Logística sector name with accent
  const sectorMatch = b.sector === 'Logística' ? "name LIKE 'Log%'" : `name='${b.sector}'`;
  sql += `INSERT INTO budgets (name, establishment_id, sector_id, period, start_date, end_date, planned_amount, consumed_amount, active)
  VALUES (${esc(b.name)}, (SELECT id FROM establishments WHERE name=${esc(b.estab)} LIMIT 1), (SELECT id FROM sectors WHERE ${sectorMatch} LIMIT 1), ${esc(b.period)}, '${b.start}', '${b.end}', ${b.planned}, ${b.consumed}, true);\n`;
}

sql += `
COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'companies' as tbl, count(*) as cnt FROM companies
UNION ALL SELECT 'establishments', count(*) FROM establishments
UNION ALL SELECT 'sectors', count(*) FROM sectors
UNION ALL SELECT 'product_types', count(*) FROM product_types
UNION ALL SELECT 'suppliers', count(*) FROM suppliers
UNION ALL SELECT 'inventory_catalog', count(*) FROM inventory_catalog
UNION ALL SELECT 'sap_warehouses', count(*) FROM sap_warehouses
UNION ALL SELECT 'approval_config', count(*) FROM approval_config
UNION ALL SELECT 'budgets', count(*) FROM budgets
ORDER BY tbl;
`;

// ---- Write 002-seed-data.sql ----
const seedPath = resolve(__dirname, '002-seed-data.sql');
writeFileSync(seedPath, sql, 'utf8');
console.log(`✅ Written: ${seedPath}`);
console.log(`   Lines: ${sql.split('\n').length}`);

// ============================================================
// Phase 3: Generate user migration SQL
// Uses Supabase auth.users + public.profiles
// ============================================================

const users = parseDefaultUsers();
console.log(`\n📦 Parsed ${users.length} users from defaultUsers.js`);

// Fix role: Mauricio Moller (u206) and Ronei (u001) need role update
// Per user corrections: admin=only Ana Moller, diretoria=Mauricio+Ronei
// But in defaultUsers.js, Mauricio is "admin" and Ronei is "gerente"
// We need to map: ana.moller→admin, mauricio→diretoria, ronei→diretoria (per user's correction)

let userSql = `-- ============================================================
-- YPOTI Compras — Phase 3: User Migration
-- Version: 003
-- Date: 2026-02-28
-- Creates auth.users + public.profiles for all 238 employees
-- Roles corrected: admin=Ana Moller only, diretoria=Mauricio+Ronei
-- ============================================================

-- NOTE: This SQL uses Supabase's auth.users table directly.
-- It creates users with the synthetic email username@ypoti.local
-- and password 'ypoti2026' (bcrypt hashed by Supabase).
-- The profiles table is populated with role, establishment, position.

-- We need to use the Supabase Admin API to create auth users,
-- since INSERT into auth.users requires specific encrypted password format.
-- Instead, we'll INSERT profiles directly and use a separate script
-- for auth user creation.

-- APPROACH: Insert profiles first, then create auth users via API.
-- The profile.auth_id will be updated after auth user creation.

BEGIN;

-- ============================================================
-- Insert all profiles (without auth_id for now)
-- auth_id will be linked after auth.users are created
-- ============================================================
`;

for (const u of users) {
  // Apply role corrections per user's instructions:
  // - ana.moller → admin (already correct in data)
  // - mauricio (u206) → diretoria (was admin)
  // - ronei (u001) → diretoria (was gerente, user correction says diretoria)
  let role = u.role;
  if (u.email === 'mauricio') role = 'diretoria';
  if (u.email === 'ronei') role = 'diretoria';

  // Handle "General" establishment → NULL (no specific establishment)
  const estabExpr = u.establishment === 'General'
    ? 'NULL'
    : `(SELECT id FROM establishments WHERE name=${esc(u.establishment)} LIMIT 1)`;

  userSql += `INSERT INTO profiles (username, full_name, role, establishment_id, position, avatar, active, force_password_change)
  VALUES (${esc(u.email)}, ${esc(u.name)}, ${esc(role)}, ${estabExpr}, ${esc(u.position)}, ${esc(u.avatar)}, ${u.active}, true);\n`;
}

userSql += `
COMMIT;

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT role, count(*) as cnt FROM profiles GROUP BY role ORDER BY role;
`;

const userPath = resolve(__dirname, '003-profiles.sql');
writeFileSync(userPath, userSql, 'utf8');
console.log(`\n✅ Written: ${userPath}`);
console.log(`   Lines: ${userSql.split('\n').length}`);
console.log(`   Users: ${users.length}`);

// Print role distribution
const roleCounts = {};
for (const u of users) {
  let role = u.role;
  if (u.email === 'mauricio') role = 'diretoria';
  if (u.email === 'ronei') role = 'diretoria';
  roleCounts[role] = (roleCounts[role] || 0) + 1;
}
console.log('\n📊 Role distribution:');
for (const [role, count] of Object.entries(roleCounts).sort()) {
  console.log(`   ${role}: ${count}`);
}
