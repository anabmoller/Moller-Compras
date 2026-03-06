-- ============================================================
-- MIGRATION 024: Cattle Economics Engine + Slaughter Module
-- Profitability analysis based on canonical calculator models
-- ============================================================

-- ============================================================
-- 1. FORMULA VERSIONS — versioned calculation models
-- ============================================================
CREATE TABLE IF NOT EXISTS cattle_formula_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formula_type    TEXT NOT NULL,       -- 'recria_pasto', 'confinamento', 'full_lifecycle'
  version         TEXT NOT NULL,       -- semver e.g. '1.0.0'
  description     TEXT,
  parameters_schema JSONB NOT NULL,    -- JSON Schema of required input parameters
  formula_logic   JSONB NOT NULL,      -- structured formula definition (canonical)
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT formula_version_unique UNIQUE (formula_type, version)
);

-- Seed canonical formulas extracted from the 3 calculators
INSERT INTO cattle_formula_versions (formula_type, version, description, parameters_schema, formula_logic) VALUES

-- RECRIA A PASTO formula (from simulador-pecuaria/sim_recria.py)
('recria_pasto', '1.0.0', 'Análise Econômica da Recria a Pasto — canonical model from Roneizoo/simulador-pecuaria',
'{
  "required": ["peso_inicial", "preco_compra_pyg", "cambio", "dias", "gmd", "custo_aluguel", "custo_nutricional", "custo_operacional", "frete", "comissao", "juros_anual", "preco_venda_kg"],
  "properties": {
    "peso_inicial": {"type": "number", "unit": "kg", "default": 175.0, "description": "Peso inicial do animal"},
    "preco_compra_pyg": {"type": "number", "unit": "PYG/kg PV", "default": 20000.0},
    "cambio": {"type": "number", "unit": "PYG/USD", "default": 7320.0},
    "dias": {"type": "integer", "unit": "days", "default": 365},
    "gmd": {"type": "number", "unit": "kg/day", "default": 0.490, "description": "Ganho Médio Diário"},
    "custo_aluguel": {"type": "number", "unit": "USD/month", "default": 5.40},
    "custo_nutricional": {"type": "number", "unit": "USD/month", "default": 4.0},
    "custo_operacional": {"type": "number", "unit": "USD/month", "default": 3.44},
    "frete": {"type": "number", "unit": "USD/head", "default": 8.0},
    "comissao": {"type": "number", "unit": "USD/head", "default": 4.0},
    "juros_anual": {"type": "number", "unit": "fraction", "default": 0.085},
    "preco_venda_kg": {"type": "number", "unit": "USD/kg PV", "default": 2.40}
  }
}',
'{
  "steps": [
    {"name": "valor_compra_usd", "formula": "(peso_inicial * preco_compra_pyg) / cambio"},
    {"name": "preco_compra_usd_kg", "formula": "preco_compra_pyg / cambio"},
    {"name": "agio_pct", "formula": "((preco_compra_usd_kg - preco_venda_kg) / preco_venda_kg) * 100"},
    {"name": "peso_final", "formula": "peso_inicial + gmd * dias"},
    {"name": "gpv", "formula": "peso_final - peso_inicial"},
    {"name": "meses", "formula": "dias / 30.5"},
    {"name": "custo_mensal", "formula": "custo_aluguel + custo_nutricional + custo_operacional"},
    {"name": "custo_total_periodo", "formula": "custo_mensal * meses"},
    {"name": "custo_total", "formula": "valor_compra_usd + custo_total_periodo + frete + comissao"},
    {"name": "receita", "formula": "peso_final * preco_venda_kg"},
    {"name": "juros_valor", "formula": "valor_compra_usd * juros_anual * (dias / 365)"},
    {"name": "lucro", "formula": "receita - custo_total - juros_valor"},
    {"name": "margem_periodo_pct", "formula": "(lucro / receita) * 100"},
    {"name": "margem_mensal_pct", "formula": "margem_periodo_pct / meses"},
    {"name": "roi_pct", "formula": "(lucro / valor_compra_usd) * 100"},
    {"name": "roi_mensal_pct", "formula": "roi_pct / meses"},
    {"name": "roi_custo_pct", "formula": "(lucro / custo_total) * 100"},
    {"name": "roi_custo_mensal_pct", "formula": "roi_custo_pct / meses"}
  ],
  "outputs": ["valor_compra_usd", "preco_compra_usd_kg", "agio_pct", "peso_final", "gpv", "meses", "custo_mensal", "custo_total_periodo", "custo_total", "receita", "juros_valor", "lucro", "margem_periodo_pct", "margem_mensal_pct", "roi_pct", "roi_mensal_pct", "roi_custo_pct", "roi_custo_mensal_pct"],
  "sensitivity": {
    "gmd_impact_per_10g": "0.01 * dias * preco_venda_kg"
  }
}'),

-- CONFINAMENTO formula (from simulador-pecuaria/sim_confinamento.py & analise-confinamento/App.py)
('confinamento', '1.0.0', 'Análise Econômica do Confinamento — canonical model from Roneizoo/analise-confinamento',
'{
  "required": ["peso_inicial", "ganho_dia", "dias", "rendimento_ini", "rendimento_fim", "preco_compra_kg", "preco_venda_kg", "diaria", "servicos_operacionais", "custos_extras", "juros_mes"],
  "properties": {
    "peso_inicial": {"type": "number", "unit": "kg", "default": 350.0},
    "ganho_dia": {"type": "number", "unit": "kg/day", "default": 1.40},
    "dias": {"type": "integer", "unit": "days", "default": 110},
    "rendimento_ini": {"type": "number", "unit": "fraction", "default": 0.50, "description": "Rendimento carcaça inicial"},
    "rendimento_fim": {"type": "number", "unit": "fraction", "default": 0.56, "description": "Rendimento carcaça final"},
    "preco_compra_kg": {"type": "number", "unit": "USD/kg PV", "default": 11.30},
    "preco_venda_kg": {"type": "number", "unit": "USD/kg carcass", "default": 21.40},
    "diaria": {"type": "number", "unit": "USD/day", "default": 14.50, "description": "Custo nutricional diário"},
    "servicos_operacionais": {"type": "number", "unit": "USD/animal/day", "default": 1.0},
    "custos_extras": {"type": "number", "unit": "USD/animal", "default": 0.0},
    "juros_mes": {"type": "number", "unit": "fraction/month", "default": 0.005}
  }
}',
'{
  "steps": [
    {"name": "peso_final", "formula": "peso_inicial + ganho_dia * dias"},
    {"name": "carcaca_final", "formula": "peso_final * rendimento_fim"},
    {"name": "ganho_peso", "formula": "peso_final - peso_inicial"},
    {"name": "ganho_carcaca", "formula": "carcaca_final - (peso_inicial * rendimento_ini)"},
    {"name": "carcaca_dia", "formula": "ganho_carcaca / dias"},
    {"name": "valor_compra", "formula": "peso_inicial * preco_compra_kg"},
    {"name": "custo_nutricional", "formula": "diaria * dias"},
    {"name": "custo_servicos", "formula": "servicos_operacionais * dias"},
    {"name": "despesas_totais", "formula": "custo_nutricional + custo_servicos + custos_extras"},
    {"name": "juros", "formula": "valor_compra * juros_mes * (dias / 30)"},
    {"name": "custo_total", "formula": "valor_compra + despesas_totais + juros"},
    {"name": "receita", "formula": "carcaca_final * preco_venda_kg"},
    {"name": "lucro", "formula": "receita - custo_total"},
    {"name": "margem_lucro_pct", "formula": "(lucro / receita) * 100"},
    {"name": "roi_pct", "formula": "(lucro / valor_compra) * 100"},
    {"name": "roi_mensal_pct", "formula": "(roi_pct / dias) * 30"},
    {"name": "roi_custo_pct", "formula": "(lucro / custo_total) * 100"},
    {"name": "roi_custo_mensal_pct", "formula": "(roi_custo_pct / dias) * 30"}
  ],
  "outputs": ["peso_final", "carcaca_final", "ganho_peso", "ganho_carcaca", "carcaca_dia", "valor_compra", "custo_nutricional", "custo_servicos", "despesas_totais", "juros", "custo_total", "receita", "lucro", "margem_lucro_pct", "roi_pct", "roi_mensal_pct", "roi_custo_pct", "roi_custo_mensal_pct"],
  "link_from_recria": {
    "peso_inicial": "recria.peso_final",
    "preco_compra_kg": "recria.preco_venda_kg"
  }
}'),

-- FULL LIFECYCLE formula (purchase → recria → confinamento → slaughter)
('full_lifecycle', '1.0.0', 'Full cattle lifecycle economics — composed from recria + confinamento + slaughter',
'{
  "required": ["recria_params", "confinamento_params", "slaughter_params"],
  "properties": {
    "recria_params": {"type": "object", "description": "All recria_pasto parameters"},
    "confinamento_params": {"type": "object", "description": "All confinamento parameters"},
    "slaughter_params": {"type": "object", "properties": {
      "carcass_weight": {"type": "number"},
      "carcass_price_per_kg": {"type": "number"},
      "slaughter_cost": {"type": "number", "default": 0},
      "freight_to_slaughter": {"type": "number", "default": 0}
    }}
  }
}',
'{
  "steps": [
    {"name": "recria_result", "formula": "APPLY recria_pasto v1.0.0 WITH recria_params"},
    {"name": "confinamento_input", "formula": "MERGE confinamento_params WITH {peso_inicial: recria_result.peso_final, preco_compra_kg: recria_result.preco_venda_kg}"},
    {"name": "confinamento_result", "formula": "APPLY confinamento v1.0.0 WITH confinamento_input"},
    {"name": "total_cost", "formula": "recria_result.custo_total + recria_result.juros_valor + confinamento_result.custo_total + slaughter_params.slaughter_cost + slaughter_params.freight_to_slaughter"},
    {"name": "total_revenue", "formula": "slaughter_params.carcass_weight * slaughter_params.carcass_price_per_kg"},
    {"name": "total_lucro", "formula": "total_revenue - total_cost"},
    {"name": "total_dias", "formula": "recria_params.dias + confinamento_params.dias"},
    {"name": "total_meses", "formula": "total_dias / 30.5"},
    {"name": "roi_lifecycle_pct", "formula": "(total_lucro / total_cost) * 100"},
    {"name": "roi_lifecycle_mensal_pct", "formula": "roi_lifecycle_pct / total_meses"}
  ],
  "outputs": ["recria_result", "confinamento_result", "total_cost", "total_revenue", "total_lucro", "total_dias", "total_meses", "roi_lifecycle_pct", "roi_lifecycle_mensal_pct"]
}')
ON CONFLICT (formula_type, version) DO NOTHING;

-- ============================================================
-- 2. CATTLE PROFITABILITY — computed results per animal/batch
-- ============================================================
CREATE TABLE IF NOT EXISTS cattle_profitability (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type        TEXT NOT NULL,         -- 'animal', 'batch', 'scenario'
  scope_id          UUID,                  -- animal_id or batch_id

  formula_type      TEXT NOT NULL,         -- 'recria_pasto', 'confinamento', 'full_lifecycle'
  formula_version   TEXT NOT NULL DEFAULT '1.0.0',

  -- Input parameters (snapshot)
  input_params      JSONB NOT NULL,

  -- Computed results (all output variables from formula)
  results           JSONB NOT NULL,

  -- Key summary fields (denormalized for queries)
  total_cost_usd    NUMERIC(12,2),
  total_revenue_usd NUMERIC(12,2),
  profit_usd        NUMERIC(12,2),
  margin_pct        NUMERIC(6,2),
  roi_pct           NUMERIC(8,2),
  roi_monthly_pct   NUMERIC(8,2),

  -- Metadata
  scenario_name     TEXT,                   -- for scenario simulations
  is_actual         BOOLEAN DEFAULT false,  -- true = based on real data, false = projected/simulated
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  computed_by       UUID REFERENCES auth.users(id),
  notes             TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profit_scope ON cattle_profitability(scope_type, scope_id);
CREATE INDEX idx_profit_formula ON cattle_profitability(formula_type);
CREATE INDEX idx_profit_actual ON cattle_profitability(is_actual, computed_at DESC);

-- ============================================================
-- 3. SLAUGHTER MODULE
-- ============================================================
CREATE TABLE IF NOT EXISTS slaughter_shipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID REFERENCES cattle_batches(id),
  movement_id       UUID REFERENCES movimientos_ganado(id),
  frigorifico_id    UUID NOT NULL REFERENCES companies(id),  -- slaughterhouse company
  establishment_origin UUID NOT NULL REFERENCES establishments(id),

  -- Planned
  planned_date      DATE NOT NULL,
  planned_head_count INTEGER NOT NULL,
  guide_number      TEXT,

  -- Actual
  actual_date       DATE,
  actual_head_count INTEGER,

  -- Freight
  carrier_name      TEXT,
  freight_cost      NUMERIC(10,2),
  freight_currency  TEXT DEFAULT 'USD',

  -- Status
  status            TEXT NOT NULL DEFAULT 'planned', -- 'planned', 'in_transit', 'arrived', 'slaughtered', 'audited', 'closed'

  notes             TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slaughter_batch ON slaughter_shipments(batch_id);
CREATE INDEX idx_slaughter_date ON slaughter_shipments(planned_date DESC);
CREATE INDEX idx_slaughter_status ON slaughter_shipments(status);

-- ============================================================
-- 4. SLAUGHTER AUDIT RESULTS — per-animal carcass data
-- ============================================================
CREATE TABLE IF NOT EXISTS slaughter_audit_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id       UUID NOT NULL REFERENCES slaughter_shipments(id),
  animal_id         UUID REFERENCES cattle_animals(id),

  -- Carcass data
  carcass_weight_hot NUMERIC(8,2),       -- hot carcass weight
  carcass_weight_cold NUMERIC(8,2),      -- cold carcass weight (after 24h)
  carcass_yield_pct NUMERIC(5,2),        -- rendimiento de carcasa %
  carcass_grade     TEXT,                 -- quality grading

  -- Defects
  bruising_score    INTEGER,              -- 0-5 scale
  condemnation      BOOLEAN DEFAULT false,
  condemnation_reason TEXT,

  -- Financial
  price_per_kg      NUMERIC(10,4),
  total_value       NUMERIC(12,2),

  -- Audit PDF reference
  audit_file_id     UUID REFERENCES file_store(id),

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slaughter_audit_shipment ON slaughter_audit_results(shipment_id);
CREATE INDEX idx_slaughter_audit_animal ON slaughter_audit_results(animal_id);

-- ============================================================
-- 5. SUPPLIER SCORING — cattle supplier quality metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_cattle_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id       UUID NOT NULL REFERENCES suppliers(id),
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,

  -- Volume
  total_head        INTEGER DEFAULT 0,
  total_batches     INTEGER DEFAULT 0,

  -- Quality metrics
  avg_entry_weight  NUMERIC(8,2),
  avg_carcass_yield NUMERIC(5,2),
  avg_daily_gain    NUMERIC(6,3),
  condemnation_rate NUMERIC(5,2),         -- % condemned at slaughter
  bruising_avg      NUMERIC(4,2),

  -- Financial
  avg_margin_pct    NUMERIC(6,2),
  avg_roi_pct       NUMERIC(8,2),

  -- Score (0-100)
  overall_score     NUMERIC(5,2),

  computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supplier_score ON supplier_cattle_scores(supplier_id, period_end DESC);

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
ALTER TABLE cattle_formula_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle_profitability ENABLE ROW LEVEL SECURITY;
ALTER TABLE slaughter_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE slaughter_audit_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_cattle_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY cfv_read ON cattle_formula_versions FOR SELECT USING (true);
CREATE POLICY cfv_write ON cattle_formula_versions FOR ALL USING (auth_role() = 'admin');

CREATE POLICY cp_read ON cattle_profitability FOR SELECT USING (true);
CREATE POLICY cp_write ON cattle_profitability FOR ALL USING (auth_role() IN ('admin', 'gerente', 'diretoria'));

CREATE POLICY ss_read ON slaughter_shipments FOR SELECT USING (true);
CREATE POLICY ss_write ON slaughter_shipments FOR ALL USING (auth_role() IN ('admin', 'gerente', 'lider'));

CREATE POLICY sar_read ON slaughter_audit_results FOR SELECT USING (true);
CREATE POLICY sar_write ON slaughter_audit_results FOR ALL USING (auth_role() IN ('admin', 'gerente'));

CREATE POLICY scs_read ON supplier_cattle_scores FOR SELECT USING (true);
CREATE POLICY scs_write ON supplier_cattle_scores FOR ALL USING (auth_role() IN ('admin', 'diretoria'));
