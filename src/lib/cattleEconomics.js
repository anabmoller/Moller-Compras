/**
 * SIGAM Cattle Economics Engine
 * ================================
 * Unified calculation engine extracted from canonical calculator models:
 *  - simulador-pecuaria/sim_recria.py     → calcRecriaPasto()
 *  - analise-confinamento/App.py          → calcConfinamento()
 *  - simulador-pecuaria/sim_confinamento.py (linked version)
 *
 * IMPORTANT: These formulas are canonical domain models.
 * Do NOT modify the financial formulas without explicit approval.
 * Formula changes must be versioned via cattle_formula_versions table.
 *
 * @version 1.0.0
 */

// ============================================================
// FORMULA VERSION REGISTRY
// ============================================================
export const FORMULA_VERSIONS = {
  RECRIA_PASTO: '1.0.0',
  CONFINAMENTO: '1.0.0',
  FULL_LIFECYCLE: '1.0.0',
};

// ============================================================
// DEFAULT PARAMETERS
// ============================================================
export const RECRIA_DEFAULTS = {
  peso_inicial: 175.0,        // kg
  preco_compra_pyg: 20000.0,  // ₲/kg PV
  cambio: 7320.0,             // ₲/US$
  dias: 365,                  // days on pasture
  gmd: 0.490,                 // kg/day — Average Daily Gain
  custo_aluguel: 5.40,        // US$/month — pasture rent
  custo_nutricional: 4.0,     // US$/month — nutrition cost
  custo_operacional: 3.44,    // US$/month — operational cost
  frete: 8.0,                 // US$/head — freight
  comissao: 4.0,              // US$/head — commission
  juros_anual: 0.085,         // annual interest rate (fraction)
  preco_venda_kg: 2.40,       // US$/kg PV — sale price
};

export const CONFINAMENTO_DEFAULTS = {
  peso_inicial: 350.0,        // kg
  ganho_dia: 1.40,            // kg/day — daily weight gain
  dias: 110,                  // days in feedlot
  rendimento_ini: 0.50,       // initial carcass yield (fraction)
  rendimento_fim: 0.56,       // final carcass yield (fraction)
  preco_compra_kg: 11.30,     // US$/kg PV — purchase price
  preco_venda_kg: 21.40,      // US$/kg carcass — sale price
  diaria: 14.50,              // US$/day — nutritional cost per day
  servicos_operacionais: 1.0, // US$/animal/day
  custos_extras: 0.0,         // US$/animal
  juros_mes: 0.005,           // monthly interest rate (fraction)
};

// ============================================================
// 1. RECRIA A PASTO — Pasture Rearing Analysis
// Canonical source: sim_recria.py lines 80-106
// ============================================================
/**
 * Calculate pasture rearing (recria) economics.
 *
 * @param {Object} params - Input parameters (see RECRIA_DEFAULTS)
 * @returns {Object} Complete economic analysis results
 */
export function calcRecriaPasto(params = {}) {
  const p = { ...RECRIA_DEFAULTS, ...params };

  // Purchase cost in USD
  const valor_compra_usd = p.cambio > 0
    ? (p.peso_inicial * p.preco_compra_pyg) / p.cambio
    : 0;
  const preco_compra_usd_kg = p.cambio > 0
    ? p.preco_compra_pyg / p.cambio
    : 0;

  // Premium (ágio) — how much more we pay vs sale price
  const agio_pct = p.preco_venda_kg > 0
    ? ((preco_compra_usd_kg - p.preco_venda_kg) / p.preco_venda_kg) * 100
    : 0;

  // Weight gain
  const peso_final = p.peso_inicial + p.gmd * p.dias;
  const gpv = peso_final - p.peso_inicial;

  // Variable costs over period
  const meses = p.dias / 30.5;
  const custo_mensal = p.custo_aluguel + p.custo_nutricional + p.custo_operacional;
  const custo_total_periodo = custo_mensal * meses;

  // Total cost
  const custo_total = valor_compra_usd + custo_total_periodo + p.frete + p.comissao;

  // Revenue
  const receita = peso_final * p.preco_venda_kg;

  // Interest on purchase capital
  const juros_valor = valor_compra_usd * p.juros_anual * (p.dias / 365);

  // Profit
  const lucro = receita - custo_total - juros_valor;

  // Margins and ROI
  const margem_periodo_pct = receita > 0 ? (lucro / receita) * 100 : 0;
  const margem_mensal_pct = meses > 0 ? margem_periodo_pct / meses : 0;
  const roi_pct = valor_compra_usd > 0 ? (lucro / valor_compra_usd) * 100 : 0;
  const roi_mensal_pct = meses > 0 ? roi_pct / meses : 0;
  const roi_custo_pct = custo_total > 0 ? (lucro / custo_total) * 100 : 0;
  const roi_custo_mensal_pct = meses > 0 ? roi_custo_pct / meses : 0;

  return {
    formula_type: 'recria_pasto',
    formula_version: FORMULA_VERSIONS.RECRIA_PASTO,
    inputs: { ...p },
    // Zootechnical indicators
    peso_final,
    gpv,
    meses,
    // Purchase
    valor_compra_usd,
    preco_compra_usd_kg,
    agio_pct,
    // Costs
    custo_mensal,
    custo_total_periodo,
    custo_total,
    juros_valor,
    // Revenue & Profit
    receita,
    lucro,
    // Margins & ROI
    margem_periodo_pct,
    margem_mensal_pct,
    roi_pct,
    roi_mensal_pct,
    roi_custo_pct,
    roi_custo_mensal_pct,
  };
}

// ============================================================
// 2. CONFINAMENTO — Feedlot Analysis
// Canonical source: analise-confinamento/App.py lines 34-55
//                   sim_confinamento.py lines 88-112
// ============================================================
/**
 * Calculate feedlot (confinamento) economics.
 *
 * @param {Object} params - Input parameters (see CONFINAMENTO_DEFAULTS)
 * @returns {Object} Complete economic analysis results
 */
export function calcConfinamento(params = {}) {
  const p = { ...CONFINAMENTO_DEFAULTS, ...params };

  // Weight
  const peso_final = p.peso_inicial + p.ganho_dia * p.dias;
  const carcaca_final = peso_final * p.rendimento_fim;
  const ganho_peso = peso_final - p.peso_inicial;
  const ganho_carcaca = carcaca_final - (p.peso_inicial * p.rendimento_ini);
  const carcaca_dia = p.dias > 0 ? ganho_carcaca / p.dias : 0;

  // Costs
  const valor_compra = p.peso_inicial * p.preco_compra_kg;
  const custo_nutricional = p.diaria * p.dias;
  const custo_servicos = p.servicos_operacionais * p.dias;
  const despesas_totais = custo_nutricional + custo_servicos + p.custos_extras;
  const juros = valor_compra * p.juros_mes * (p.dias / 30);
  const custo_total = valor_compra + despesas_totais + juros;

  // Revenue (sold by carcass weight)
  const receita = carcaca_final * p.preco_venda_kg;

  // Profit
  const lucro = receita - custo_total;

  // Margins and ROI
  const margem_lucro_pct = receita > 0 ? (lucro / receita) * 100 : 0;
  const roi_pct = valor_compra > 0 ? (lucro / valor_compra) * 100 : 0;
  const roi_mensal_pct = p.dias > 0 ? (roi_pct / p.dias) * 30 : 0;
  const roi_custo_pct = custo_total > 0 ? (lucro / custo_total) * 100 : 0;
  const roi_custo_mensal_pct = p.dias > 0 ? (roi_custo_pct / p.dias) * 30 : 0;

  return {
    formula_type: 'confinamento',
    formula_version: FORMULA_VERSIONS.CONFINAMENTO,
    inputs: { ...p },
    // Zootechnical
    peso_final,
    carcaca_final,
    ganho_peso,
    ganho_carcaca,
    carcaca_dia,
    // Costs
    valor_compra,
    custo_nutricional,
    custo_servicos,
    despesas_totais,
    juros,
    custo_total,
    // Revenue & Profit
    receita,
    lucro,
    // Margins & ROI
    margem_lucro_pct,
    roi_pct,
    roi_mensal_pct,
    roi_custo_pct,
    roi_custo_mensal_pct,
  };
}

// ============================================================
// 3. FULL LIFECYCLE — Purchase → Recria → Confinamento → Slaughter
// Links recria output to confinamento input automatically
// ============================================================
/**
 * Calculate full cattle lifecycle economics.
 *
 * @param {Object} recria_params - Recria input parameters
 * @param {Object} confinamento_params - Confinamento input parameters (peso_inicial and preco_compra_kg auto-linked from recria)
 * @param {Object} slaughter_params - Slaughter economics { carcass_weight, carcass_price_per_kg, slaughter_cost, freight_to_slaughter }
 * @returns {Object} Complete lifecycle analysis
 */
export function calcFullLifecycle(recria_params = {}, confinamento_params = {}, slaughter_params = {}) {
  // Step 1: Calculate recria
  const recria = calcRecriaPasto(recria_params);

  // Step 2: Link recria output → confinamento input
  const linked_confinamento_params = {
    ...confinamento_params,
    peso_inicial: confinamento_params.peso_inicial ?? recria.peso_final,
    preco_compra_kg: confinamento_params.preco_compra_kg ?? recria.inputs.preco_venda_kg,
  };
  const confinamento = calcConfinamento(linked_confinamento_params);

  // Step 3: Slaughter revenue
  const sl = {
    carcass_weight: slaughter_params.carcass_weight ?? confinamento.carcaca_final,
    carcass_price_per_kg: slaughter_params.carcass_price_per_kg ?? confinamento.inputs.preco_venda_kg,
    slaughter_cost: slaughter_params.slaughter_cost ?? 0,
    freight_to_slaughter: slaughter_params.freight_to_slaughter ?? 0,
  };

  // Step 4: Lifecycle totals
  const total_cost = recria.custo_total + recria.juros_valor +
    confinamento.custo_total +
    sl.slaughter_cost + sl.freight_to_slaughter;

  const total_revenue = sl.carcass_weight * sl.carcass_price_per_kg;
  const total_lucro = total_revenue - total_cost;

  const total_dias = recria.inputs.dias + confinamento.inputs.dias;
  const total_meses = total_dias / 30.5;

  const roi_lifecycle_pct = total_cost > 0 ? (total_lucro / total_cost) * 100 : 0;
  const roi_lifecycle_mensal_pct = total_meses > 0 ? roi_lifecycle_pct / total_meses : 0;

  return {
    formula_type: 'full_lifecycle',
    formula_version: FORMULA_VERSIONS.FULL_LIFECYCLE,
    recria,
    confinamento,
    slaughter: sl,
    // Lifecycle totals
    total_cost,
    total_revenue,
    total_lucro,
    total_dias,
    total_meses,
    roi_lifecycle_pct,
    roi_lifecycle_mensal_pct,
  };
}

// ============================================================
// 4. SENSITIVITY ANALYSIS
// ============================================================
/**
 * Run sensitivity analysis on recria model.
 * Returns impact of varying purchase price, sale price, and GMD.
 */
export function recriaSensitivity(base_params, variations = {}) {
  const base = calcRecriaPasto(base_params);
  const results = [];

  const {
    preco_compra_range = [],
    preco_venda_range = [],
    gmd_range = [],
  } = variations;

  // Purchase price sensitivity
  for (const pyg of preco_compra_range) {
    const scenario = calcRecriaPasto({ ...base_params, preco_compra_pyg: pyg });
    results.push({
      variable: 'preco_compra_pyg',
      value: pyg,
      lucro: scenario.lucro,
      delta: scenario.lucro - base.lucro,
    });
  }

  // Sale price sensitivity
  for (const venda of preco_venda_range) {
    const scenario = calcRecriaPasto({ ...base_params, preco_venda_kg: venda });
    results.push({
      variable: 'preco_venda_kg',
      value: venda,
      lucro: scenario.lucro,
      delta: scenario.lucro - base.lucro,
    });
  }

  // GMD sensitivity
  for (const g of gmd_range) {
    const scenario = calcRecriaPasto({ ...base_params, gmd: g });
    results.push({
      variable: 'gmd',
      value: g,
      lucro: scenario.lucro,
      delta: scenario.lucro - base.lucro,
    });
  }

  return { base, scenarios: results };
}

/**
 * GMD impact analysis (canonical formula from sim_recria.py line 320-325)
 * Each +10g/day gain increases profit by: 0.01 * dias * preco_venda_kg
 */
export function gmdImpactPer10g(dias, preco_venda_kg) {
  return 0.01 * dias * preco_venda_kg;
}

/**
 * Run sensitivity analysis on confinamento model.
 */
export function confinamentoSensitivity(base_params, variations = {}) {
  const base = calcConfinamento(base_params);
  const results = [];

  const {
    ganho_dia_range = [],
    preco_venda_range = [],
    diaria_range = [],
  } = variations;

  for (const g of ganho_dia_range) {
    const scenario = calcConfinamento({ ...base_params, ganho_dia: g });
    results.push({ variable: 'ganho_dia', value: g, lucro: scenario.lucro, delta: scenario.lucro - base.lucro });
  }

  for (const v of preco_venda_range) {
    const scenario = calcConfinamento({ ...base_params, preco_venda_kg: v });
    results.push({ variable: 'preco_venda_kg', value: v, lucro: scenario.lucro, delta: scenario.lucro - base.lucro });
  }

  for (const d of diaria_range) {
    const scenario = calcConfinamento({ ...base_params, diaria: d });
    results.push({ variable: 'diaria', value: d, lucro: scenario.lucro, delta: scenario.lucro - base.lucro });
  }

  return { base, scenarios: results };
}

// ============================================================
// 5. BATCH PROFITABILITY — aggregate for a batch of animals
// ============================================================
/**
 * Calculate batch-level profitability.
 *
 * @param {string} formula_type - 'recria_pasto' | 'confinamento' | 'full_lifecycle'
 * @param {Object} params - calculation parameters
 * @param {number} head_count - number of animals
 * @returns {Object} Per-head and total batch economics
 */
export function calcBatchProfitability(formula_type, params, head_count) {
  let per_head;
  if (formula_type === 'recria_pasto') {
    per_head = calcRecriaPasto(params);
  } else if (formula_type === 'confinamento') {
    per_head = calcConfinamento(params);
  } else {
    throw new Error(`Unsupported formula_type: ${formula_type}`);
  }

  return {
    formula_type,
    head_count,
    per_head,
    batch_totals: {
      total_cost: per_head.custo_total * head_count,
      total_revenue: per_head.receita * head_count,
      total_profit: per_head.lucro * head_count,
      margin_pct: per_head.margem_periodo_pct ?? per_head.margem_lucro_pct,
      roi_pct: per_head.roi_pct,
    },
  };
}

// ============================================================
// 6. SCENARIO COMPARISON
// ============================================================
/**
 * Compare multiple scenarios side by side.
 *
 * @param {Array<{name: string, formula_type: string, params: Object}>} scenarios
 * @returns {Array} Computed results for each scenario
 */
export function compareScenarios(scenarios) {
  return scenarios.map(({ name, formula_type, params }) => {
    let result;
    if (formula_type === 'recria_pasto') result = calcRecriaPasto(params);
    else if (formula_type === 'confinamento') result = calcConfinamento(params);
    else if (formula_type === 'full_lifecycle') result = calcFullLifecycle(params.recria, params.confinamento, params.slaughter);
    else throw new Error(`Unknown formula_type: ${formula_type}`);

    return { name, formula_type, result };
  });
}
