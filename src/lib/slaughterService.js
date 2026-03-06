/**
 * SIGAM Slaughter & Profitability Service
 * Shipments, audit results, supplier scoring, profitability records.
 */
import { supabase } from './supabase';

// ============================================================
// SLAUGHTER SHIPMENTS
// ============================================================

export async function getSlaughterShipments(filters = {}) {
  let query = supabase
    .from('slaughter_shipments')
    .select(`
      *,
      batch:cattle_batches(id, batch_code, batch_type)
    `)
    .order('planned_date', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.batchId) query = query.eq('batch_id', filters.batchId);

  const { data, error } = await query.limit(filters.limit || 50);
  if (error) throw error;
  return data || [];
}

export async function createSlaughterShipment(shipment) {
  const { data, error } = await supabase
    .from('slaughter_shipments')
    .insert(shipment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSlaughterShipment(shipmentId, updates) {
  const { data, error } = await supabase
    .from('slaughter_shipments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', shipmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// SLAUGHTER AUDIT RESULTS
// ============================================================

export async function getAuditResults(shipmentId) {
  const { data, error } = await supabase
    .from('slaughter_audit_results')
    .select('*')
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createAuditResult(result) {
  const { data, error } = await supabase
    .from('slaughter_audit_results')
    .insert(result)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkCreateAuditResults(results) {
  const { data, error } = await supabase
    .from('slaughter_audit_results')
    .insert(results)
    .select();

  if (error) throw error;
  return data || [];
}

// ============================================================
// PROFITABILITY RECORDS
// ============================================================

export async function getProfitabilityRecords(filters = {}) {
  let query = supabase
    .from('cattle_profitability')
    .select('*')
    .order('computed_at', { ascending: false });

  if (filters.scopeType) query = query.eq('scope_type', filters.scopeType);
  if (filters.scopeId) query = query.eq('scope_id', filters.scopeId);
  if (filters.formulaType) query = query.eq('formula_type', filters.formulaType);
  if (filters.isActual !== undefined) query = query.eq('is_actual', filters.isActual);

  const { data, error } = await query.limit(filters.limit || 100);
  if (error) throw error;
  return data || [];
}

export async function saveProfitabilityRecord(record) {
  const { data, error } = await supabase
    .from('cattle_profitability')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// SUPPLIER CATTLE SCORES
// ============================================================

export async function getSupplierScores(filters = {}) {
  let query = supabase
    .from('supplier_cattle_scores')
    .select(`
      *,
      supplier:suppliers(id, name)
    `)
    .order('period_end', { ascending: false });

  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);

  const { data, error } = await query.limit(filters.limit || 50);
  if (error) throw error;
  return data || [];
}

// ============================================================
// FORMULA VERSIONS
// ============================================================

export async function getFormulaVersions() {
  const { data, error } = await supabase
    .from('cattle_formula_versions')
    .select('*')
    .eq('is_active', true)
    .order('formula_type');

  if (error) throw error;
  return data || [];
}

export async function getFormulaVersion(formulaType, version = null) {
  let query = supabase
    .from('cattle_formula_versions')
    .select('*')
    .eq('formula_type', formulaType)
    .eq('is_active', true);

  if (version) {
    query = query.eq('version', version);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}
