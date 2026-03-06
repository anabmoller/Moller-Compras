-- ============================================================
-- MIGRATION 021: Raw Materials Module (Materia Prima)
-- Complete schema for commodity contracts, deliveries, inventory
-- ============================================================

-- ============================================================
-- 1. COMMODITY CATALOG — types of raw materials
-- ============================================================
CREATE TABLE IF NOT EXISTS commodity_catalog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,          -- 'grain', 'supplement', 'mineral', 'other'
  unit        TEXT NOT NULL DEFAULT 'kg', -- 'kg', 'ton', 'liter', 'bag'
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed common commodities from transcript
INSERT INTO commodity_catalog (name, category, unit) VALUES
  ('Maíz', 'grain', 'ton'),
  ('Sal mineral', 'mineral', 'kg'),
  ('DDG (Granos de destilería)', 'grain', 'ton'),
  ('Expeller de soja', 'grain', 'ton'),
  ('Harina de hueso', 'supplement', 'kg'),
  ('Núcleo vitamínico', 'supplement', 'kg'),
  ('Urea', 'supplement', 'kg'),
  ('Silaje de maíz', 'grain', 'ton'),
  ('Cascarilla de soja', 'grain', 'ton'),
  ('Premezcla', 'supplement', 'kg')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. RAW MATERIAL CONTRACTS — supply agreements
-- ============================================================
CREATE TABLE IF NOT EXISTS raw_material_contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number   TEXT NOT NULL,
  commodity_id      UUID NOT NULL REFERENCES commodity_catalog(id),
  supplier_id       UUID NOT NULL REFERENCES suppliers(id),
  establishment_id  UUID REFERENCES establishments(id),

  -- Contract terms
  total_quantity    NUMERIC(12,2) NOT NULL,
  unit              TEXT NOT NULL DEFAULT 'ton',
  unit_price        NUMERIC(12,4) NOT NULL,      -- price per unit
  currency          TEXT NOT NULL DEFAULT 'USD',
  total_value       NUMERIC(14,2) GENERATED ALWAYS AS (total_quantity * unit_price) STORED,

  -- Delivery schedule
  delivery_start    DATE,
  delivery_end      DATE,
  delivery_frequency TEXT DEFAULT 'monthly',      -- 'weekly', 'biweekly', 'monthly', 'on_demand'

  -- Status
  status            TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
  delivered_quantity NUMERIC(12,2) DEFAULT 0,

  -- Metadata
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rm_contracts_supplier ON raw_material_contracts(supplier_id);
CREATE INDEX idx_rm_contracts_commodity ON raw_material_contracts(commodity_id);
CREATE INDEX idx_rm_contracts_status ON raw_material_contracts(status);
CREATE INDEX idx_rm_contracts_establishment ON raw_material_contracts(establishment_id);

-- ============================================================
-- 3. RAW MATERIAL DELIVERIES — reception events
-- ============================================================
CREATE TABLE IF NOT EXISTS raw_material_deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id       UUID REFERENCES raw_material_contracts(id),
  commodity_id      UUID NOT NULL REFERENCES commodity_catalog(id),
  supplier_id       UUID NOT NULL REFERENCES suppliers(id),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),

  -- Delivery data
  remission_number  TEXT,
  delivery_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_quantity NUMERIC(12,2),
  received_quantity NUMERIC(12,2) NOT NULL,
  unit              TEXT NOT NULL DEFAULT 'ton',
  unit_price        NUMERIC(12,4),
  total_cost        NUMERIC(14,2),

  -- Quality check
  quality_status    TEXT DEFAULT 'pending',   -- 'pending', 'approved', 'rejected', 'partial'
  quality_notes     TEXT,
  moisture_pct      NUMERIC(5,2),             -- for grains
  impurity_pct      NUMERIC(5,2),             -- for grains

  -- Logistics
  vehicle_plate     TEXT,
  driver_name       TEXT,
  freight_cost      NUMERIC(10,2) DEFAULT 0,

  -- Workflow
  status            TEXT NOT NULL DEFAULT 'received', -- 'in_transit', 'received', 'verified', 'rejected'
  received_by       UUID REFERENCES auth.users(id),
  verified_by       UUID REFERENCES auth.users(id),
  verified_at       TIMESTAMPTZ,

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rm_deliveries_contract ON raw_material_deliveries(contract_id);
CREATE INDEX idx_rm_deliveries_commodity ON raw_material_deliveries(commodity_id);
CREATE INDEX idx_rm_deliveries_date ON raw_material_deliveries(delivery_date DESC);
CREATE INDEX idx_rm_deliveries_establishment ON raw_material_deliveries(establishment_id);

-- ============================================================
-- 4. INVENTORY — stock balances per establishment
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_balances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id      UUID NOT NULL REFERENCES commodity_catalog(id),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),
  current_balance   NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit              TEXT NOT NULL DEFAULT 'ton',
  avg_daily_usage   NUMERIC(10,2) DEFAULT 0,      -- calculated from transactions
  days_of_coverage  NUMERIC(6,1) DEFAULT 0,        -- balance / avg_daily_usage
  min_stock_level   NUMERIC(12,2) DEFAULT 0,        -- alert threshold
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inv_balance_unique UNIQUE (commodity_id, establishment_id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id      UUID NOT NULL REFERENCES commodity_catalog(id),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),
  transaction_type  TEXT NOT NULL,              -- 'reception', 'consumption', 'transfer_in', 'transfer_out', 'adjustment', 'loss'
  quantity          NUMERIC(12,2) NOT NULL,     -- positive = in, negative = out
  unit              TEXT NOT NULL DEFAULT 'ton',
  reference_type    TEXT,                       -- 'delivery', 'production_order', 'manual'
  reference_id      TEXT,                       -- FK to delivery, order, etc.
  balance_after     NUMERIC(14,2),             -- snapshot after this txn
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_txn_commodity_est ON inventory_transactions(commodity_id, establishment_id, created_at DESC);
CREATE INDEX idx_inv_txn_type ON inventory_transactions(transaction_type);

-- ============================================================
-- 5. COMMODITY REFERENCE PRICES — market price tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS commodity_ref_prices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id  UUID NOT NULL REFERENCES commodity_catalog(id),
  price_date    DATE NOT NULL,
  price         NUMERIC(12,4) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  unit          TEXT NOT NULL DEFAULT 'ton',
  source        TEXT DEFAULT 'manual',         -- 'manual', 'api_cbot', 'api_local'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ref_price_unique UNIQUE (commodity_id, price_date, source)
);

CREATE INDEX idx_ref_prices_commodity_date ON commodity_ref_prices(commodity_id, price_date DESC);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
ALTER TABLE commodity_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_material_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_material_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commodity_ref_prices ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY cc_read ON commodity_catalog FOR SELECT USING (true);
CREATE POLICY rmc_read ON raw_material_contracts FOR SELECT USING (true);
CREATE POLICY rmd_read ON raw_material_deliveries FOR SELECT USING (true);
CREATE POLICY ib_read ON inventory_balances FOR SELECT USING (true);
CREATE POLICY it_read ON inventory_transactions FOR SELECT USING (true);
CREATE POLICY crp_read ON commodity_ref_prices FOR SELECT USING (true);

-- Write access for authorized roles
CREATE POLICY cc_write ON commodity_catalog FOR ALL USING (auth_role() IN ('admin'));
CREATE POLICY rmc_write ON raw_material_contracts FOR ALL USING (auth_role() IN ('admin', 'gerente', 'comprador'));
CREATE POLICY rmd_write ON raw_material_deliveries FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider', 'comprador'));
CREATE POLICY ib_write ON inventory_balances FOR ALL USING (auth_role() IN ('admin', 'gerente'));
CREATE POLICY it_write ON inventory_transactions FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));
CREATE POLICY crp_write ON commodity_ref_prices FOR ALL USING (auth_role() IN ('admin', 'gerente'));

-- ============================================================
-- 7. TRIGGER: Auto-update inventory balance on delivery verification
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_inventory_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') THEN
    -- Upsert inventory balance
    INSERT INTO inventory_balances (commodity_id, establishment_id, current_balance, unit)
    VALUES (NEW.commodity_id, NEW.establishment_id, NEW.received_quantity, NEW.unit)
    ON CONFLICT (commodity_id, establishment_id)
    DO UPDATE SET
      current_balance = inventory_balances.current_balance + NEW.received_quantity,
      last_updated = NOW();

    -- Record inventory transaction
    INSERT INTO inventory_transactions (
      commodity_id, establishment_id, transaction_type, quantity, unit,
      reference_type, reference_id, balance_after, created_by
    ) VALUES (
      NEW.commodity_id, NEW.establishment_id, 'reception', NEW.received_quantity, NEW.unit,
      'delivery', NEW.id::TEXT,
      (SELECT current_balance FROM inventory_balances WHERE commodity_id = NEW.commodity_id AND establishment_id = NEW.establishment_id),
      NEW.verified_by
    );

    -- Update contract delivered quantity
    IF NEW.contract_id IS NOT NULL THEN
      UPDATE raw_material_contracts
      SET delivered_quantity = delivered_quantity + NEW.received_quantity,
          updated_at = NOW()
      WHERE id = NEW.contract_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_delivery_verified
  AFTER UPDATE ON raw_material_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_inventory_on_delivery();
