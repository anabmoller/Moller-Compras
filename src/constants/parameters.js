// ============================================================
// YPOTI — ADMIN PARAMETERS (Modulo 7)
// Reads via anon client (RLS), writes via Edge Functions
// ============================================================

import { supabase, supabaseUrl, supabaseAnonKey, getStoredToken } from "../lib/supabase";

// ---- Edge Function helper (same pattern as queries.js) ----
async function invokeAdminData(body) {
  let token = getStoredToken();

  if (!token) {
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000)),
      ]);
      token = result?.data?.session?.access_token;
    } catch { /* timeout */ }
  }

  if (!token) throw new Error("No hay sesión activa.");

  const res = await fetch(`${supabaseUrl}/functions/v1/admin-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || errBody.message || `Error ${res.status}`);
  }

  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return data;
}

// ---- Module-level cache ----
let _params = {
  establishments: [],
  sectors: [],
  productTypes: [],
  suppliers: [],
  companies: [],
};

// ============================================================
// INIT — Load all reference data from Supabase (anon + RLS)
// ============================================================

export async function initParameters() {
  try {
    const [estab, sectors, types, suppliers, companies] = await Promise.all([
      supabase.from("establishments").select("*").order("name"),
      supabase.from("sectors").select("*").order("name"),
      supabase.from("product_types").select("*").order("name"),
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("companies").select("*").order("name"),
    ]);

    // Company UUID -> name lookup for establishments
    const companyMap = {};
    for (const c of (companies.data || [])) {
      companyMap[c.id] = c.name;
    }

    _params = {
      establishments: (estab.data || []).map(e => ({
        id: e.legacy_id || e.id,
        _uuid: e.id,
        name: e.name,
        code: e.code,
        company: companyMap[e.company_id] || "",
        companyId: e.company_id,
        manager: e.manager,
        location: e.location,
        // New fields
        senacsa_code: e.senacsa_code || "",
        senacsa_unidad_zonal: e.senacsa_unidad_zonal || "",
        departamento: e.departamento || "",
        municipio: e.municipio || "",
        latitude: e.latitude || "",
        longitude: e.longitude || "",
        active: e.active !== false,
      })),
      sectors: (sectors.data || []).map(s => ({
        id: s.legacy_id || s.id,
        _uuid: s.id,
        // Data cleanup: fix known bad names from DB (e.g. "building Feedlot" → "Feedlot")
        name: (s.name || "").replace(/^building\s+/i, ""),
        icon: s.icon,
        description: s.description,
        lider: s.lider || "",
        active: s.active !== false,
      })),
      productTypes: (types.data || []).map(t => ({
        id: t.legacy_id || t.id,
        _uuid: t.id,
        name: t.name,
        icon: t.icon,
        description: t.description,
        active: t.active !== false,
      })),
      suppliers: (suppliers.data || []).map(s => ({
        id: s.legacy_id || s.id,
        _uuid: s.id,
        name: s.name,
        ruc: s.ruc,
        phone: s.phone,
        email: s.email,
        category: s.category,
        active: s.active !== false,
      })),
      companies: (companies.data || []).map(c => ({
        id: c.legacy_id || c.id,
        _uuid: c.id,
        name: c.name,
        ruc: c.ruc,
        type: c.type,
        director: c.director,
        // New fields
        presidente: c.presidente || "",
        contacto_nombre: c.contacto_nombre || "",
        contacto_email: c.contacto_email || "",
        contacto_celular: c.contacto_celular || "",
        direccion: c.direccion || "",
        sucursales: c.sucursales || "",
        observaciones: c.observaciones || "",
        active: c.active !== false,
      })),
    };

  } catch (err) {
    console.error("[Params] Init failed:", err);
  }
}

// ============================================================
// SYNCHRONOUS GETTERS (return from cache)
// ============================================================

export function getParameters() { return _params; }
export function getEstablishments() { return _params.establishments.filter(e => e.active); }
export function getSectors() { return _params.sectors.filter(s => s.active); }
export function getProductTypes() { return _params.productTypes.filter(p => p.active); }
export function getSuppliers() { return _params.suppliers.filter(s => s.active); }
export function getCompanies() { return _params.companies; }

// ============================================================
// ASYNC CRUD — Write via Edge Functions
// ============================================================

export async function addParameterItem(category, item) {
  const data = await invokeAdminData({ action: "add-parameter", category, item });
  await initParameters(); // refresh cache
  return data?.data;
}

export async function updateParameterItem(category, id, updates) {
  const item = (_params[category] || []).find(i => i.id === id);
  const uuid = item?._uuid || id;
  await invokeAdminData({ action: "update-parameter", category, id: uuid, updates });
  await initParameters(); // refresh cache
}

export async function toggleParameterItem(category, id) {
  const item = (_params[category] || []).find(i => i.id === id);
  if (!item) return;
  const uuid = item._uuid || id;
  await invokeAdminData({ action: "toggle-parameter", category, id: uuid });
  await initParameters(); // refresh cache
}

export async function resetParametersToDefault() {
  await initParameters();
  return _params;
}
