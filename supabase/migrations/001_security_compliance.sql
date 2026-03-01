-- ============================================================
-- MIGRATION 001: Security & Compliance Tables — Compras Ypoti
-- Date: 2026-03-01
-- Purpose: Audit trail, auth logging, security policies,
--          supplier evaluations, non-conformities, document
--          versioning, and automatic audit triggers.
-- ============================================================

-- ============================================================
-- 1. AUDIT TRAIL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_trail (
  id         BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id  TEXT NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data   JSONB,
  new_data   JSONB,
  user_id    UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_table   ON audit_trail(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trail_record  ON audit_trail(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user    ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created ON audit_trail(created_at);

-- ============================================================
-- 2. AUTH AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user  ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event ON auth_audit_log(event_type);

-- ============================================================
-- 3. SECURITY POLICIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS security_policies (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  iso_reference TEXT,
  version      TEXT DEFAULT '1.0',
  status       TEXT DEFAULT 'active',
  next_review  DATE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. SUPPLIER EVALUATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id      UUID NOT NULL,
  period           TEXT NOT NULL,
  quality_score    NUMERIC(3,1) CHECK (quality_score BETWEEN 0 AND 10),
  delivery_score   NUMERIC(3,1) CHECK (delivery_score BETWEEN 0 AND 10),
  price_score      NUMERIC(3,1) CHECK (price_score BETWEEN 0 AND 10),
  compliance_score NUMERIC(3,1) CHECK (compliance_score BETWEEN 0 AND 10),
  total_score      NUMERIC(3,1) GENERATED ALWAYS AS (
    (quality_score + delivery_score + price_score + compliance_score) / 4.0
  ) STORED,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_eval_supplier ON supplier_evaluations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_eval_period   ON supplier_evaluations(period);

-- ============================================================
-- 5. NON-CONFORMITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS non_conformities (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id       UUID NOT NULL,
  type              TEXT NOT NULL,
  description       TEXT NOT NULL,
  severity          TEXT CHECK (severity IN ('baja', 'media', 'alta', 'crítica')),
  corrective_action TEXT,
  preventive_action TEXT,
  status            TEXT DEFAULT 'abierta' CHECK (status IN ('abierta', 'en_proceso', 'cerrada')),
  reported_by       UUID,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nc_supplier ON non_conformities(supplier_id);
CREATE INDEX IF NOT EXISTS idx_nc_status   ON non_conformities(status);

-- ============================================================
-- 6. DOCUMENT VERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_id   UUID NOT NULL,
  version       INTEGER NOT NULL DEFAULT 1,
  data          JSONB NOT NULL,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docver_type ON document_versions(document_type);
CREATE INDEX IF NOT EXISTS idx_docver_doc  ON document_versions(document_id);

-- ============================================================
-- 7. AUDIT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_trail (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. ATTACH AUDIT TRIGGERS (with exception handling)
-- ============================================================
DO $$
BEGIN
  -- purchase_requests
  BEGIN
    CREATE TRIGGER trg_audit_purchase_requests
      AFTER INSERT OR UPDATE OR DELETE ON purchase_requests
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table purchase_requests does not exist yet — skipping trigger.';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Trigger trg_audit_purchase_requests already exists — skipping.';
  END;

  -- suppliers
  BEGIN
    CREATE TRIGGER trg_audit_suppliers
      AFTER INSERT OR UPDATE OR DELETE ON suppliers
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table suppliers does not exist yet — skipping trigger.';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Trigger trg_audit_suppliers already exists — skipping.';
  END;

  -- products
  BEGIN
    CREATE TRIGGER trg_audit_products
      AFTER INSERT OR UPDATE OR DELETE ON products
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table products does not exist yet — skipping trigger.';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Trigger trg_audit_products already exists — skipping.';
  END;

  -- price_history
  BEGIN
    CREATE TRIGGER trg_audit_price_history
      AFTER INSERT OR UPDATE OR DELETE ON price_history
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'Table price_history does not exist yet — skipping trigger.';
  WHEN duplicate_object THEN
    RAISE NOTICE 'Trigger trg_audit_price_history already exists — skipping.';
  END;
END $$;

-- ============================================================
-- 9. SEED SECURITY POLICIES
-- ============================================================
INSERT INTO security_policies (title, description, iso_reference, version, status, next_review) VALUES
(
  'Política de Control de Acceso',
  'Define los controles de acceso basados en roles (RBAC) para todos los módulos del sistema de compras.',
  'ISO 27001 - A.9',
  '1.0',
  'active',
  '2026-09-01'
),
(
  'Política de Clasificación de Información',
  'Establece los niveles de clasificación de datos: público, interno, confidencial y restringido.',
  'ISO 27001 - A.8.2',
  '1.0',
  'active',
  '2026-09-01'
),
(
  'Política de Gestión de Proveedores',
  'Criterios de evaluación, selección y monitoreo continuo de proveedores según estándares ISO.',
  'ISO 9001 - 8.4',
  '1.0',
  'active',
  '2026-06-01'
),
(
  'Política de Auditoría y Trazabilidad',
  'Registro automático de todas las operaciones críticas con trail de auditoría inmutable.',
  'ISO 27001 - A.12.4',
  '1.0',
  'active',
  '2026-09-01'
),
(
  'Política de Respaldo y Recuperación',
  'Procedimientos de backup diario y plan de recuperación ante desastres para datos de compras.',
  'ISO 27001 - A.12.3',
  '1.0',
  'draft',
  '2026-06-01'
),
(
  'Política de Protección de Datos Personales',
  'Cumplimiento con regulaciones de privacidad para datos de proveedores y empleados.',
  'ISO 27701 - 6.3',
  '1.0',
  'active',
  '2026-09-01'
),
(
  'Política de Gestión de No Conformidades',
  'Proceso para identificar, documentar y resolver no conformidades con proveedores.',
  'ISO 9001 - 10.2',
  '1.0',
  'active',
  '2026-06-01'
),
(
  'Política de Seguridad en la Nube',
  'Controles de seguridad específicos para la infraestructura Supabase y servicios cloud.',
  'ISO 27018 - 5.1',
  '1.0',
  'draft',
  '2026-12-01'
);
