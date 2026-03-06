/**
 * SIGAM Freight Service
 * Carrier management, job tracking, performance analytics.
 */
import { supabase } from './supabase';

// ============================================================
// CARRIERS
// ============================================================

export async function getCarriers(activeOnly = true) {
  let query = supabase
    .from('carriers')
    .select('*')
    .order('name');

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCarrier(carrierId) {
  const { data, error } = await supabase
    .from('carriers')
    .select('*')
    .eq('id', carrierId)
    .single();

  if (error) throw error;
  return data;
}

export async function createCarrier(carrier) {
  const { data, error } = await supabase
    .from('carriers')
    .insert(carrier)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCarrier(carrierId, updates) {
  const { data, error } = await supabase
    .from('carriers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', carrierId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// FREIGHT JOBS
// ============================================================

export async function getFreightJobs(filters = {}) {
  let query = supabase
    .from('freight_jobs')
    .select(`
      *,
      carrier:carriers(id, name, contact_phone)
    `)
    .order('scheduled_pickup', { ascending: false });

  if (filters.carrierId) query = query.eq('carrier_id', filters.carrierId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.cargoType) query = query.eq('cargo_type', filters.cargoType);
  if (filters.relatedObjectType) {
    query = query.eq('related_object_type', filters.relatedObjectType);
    if (filters.relatedObjectId) query = query.eq('related_object_id', filters.relatedObjectId);
  }

  const { data, error } = await query.limit(filters.limit || 100);
  if (error) throw error;
  return data || [];
}

export async function getFreightJob(jobId) {
  const { data, error } = await supabase
    .from('freight_jobs')
    .select(`
      *,
      carrier:carriers(*)
    `)
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}

export async function createFreightJob(job) {
  const { data, error } = await supabase
    .from('freight_jobs')
    .insert(job)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFreightJob(jobId, updates) {
  const { data, error } = await supabase
    .from('freight_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Advance freight job status with auto-timestamping.
 */
export async function advanceFreightStatus(jobId, newStatus) {
  const updates = { status: newStatus, updated_at: new Date().toISOString() };
  const now = new Date().toISOString();

  switch (newStatus) {
    case 'loaded':
      updates.actual_pickup = now;
      break;
    case 'arrived':
    case 'unloaded':
    case 'completed':
      updates.actual_delivery = now;
      break;
  }

  return updateFreightJob(jobId, updates);
}

/**
 * Record loss on a freight job.
 */
export async function recordFreightLoss(jobId, lossQuantity, lossReason) {
  return updateFreightJob(jobId, {
    loss_quantity: lossQuantity,
    loss_reason: lossReason,
  });
}

// ============================================================
// CARRIER PERFORMANCE
// ============================================================

export async function getCarrierPerformance(carrierId, limit = 12) {
  const { data, error } = await supabase
    .from('carrier_performance')
    .select('*')
    .eq('carrier_id', carrierId)
    .order('period_end', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Compute carrier performance for a period.
 */
export async function computeCarrierPerformance(carrierId, periodStart, periodEnd) {
  const { data: jobs } = await supabase
    .from('freight_jobs')
    .select('*')
    .eq('carrier_id', carrierId)
    .gte('scheduled_pickup', periodStart)
    .lte('scheduled_pickup', periodEnd);

  if (!jobs || jobs.length === 0) return null;

  const completed = jobs.filter(j => j.status === 'completed');
  const onTime = completed.filter(j => {
    if (!j.scheduled_delivery || !j.actual_delivery) return false;
    return new Date(j.actual_delivery) <= new Date(j.scheduled_delivery);
  });

  const totalLoss = completed.reduce((s, j) => s + (Number(j.loss_quantity) || 0), 0);
  const totalExpected = completed.reduce((s, j) => s + (Number(j.expected_quantity) || 0), 0);
  const totalCost = completed.reduce((s, j) => s + (Number(j.actual_cost) || 0), 0);

  const delays = completed
    .filter(j => j.scheduled_delivery && j.actual_delivery)
    .map(j => (new Date(j.actual_delivery) - new Date(j.scheduled_delivery)) / 3600000);
  const avgDelay = delays.length > 0 ? delays.reduce((s, d) => s + d, 0) / delays.length : 0;

  const onTimeRate = completed.length > 0 ? (onTime.length / completed.length) * 100 : 0;
  const lossRate = totalExpected > 0 ? (totalLoss / totalExpected) * 100 : 0;

  // Overall score: weighted combination
  const score = Math.max(0, Math.min(100,
    (onTimeRate * 0.4) +
    ((100 - lossRate) * 0.3) +
    (Math.max(0, 100 - Math.abs(avgDelay) * 5) * 0.3)
  ));

  const record = {
    carrier_id: carrierId,
    period_start: periodStart,
    period_end: periodEnd,
    total_jobs: jobs.length,
    completed_jobs: completed.length,
    on_time_deliveries: onTime.length,
    on_time_rate_pct: Math.round(onTimeRate * 100) / 100,
    total_loss: Math.round(totalLoss * 100) / 100,
    loss_rate_pct: Math.round(lossRate * 100) / 100,
    avg_delay_hours: Math.round(avgDelay * 10) / 10,
    total_cost: Math.round(totalCost * 100) / 100,
    avg_cost_per_job: completed.length > 0 ? Math.round(totalCost / completed.length * 100) / 100 : 0,
    overall_score: Math.round(score * 100) / 100,
  };

  // Upsert
  const { data, error } = await supabase
    .from('carrier_performance')
    .insert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}
