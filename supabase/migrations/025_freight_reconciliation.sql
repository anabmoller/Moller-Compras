-- ============================================================
-- MIGRATION 025: Freight Module + Reconciliation & Theft Detection
-- ============================================================

-- ============================================================
-- 1. CARRIERS — transport companies
-- ============================================================
CREATE TABLE IF NOT EXISTS carriers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  tax_id            TEXT,
  contact_name      TEXT,
  contact_phone     TEXT,
  contact_email     TEXT,
  senacsa_authorized BOOLEAN DEFAULT false,
  vehicle_types     TEXT[],              -- 'cattle_truck', 'grain_truck', 'tanker', 'flatbed'
  service_regions   TEXT[],
  is_active         BOOLEAN DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. FREIGHT JOBS — unified transport tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS freight_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number        TEXT NOT NULL,
  carrier_id        UUID REFERENCES carriers(id),

  -- What's being transported
  cargo_type        TEXT NOT NULL,        -- 'cattle', 'raw_material', 'fuel', 'general', 'slaughter'
  cargo_description TEXT,

  -- Origin/Destination
  origin_establishment_id UUID REFERENCES establishments(id),
  origin_address    TEXT,
  destination_establishment_id UUID REFERENCES establishments(id),
  destination_address TEXT,

  -- Linked objects
  related_object_type TEXT,               -- 'movement', 'delivery', 'slaughter_shipment', 'request'
  related_object_id TEXT,

  -- Quantities
  expected_quantity NUMERIC(12,2),
  actual_quantity   NUMERIC(12,2),
  quantity_unit     TEXT,                  -- 'head', 'ton', 'liters', 'units'
  expected_weight   NUMERIC(12,2),
  actual_weight     NUMERIC(12,2),

  -- Schedule
  scheduled_pickup  TIMESTAMPTZ,
  actual_pickup     TIMESTAMPTZ,
  scheduled_delivery TIMESTAMPTZ,
  actual_delivery   TIMESTAMPTZ,

  -- Vehicle
  vehicle_plate     TEXT,
  driver_name       TEXT,
  driver_phone      TEXT,
  driver_document   TEXT,

  -- Cost
  quoted_cost       NUMERIC(10,2),
  actual_cost       NUMERIC(10,2),
  cost_currency     TEXT DEFAULT 'PYG',

  -- Status
  status            TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'in_pickup', 'loaded', 'in_transit', 'arrived', 'unloaded', 'completed', 'cancelled'

  -- Loss tracking
  loss_quantity     NUMERIC(10,2) DEFAULT 0,
  loss_reason       TEXT,

  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_freight_carrier ON freight_jobs(carrier_id);
CREATE INDEX idx_freight_status ON freight_jobs(status);
CREATE INDEX idx_freight_cargo ON freight_jobs(cargo_type);
CREATE INDEX idx_freight_dates ON freight_jobs(scheduled_pickup DESC);
CREATE INDEX idx_freight_related ON freight_jobs(related_object_type, related_object_id);

-- ============================================================
-- 3. CARRIER PERFORMANCE — aggregated metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS carrier_performance (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id        UUID NOT NULL REFERENCES carriers(id),
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,

  total_jobs        INTEGER DEFAULT 0,
  completed_jobs    INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  on_time_rate_pct  NUMERIC(5,2),

  total_loss        NUMERIC(10,2) DEFAULT 0,
  loss_rate_pct     NUMERIC(5,2),

  avg_delay_hours   NUMERIC(6,1),
  total_cost        NUMERIC(12,2),
  avg_cost_per_job  NUMERIC(10,2),

  overall_score     NUMERIC(5,2),         -- 0-100

  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carrier_perf ON carrier_performance(carrier_id, period_end DESC);

-- ============================================================
-- 4. RECONCILIATION — external data snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS external_data_ingests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system     TEXT NOT NULL,         -- 'sap', 'control_pasto', 'sigor', 'capataz_report'
  data_type         TEXT NOT NULL,         -- 'inventory_count', 'herd_count', 'movement_log', 'financial'
  file_store_id     UUID REFERENCES file_store(id),

  -- Parsed data
  raw_data          JSONB,
  parsed_records    INTEGER DEFAULT 0,
  parse_errors      INTEGER DEFAULT 0,

  establishment_id  UUID REFERENCES establishments(id),
  snapshot_date     DATE NOT NULL,

  status            TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'parsed', 'reconciled', 'error'
  imported_by       UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ext_ingest_source ON external_data_ingests(source_system, snapshot_date DESC);
CREATE INDEX idx_ext_ingest_est ON external_data_ingests(establishment_id);

-- ============================================================
-- 5. RECONCILIATION SNAPSHOTS — comparison results
-- ============================================================
CREATE TABLE IF NOT EXISTS reconciliation_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),
  snapshot_date     DATE NOT NULL,

  -- Counts from different sources
  sigam_count       INTEGER,              -- SIGAM internal count
  sap_count         INTEGER,
  control_pasto_count INTEGER,
  sigor_count       INTEGER,
  capataz_count     INTEGER,

  -- Discrepancies
  max_discrepancy   INTEGER,
  discrepancy_details JSONB,              -- per-category breakdown

  -- Analysis
  risk_level        TEXT DEFAULT 'normal', -- 'normal', 'warning', 'critical'
  explanation       TEXT,
  resolution        TEXT,
  resolved_by       UUID REFERENCES auth.users(id),
  resolved_at       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recon_est_date ON reconciliation_snapshots(establishment_id, snapshot_date DESC);
CREATE INDEX idx_recon_risk ON reconciliation_snapshots(risk_level);

-- ============================================================
-- 6. DISCREPANCY ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS discrepancy_alerts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID NOT NULL REFERENCES reconciliation_snapshots(id),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),

  alert_type        TEXT NOT NULL,         -- 'missing_animals', 'excess_animals', 'weight_mismatch', 'category_mismatch'
  severity          TEXT NOT NULL DEFAULT 'warning', -- 'info', 'warning', 'critical'

  expected_value    TEXT,
  actual_value      TEXT,
  difference        TEXT,

  category          TEXT,                   -- animal category if applicable
  sector            TEXT,

  -- Resolution
  status            TEXT NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'false_positive'
  assigned_to       UUID REFERENCES auth.users(id),
  resolution_notes  TEXT,
  resolved_at       TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_disc_alert_est ON discrepancy_alerts(establishment_id, status);
CREATE INDEX idx_disc_alert_recon ON discrepancy_alerts(reconciliation_id);
CREATE INDEX idx_disc_alert_severity ON discrepancy_alerts(severity, status);

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_ingests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE discrepancy_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY carriers_read ON carriers FOR SELECT USING (true);
CREATE POLICY carriers_write ON carriers FOR ALL USING (auth_role() IN ('admin', 'gerente'));

CREATE POLICY fj_read ON freight_jobs FOR SELECT USING (true);
CREATE POLICY fj_write ON freight_jobs FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider', 'comprador'));

CREATE POLICY cp_perf_read ON carrier_performance FOR SELECT USING (true);
CREATE POLICY cp_perf_write ON carrier_performance FOR ALL USING (auth_role() IN ('admin'));

CREATE POLICY edi_read ON external_data_ingests FOR SELECT USING (auth_role() IN ('admin', 'diretoria', 'gerente'));
CREATE POLICY edi_write ON external_data_ingests FOR ALL USING (auth_role() IN ('admin', 'gerente'));

CREATE POLICY rs_read ON reconciliation_snapshots FOR SELECT USING (auth_role() IN ('admin', 'diretoria', 'gerente'));
CREATE POLICY rs_write ON reconciliation_snapshots FOR ALL USING (auth_role() IN ('admin'));

CREATE POLICY da_read ON discrepancy_alerts FOR SELECT USING (auth_role() IN ('admin', 'diretoria', 'gerente'));
CREATE POLICY da_write ON discrepancy_alerts FOR ALL USING (auth_role() IN ('admin', 'gerente'));
