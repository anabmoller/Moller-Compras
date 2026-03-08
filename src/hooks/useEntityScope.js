// ============================================================
// useEntityScope — Centralized entity visibility hook
//
// Provides scoped access to establishments, fiscal entities,
// and related selectors based on the logged-in user's
// allowed entity scope (from user_establishments and
// user_fiscal_entities junction tables).
//
// Usage:
//   const { scopedEstablishments, scopedFiscalEntities, ... } = useEntityScope();
//
// Rules:
//   - Operational screens use scoped data (forms, dashboards, filters)
//   - Admin screens use global data (ParametersScreen, UserManagement)
//   - Frigoríficos & ganaderos are NOT user-scoped (external entities)
//   - If user has no scope → hasScope = false, empty lists
// ============================================================

import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getEstablishments, getCompanies } from "../constants/parameters";
import { getFrigorificos, getGanaderos } from "../constants/ganado";

/**
 * Load fiscal entities from Supabase cache.
 * Since parameters.js doesn't cache fiscal_entities, we add a
 * lightweight in-memory loader here. Falls back to empty array.
 */
let _fiscalEntitiesCache = [];
let _fiscalEntitiesFetched = false;

export async function initFiscalEntities() {
  if (_fiscalEntitiesFetched) return;
  try {
    const { supabase } = await import("../lib/supabase");
    const { data } = await supabase
      .from("fiscal_entities")
      .select("*")
      .eq("active", true)
      .order("legal_name");
    _fiscalEntitiesCache = (data || []).map(fe => ({
      id: fe.id,
      legalName: fe.legal_name,
      ruc: fe.ruc,
      billingAddress: fe.billing_address_reference,
      phone: fe.phone,
      cellPhone: fe.cell_phone,
      invoiceEmail: fe.invoice_email,
      active: fe.active,
    }));
    _fiscalEntitiesFetched = true;
  } catch (err) {
    console.error("[EntityScope] Failed to load fiscal entities:", err);
  }
}

export function getFiscalEntities() {
  return _fiscalEntitiesCache;
}

/**
 * Core hook: returns user-scoped entity lists.
 *
 * @returns {Object} Scoped entity data
 */
export function useEntityScope() {
  const { currentUser } = useAuth();

  const allowedEstablishmentIds = currentUser?.allowedEstablishmentIds || [];
  const allowedFiscalEntityIds = currentUser?.allowedFiscalEntityIds || [];
  const scopeLoaded = currentUser?.scopeLoaded ?? false;

  // ---- Scoped establishments (only user's allowed) ----
  const scopedEstablishments = useMemo(() => {
    if (!scopeLoaded || allowedEstablishmentIds.length === 0) return [];
    const all = getEstablishments(); // filtered by active
    return all.filter(e => allowedEstablishmentIds.includes(e._uuid));
  }, [allowedEstablishmentIds, scopeLoaded]);

  // ---- Scoped fiscal entities (only user's allowed) ----
  const scopedFiscalEntities = useMemo(() => {
    if (!scopeLoaded || allowedFiscalEntityIds.length === 0) return [];
    const all = getFiscalEntities();
    return all.filter(fe => allowedFiscalEntityIds.includes(fe.id));
  }, [allowedFiscalEntityIds, scopeLoaded]);

  // ---- Frigoríficos: global (external entities, not user-scoped) ----
  const scopedFrigorificos = useMemo(() => getFrigorificos(), []);

  // ---- Ganaderos: global (external entities, not user-scoped) ----
  const scopedGanaderos = useMemo(() => getGanaderos(), []);

  // ---- Companies: global ----
  const scopedCompanies = useMemo(() => getCompanies(), []);

  // ---- Default selections ----
  const defaultEstablishment = useMemo(() => {
    if (!currentUser?.defaultEstablishmentId) return null;
    return scopedEstablishments.find(e => e._uuid === currentUser.defaultEstablishmentId) || null;
  }, [currentUser?.defaultEstablishmentId, scopedEstablishments]);

  const defaultFiscalEntity = useMemo(() => {
    if (!currentUser?.defaultFiscalEntityId) return null;
    return scopedFiscalEntities.find(fe => fe.id === currentUser.defaultFiscalEntityId) || null;
  }, [currentUser?.defaultFiscalEntityId, scopedFiscalEntities]);

  // ---- Scope check helper ----
  const isEstablishmentInScope = useMemo(() => {
    const idSet = new Set(allowedEstablishmentIds);
    return (entityId) => idSet.has(entityId);
  }, [allowedEstablishmentIds]);

  const isFiscalEntityInScope = useMemo(() => {
    const idSet = new Set(allowedFiscalEntityIds);
    return (entityId) => idSet.has(entityId);
  }, [allowedFiscalEntityIds]);

  return {
    // Scoped lists
    scopedEstablishments,
    scopedFiscalEntities,
    scopedFrigorificos,
    scopedGanaderos,
    scopedCompanies,

    // Defaults
    defaultEstablishment,
    defaultFiscalEntity,

    // Scope check helpers
    isEstablishmentInScope,
    isFiscalEntityInScope,

    // State
    hasScope: scopeLoaded && (allowedEstablishmentIds.length > 0 || allowedFiscalEntityIds.length > 0),
    scopeLoaded,

    // Raw IDs (for queries)
    allowedEstablishmentIds,
    allowedFiscalEntityIds,
  };
}

export default useEntityScope;
