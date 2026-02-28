-- ============================================================
-- YPOTI Compras — Phase 2: Seed Reference Data
-- Version: 002 (corrected)
-- Date: 2026-02-28
-- Generated from src/constants/* — matches 001-schema.sql
-- ============================================================

-- ============================================================
-- PRE-REQUISITE: Add columns not in original DDL but needed
-- ============================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS activity TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE inventory_catalog ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE sap_warehouses ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE approval_config ADD COLUMN IF NOT EXISTS value TEXT;

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
-- NOTE: column is group_name (not "group" which is reserved)
-- ============================================================
INSERT INTO inventory_catalog (code, name, type, group_name, active) VALUES
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
-- NOTE: establishment is TEXT (not FK), matches establishment name
-- ============================================================
INSERT INTO sap_warehouses (code, name, category, establishment, active) VALUES
  ('DIESEL-YPOTI',  'Diesel Ypoti',            'Combustibles', 'Ypoti',       true),
  ('DIESEL-CM',     'Diesel Cerro Memby',       'Combustibles', 'Cerro Memby', true),
  ('DIESEL-CA',     'Diesel Cielo Azul',        'Combustibles', 'Cielo Azul',  true),
  ('DIESEL-LUS',    'Diesel Lusipar',           'Combustibles', 'Lusipar',     true),
  ('NAFTA-YPOTI',   'Nafta Ypoti',             'Combustibles', 'Ypoti',       true),
  ('RECRIA-YPOTI',  'Recria Ypoti',            'Recria',       'Ypoti',       true),
  ('RECRIA-CM',     'Recria Cerro Memby',       'Recria',       'Cerro Memby', true),
  ('RECRIA-CA',     'Recria Cielo Azul',        'Recria',       'Cielo Azul',  true),
  ('RECRIA-LUS',    'Recria Lusipar',           'Recria',       'Lusipar',     true),
  ('RECRIA-SC',     'Recria Santa Clara',       'Recria',       'Santa Clara', true),
  ('RECRIA-SMS',    'Recria Santa Maria',       'Recria',       'Santa Maria', true),
  ('RECRIA-OV',     'Recria Oro Verde',         'Recria',       'Oro Verde',   true),
  ('RECRIA-YBP',    'Recria Ybypora',           'Recria',       'Ybypora',     true),
  ('FAB-BAL',       'Fabrica Balanceados',      'Produccion',   'Ypoti',       true),
  ('FEEDLOT-YPOTI', 'Feedlot Ypoti',           'Produccion',   'Ypoti',       true),
  ('AGRI',          'Agricultura',             'Produccion',   'Ypoti',       true),
  ('ALM-AGR-CM',    'Almacen Agricola C.M.',    'Produccion',   'Cerro Memby', true),
  ('TALLER',        'Taller',                  'Soporte',      'Ypoti',       true),
  ('FARMACIA',      'Farmacia',                'Soporte',      'Ypoti',       true),
  ('ALM-GEN',       'Almacen General',          'Soporte',      'Ypoti',       true),
  ('COMPRAS-TEMP',  'Compras Temporal',         'Soporte',      'Ypoti',       true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PART H: APPROVAL CONFIG (27 key-value pairs)
-- Uses rule_key + value columns (value added via ALTER TABLE)
-- ============================================================
INSERT INTO approval_config (rule_key, value, description) VALUES
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
ON CONFLICT (rule_key) DO NOTHING;

-- ============================================================
-- PART I: BUDGETS (17 records)
-- NOTE: establishment and sector are TEXT columns (not FKs)
-- NOTE: columns are "planned" and "consumed" (not planned_amount)
-- ============================================================
INSERT INTO budgets (name, establishment, sector, period, start_date, end_date, planned, consumed, active) VALUES
  ('Taller Ypoti',              'Ypoti',       'Oficina/Taller',   '2026', '2026-01-01', '2026-12-31', 60000000,  15000000, true),
  ('Veterinaria Ypoti',         'Ypoti',       'Veterinaria',      '2026', '2026-01-01', '2026-12-31', 120000000, 45000000, true),
  ('Nutrición Ypoti',           'Ypoti',       'Confinamiento',    '2026', '2026-01-01', '2026-12-31', 250000000, 80000000, true),
  ('Agricultura Ypoti',         'Ypoti',       'Agricultura',      '2026', '2026-01-01', '2026-12-31', 180000000, 55000000, true),
  ('Mantenimiento Ypoti',       'Ypoti',       'Mantenimiento',    '2026', '2026-01-01', '2026-12-31', 40000000,  12000000, true),
  ('Combustible Ypoti',         'Ypoti',       'Logística',        '2026', '2026-01-01', '2026-12-31', 200000000, 78000000, true),
  ('Admin Ypoti',               'Ypoti',       'Administrativo',   '2026', '2026-01-01', '2026-12-31', 30000000,  8000000,  true),
  ('Operacional Cerro Memby',   'Cerro Memby', 'Recria',           '2026', '2026-01-01', '2026-12-31', 80000000,  22000000, true),
  ('Veterinaria Cerro Memby',   'Cerro Memby', 'Veterinaria',      '2026', '2026-01-01', '2026-12-31', 50000000,  18000000, true),
  ('Operacional Cielo Azul',    'Cielo Azul',  'Recria',           '2026', '2026-01-01', '2026-12-31', 70000000,  20000000, true),
  ('Veterinaria Cielo Azul',    'Cielo Azul',  'Veterinaria',      '2026', '2026-01-01', '2026-12-31', 45000000,  15000000, true),
  ('Operacional Lusipar',       'Lusipar',     'Confinamiento',    '2026', '2026-01-01', '2026-12-31', 150000000, 50000000, true),
  ('Veterinaria Lusipar',       'Lusipar',     'Veterinaria',      '2026', '2026-01-01', '2026-12-31', 60000000,  20000000, true),
  ('Operacional Santa Maria',   'Santa Maria', 'Recria',           '2026', '2026-01-01', '2026-12-31', 65000000,  18000000, true),
  ('Operacional Ybypora',       'Ybypora',     'Recria',           '2026', '2026-01-01', '2026-12-31', 55000000,  15000000, true),
  ('Operacional Santa Clara',   'Santa Clara', 'Recria',           '2026', '2026-01-01', '2026-12-31', 50000000,  12000000, true),
  ('Agricultura Oro Verde',     'Oro Verde',   'Agricultura',      '2026', '2026-01-01', '2026-12-31', 90000000,  30000000, true)
ON CONFLICT DO NOTHING;

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
