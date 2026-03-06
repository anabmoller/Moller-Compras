-- ============================================================
-- MIGRATION 023: Hacienda Deep Module
-- Individual animal tracking, TruTest, guide custody, compliance
-- ============================================================

-- ============================================================
-- 1. CATTLE BATCHES (Lotes) — grouping of animals
-- ============================================================
CREATE TABLE IF NOT EXISTS cattle_batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code        TEXT NOT NULL,
  batch_type        TEXT NOT NULL DEFAULT 'recria', -- 'purchase', 'recria', 'confinement', 'fatten', 'slaughter'
  establishment_id  UUID NOT NULL REFERENCES establishments(id),
  sector            TEXT,

  -- Animal count
  initial_count     INTEGER NOT NULL DEFAULT 0,
  current_count     INTEGER NOT NULL DEFAULT 0,

  -- Weight data
  avg_entry_weight  NUMERIC(8,2),
  avg_current_weight NUMERIC(8,2),
  target_weight     NUMERIC(8,2),

  -- Dates
  start_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date   DATE,
  closed_date       DATE,

  -- Category (SENACSA)
  category_id       UUID REFERENCES categorias_animales(id),

  -- Economics reference
  economics_snapshot JSONB,  -- periodic snapshot of batch profitability

  status            TEXT NOT NULL DEFAULT 'active', -- 'active', 'closed', 'cancelled'
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cattle_batch_est ON cattle_batches(establishment_id);
CREATE INDEX idx_cattle_batch_status ON cattle_batches(status);
CREATE INDEX idx_cattle_batch_type ON cattle_batches(batch_type);

-- ============================================================
-- 2. CATTLE ANIMALS — individual animal tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS cattle_animals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identification
  trutest_id        TEXT,                          -- electronic ear tag (RFID)
  visual_tag        TEXT,                          -- visual ear tag number
  senacsa_id        TEXT,                          -- SENACSA registration if available

  -- Current state
  current_status    TEXT NOT NULL DEFAULT 'active', -- 'active', 'in_transit', 'slaughtered', 'dead', 'sold', 'missing'
  current_establishment_id UUID REFERENCES establishments(id),
  current_batch_id  UUID REFERENCES cattle_batches(id),
  current_sector    TEXT,

  -- Classification
  category_id       UUID REFERENCES categorias_animales(id),
  breed             TEXT,
  sex               TEXT DEFAULT 'M',              -- 'M', 'F'
  birth_date        DATE,
  age_months        INTEGER,

  -- Weight history (latest)
  entry_weight      NUMERIC(8,2),
  entry_date        DATE,
  latest_weight     NUMERIC(8,2),
  latest_weight_date DATE,

  -- Origin
  purchase_movement_id UUID REFERENCES movimientos_ganado(id),
  supplier_id       UUID REFERENCES suppliers(id),
  purchase_price_per_kg NUMERIC(10,4),
  purchase_currency TEXT DEFAULT 'PYG',

  -- Slaughter
  slaughter_date    DATE,
  carcass_weight    NUMERIC(8,2),
  carcass_yield_pct NUMERIC(5,2),

  -- Metadata
  metadata          JSONB DEFAULT '{}',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_cattle_trutest ON cattle_animals(trutest_id) WHERE trutest_id IS NOT NULL;
CREATE INDEX idx_cattle_status ON cattle_animals(current_status);
CREATE INDEX idx_cattle_establishment ON cattle_animals(current_establishment_id);
CREATE INDEX idx_cattle_batch ON cattle_animals(current_batch_id);
CREATE INDEX idx_cattle_visual_tag ON cattle_animals(visual_tag);

-- ============================================================
-- 3. CATTLE EVENTS — lifecycle event log
-- ============================================================
CREATE TABLE IF NOT EXISTS cattle_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id         UUID NOT NULL REFERENCES cattle_animals(id) ON DELETE CASCADE,
  batch_id          UUID REFERENCES cattle_batches(id),
  establishment_id  UUID REFERENCES establishments(id),

  event_type        TEXT NOT NULL,
  -- Types: 'entry', 'weighing', 'vaccination', 'treatment', 'movement_out',
  --        'movement_in', 'batch_transfer', 'slaughter', 'death', 'sale', 'adjustment'

  event_date        DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Weight at event
  weight            NUMERIC(8,2),
  weight_gain_since_last NUMERIC(8,2),  -- computed from previous weighing

  -- Movement reference
  movement_id       UUID REFERENCES movimientos_ganado(id),

  -- Medical/treatment
  treatment_type    TEXT,                -- 'vaccine', 'deworming', 'antibiotic', 'supplement'
  treatment_product TEXT,
  treatment_dose    TEXT,
  treatment_cost    NUMERIC(10,2),

  -- Financial
  cost_amount       NUMERIC(10,2),
  cost_currency     TEXT DEFAULT 'USD',
  cost_category     TEXT,               -- 'purchase', 'feed', 'medical', 'freight', 'labor', 'other'

  -- Revenue (for slaughter/sale events)
  revenue_amount    NUMERIC(12,2),
  revenue_currency  TEXT DEFAULT 'USD',

  notes             TEXT,
  recorded_by       UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cattle_event_animal ON cattle_events(animal_id, event_date DESC);
CREATE INDEX idx_cattle_event_type ON cattle_events(event_type);
CREATE INDEX idx_cattle_event_batch ON cattle_events(batch_id);
CREATE INDEX idx_cattle_event_date ON cattle_events(event_date DESC);

-- ============================================================
-- 4. TRUTEST IMPORTS — CSV upload tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS trutest_imports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name         TEXT NOT NULL,
  file_store_id     UUID REFERENCES file_store(id),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),
  movement_id       UUID REFERENCES movimientos_ganado(id),
  batch_id          UUID REFERENCES cattle_batches(id),

  -- Import results
  total_records     INTEGER NOT NULL DEFAULT 0,
  new_animals       INTEGER DEFAULT 0,
  updated_animals   INTEGER DEFAULT 0,
  errors            INTEGER DEFAULT 0,
  error_details     JSONB,

  status            TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  imported_by       UUID REFERENCES auth.users(id),
  imported_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. GUIDE CUSTODY CHAIN — who holds the physical guide
-- ============================================================
CREATE TABLE IF NOT EXISTS guide_custody_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_id       UUID NOT NULL REFERENCES movimientos_ganado(id),
  guide_number      TEXT NOT NULL,

  -- Custody transfer
  from_person       TEXT,
  from_role         TEXT,                 -- 'driver', 'capataz', 'admin', 'office'
  to_person         TEXT NOT NULL,
  to_role           TEXT NOT NULL,

  transfer_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transfer_location TEXT,                 -- establishment name or office name

  -- Verification
  verified_by_scan  BOOLEAN DEFAULT false, -- QR code scan verification
  scan_data         JSONB,
  photo_file_id     UUID REFERENCES file_store(id),

  notes             TEXT,
  recorded_by       UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guide_custody_movement ON guide_custody_events(movement_id);
CREATE INDEX idx_guide_custody_guide ON guide_custody_events(guide_number);

-- ============================================================
-- 6. REGULATORY COMPLIANCE — SIAP tasks and SENACSA deadlines
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type         TEXT NOT NULL,        -- 'siap_verification', 'senacsa_protocol', 'guide_registration', 'vaccination_campaign'
  related_object_type TEXT,               -- 'movement', 'animal', 'batch', 'establishment'
  related_object_id TEXT,

  title             TEXT NOT NULL,
  description       TEXT,

  -- Deadlines
  due_date          DATE NOT NULL,
  warning_date      DATE,                 -- send alert at this date
  completed_date    DATE,

  -- Status
  status            TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue', 'waived'
  priority          TEXT DEFAULT 'normal',            -- 'low', 'normal', 'high', 'critical'

  -- Fine risk
  fine_risk_amount  NUMERIC(12,2),
  fine_currency     TEXT DEFAULT 'PYG',

  -- Assignment
  assigned_to       UUID REFERENCES auth.users(id),
  completed_by      UUID REFERENCES auth.users(id),

  evidence_file_id  UUID REFERENCES file_store(id),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_status ON compliance_tasks(status, due_date);
CREATE INDEX idx_compliance_related ON compliance_tasks(related_object_type, related_object_id);
CREATE INDEX idx_compliance_due ON compliance_tasks(due_date);

-- ============================================================
-- 7. ENHANCE EXISTING movimientos_ganado — add guide expiry + custody fields
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_ganado' AND column_name = 'guide_expiry_date') THEN
    ALTER TABLE movimientos_ganado ADD COLUMN guide_expiry_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_ganado' AND column_name = 'guide_custody_holder') THEN
    ALTER TABLE movimientos_ganado ADD COLUMN guide_custody_holder TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_ganado' AND column_name = 'guide_custody_role') THEN
    ALTER TABLE movimientos_ganado ADD COLUMN guide_custody_role TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_ganado' AND column_name = 'siap_verified') THEN
    ALTER TABLE movimientos_ganado ADD COLUMN siap_verified BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_ganado' AND column_name = 'siap_verification_date') THEN
    ALTER TABLE movimientos_ganado ADD COLUMN siap_verification_date TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================
-- 8. RLS POLICIES
-- ============================================================
ALTER TABLE cattle_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trutest_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_custody_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY cb_read ON cattle_batches FOR SELECT USING (true);
CREATE POLICY ca_read ON cattle_animals FOR SELECT USING (true);
CREATE POLICY ce_read ON cattle_events FOR SELECT USING (true);
CREATE POLICY ti_read ON trutest_imports FOR SELECT USING (true);
CREATE POLICY gce_read ON guide_custody_events FOR SELECT USING (true);
CREATE POLICY ct_read ON compliance_tasks FOR SELECT USING (true);

CREATE POLICY cb_write ON cattle_batches FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));
CREATE POLICY ca_write ON cattle_animals FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));
CREATE POLICY ce_write ON cattle_events FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));
CREATE POLICY ti_write ON trutest_imports FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));
CREATE POLICY gce_write ON guide_custody_events FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));
CREATE POLICY ct_write ON compliance_tasks FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));

-- ============================================================
-- 9. TRIGGER: Auto-create SIAP compliance task on movement creation
-- ============================================================
CREATE OR REPLACE FUNCTION fn_create_compliance_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pendiente_validacion' THEN
    INSERT INTO compliance_tasks (
      task_type, related_object_type, related_object_id,
      title, description, due_date, warning_date, priority
    ) VALUES (
      'siap_verification', 'movement', NEW.id::TEXT,
      'Verificación SIAP - Guía ' || COALESCE(NEW.numero_guia, 'S/N'),
      'Verificar movimiento en sistema SIAP de SENACSA',
      COALESCE(NEW.guide_expiry_date, CURRENT_DATE + INTERVAL '5 days'),
      COALESCE(NEW.guide_expiry_date - INTERVAL '3 days', CURRENT_DATE + INTERVAL '2 days'),
      'high'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_movement_compliance
  AFTER INSERT OR UPDATE ON movimientos_ganado
  FOR EACH ROW
  EXECUTE FUNCTION fn_create_compliance_on_movement();
