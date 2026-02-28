-- ============================================================
-- YPOTI Compras — Phase 1: Complete Database Schema
-- Version: 001
-- Date: 2026-02-28
-- ============================================================
-- This script creates all tables, sequences, triggers,
-- helper functions, and RLS policies for the YPOTI Compras
-- purchase request management system.
-- ============================================================

-- ============================================================
-- PART A: REFERENCE TABLES
-- ============================================================

-- 1. Companies (7 records)
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  ruc TEXT,
  type TEXT CHECK (type IN ('empresa','persona_fisica')),
  director TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Establishments (9 records)
CREATE TABLE IF NOT EXISTS establishments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES companies(id),
  manager TEXT,
  location TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Sectors (9 records)
CREATE TABLE IF NOT EXISTS sectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Product Types (10 records)
CREATE TABLE IF NOT EXISTS product_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Suppliers (6+ records)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  ruc TEXT,
  phone TEXT,
  email TEXT,
  category TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Inventory Catalog (58 items)
CREATE TABLE IF NOT EXISTS inventory_catalog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT,
  group_name TEXT,
  transactions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. SAP Warehouses (21 records)
CREATE TABLE IF NOT EXISTS sap_warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  establishment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PART B: USER PROFILES
-- ============================================================

-- 8. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','diretoria','gerente','lider','comprador','solicitante')),
  establishment TEXT,
  position TEXT,
  avatar TEXT,
  active BOOLEAN DEFAULT true,
  force_password_change BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PART C: CORE BUSINESS TABLES
-- ============================================================

-- 9. Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  legacy_id TEXT UNIQUE,
  name TEXT NOT NULL,
  establishment TEXT NOT NULL,
  sector TEXT NOT NULL,
  period TEXT,
  start_date DATE,
  end_date DATE,
  planned BIGINT NOT NULL DEFAULT 0,
  consumed BIGINT NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Requests (main entity)
CREATE SEQUENCE IF NOT EXISTS request_number_seq START 1;

CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  requester TEXT,
  created_by UUID REFERENCES profiles(id),
  created_by_name TEXT,
  establishment TEXT NOT NULL,
  company TEXT,
  sector TEXT,
  type TEXT,
  priority TEXT DEFAULT 'media' CHECK (priority IN ('baja','media','alta','emergencial')),
  status TEXT DEFAULT 'borrador' CHECK (status IN (
    'borrador','cotizacion','presupuestado','pendiente_aprobacion',
    'aprobado','en_proceso','recibido','facturado','registrado_sap',
    'rechazado','cancelado'
  )),
  total_amount BIGINT DEFAULT 0,
  quantity INT,
  reason TEXT,
  purpose TEXT,
  equipment TEXT,
  suggested_supplier TEXT,
  notes TEXT,
  supplier TEXT,
  assignee TEXT,
  budget_id UUID REFERENCES budgets(id),
  budget_exceeded BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  confirmed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Request Items
CREATE TABLE IF NOT EXISTS request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit TEXT,
  unit_price BIGINT DEFAULT 0,
  total_price BIGINT DEFAULT 0,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  currency TEXT DEFAULT 'PYG' CHECK (currency IN ('PYG','USD','BRL')),
  price BIGINT NOT NULL,
  delivery_days INT DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  selected BOOLEAN DEFAULT false,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Approval Steps
CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  approver_username TEXT,
  approver_name TEXT,
  sla_hours INT DEFAULT 24,
  conditional BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','revision','skipped')),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Approval History (append-only audit trail)
CREATE TABLE IF NOT EXISTS approval_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  step_label TEXT,
  performed_by UUID REFERENCES profiles(id),
  performed_by_name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Budget Transactions (audit trail)
CREATE TABLE IF NOT EXISTS budget_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budgets(id),
  request_id UUID REFERENCES requests(id),
  type TEXT NOT NULL CHECK (type IN ('consume','reverse')),
  amount BIGINT NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Approval Config (rules engine)
CREATE TABLE IF NOT EXISTS approval_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_key TEXT NOT NULL UNIQUE,
  description TEXT,
  threshold_amount BIGINT,
  sla_normal INT,
  sla_emergency INT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PART D: TRIGGERS & FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_requests_updated_at ON requests;
CREATE TRIGGER trg_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON budgets;
CREATE TRIGGER trg_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate request_number on insert
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := 'SC-' || EXTRACT(YEAR FROM now())::TEXT || '-' ||
      LPAD(nextval('request_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_request_number ON requests;
CREATE TRIGGER trg_request_number
  BEFORE INSERT ON requests
  FOR EACH ROW EXECUTE FUNCTION generate_request_number();

-- ============================================================
-- PART E: RLS HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's username
CREATE OR REPLACE FUNCTION auth_username()
RETURNS TEXT AS $$
  SELECT username FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's establishment
CREATE OR REPLACE FUNCTION auth_establishment()
RETURNS TEXT AS $$
  SELECT establishment FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is admin (only Ana Moller)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_role() = 'admin', false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is diretoria (Mauricio Moller, Ronei F Barrios)
CREATE OR REPLACE FUNCTION is_diretoria()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_role() = 'diretoria', false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has full visibility (admin OR diretoria)
CREATE OR REPLACE FUNCTION has_full_visibility()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_role() IN ('admin', 'diretoria'), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PART F: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE sap_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART G: RLS POLICIES
-- ============================================================

-- ---- PROFILES ----
-- Everyone can read profiles (needed for displaying names, roles)
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile (password change flag, etc.)
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin has full CRUD on profiles
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (is_admin());

-- ---- COMPANIES ----
CREATE POLICY companies_select ON companies
  FOR SELECT USING (true);
CREATE POLICY companies_admin ON companies
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY companies_admin_update ON companies
  FOR UPDATE USING (is_admin());
CREATE POLICY companies_admin_delete ON companies
  FOR DELETE USING (is_admin());

-- ---- ESTABLISHMENTS ----
CREATE POLICY establishments_select ON establishments
  FOR SELECT USING (true);
CREATE POLICY establishments_admin ON establishments
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY establishments_admin_update ON establishments
  FOR UPDATE USING (is_admin());
CREATE POLICY establishments_admin_delete ON establishments
  FOR DELETE USING (is_admin());

-- ---- SECTORS ----
CREATE POLICY sectors_select ON sectors
  FOR SELECT USING (true);
CREATE POLICY sectors_admin ON sectors
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY sectors_admin_update ON sectors
  FOR UPDATE USING (is_admin());
CREATE POLICY sectors_admin_delete ON sectors
  FOR DELETE USING (is_admin());

-- ---- PRODUCT TYPES ----
CREATE POLICY product_types_select ON product_types
  FOR SELECT USING (true);
CREATE POLICY product_types_admin ON product_types
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY product_types_admin_update ON product_types
  FOR UPDATE USING (is_admin());
CREATE POLICY product_types_admin_delete ON product_types
  FOR DELETE USING (is_admin());

-- ---- SUPPLIERS ----
CREATE POLICY suppliers_select ON suppliers
  FOR SELECT USING (true);
CREATE POLICY suppliers_admin ON suppliers
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY suppliers_admin_update ON suppliers
  FOR UPDATE USING (is_admin());
CREATE POLICY suppliers_admin_delete ON suppliers
  FOR DELETE USING (is_admin());

-- ---- INVENTORY CATALOG ----
CREATE POLICY inventory_catalog_select ON inventory_catalog
  FOR SELECT USING (true);
CREATE POLICY inventory_catalog_admin ON inventory_catalog
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY inventory_catalog_admin_update ON inventory_catalog
  FOR UPDATE USING (is_admin());
CREATE POLICY inventory_catalog_admin_delete ON inventory_catalog
  FOR DELETE USING (is_admin());

-- ---- SAP WAREHOUSES ----
CREATE POLICY sap_warehouses_select ON sap_warehouses
  FOR SELECT USING (true);
CREATE POLICY sap_warehouses_admin ON sap_warehouses
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY sap_warehouses_admin_update ON sap_warehouses
  FOR UPDATE USING (is_admin());
CREATE POLICY sap_warehouses_admin_delete ON sap_warehouses
  FOR DELETE USING (is_admin());

-- ---- APPROVAL CONFIG ----
CREATE POLICY approval_config_select ON approval_config
  FOR SELECT USING (true);
CREATE POLICY approval_config_admin ON approval_config
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY approval_config_admin_update ON approval_config
  FOR UPDATE USING (is_admin());
CREATE POLICY approval_config_admin_delete ON approval_config
  FOR DELETE USING (is_admin());

-- ---- REQUESTS ----
-- Visibility: admin+diretoria all, comprador all, gerente/lider own establishment, solicitante own
CREATE POLICY requests_select ON requests
  FOR SELECT USING (
    has_full_visibility()
    OR auth_role() = 'comprador'
    OR (auth_role() IN ('gerente','lider') AND establishment = auth_establishment())
    OR (auth_role() = 'solicitante' AND created_by = auth.uid())
  );

CREATE POLICY requests_insert ON requests
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY requests_update ON requests
  FOR UPDATE USING (
    is_admin()
    OR (created_by = auth.uid() AND status = 'borrador')
  );

CREATE POLICY requests_delete ON requests
  FOR DELETE USING (is_admin());

-- ---- REQUEST ITEMS ----
CREATE POLICY items_select ON request_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id
      AND (has_full_visibility() OR r.created_by = auth.uid()
      OR auth_role() = 'comprador'
      OR (auth_role() IN ('gerente','lider') AND r.establishment = auth_establishment())))
  );

CREATE POLICY items_insert ON request_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id
      AND (r.created_by = auth.uid() OR is_admin()) AND r.status = 'borrador')
  );

CREATE POLICY items_update ON request_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id
      AND (r.created_by = auth.uid() OR is_admin()) AND r.status = 'borrador')
  );

CREATE POLICY items_delete ON request_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id
      AND (r.created_by = auth.uid() OR is_admin()) AND r.status = 'borrador')
  );

-- ---- QUOTATIONS ----
CREATE POLICY quot_select ON quotations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id
      AND (has_full_visibility() OR r.created_by = auth.uid()
      OR auth_role() IN ('gerente','comprador','lider')))
  );

CREATE POLICY quot_insert ON quotations
  FOR INSERT WITH CHECK (
    auth_role() IN ('admin','comprador')
    OR EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id AND r.created_by = auth.uid())
  );

CREATE POLICY quot_update ON quotations
  FOR UPDATE USING (
    auth_role() IN ('admin','comprador')
  );

CREATE POLICY quot_delete ON quotations
  FOR DELETE USING (
    auth_role() IN ('admin','comprador')
  );

-- ---- COMMENTS ----
CREATE POLICY comments_select ON comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id
      AND (has_full_visibility() OR r.created_by = auth.uid()
      OR auth_role() = 'comprador'
      OR (auth_role() IN ('gerente','lider') AND r.establishment = auth_establishment())))
  );

CREATE POLICY comments_insert ON comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
  );

-- ---- APPROVAL STEPS ----
-- Read: follows request visibility. Write: ONLY via Edge Functions (service_role)
CREATE POLICY steps_select ON approval_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id
      AND (has_full_visibility() OR r.created_by = auth.uid()
      OR auth_role() = 'comprador'
      OR (auth_role() IN ('gerente','lider') AND r.establishment = auth_establishment())))
  );

-- ---- APPROVAL HISTORY ----
-- Read: follows request visibility. Write: ONLY via Edge Functions (append-only)
CREATE POLICY history_select ON approval_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM requests r WHERE r.id = request_id
      AND (has_full_visibility() OR r.created_by = auth.uid()
      OR auth_role() = 'comprador'
      OR (auth_role() IN ('gerente','lider') AND r.establishment = auth_establishment())))
  );

-- ---- BUDGETS ----
-- Read: admin+diretoria all, gerente all, lider own establishment
CREATE POLICY budgets_select ON budgets
  FOR SELECT USING (
    has_full_visibility()
    OR auth_role() = 'gerente'
    OR (auth_role() = 'lider' AND establishment = auth_establishment())
  );

CREATE POLICY budgets_admin_insert ON budgets
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY budgets_admin_update ON budgets
  FOR UPDATE USING (is_admin());

CREATE POLICY budgets_admin_delete ON budgets
  FOR DELETE USING (is_admin());

-- ---- BUDGET TRANSACTIONS ----
-- Read: admin+diretoria+gerente. Write: ONLY via Edge Functions
CREATE POLICY btx_select ON budget_transactions
  FOR SELECT USING (
    has_full_visibility() OR auth_role() = 'gerente'
  );

-- ============================================================
-- PART H: INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_establishment ON requests(establishment);
CREATE INDEX IF NOT EXISTS idx_requests_created_by ON requests(created_by);
CREATE INDEX IF NOT EXISTS idx_requests_date ON requests(date);
CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_quotations_request_id ON quotations(request_id);
CREATE INDEX IF NOT EXISTS idx_comments_request_id ON comments(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_request_id ON approval_steps(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_request_id ON approval_history(request_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget_id ON budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_establishment ON profiles(establishment);
CREATE INDEX IF NOT EXISTS idx_budgets_establishment_sector ON budgets(establishment, sector);

-- ============================================================
-- DONE: 17 tables, 1 sequence, 4 triggers, 7 functions,
--       17 tables with RLS, 46 policies, 13 indexes
-- ============================================================
