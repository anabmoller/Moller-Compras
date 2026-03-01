-- ============================================================
-- MIGRATION: Seed Real Operational Data — Compras Ypoti
-- Date: 2026-02-28
-- Purpose: Add enriched product catalog, KPI history, supplier
--          intelligence, locations, contracts, and stock tracking
--          WITHOUT touching the existing 17-table schema.
-- ============================================================
-- EXISTING TABLES (DO NOT RECREATE):
--   companies, establishments, sectors, product_types, suppliers,
--   inventory_catalog, sap_warehouses, approval_config, profiles,
--   budgets, requests, request_items, quotations, comments,
--   approval_steps, approval_history, budget_transactions
-- ============================================================

-- ============================================================
-- 1. NEW ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE supplier_rating AS ENUM ('sin_evaluar', 'regular', 'bueno', 'muy_bueno', 'excelente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('bajo', 'moderado', 'alto', 'critico');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE semaforo AS ENUM ('verde', 'amarillo', 'rojo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. ALTER TABLE: suppliers — add intelligence columns
-- ============================================================
-- Existing columns kept: id, legacy_id, name, ruc, phone, email, category, active, created_at
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rating supplier_rating DEFAULT 'sin_evaluar';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS risk_level risk_level DEFAULT 'bajo';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rubros TEXT[];
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_conditions TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_single_source BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS annual_volume_gs BIGINT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS invoice_count INTEGER;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 3. NEW TABLES
-- ============================================================

-- 3.1 Categories (accounting/operational grouping for products)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  grupo_contable TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 Subcategories
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id, name)
);

-- 3.3 Locations (physical hierarchy: estancia > deposito)
-- Complementary to `establishments` (organizational units).
-- This tracks physical storage locations within farms.
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('estancia', 'deposito', 'oficina')),
  parent_id UUID REFERENCES locations(id),
  address TEXT,
  city TEXT,
  department TEXT,
  country TEXT DEFAULT 'Paraguay',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.4 Products (enriched product master — extends inventory_catalog)
-- inventory_catalog = flat SAP reference (code, name, type, group_name)
-- products = full product detail with FKs to categories, subcategories, suppliers
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  unit_of_measure TEXT,
  presentation TEXT,
  manufacturer TEXT,
  active_ingredient TEXT,
  species TEXT,
  administration_route TEXT,
  criticality TEXT CHECK (criticality IN ('baja', 'media', 'alta', 'critica')),
  default_supplier_id UUID REFERENCES suppliers(id),
  deposit TEXT,
  grupo_contable TEXT,
  status TEXT DEFAULT 'activo',
  min_stock NUMERIC,
  reorder_point NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3.5 Price History (benchmark and historical pricing)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  supplier_id UUID REFERENCES suppliers(id),
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'GS' CHECK (currency IN ('GS', 'USD')),
  unit TEXT,
  date DATE NOT NULL,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.6 Monthly KPIs (operational indicators from Asana/Notion)
CREATE TABLE IF NOT EXISTS monthly_kpis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period TEXT NOT NULL UNIQUE,
  reference_date DATE,
  orders_created INTEGER,
  orders_completed INTEGER,
  orders_overdue INTEGER,
  orders_emergency INTEGER,
  backlog_end INTEGER,
  emergency_pct NUMERIC,
  resolution_rate NUMERIC,
  lead_time_avg NUMERIC,
  lead_time_median NUMERIC,
  lead_time_p90 NUMERIC,
  lead_time_emergency NUMERIC,
  avg_delay_days NUMERIC,
  iqd_price NUMERIC,
  iqd_requester NUMERIC,
  iqd_urgency NUMERIC,
  iqd_total NUMERIC,
  semaforo semaforo,
  top_location TEXT,
  top_sector TEXT,
  top_type TEXT,
  sap_spending_gs BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.7 Contracts (supplier contracts tracking)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id),
  product_category TEXT,
  product_description TEXT,
  price_per_unit NUMERIC,
  currency TEXT DEFAULT 'USD',
  unit TEXT,
  volume_contracted NUMERIC,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'activo' CHECK (status IN ('activo', 'vencido', 'cerrado', 'renovado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.8 Stock Movements (entrada/salida per location)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  location_id UUID REFERENCES locations(id),
  movement_type TEXT CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
  quantity NUMERIC NOT NULL,
  unit TEXT,
  date DATE NOT NULL,
  responsible TEXT,
  reference_doc TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.9 Fuel Consumption (diesel/nafta tracking per equipment)
CREATE TABLE IF NOT EXISTS fuel_consumption (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fuel_type TEXT CHECK (fuel_type IN ('diesel', 'nafta')),
  location_id UUID REFERENCES locations(id),
  date DATE NOT NULL,
  liters NUMERIC NOT NULL,
  equipment TEXT,
  operator TEXT,
  hourmeter_reading NUMERIC,
  cost_per_liter NUMERIC,
  total_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);
CREATE INDEX IF NOT EXISTS idx_monthly_kpis_date ON monthly_kpis(reference_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_date ON fuel_consumption(date);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_contracts_supplier ON contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- ============================================================
-- 5. RLS + POLICIES for new tables
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_consumption ENABLE ROW LEVEL SECURITY;

-- Read: all authenticated users
CREATE POLICY categories_select ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY subcategories_select ON subcategories FOR SELECT TO authenticated USING (true);
CREATE POLICY locations_select ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY products_select ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY price_history_select ON price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY monthly_kpis_select ON monthly_kpis FOR SELECT TO authenticated USING (true);
CREATE POLICY contracts_select ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY stock_movements_select ON stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY fuel_consumption_select ON fuel_consumption FOR SELECT TO authenticated USING (true);

-- Write: admin only (using existing is_admin() function from 001-schema.sql)
CREATE POLICY categories_admin ON categories FOR ALL USING (is_admin());
CREATE POLICY subcategories_admin ON subcategories FOR ALL USING (is_admin());
CREATE POLICY locations_admin ON locations FOR ALL USING (is_admin());
CREATE POLICY products_admin ON products FOR ALL USING (is_admin());
CREATE POLICY price_history_admin ON price_history FOR ALL USING (is_admin());
CREATE POLICY monthly_kpis_admin ON monthly_kpis FOR ALL USING (is_admin());
CREATE POLICY contracts_admin ON contracts FOR ALL USING (is_admin());
CREATE POLICY stock_movements_admin ON stock_movements FOR ALL USING (is_admin());
CREATE POLICY fuel_consumption_admin ON fuel_consumption FOR ALL USING (is_admin());

-- ============================================================
-- 6. SEED DATA — CATEGORIES
-- ============================================================
INSERT INTO categories (name, description, grupo_contable) VALUES
  ('Veterinaria', 'Medicamentos, vacunas y productos veterinarios', 'DEPOSITO ESTANCIA'),
  ('Hacienda', 'Compra de ganado bovino, equino y otros', 'HACIENDA VACUNA - COMPRA'),
  ('Materia Prima', 'Alimentos balanceados, granos, subproductos', 'MATERIA PRIMA'),
  ('Combustible', 'Diesel, nafta y derivados', 'COMBUSTIBLE'),
  ('Lubricantes', 'Aceites, grasas y fluidos hidraulicos', 'LUBRICANTES'),
  ('Productos Agricolas', 'Fertilizantes, herbicidas, semillas', 'PRODUCTOS AGRICOLAS'),
  ('Repuestos', 'Piezas y repuestos de maquinaria', 'REPUESTOS'),
  ('Infraestructura', 'Materiales de construccion, alambrados, postes', 'INFRAESTRUCTURA'),
  ('Tecnologia', 'Equipos informaticos, software', 'TECNOLOGIA'),
  ('Menaje/Cocina', 'Equipamiento gastronomico y menaje', 'MENAJE')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 7. SEED DATA — SUBCATEGORIES
-- ============================================================
INSERT INTO subcategories (category_id, name, description)
SELECT c.id, s.name, s.description FROM (VALUES
  ('Veterinaria', 'Antiparasitarios', 'Ivermectinas, endectocidas'),
  ('Veterinaria', 'Vacunas', 'Clostridiales, neumosan, rabia'),
  ('Veterinaria', 'Antibioticos', 'Florfenicol, oxitetraciclina, cefalosporinas'),
  ('Veterinaria', 'Antiinflamatorios', 'AINES, corticoides'),
  ('Veterinaria', 'Vitaminas/Suplementos', 'Monovin, Catosal, Bioxan'),
  ('Veterinaria', 'Material Descartable', 'Seringas, guantes, tubos'),
  ('Veterinaria', 'Identificacion', 'Brincos, caravanas, aplicadores'),
  ('Veterinaria', 'Equipamiento', 'Pistolas dosadoras, aplicadores pour-on'),
  ('Hacienda', 'Bovinos - Cria', 'Desmamantes, terneros'),
  ('Hacienda', 'Bovinos - Engorde', 'Novillos, toretones, vacas'),
  ('Hacienda', 'Equinos/Otros', 'Equinos, mulas, burros'),
  ('Materia Prima', 'Subproductos Industriales', 'Burlanda, cascarilla, afrecho'),
  ('Materia Prima', 'Granos', 'Maiz humedo, maiz seco, sorgo'),
  ('Materia Prima', 'Harinas', 'Harina de soja, concentrados'),
  ('Materia Prima', 'Minerales', 'Sal entrefina, calcareo, premezclas'),
  ('Combustible', 'Diesel', 'Gasoil para maquinaria y vehiculos'),
  ('Combustible', 'Nafta', 'Gasolina para vehiculos y motos'),
  ('Lubricantes', 'Aceites Motor', '15W40, Shell, Ambra'),
  ('Lubricantes', 'Aceites Hidraulicos', 'Hydra 68, HY-GARD'),
  ('Lubricantes', 'Aceites Transmision', '80W90, 85W140'),
  ('Productos Agricolas', 'Fertilizantes', 'NPK, foliares, urea'),
  ('Productos Agricolas', 'Herbicidas', 'Glifosato, atrazina'),
  ('Productos Agricolas', 'Insecticidas', 'Piretroides, neonicotinoides'),
  ('Repuestos', 'Filtros', 'Aceite, combustible, aire, hidraulico'),
  ('Repuestos', 'Correas/Transmision', 'Correas, cadenas, rodamientos'),
  ('Infraestructura', 'Alambrados', 'Postes, alambre, varillas'),
  ('Infraestructura', 'Construccion', 'Cemento, hierro, ladrillos')
) AS s(cat, name, description)
JOIN categories c ON c.name = s.cat
ON CONFLICT (category_id, name) DO NOTHING;

-- ============================================================
-- 8. SEED DATA — LOCATIONS
-- ============================================================
INSERT INTO locations (name, type, address, city, department) VALUES
  ('YPOTI', 'estancia', NULL, NULL, 'San Pedro'),
  ('ORO VERDE', 'estancia', NULL, NULL, 'San Pedro'),
  ('LUSIPAR', 'estancia', NULL, NULL, 'San Pedro'),
  ('SANTA CLARA', 'estancia', NULL, NULL, 'San Pedro'),
  ('YBY PORA', 'estancia', NULL, NULL, 'Canindeyú'),
  ('YBY PYTA', 'estancia', NULL, NULL, 'Canindeyú'),
  ('CERRO MEMBY', 'estancia', NULL, NULL, 'San Pedro'),
  ('CIELO AZUL', 'estancia', NULL, NULL, 'Concepcion'),
  ('SANTA MARIA DA SERRA', 'estancia', NULL, NULL, 'San Pedro'),
  ('OFICINA ASUNCION', 'oficina', NULL, 'Asuncion', 'Central')
ON CONFLICT (name) DO NOTHING;

-- Depositos (child of estancias)
INSERT INTO locations (name, type, parent_id)
SELECT d.name, 'deposito', l.id FROM (VALUES
  ('YPOTI', 'ALMACEN GENERAL - YPOTI'),
  ('YPOTI', 'FARMACIA - YPOTI'),
  ('LUSIPAR', 'RECRIA LUSIPAR'),
  ('YBY PORA', 'ALMACEN GENERAL - YBY PORA'),
  ('CERRO MEMBY', 'ALMACEN GENERAL - CERRO MEMBY'),
  ('CIELO AZUL', 'ALMACEN GENERAL - CIELO AZUL'),
  ('SANTA CLARA', 'ALMACEN GENERAL - SANTA CLARA')
) AS d(estancia, name)
JOIN locations l ON l.name = d.estancia
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 9. SEED DATA — SUPPLIERS (enrich existing + add new)
-- ============================================================

-- 9a. Update existing suppliers with new intelligence data where we have RUC match
-- (existing suppliers from 002-seed-data.sql mostly have NULL ruc, so this is limited)

-- 9b. Insert new suppliers that don't already exist by name (case-insensitive)
INSERT INTO suppliers (name, ruc, contact_name, phone, email, city, rating, risk_level, rubros, payment_conditions, is_single_source, annual_volume_gs, invoice_count, notes, active)
SELECT v.name, v.ruc, v.contact_name, v.phone, v.email, v.city,
       v.rating::supplier_rating, v.risk_level::risk_level,
       v.rubros, v.payment_conditions, v.is_single_source,
       v.annual_volume_gs, v.invoice_count, v.notes, true
FROM (VALUES
  -- Directorio de Proveedores (with contact info)
  ('Riego del Este S.A.', '80089123-4', 'Martin Rojas', '0971 888 321', 'ventas@riegodeleste.com.py', 'Ciudad del Este', 'excelente', 'bajo', ARRAY['Bombas/Riego','Cocina Industrial','Generadores','Menaje','Vidrios'], '3% desc 15 dias, 5% contado', false, NULL::BIGINT, NULL::INTEGER, 'Garantia 2 anos bomba. Entrega 7 dias'),
  ('Hidro Agro Paraguay S.A.', '80072345-1', 'Pedro Gonzalez', '0981 444 555', 'pedro@hidroagro.com.py', 'Asuncion', 'bueno', 'bajo', ARRAY['Bombas/Riego','Generadores'], 'Solo contado', false, NULL, NULL, 'Especialista bombas sumergibles. Entrega 5 dias'),
  ('Vidriopar S.A.', '80078321-7', 'Ventas', '021 333 7700', NULL, 'Asuncion', 'sin_evaluar', 'bajo', ARRAY['Infraestructura','Vidrios'], NULL, false, NULL, NULL, 'Vidrio templado, laminado'),
  ('Grupo Sudamerica S.A.', '80065712-8', 'Carolina Pellegrini', NULL, 'carpell@semillassudamerica.com', 'Asuncion', 'excelente', 'bajo', ARRAY['Bombas/Riego','Cocina Industrial','Generadores','Menaje','Vidrios'], '30 dias, 1 ano garantia', false, NULL, NULL, 'Proveedor integral. Marcas premium. Entrega 10-15 dias'),
  ('Venancio Paraguay', '80091445-2', 'Ventas', '021 555 8900', NULL, 'Asuncion', 'sin_evaluar', 'bajo', ARRAY['Cocina Industrial','Menaje'], NULL, false, NULL, NULL, 'Fabricante brasileno, representacion local'),
  -- Veterinary suppliers
  ('Agroveterinaria Consult-Pec S.R.L.', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Veterinaria'], NULL, false, NULL, NULL, 'Proveedor principal de veterinarios'),
  ('Compania Veterinaria del Paraguay', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Veterinaria'], NULL, false, NULL, NULL, NULL),
  ('CIAVET S.R.L.', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Veterinaria'], NULL, false, NULL, NULL, NULL),
  ('Azure Paraguay S.A.', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Veterinaria'], NULL, false, NULL, NULL, NULL),
  -- Strategic suppliers (from Radiografia, Mapa de Riesgo)
  ('CHACOBRAS S.A.', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'alto', ARRAY['Hacienda'], NULL, true, 72500000000, NULL, 'Top 1 por volumen. Gs 72.5B. Proveedor principal de ganado Rural Engorda'),
  ('INPASA', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'critico', ARRAY['Materia Prima'], NULL, true, 56400000000, NULL, 'Monopolio Burlanda. 9.1M kg/2025. USD 223/ton actual, target 215-220'),
  ('ADM Paraguay', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'critico', ARRAY['Materia Prima'], NULL, true, NULL, NULL, 'Monopolio Cascarilla de Soja. 3.0M kg/2025. Precio subio USD 88-110'),
  ('TORO PAMPA', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Combustible'], NULL, false, 32500000000, NULL, 'Gs 32.5B. Proveedor principal de combustible'),
  ('NETEL S.A.', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Repuestos','Veterinaria'], NULL, false, NULL, 828, '828 facturas. Oportunidad descuento por volumen'),
  ('Comercial Progreso', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Insumos Generales'], NULL, false, NULL, 702, '702 facturas. Oportunidad descuento por volumen'),
  ('RANCHO PIRA', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Hacienda'], NULL, false, 22100000000, NULL, 'Gs 22.1B'),
  ('FERUSA', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Repuestos','Infraestructura'], NULL, false, 16800000000, NULL, 'Gs 16.8B'),
  ('AGY ARAGUANEY', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'critico', ARRAY['Materia Prima'], NULL, true, NULL, NULL, 'Monopolio Maiz Seco 2025. 522K kg. Diversificar urgente'),
  ('ANR S.A.', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'critico', ARRAY['Materia Prima'], NULL, true, NULL, NULL, 'Monopolio Calcareo. 2.4M kg/2025'),
  ('TENERIFE', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'moderado', ARRAY['Materia Prima'], NULL, false, NULL, NULL, 'Harina de Soja 55.5% concentracion'),
  ('INDUSPAR', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'moderado', ARRAY['Materia Prima'], NULL, false, NULL, NULL, 'Sal Entrefina 68.6% concentracion'),
  ('BOVITECNICA', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Materia Prima'], NULL, false, NULL, NULL, 'Sal Entrefina 31.4%'),
  ('Agrofertil S.A.', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'alto', ARRAY['Productos Agricolas'], NULL, true, NULL, NULL, '47 de 48 productos sin alternativa. Negociar competidores para top 10'),
  ('Petroquim', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Combustible'], NULL, false, NULL, NULL, 'Alternativa combustible para negociacion'),
  -- Maiz suppliers
  ('Pedro Bahman', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Materia Prima'], NULL, false, NULL, NULL, 'Proveedor maiz humedo'),
  ('Johan Wolt Friessen', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Materia Prima'], NULL, false, NULL, NULL, 'Proveedor maiz humedo'),
  ('Julio Schulz', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Materia Prima'], NULL, false, NULL, NULL, 'Proveedor maiz humedo'),
  ('Peter Harder', NULL, NULL, NULL, NULL, NULL, 'sin_evaluar', 'bajo', ARRAY['Materia Prima'], NULL, false, NULL, NULL, 'Proveedor maiz seco - RANCHO PIRA')
) AS v(name, ruc, contact_name, phone, email, city, rating, risk_level, rubros, payment_conditions, is_single_source, annual_volume_gs, invoice_count, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM suppliers s WHERE LOWER(s.name) = LOWER(v.name)
);

-- 9c. Enrich existing SAP-imported suppliers with risk/volume data where names partially match
UPDATE suppliers SET
  risk_level = 'critico',
  rubros = ARRAY['Materia Prima'],
  is_single_source = true,
  notes = COALESCE(notes, '') || ' | Monopolio Burlanda. 9.1M kg/2025',
  updated_at = now()
WHERE LOWER(name) LIKE '%inpasa%' AND risk_level IS NULL;

UPDATE suppliers SET
  risk_level = 'critico',
  rubros = ARRAY['Materia Prima'],
  is_single_source = true,
  notes = COALESCE(notes, '') || ' | Monopolio Cascarilla de Soja',
  updated_at = now()
WHERE LOWER(name) LIKE '%adm%paraguay%' AND risk_level IS NULL;

UPDATE suppliers SET
  risk_level = 'alto',
  rubros = ARRAY['Productos Agricolas'],
  is_single_source = true,
  notes = COALESCE(notes, '') || ' | 47/48 productos sin alternativa',
  updated_at = now()
WHERE LOWER(name) LIKE '%agrofertil%' AND risk_level IS NULL;

UPDATE suppliers SET
  risk_level = 'bajo',
  annual_volume_gs = 16800000000,
  rubros = ARRAY['Repuestos','Infraestructura'],
  notes = COALESCE(notes, '') || ' | Gs 16.8B volumen anual',
  updated_at = now()
WHERE LOWER(name) LIKE '%ferusa%' AND risk_level IS NULL;

-- ============================================================
-- 10. SEED DATA — PRODUCTS
-- ============================================================
INSERT INTO products (name, code, category_id, unit_of_measure, presentation, manufacturer, active_ingredient, species, administration_route, deposit, grupo_contable, default_supplier_id)
SELECT p.name, p.code, c.id, p.unit, p.presentation, p.manufacturer, p.active_ingredient, p.species, p.route, p.deposit, p.grupo_contable, s.id
FROM (VALUES
  -- Veterinaria
  ('RABATVAC BOVIS 100ML', 'VET-000001', 'Veterinaria', 'frasco', '100ml', NULL, 'Virus rabico inactivado', 'Bovino', 'Subcutanea', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Agroveterinaria Consult-Pec S.R.L.'),
  ('CLOSTRISAN', 'VET-000002', 'Veterinaria', 'frasco', NULL, 'Virbac', 'Polivalente clostridial', 'Bovino', 'Subcutanea', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Agroveterinaria Consult-Pec S.R.L.'),
  ('BIOPOLIGEN HS', 'VET-000003', 'Veterinaria', 'frasco', NULL, NULL, 'Polivalente reproductivo', 'Bovino', 'Subcutanea', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'CIAVET S.R.L.'),
  ('IVOMEC G 3,15 1LTS', 'VET-000004', 'Veterinaria', 'frasco', '1 litro', 'Boehringer Ingelheim', 'Ivermectina 3.15%', 'Bovino', 'Subcutanea', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Agroveterinaria Consult-Pec S.R.L.'),
  ('ZUPREVO 180 MG X 100ML', 'VET-000005', 'Veterinaria', 'frasco', '100ml', 'MSD', 'Tildipirosin 180mg/ml', 'Bovino', 'Subcutanea', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Compania Veterinaria del Paraguay'),
  ('HEPATOXAN 100ML', 'VET-000006', 'Veterinaria', 'frasco', '100ml', NULL, 'Hepatoprotector', 'Bovino', 'Inyectable', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Compania Veterinaria del Paraguay'),
  ('SOLUTION LA 3,5% 500ML', 'VET-000007', 'Veterinaria', 'frasco', '500ml', NULL, 'Ivermectina 3.5% LA', 'Bovino', 'Subcutanea', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Compania Veterinaria del Paraguay'),
  ('ECTOLINE 5LTS', 'VET-000008', 'Veterinaria', 'bidon', '5 litros', NULL, 'Ectoparasiticida', 'Bovino', 'Pour-on', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Agroveterinaria Consult-Pec S.R.L.'),
  ('VACUNA NEUMOSAN DE 20/50DOSIS', 'VET-000009', 'Veterinaria', 'frasco', '20-50 dosis', 'Virbac', 'Neumococica bovina', 'Bovino', 'Subcutanea', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Agroveterinaria Consult-Pec S.R.L.'),
  ('DECTOMAX INY X 500 ML', 'VET-000010', 'Veterinaria', 'frasco', '500ml', 'Elanco', 'Doramectina', 'Bovino', 'Subcutanea', 'FARMACIA', 'DEPOSITO ESTANCIA', 'CIAVET S.R.L.'),
  ('IVERGEN PLAT 3.15 500 ML', 'VET-000011', 'Veterinaria', 'frasco', '500ml', NULL, 'Ivermectina 3.15% Platinum', 'Bovino', 'Subcutanea', 'FARMACIA', 'DEPOSITO ESTANCIA', 'Agroveterinaria Consult-Pec S.R.L.'),
  ('CIDENTAL 250 ML', 'VET-000012', 'Veterinaria', 'frasco', '250ml', 'Bimeda', 'Ectoparasiticida', 'Bovino', 'Topica', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Azure Paraguay S.A.'),
  ('POLICLOSTRIGEN 250 ML 50 DOSIS', 'VET-000013', 'Veterinaria', 'frasco', '250ml/50 dosis', NULL, 'Polivalente clostridial', 'Bovino', 'Subcutanea', 'ALMACEN GENERAL', 'DEPOSITO ESTANCIA', 'Agroveterinaria Consult-Pec S.R.L.'),
  -- Hacienda
  ('DESMAMANTE MACHO', 'HAC-000001', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, 'ALMACEN GENERAL', 'HACIENDA VACUNA - COMPRA', NULL),
  ('DESMAMANTE HEMBRA', 'HAC-000002', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, 'RECRIA LUSIPAR', 'HACIENDA VACUNA - COMPRA', NULL),
  ('VAQUILLA', 'HAC-000003', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, NULL, 'HACIENDA VACUNA - COMPRA', NULL),
  ('VACA', 'HAC-000004', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, NULL, 'HACIENDA VACUNA - COMPRA', NULL),
  ('TORO', 'HAC-000005', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, NULL, 'HACIENDA VACUNA - COMPRA', NULL),
  ('NOVILLO', 'HAC-000006', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, NULL, 'HACIENDA VACUNA - COMPRA', NULL),
  ('TERNERO', 'HAC-000007', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, NULL, 'HACIENDA VACUNA - COMPRA', NULL),
  ('MULA', 'HAC-000008', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Equino', NULL, NULL, 'OTRAS HACIENDAS', NULL),
  ('EQUINO', 'HAC-000009', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Equino', NULL, NULL, 'OTRAS HACIENDAS', NULL),
  ('BURRO', 'HAC-000010', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Equino', NULL, NULL, 'OTRAS HACIENDAS', NULL),
  ('VACA NELORE', 'HAC-000011', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, NULL, 'HACIENDA VACUNA - COMPRA', NULL),
  ('TORETON', 'HAC-000012', 'Hacienda', 'cabeza', NULL, NULL, NULL, 'Bovino', NULL, NULL, 'HACIENDA VACUNA - COMPRA', NULL)
) AS p(name, code, cat, unit, presentation, manufacturer, active_ingredient, species, route, deposit, grupo_contable, supplier_name)
JOIN categories c ON c.name = p.cat
LEFT JOIN suppliers s ON s.name = p.supplier_name
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  unit_of_measure = EXCLUDED.unit_of_measure,
  presentation = EXCLUDED.presentation,
  manufacturer = EXCLUDED.manufacturer,
  active_ingredient = EXCLUDED.active_ingredient,
  species = EXCLUDED.species,
  administration_route = EXCLUDED.administration_route,
  default_supplier_id = COALESCE(EXCLUDED.default_supplier_id, products.default_supplier_id),
  updated_at = now();

-- ============================================================
-- 11. SEED DATA — MONTHLY KPIs (15 months of history)
-- ============================================================
INSERT INTO monthly_kpis (period, reference_date, orders_created, orders_completed, orders_overdue, orders_emergency, backlog_end, emergency_pct, resolution_rate, lead_time_avg, lead_time_median, lead_time_p90, lead_time_emergency, avg_delay_days, iqd_price, iqd_requester, iqd_urgency, iqd_total, semaforo, top_location, top_sector, top_type, sap_spending_gs, notes) VALUES
  ('Dic 2024', '2024-12-01', 14, 14, 0, 0, 11, 0, 100, 30.1, 21, 34, NULL, 9, 7.1, 0, 85.7, 30.9, 'amarillo', 'Ybypora', 'Recria', 'Insumo', NULL, 'Mes inicial Asana. Backlog bajo'),
  ('Ene 2025', '2025-01-01', 66, 66, 0, 0, 34, 0, 100, 57.4, 11, 164, NULL, 14, 15.2, 0, 86.4, 33.8, 'verde', 'Ypoti', 'Recria', 'Insumo', NULL, 'Alta productividad. P90 elevado por tareas legacy'),
  ('Feb 2025', '2025-02-01', 38, 38, 0, 0, 52, 0, 100, 77.7, 119, 134.3, NULL, 29, 10.5, 0, 68.4, 26.3, 'amarillo', 'Ypoti', 'Recria', 'Insumo', NULL, 'Backlog supera 50. Lead time mediano altisimo'),
  ('Mar 2025', '2025-03-01', 32, 32, 0, 0, 69, 0, 100, 60, 59.5, 103.5, NULL, 51, 21.9, 0, 84.4, 35.4, 'amarillo', 'Cerro Memby', 'Recria', 'Insumo', NULL, 'Cerro Memby como top local'),
  ('Abr 2025', '2025-04-01', 24, 22, 0, 0, 76, 0, 92, 33.1, 20.5, 74.5, NULL, 72, 8.3, 0, 50, 19.4, 'amarillo', 'Ypoti', 'Recria', 'Equipamento', 36300000000, 'Pior IQD (19.4%). SAP Gs 36.3B'),
  ('May 2025', '2025-05-01', 33, 31, 2, 0, 87, 0, 94, 27.3, 20, 84, NULL, 91, 15.2, 0, 60.6, 25.3, 'amarillo', 'Ypoti', 'Recria', 'Insumo', 27200000000, 'Primeros pedidos atrasados. SAP Gs 27.2B'),
  ('Jun 2025', '2025-06-01', 48, 36, 7, 0, 44, 0, 75, 30, 13.5, 75, NULL, 18, 6.2, 0, 79.2, 28.5, 'verde', 'Ypoti', 'Recria', 'Insumo', 38700000000, 'Limpieza masiva. SAP pico Gs 38.7B'),
  ('Jul 2025', '2025-07-01', 63, 34, 16, 4, 83, 6, 54, 33.8, 34, 66.6, 7, 31, 1.6, 0, 82.5, 28, 'amarillo', 'Ypoti', 'Recria', 'Insumo', 34000000000, 'Primeras emergencias. SAP Gs 34B'),
  ('Ago 2025', '2025-08-01', 76, 55, 23, 18, 103, 24, 72, 18.7, 9, 35.8, 6.4, 46, 1.3, 0, 80.3, 27.2, 'rojo', 'Ypoti', 'Recria', 'Insumo', 22600000000, 'Pico emergencias 24%. Backlog >100. SAP Gs 22.6B'),
  ('Sep 2025', '2025-09-01', 69, 50, 31, 7, 102, 10, 72, 9.6, 5.5, 19, 2.6, 59, 0, 1.4, 62.3, 21.3, 'rojo', 'Ypoti', 'Recria', 'Insumo', 11900000000, 'Campo Solicitante comeca. SAP Gs 11.9B'),
  ('Oct 2025', '2025-10-01', 71, 62, 33, 3, 120, 4, 87, 25.8, 8, 78, 9.3, 85, 2.8, 47.9, 63.4, 38, 'rojo', 'Ypoti', 'Recria', 'Insumo', 14600000000, 'Mejor tasa resolucion 87%. SAP Gs 14.6B'),
  ('Nov 2025', '2025-11-01', 49, 28, 46, 4, 142, 8, 57, 9.5, 3, 27, 3.5, 85, 0, 53.1, 71.4, 41.5, 'amarillo', 'Ypoti', 'Recria', 'Insumo', 34800000000, 'IQD mejora 41.5%. SAP pico Gs 34.8B'),
  ('Dic 2025', '2025-12-01', 42, 18, 66, 6, 163, 14, 43, 10.1, 1.5, 33.3, 2, 86, 2.4, 59.5, 73.8, 45.2, 'rojo', 'Ypoti', 'Confinamiento', 'Insumo', NULL, 'Backlog >160. 14% emergencias'),
  ('Ene 2026', '2026-01-01', 81, 34, 93, 3, 193, 4, 42, 4.2, 2.5, 11, 5, 87, 2.5, 35.8, 66.7, 35, 'rojo', 'Ypoti', 'Recria', 'Insumo', 31600000000, 'Mayor volumen (81). Backlog=193. SAP Gs 31.6B'),
  ('Feb 2026', '2026-02-01', 21, 6, 111, 2, 201, 10, 29, 2, 1, 5, NULL, 100, 4.8, 0, 66.7, 23.8, 'rojo', 'Ypoti', 'Recria', 'Equipamento', NULL, 'Mes parcial. Backlog record 201. 111 atrasados')
ON CONFLICT (period) DO UPDATE SET
  orders_created = EXCLUDED.orders_created,
  orders_completed = EXCLUDED.orders_completed,
  orders_overdue = EXCLUDED.orders_overdue,
  orders_emergency = EXCLUDED.orders_emergency,
  backlog_end = EXCLUDED.backlog_end,
  emergency_pct = EXCLUDED.emergency_pct,
  resolution_rate = EXCLUDED.resolution_rate,
  lead_time_avg = EXCLUDED.lead_time_avg,
  lead_time_median = EXCLUDED.lead_time_median,
  lead_time_p90 = EXCLUDED.lead_time_p90,
  lead_time_emergency = EXCLUDED.lead_time_emergency,
  avg_delay_days = EXCLUDED.avg_delay_days,
  iqd_price = EXCLUDED.iqd_price,
  iqd_requester = EXCLUDED.iqd_requester,
  iqd_urgency = EXCLUDED.iqd_urgency,
  iqd_total = EXCLUDED.iqd_total,
  semaforo = EXCLUDED.semaforo,
  top_location = EXCLUDED.top_location,
  top_sector = EXCLUDED.top_sector,
  top_type = EXCLUDED.top_type,
  sap_spending_gs = EXCLUDED.sap_spending_gs,
  notes = EXCLUDED.notes;

-- ============================================================
-- 12. SEED DATA — PRICE BENCHMARKS
-- ============================================================
INSERT INTO price_history (product_id, price, currency, unit, date, source, notes)
SELECT p.id, v.price, v.currency, v.unit, v.date, v.source, v.notes
FROM (VALUES
  ('DESMAMANTE MACHO', 3200000, 'GS', 'cabeza', '2025-03-01'::DATE, 'Sazonalidad 2025', 'Precio optimo Q1-Q2'),
  ('DESMAMANTE MACHO', 5400000, 'GS', 'cabeza', '2025-11-01'::DATE, 'Sazonalidad 2025', 'Precio pico Q4 (+67%)'),
  ('DESMAMANTE MACHO', 4800000, 'GS', 'cabeza', '2026-01-01'::DATE, 'Sazonalidad 2025', 'Precio actual Ene-Feb 2026'),
  ('TORETON', 4200000, 'GS', 'cabeza', '2024-01-01'::DATE, 'Radiografia 2024', 'Precio 2024'),
  ('TORETON', 6440000, 'GS', 'cabeza', '2025-12-01'::DATE, 'Radiografia 2025', 'Inflacion 52% interanual')
) AS v(product_name, price, currency, unit, date, source, notes)
JOIN products p ON p.name = v.product_name;

-- ============================================================
-- 13. VIEWS (for dashboard queries)
-- ============================================================

-- Monthly spending overview
CREATE OR REPLACE VIEW v_monthly_spending AS
SELECT
  period,
  reference_date,
  sap_spending_gs,
  orders_created,
  orders_completed,
  backlog_end,
  emergency_pct,
  iqd_total as data_quality_index,
  semaforo
FROM monthly_kpis
ORDER BY reference_date;

-- Supplier risk dashboard
CREATE OR REPLACE VIEW v_supplier_risk AS
SELECT
  name,
  risk_level,
  is_single_source,
  annual_volume_gs,
  invoice_count,
  rating,
  rubros,
  notes
FROM suppliers
WHERE active = true
ORDER BY
  CASE risk_level
    WHEN 'critico' THEN 1
    WHEN 'alto' THEN 2
    WHEN 'moderado' THEN 3
    ELSE 4
  END,
  annual_volume_gs DESC NULLS LAST;

-- Product catalog with supplier info
CREATE OR REPLACE VIEW v_product_catalog AS
SELECT
  p.name as product,
  p.code,
  c.name as category,
  sc.name as subcategory,
  p.unit_of_measure,
  p.presentation,
  p.manufacturer,
  s.name as default_supplier,
  s.risk_level as supplier_risk,
  p.criticality,
  p.deposit
FROM products p
JOIN categories c ON c.id = p.category_id
LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
LEFT JOIN suppliers s ON s.id = p.default_supplier_id
ORDER BY c.name, p.name;

-- ============================================================
-- VERIFICATION QUERY (run after migration)
-- ============================================================
SELECT 'categories' as tbl, count(*) as cnt FROM categories
UNION ALL SELECT 'subcategories', count(*) FROM subcategories
UNION ALL SELECT 'locations', count(*) FROM locations
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'price_history', count(*) FROM price_history
UNION ALL SELECT 'monthly_kpis', count(*) FROM monthly_kpis
UNION ALL SELECT 'contracts', count(*) FROM contracts
UNION ALL SELECT 'stock_movements', count(*) FROM stock_movements
UNION ALL SELECT 'fuel_consumption', count(*) FROM fuel_consumption
UNION ALL SELECT 'suppliers (total)', count(*) FROM suppliers
ORDER BY tbl;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
