/**
 * SIGAM Fuel (Combustible) Service
 * Purchases, dispense events, balances, analytics.
 */
import { supabase } from './supabase';

// ============================================================
// VEHICLES
// ============================================================

export async function getVehicles(establishmentId = null) {
  let query = supabase
    .from('vehicle_assets')
    .select('*')
    .eq('is_active', true)
    .order('plate');

  if (establishmentId) query = query.eq('establishment_id', establishmentId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createVehicle(vehicle) {
  const { data, error } = await supabase
    .from('vehicle_assets')
    .insert(vehicle)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateVehicle(vehicleId, updates) {
  const { data, error } = await supabase
    .from('vehicle_assets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// FUEL PURCHASES (Bulk buys)
// ============================================================

export async function getFuelPurchases(filters = {}) {
  let query = supabase
    .from('fuel_purchases')
    .select(`
      *,
      supplier:suppliers(id, name)
    `)
    .order('purchase_date', { ascending: false });

  if (filters.establishmentId) query = query.eq('establishment_id', filters.establishmentId);
  if (filters.fuelType) query = query.eq('fuel_type', filters.fuelType);
  if (filters.dateFrom) query = query.gte('purchase_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('purchase_date', filters.dateTo);

  const { data, error } = await query.limit(filters.limit || 100);
  if (error) throw error;
  return data || [];
}

export async function createFuelPurchase(purchase) {
  const { data, error } = await supabase
    .from('fuel_purchases')
    .insert(purchase)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// DISPENSE EVENTS
// ============================================================

export async function getDispenseEvents(filters = {}) {
  let query = supabase
    .from('fuel_dispense_events')
    .select(`
      *,
      vehicle:vehicle_assets(id, plate, vehicle_type, description)
    `)
    .order('dispense_date', { ascending: false });

  if (filters.vehicleId) query = query.eq('vehicle_id', filters.vehicleId);
  if (filters.establishmentId) query = query.eq('establishment_id', filters.establishmentId);
  if (filters.fuelType) query = query.eq('fuel_type', filters.fuelType);
  if (filters.dateFrom) query = query.gte('dispense_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('dispense_date', filters.dateTo);

  const { data, error } = await query.limit(filters.limit || 200);
  if (error) throw error;
  return data || [];
}

export async function createDispenseEvent(event) {
  const { data, error } = await supabase
    .from('fuel_dispense_events')
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// FUEL BALANCES
// ============================================================

export async function getFuelBalances(establishmentId = null) {
  let query = supabase
    .from('fuel_balances')
    .select('*');

  if (establishmentId) query = query.eq('establishment_id', establishmentId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================
// REFERENCE PRICES
// ============================================================

export async function getFuelRefPrices(fuelType = 'diesel', days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('fuel_ref_prices')
    .select('*')
    .eq('fuel_type', fuelType)
    .gte('price_date', since.toISOString().split('T')[0])
    .order('price_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ============================================================
// DASHBOARD KPIS
// ============================================================

export async function getFuelKPIs(establishmentId = null) {
  // Monthly consumption
  const startOfMonth = new Date();
  startOfMonth.setDate(1);

  let dispenseQuery = supabase
    .from('fuel_dispense_events')
    .select('quantity, fuel_type')
    .gte('dispense_date', startOfMonth.toISOString().split('T')[0]);
  if (establishmentId) dispenseQuery = dispenseQuery.eq('establishment_id', establishmentId);
  const { data: dispenses } = await dispenseQuery;

  const totalLiters = (dispenses || []).reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  const dispenseCount = (dispenses || []).length;

  // Monthly spend
  let purchaseQuery = supabase
    .from('fuel_purchases')
    .select('total_cost')
    .gte('purchase_date', startOfMonth.toISOString().split('T')[0]);
  if (establishmentId) purchaseQuery = purchaseQuery.eq('establishment_id', establishmentId);
  const { data: purchases } = await purchaseQuery;

  const totalSpend = (purchases || []).reduce((sum, p) => sum + (Number(p.total_cost) || 0), 0);

  // Average price per liter
  const avgPrice = totalLiters > 0 ? Math.round(totalSpend / totalLiters) : 0;

  return {
    monthlyLiters: Math.round(totalLiters),
    monthlySpend: Math.round(totalSpend),
    dispenseCount,
    avgPricePerLiter: avgPrice,
  };
}

// ============================================================
// ANOMALY DETECTION (simple threshold-based)
// ============================================================

export async function detectFuelAnomalies(establishmentId, lookbackDays = 30) {
  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const { data: events } = await supabase
    .from('fuel_dispense_events')
    .select('*, vehicle:vehicle_assets(plate, avg_consumption)')
    .eq('establishment_id', establishmentId)
    .gte('dispense_date', since.toISOString().split('T')[0])
    .order('dispense_date', { ascending: false });

  if (!events || events.length === 0) return [];

  const anomalies = [];

  // Group by vehicle and detect over-consumption
  const byVehicle = {};
  for (const e of events) {
    const vId = e.vehicle_id;
    if (!byVehicle[vId]) byVehicle[vId] = [];
    byVehicle[vId].push(e);
  }

  for (const [vehicleId, vEvents] of Object.entries(byVehicle)) {
    const totalQty = vEvents.reduce((s, e) => s + (Number(e.quantity) || 0), 0);
    const avgPerEvent = totalQty / vEvents.length;

    // Flag any single dispense that's >2x average
    for (const e of vEvents) {
      if (Number(e.quantity) > avgPerEvent * 2 && avgPerEvent > 10) {
        anomalies.push({
          type: 'excessive_dispense',
          vehicleId,
          plate: e.vehicle?.plate,
          date: e.dispense_date,
          quantity: Number(e.quantity),
          average: Math.round(avgPerEvent),
          ratio: Math.round(Number(e.quantity) / avgPerEvent * 100) / 100,
        });
      }
    }
  }

  return anomalies;
}
