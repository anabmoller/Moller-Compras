-- ============================================================
-- MIGRATION 022: Fuel Module (Combustible)
-- Purchase tracking, dispense events, vehicle fleet, analytics
-- ============================================================

-- ============================================================
-- 1. VEHICLE ASSETS — fleet registry
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate             TEXT NOT NULL,
  vehicle_type      TEXT NOT NULL DEFAULT 'truck', -- 'truck', 'pickup', 'tractor', 'motorcycle', 'pump_equipment', 'other'
  brand             TEXT,
  model             TEXT,
  year              INTEGER,
  establishment_id  UUID REFERENCES establishments(id),
  assigned_sector   TEXT,
  fuel_type         TEXT DEFAULT 'diesel',         -- 'diesel', 'gasoline', 'flex'
  tank_capacity_l   NUMERIC(8,2),
  avg_consumption   NUMERIC(6,2),                  -- liters per hour or per km
  consumption_unit  TEXT DEFAULT 'l/h',             -- 'l/h', 'l/km'
  odometer_current  NUMERIC(10,1),
  hourmeter_current NUMERIC(10,1),
  is_active         BOOLEAN DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicle_plate ON vehicle_assets(plate);
CREATE INDEX idx_vehicle_establishment ON vehicle_assets(establishment_id);

-- ============================================================
-- 2. FUEL PURCHASES — bulk fuel buying
-- ============================================================
CREATE TABLE IF NOT EXISTS fuel_purchases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id       UUID NOT NULL REFERENCES suppliers(id),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),

  fuel_type         TEXT NOT NULL DEFAULT 'diesel', -- 'diesel', 'gasoline', 'gas'
  quantity_liters   NUMERIC(12,2) NOT NULL,
  unit_price        NUMERIC(10,4) NOT NULL,          -- price per liter
  currency          TEXT NOT NULL DEFAULT 'PYG',
  total_cost        NUMERIC(14,2) GENERATED ALWAYS AS (quantity_liters * unit_price) STORED,

  invoice_number    TEXT,
  purchase_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date     DATE,

  -- Tank level tracking
  tank_level_before NUMERIC(12,2),
  tank_level_after  NUMERIC(12,2),

  status            TEXT NOT NULL DEFAULT 'received', -- 'ordered', 'in_transit', 'received', 'verified'
  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_purchase_date ON fuel_purchases(purchase_date DESC);
CREATE INDEX idx_fuel_purchase_establishment ON fuel_purchases(establishment_id);
CREATE INDEX idx_fuel_purchase_supplier ON fuel_purchases(supplier_id);

-- ============================================================
-- 3. FUEL DISPENSE EVENTS — individual consumption records
-- ============================================================
CREATE TABLE IF NOT EXISTS fuel_dispense_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),
  vehicle_id        UUID REFERENCES vehicle_assets(id),
  operator_id       UUID REFERENCES auth.users(id),

  fuel_type         TEXT NOT NULL DEFAULT 'diesel',
  quantity_liters   NUMERIC(8,2) NOT NULL,
  dispense_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  dispense_time     TIME,

  -- Vehicle readings at dispense
  odometer_reading  NUMERIC(10,1),
  hourmeter_reading NUMERIC(10,1),

  -- Pump data (for CSV import from pump devices)
  pump_id           TEXT,
  pump_reading_start NUMERIC(12,2),
  pump_reading_end  NUMERIC(12,2),

  -- Context
  purpose           TEXT,                -- 'field_work', 'transport', 'generator', 'maintenance'
  destination       TEXT,
  authorized_by     UUID REFERENCES auth.users(id),

  -- Import tracking
  import_source     TEXT DEFAULT 'manual', -- 'manual', 'csv_pump', 'api'
  import_batch_id   TEXT,

  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fuel_dispense_date ON fuel_dispense_events(dispense_date DESC);
CREATE INDEX idx_fuel_dispense_vehicle ON fuel_dispense_events(vehicle_id);
CREATE INDEX idx_fuel_dispense_establishment ON fuel_dispense_events(establishment_id);

-- ============================================================
-- 4. FUEL REFERENCE PRICES — market prices
-- ============================================================
CREATE TABLE IF NOT EXISTS fuel_ref_prices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_type     TEXT NOT NULL,
  price_date    DATE NOT NULL,
  price         NUMERIC(10,4) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'PYG',
  unit          TEXT NOT NULL DEFAULT 'liter',
  source        TEXT DEFAULT 'manual',
  region        TEXT DEFAULT 'paraguay',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fuel_ref_price_unique UNIQUE (fuel_type, price_date, source)
);

CREATE INDEX idx_fuel_ref_price_date ON fuel_ref_prices(fuel_type, price_date DESC);

-- ============================================================
-- 5. FUEL BALANCE — per-establishment tank levels
-- ============================================================
CREATE TABLE IF NOT EXISTS fuel_balances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id  UUID NOT NULL REFERENCES establishments(id),
  fuel_type         TEXT NOT NULL DEFAULT 'diesel',
  current_balance_l NUMERIC(12,2) NOT NULL DEFAULT 0,
  tank_capacity_l   NUMERIC(12,2),
  avg_daily_usage_l NUMERIC(8,2) DEFAULT 0,
  days_of_coverage  NUMERIC(6,1) DEFAULT 0,
  min_stock_level_l NUMERIC(12,2) DEFAULT 0,
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fuel_balance_unique UNIQUE (establishment_id, fuel_type)
);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
ALTER TABLE vehicle_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_dispense_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_ref_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY va_read ON vehicle_assets FOR SELECT USING (true);
CREATE POLICY fp_read ON fuel_purchases FOR SELECT USING (true);
CREATE POLICY fde_read ON fuel_dispense_events FOR SELECT USING (true);
CREATE POLICY frp_read ON fuel_ref_prices FOR SELECT USING (true);
CREATE POLICY fb_read ON fuel_balances FOR SELECT USING (true);

CREATE POLICY va_write ON vehicle_assets FOR ALL USING (auth_role() IN ('admin', 'gerente'));
CREATE POLICY fp_write ON fuel_purchases FOR ALL USING (auth_role() IN ('admin', 'gerente', 'comprador'));
CREATE POLICY fde_write ON fuel_dispense_events FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));
CREATE POLICY frp_write ON fuel_ref_prices FOR ALL USING (auth_role() IN ('admin', 'gerente'));
CREATE POLICY fb_write ON fuel_balances FOR ALL USING (auth_role() IN ('admin', 'gerente'));

-- ============================================================
-- 7. TRIGGER: Auto-update fuel balance on dispense
-- ============================================================
CREATE OR REPLACE FUNCTION fn_update_fuel_balance_on_dispense()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO fuel_balances (establishment_id, fuel_type, current_balance_l)
  VALUES (NEW.establishment_id, NEW.fuel_type, -NEW.quantity_liters)
  ON CONFLICT (establishment_id, fuel_type)
  DO UPDATE SET
    current_balance_l = fuel_balances.current_balance_l - NEW.quantity_liters,
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_fuel_dispense
  AFTER INSERT ON fuel_dispense_events
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_fuel_balance_on_dispense();

CREATE OR REPLACE FUNCTION fn_update_fuel_balance_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    INSERT INTO fuel_balances (establishment_id, fuel_type, current_balance_l)
    VALUES (NEW.establishment_id, NEW.fuel_type, NEW.quantity_liters)
    ON CONFLICT (establishment_id, fuel_type)
    DO UPDATE SET
      current_balance_l = fuel_balances.current_balance_l + NEW.quantity_liters,
      last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_fuel_purchase_received
  AFTER INSERT OR UPDATE ON fuel_purchases
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_fuel_balance_on_purchase();
