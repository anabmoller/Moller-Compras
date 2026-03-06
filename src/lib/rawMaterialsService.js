/**
 * SIGAM Raw Materials (Materia Prima) Service
 * Contracts, deliveries, inventory, reference prices.
 */
import { supabase } from './supabase';

// ============================================================
// COMMODITY CATALOG
// ============================================================

export async function getCommodityCatalog() {
  const { data, error } = await supabase
    .from('commodity_catalog')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

// ============================================================
// CONTRACTS
// ============================================================

export async function getContracts(filters = {}) {
  let query = supabase
    .from('raw_material_contracts')
    .select(`
      *,
      commodity:commodity_catalog(id, name, category, unit),
      supplier:suppliers(id, name)
    `)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
  if (filters.commodityId) query = query.eq('commodity_id', filters.commodityId);
  if (filters.establishmentId) query = query.eq('establishment_id', filters.establishmentId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getContract(contractId) {
  const { data, error } = await supabase
    .from('raw_material_contracts')
    .select(`
      *,
      commodity:commodity_catalog(id, name, category, unit),
      supplier:suppliers(id, name)
    `)
    .eq('id', contractId)
    .single();

  if (error) throw error;
  return data;
}

export async function createContract(contract) {
  const { data, error } = await supabase
    .from('raw_material_contracts')
    .insert(contract)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContract(contractId, updates) {
  const { data, error } = await supabase
    .from('raw_material_contracts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', contractId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// DELIVERIES
// ============================================================

export async function getDeliveries(filters = {}) {
  let query = supabase
    .from('raw_material_deliveries')
    .select(`
      *,
      commodity:commodity_catalog(id, name, category, unit),
      supplier:suppliers(id, name),
      contract:raw_material_contracts(id, contract_number)
    `)
    .order('delivery_date', { ascending: false });

  if (filters.contractId) query = query.eq('contract_id', filters.contractId);
  if (filters.commodityId) query = query.eq('commodity_id', filters.commodityId);
  if (filters.establishmentId) query = query.eq('establishment_id', filters.establishmentId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.dateFrom) query = query.gte('delivery_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('delivery_date', filters.dateTo);

  const { data, error } = await query.limit(filters.limit || 100);
  if (error) throw error;
  return data || [];
}

export async function createDelivery(delivery) {
  const { data, error } = await supabase
    .from('raw_material_deliveries')
    .insert(delivery)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function verifyDelivery(deliveryId, verifiedBy) {
  const { data, error } = await supabase
    .from('raw_material_deliveries')
    .update({
      status: 'verified',
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliveryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// INVENTORY
// ============================================================

export async function getInventoryBalances(establishmentId = null) {
  let query = supabase
    .from('inventory_balances')
    .select(`
      *,
      commodity:commodity_catalog(id, name, category, unit)
    `)
    .order('days_of_coverage', { ascending: true });

  if (establishmentId) query = query.eq('establishment_id', establishmentId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getInventoryTransactions(commodityId, establishmentId, limit = 50) {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('commodity_id', commodityId)
    .eq('establishment_id', establishmentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createInventoryAdjustment(commodityId, establishmentId, quantity, notes, createdBy) {
  // Get current balance
  const { data: balance } = await supabase
    .from('inventory_balances')
    .select('current_balance')
    .eq('commodity_id', commodityId)
    .eq('establishment_id', establishmentId)
    .single();

  const newBalance = (balance?.current_balance || 0) + quantity;

  // Upsert balance
  await supabase
    .from('inventory_balances')
    .upsert({
      commodity_id: commodityId,
      establishment_id: establishmentId,
      current_balance: newBalance,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'commodity_id,establishment_id' });

  // Record transaction
  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert({
      commodity_id: commodityId,
      establishment_id: establishmentId,
      transaction_type: quantity >= 0 ? 'adjustment' : 'loss',
      quantity,
      reference_type: 'manual',
      balance_after: newBalance,
      notes,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// REFERENCE PRICES
// ============================================================

export async function getReferencePrices(commodityId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('commodity_ref_prices')
    .select('*')
    .eq('commodity_id', commodityId)
    .gte('price_date', since.toISOString().split('T')[0])
    .order('price_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addReferencePrice(commodityId, priceDate, price, currency = 'USD', source = 'manual') {
  const { data, error } = await supabase
    .from('commodity_ref_prices')
    .upsert({
      commodity_id: commodityId,
      price_date: priceDate,
      price,
      currency,
      source,
    }, { onConflict: 'commodity_id,price_date,source' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// DASHBOARD KPIS
// ============================================================

export async function getRawMaterialsKPIs(establishmentId = null) {
  // Active contracts count
  let contractsQuery = supabase
    .from('raw_material_contracts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');
  if (establishmentId) contractsQuery = contractsQuery.eq('establishment_id', establishmentId);
  const { count: activeContracts } = await contractsQuery;

  // Recent deliveries (this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  let deliveriesQuery = supabase
    .from('raw_material_deliveries')
    .select('received_quantity, total_cost')
    .gte('delivery_date', startOfMonth.toISOString().split('T')[0]);
  if (establishmentId) deliveriesQuery = deliveriesQuery.eq('establishment_id', establishmentId);
  const { data: deliveries } = await deliveriesQuery;

  const totalTonnage = (deliveries || []).reduce((sum, d) => sum + (Number(d.received_quantity) || 0), 0);
  const totalSpend = (deliveries || []).reduce((sum, d) => sum + (Number(d.total_cost) || 0), 0);

  // Low stock alerts
  let balancesQuery = supabase
    .from('inventory_balances')
    .select('id', { count: 'exact', head: true })
    .lt('days_of_coverage', 7)
    .gt('min_stock_level', 0);
  if (establishmentId) balancesQuery = balancesQuery.eq('establishment_id', establishmentId);
  const { count: lowStockCount } = await balancesQuery;

  return {
    activeContracts: activeContracts || 0,
    totalTonnage: Math.round(totalTonnage * 100) / 100,
    totalSpend: Math.round(totalSpend),
    lowStockAlerts: lowStockCount || 0,
  };
}
