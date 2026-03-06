/**
 * SIGAM Reconciliation & Theft Detection Service
 * External data ingestion, cross-system comparison, discrepancy alerts.
 */
import { supabase } from './supabase';

// ============================================================
// EXTERNAL DATA INGESTS
// ============================================================

export async function getIngests(filters = {}) {
  let query = supabase
    .from('external_data_ingests')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.sourceSystem) query = query.eq('source_system', filters.sourceSystem);
  if (filters.establishmentId) query = query.eq('establishment_id', filters.establishmentId);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query.limit(filters.limit || 50);
  if (error) throw error;
  return data || [];
}

export async function createIngest(ingest) {
  const { data, error } = await supabase
    .from('external_data_ingests')
    .insert(ingest)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateIngest(ingestId, updates) {
  const { data, error } = await supabase
    .from('external_data_ingests')
    .update(updates)
    .eq('id', ingestId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// RECONCILIATION SNAPSHOTS
// ============================================================

export async function getReconciliationSnapshots(filters = {}) {
  let query = supabase
    .from('reconciliation_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false });

  if (filters.establishmentId) query = query.eq('establishment_id', filters.establishmentId);
  if (filters.riskLevel) query = query.eq('risk_level', filters.riskLevel);

  const { data, error } = await query.limit(filters.limit || 50);
  if (error) throw error;
  return data || [];
}

export async function getSnapshot(snapshotId) {
  const { data, error } = await supabase
    .from('reconciliation_snapshots')
    .select('*')
    .eq('id', snapshotId)
    .single();

  if (error) throw error;
  return data;
}

export async function createSnapshot(snapshot) {
  // Compute max discrepancy
  const counts = [
    snapshot.sigam_count,
    snapshot.sap_count,
    snapshot.control_pasto_count,
    snapshot.sigor_count,
    snapshot.capataz_count,
  ].filter(c => c != null);

  const maxDisc = counts.length >= 2
    ? Math.max(...counts) - Math.min(...counts)
    : 0;

  // Auto-assign risk level
  let riskLevel = 'normal';
  if (maxDisc > 10) riskLevel = 'critical';
  else if (maxDisc > 3) riskLevel = 'warning';

  const { data, error } = await supabase
    .from('reconciliation_snapshots')
    .insert({
      ...snapshot,
      max_discrepancy: maxDisc,
      risk_level: riskLevel,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function resolveSnapshot(snapshotId, resolution, resolvedBy) {
  const { data, error } = await supabase
    .from('reconciliation_snapshots')
    .update({
      resolution,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', snapshotId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// DISCREPANCY ALERTS
// ============================================================

export async function getDiscrepancyAlerts(filters = {}) {
  let query = supabase
    .from('discrepancy_alerts')
    .select(`
      *,
      reconciliation:reconciliation_snapshots(id, snapshot_date, establishment_id)
    `)
    .order('created_at', { ascending: false });

  if (filters.establishmentId) query = query.eq('establishment_id', filters.establishmentId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.severity) query = query.eq('severity', filters.severity);

  const { data, error } = await query.limit(filters.limit || 100);
  if (error) throw error;
  return data || [];
}

export async function createDiscrepancyAlert(alert) {
  const { data, error } = await supabase
    .from('discrepancy_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAlertStatus(alertId, status, resolutionNotes = null) {
  const updates = { status };
  if (status === 'resolved' || status === 'false_positive') {
    updates.resolved_at = new Date().toISOString();
    updates.resolution_notes = resolutionNotes;
  }

  const { data, error } = await supabase
    .from('discrepancy_alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function assignAlert(alertId, userId) {
  const { data, error } = await supabase
    .from('discrepancy_alerts')
    .update({ assigned_to: userId, status: 'investigating' })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// DASHBOARD KPIS
// ============================================================

export async function getReconciliationKPIs(establishmentId = null) {
  // Open alerts count by severity
  let alertsQuery = supabase
    .from('discrepancy_alerts')
    .select('severity')
    .in('status', ['open', 'investigating']);
  if (establishmentId) alertsQuery = alertsQuery.eq('establishment_id', establishmentId);
  const { data: alerts } = await alertsQuery;

  const criticalAlerts = (alerts || []).filter(a => a.severity === 'critical').length;
  const warningAlerts = (alerts || []).filter(a => a.severity === 'warning').length;
  const totalOpenAlerts = (alerts || []).length;

  // Latest snapshot risk level
  let snapshotQuery = supabase
    .from('reconciliation_snapshots')
    .select('risk_level, snapshot_date, max_discrepancy')
    .order('snapshot_date', { ascending: false })
    .limit(1);
  if (establishmentId) snapshotQuery = snapshotQuery.eq('establishment_id', establishmentId);
  const { data: snapshots } = await snapshotQuery;
  const latestSnapshot = snapshots?.[0] || null;

  return {
    totalOpenAlerts,
    criticalAlerts,
    warningAlerts,
    latestRiskLevel: latestSnapshot?.risk_level || 'normal',
    latestSnapshotDate: latestSnapshot?.snapshot_date || null,
    latestMaxDiscrepancy: latestSnapshot?.max_discrepancy || 0,
  };
}
