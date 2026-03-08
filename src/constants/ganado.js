// ============================================================
// YPOTI — MODULO DE GANADO (Data Layer)
// Reads via anon client (RLS), writes via Edge Functions
// Multi-category model: each movimiento has N category detail rows
// ============================================================

import { supabase } from "../lib/supabase";
import { invokeEdgeFunction } from "../lib/queries";

// ---- Status flow ----
export const GANADO_STATUS_FLOW = [
  { key: "borrador",               label: "Borrador",       color: "#64748b", icon: "✎" },
  { key: "pendiente_validacion",    label: "Pend. Validación", color: "#f59e0b", icon: "◷" },
  { key: "validado",               label: "Validado",       color: "#3b82f6", icon: "✓" },
  { key: "en_transito",            label: "En Tránsito",    color: "#8b5cf6", icon: "⇢" },
  { key: "recibido",               label: "Recibido",       color: "#10b981", icon: "↓" },
  { key: "cerrado",                label: "Cerrado",        color: "#1e293b", icon: "▣" },
];

export const GANADO_EXTRA_STATUSES = [
  { key: "anulado", label: "Anulado", color: "#ef4444", icon: "✗" },
];

export const FINALIDAD_OPTIONS = [
  { value: "faena",            label: "Faena" },
  { value: "cria",             label: "Cría" },
  { value: "engorde",          label: "Engorde" },
  { value: "remate",           label: "Remate" },
  { value: "exposicion",       label: "Exposición" },
  { value: "transito",         label: "Tránsito" },
  { value: "cambio_titular",   label: "Cambio de Titular" },
  { value: "otro",             label: "Otro" },
];

export const TIPO_OPERACION_OPTIONS = [
  { value: "compra",                  label: "Compra" },
  { value: "venta",                   label: "Venta" },
  { value: "transferencia_interna",   label: "Transferencia Interna" },
  { value: "consignacion",            label: "Consignación" },
];

// ---- Module-level cache ----
let _categorias = [];
let _ganaderos = [];
let _frigorificos = [];

// ============================================================
// INIT — Load reference data from Supabase (anon + RLS)
// ============================================================

export async function initGanado() {
  try {
    const [catRes, ganRes, frigRes] = await Promise.all([
      supabase.from("categorias_animales").select("*").eq("active", true).order("codigo"),
      supabase.from("suppliers").select("*").eq("is_ganadero", true).order("name"),
      supabase.from("companies").select("*").eq("is_frigorifico", true).order("name"),
    ]);

    _categorias = (catRes.data || []).map(c => ({
      id: c.id,
      codigo: c.codigo,
      nombre: c.nombre,
      descripcion: c.descripcion,
      sexo: c.sexo,
      edadMinMeses: c.edad_min_meses,
      edadMaxMeses: c.edad_max_meses,
    }));

    _ganaderos = (ganRes.data || []).map(s => ({
      id: s.id,
      name: s.name,
      ruc: s.ruc,
      senascaCode: s.senacsa_code_proveedor,
      phone: s.phone,
      email: s.email,
    }));

    _frigorificos = (frigRes.data || []).map(c => ({
      id: c.id,
      name: c.name,
      ruc: c.ruc,
      senascaCode: c.senacsa_code_empresa,
    }));
  } catch (err) {
    console.error("[Ganado] Init failed:", err);
  }
}

// ============================================================
// SYNCHRONOUS GETTERS
// ============================================================

export function getCategorias() { return _categorias; }
export function getGanaderos() { return _ganaderos; }
export function getFrigorificos() { return _frigorificos; }

// ============================================================
// FETCH OPERATIONS (anon client + RLS)
// ============================================================

function transformPesaje(row) {
  return {
    id: row.id,
    movimientoId: row.movimiento_id,
    detalleCategoriaId: row.detalle_categoria_id,
    fechaPesaje: row.fecha_pesaje,
    horaPesaje: row.hora_pesaje,
    cantidadPesada: row.cantidad_pesada,
    pesoBrutoKg: Number(row.peso_bruto_kg) || 0,
    pesoTaraKg: Number(row.peso_tara_kg) || 0,
    pesoNetoKg: Number(row.peso_neto_kg) || 0,
    pesoPromedioKg: Number(row.peso_promedio_kg) || 0,
    nroTropa: row.nro_tropa,
    nroLote: row.nro_lote,
    categoriaId: row.categoria_id,
    tipoPesaje: row.tipo_pesaje,
    cantidadEsperada: row.cantidad_esperada,
    pesoEsperadoKg: Number(row.peso_esperado_kg) || 0,
    diferenciaCantidad: row.diferencia_cantidad,
    diferenciaPesoKg: Number(row.diferencia_peso_kg) || 0,
    balanzaId: row.balanza_id,
    balanzaNombre: row.balanza_nombre,
    ticketNro: row.ticket_nro,
    conforme: row.conforme,
    observaciones: row.observaciones,
    pesadoPor: row.pesado_por_nombre,
    verificadoPor: row.verificado_por_nombre,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformMovimiento(row, categorias = [], divergencias = [], archivos = [], statusLog = [], pesajes = []) {
  return {
    id: row.movimiento_number,
    _uuid: row.id,
    tipoOperacion: row.tipo_operacion,
    finalidad: row.finalidad,
    establecimientoOrigenId: row.establecimiento_origen_id,
    empresaDestinoId: row.empresa_destino_id,
    establecimientoDestinoId: row.establecimiento_destino_id,
    destinoNombre: row.destino_nombre,
    // Multi-category aggregated totals
    cantidadTotal: row.cantidad_total || 0,
    pesoTotalKg: Number(row.peso_total_kg) || 0,
    // Category detail rows
    categorias: categorias.map(d => ({
      id: d.id,
      categoriaId: d.categoria_id,
      cantidad: d.cantidad,
      pesoKg: Number(d.peso_kg) || 0,
      pesoPromedioKg: Number(d.peso_promedio_kg) || 0,
      precioPorKg: Number(d.precio_por_kg) || 0,
      precioSubtotal: Number(d.precio_subtotal) || 0,
      observaciones: d.observaciones,
    })),
    nroGuia: row.nro_guia,
    nroCota: row.nro_cota,
    fechaEmision: row.fecha_emision,
    precioPorKg: Number(row.precio_por_kg) || 0,
    precioTotal: Number(row.precio_total) || 0,
    moneda: row.moneda,
    estado: row.estado,
    marcaVerificada: row.marca_verificada,
    senascaVerificado: row.senacsa_verificado,
    guiaConforme: row.guia_conforme,
    observaciones: row.observaciones,
    createdBy: row.created_by_name || "",
    createdById: row.created_by,
    validatedBy: row.validated_by_name || "",
    validatedAt: row.validated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    divergencias: divergencias.map(d => ({
      id: d.id,
      tipo: d.tipo,
      descripcion: d.descripcion,
      cantidadDiferencia: d.cantidad_diferencia,
      pesoDiferenciaKg: Number(d.peso_diferencia_kg) || 0,
      resolucion: d.resolucion,
      resuelto: d.resuelto,
      reportadoPor: d.reportado_por_nombre,
      createdAt: d.created_at,
    })),
    archivos: archivos.map(a => ({
      id: a.id,
      tipo: a.tipo,
      nombre: a.nombre,
      storagePath: a.storage_path,
      mimeType: a.mime_type,
      sizeBytes: a.size_bytes,
      uploadedBy: a.uploaded_by_name,
      createdAt: a.created_at,
    })),
    statusLog: statusLog.map(l => ({
      id: l.id,
      estadoAnterior: l.estado_anterior,
      estadoNuevo: l.estado_nuevo,
      comentario: l.comentario,
      changedBy: l.changed_by_name,
      createdAt: l.created_at,
    })),
    pesajes: pesajes.map(transformPesaje),
  };
}

function groupBy(arr, key) {
  const map = {};
  for (const item of arr) {
    const id = item[key];
    if (!map[id]) map[id] = [];
    map[id].push(item);
  }
  return map;
}

export async function fetchMovimientos({ establishmentIds } = {}) {
  let movQuery = supabase.from("movimientos_ganado").select("*").order("created_at", { ascending: false }).limit(500);

  // Scope filter: only movimientos where origen OR destino is within the user's allowed establishments
  if (Array.isArray(establishmentIds) && establishmentIds.length > 0) {
    movQuery = movQuery.or(
      `establecimiento_origen_id.in.(${establishmentIds.join(",")}),establecimiento_destino_id.in.(${establishmentIds.join(",")})`,
    );
  }

  const [movRes, catRes, divRes, archRes] = await Promise.all([
    movQuery,
    supabase.from("detalle_movimiento_categorias").select("*").limit(2000),
    supabase.from("movimiento_divergencias").select("*").limit(500),
    supabase.from("movimiento_archivos").select("*").limit(500),
  ]);

  if (movRes.error) {
    console.error("[Ganado] Failed to fetch movimientos:", movRes.error.message);
    return [];
  }

  const movimientos = movRes.data || [];
  const categorias = catRes.data || [];
  const divergencias = divRes.data || [];
  const archivos = archRes.data || [];

  const catByMov = groupBy(categorias, "movimiento_id");
  const divByMov = groupBy(divergencias, "movimiento_id");
  const archByMov = groupBy(archivos, "movimiento_id");

  return movimientos.map(m => transformMovimiento(
    m,
    catByMov[m.id] || [],
    divByMov[m.id] || [],
    archByMov[m.id] || [],
    [], // status log not needed in list view
  ));
}

export async function fetchSingleMovimiento(uuid) {
  const [movRes, catRes, divRes, archRes, logRes, pesRes] = await Promise.all([
    supabase.from("movimientos_ganado").select("*").eq("id", uuid).single(),
    supabase.from("detalle_movimiento_categorias").select("*").eq("movimiento_id", uuid),
    supabase.from("movimiento_divergencias").select("*").eq("movimiento_id", uuid),
    supabase.from("movimiento_archivos").select("*").eq("movimiento_id", uuid),
    supabase.from("movimiento_estados_log").select("*").eq("movimiento_id", uuid).order("created_at", { ascending: true }),
    supabase.from("pesajes_ganado").select("*").eq("movimiento_id", uuid).order("created_at", { ascending: true }),
  ]);

  if (movRes.error) {
    console.error("[Ganado] Failed to fetch movimiento:", movRes.error.message);
    return null;
  }

  return transformMovimiento(
    movRes.data,
    catRes.data || [],
    divRes.data || [],
    archRes.data || [],
    logRes.data || [],
    pesRes.data || [],
  );
}

// ============================================================
// WRITE OPERATIONS — Via Edge Functions
// ============================================================

export async function insertMovimiento(movimiento) {
  const data = await invokeEdgeFunction("ganado-mutations", {
    action: "create", movimiento,
  });
  return data.movimientoUuid;
}

export async function updateMovimiento(movimientoUuid, updates) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "update", movimientoUuid, updates,
  });
}

export async function addCategories(movimientoUuid, categorias) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "add-categories", movimientoUuid, categorias,
  });
}

export async function updateCategory(detalleId, updates) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "update-category", detalleId, updates,
  });
}

export async function removeCategory(detalleId) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "remove-category", detalleId,
  });
}

export async function validateMovimiento(movimientoUuid) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "validate", movimientoUuid,
  });
}

export async function advanceGanadoStatus(movimientoUuid, newStatus, comentario) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "advance-status", movimientoUuid, newStatus, comentario,
  });
}

export async function addDivergencia(movimientoUuid, divergencia) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "add-divergence", movimientoUuid, divergencia,
  });
}

export async function resolveDivergencia(divergenciaId, resolucion) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "resolve-divergence", divergenciaId, resolucion,
  });
}

export async function addArchivo(movimientoUuid, archivo) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "add-attachment", movimientoUuid, archivo,
  });
}

export async function anularMovimiento(movimientoUuid, reason) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "anular", movimientoUuid, reason,
  });
}

// ============================================================
// PESAJES — Via Edge Functions
// ============================================================

export async function addPesaje(movimientoUuid, pesaje) {
  const data = await invokeEdgeFunction("ganado-mutations", {
    action: "add-pesaje", movimientoUuid, pesaje,
  });
  return data.pesajeId;
}

export async function updatePesaje(pesajeId, updates) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "update-pesaje", pesajeId, updates,
  });
}

export async function deletePesaje(pesajeId) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "delete-pesaje", pesajeId,
  });
}

// ============================================================
// FETCH PESAJES LIST (for reports)
// ============================================================

export async function fetchPesajesByMovimiento(movimientoUuid) {
  const { data, error } = await supabase
    .from("pesajes_ganado")
    .select("*")
    .eq("movimiento_id", movimientoUuid)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Ganado] Failed to fetch pesajes:", error.message);
    return [];
  }
  return (data || []).map(transformPesaje);
}

// ============================================================
// HATO (HERD INVENTORY) — Derive from movements
// ============================================================

/**
 * Fetch all non-anulado movements with category details for herd derivation.
 * Lightweight query (no divergencias/archivos) for the Hato view.
 */
export async function fetchHatoData({ establishmentId = null } = {}) {
  let movQuery = supabase
    .from("movimientos_ganado")
    .select("id, movimiento_number, tipo_operacion, estado, cantidad_total, peso_total_kg, establecimiento_origen_id, establecimiento_destino_id, destino_nombre, fecha_emision, nro_guia, nro_cota, finalidad, precio_por_kg, precio_total, moneda, observaciones, created_by_name, created_at, updated_at")
    .neq("estado", "anulado")
    .order("fecha_emision", { ascending: false })
    .limit(5000);

  if (establishmentId) {
    movQuery = movQuery.or(
      `establecimiento_origen_id.eq.${establishmentId},establecimiento_destino_id.eq.${establishmentId}`
    );
  }

  const [movRes, detRes] = await Promise.all([
    movQuery,
    supabase
      .from("detalle_movimiento_categorias")
      .select("id, movimiento_id, categoria_id, cantidad, peso_kg, peso_promedio_kg")
      .limit(10000),
  ]);

  if (movRes.error) throw movRes.error;

  const movements = movRes.data || [];
  const details = detRes.data || [];

  // Group details by movement
  const movIds = new Set(movements.map(m => m.id));
  const detByMov = {};
  for (const d of details) {
    if (!movIds.has(d.movimiento_id)) continue;
    if (!detByMov[d.movimiento_id]) detByMov[d.movimiento_id] = [];
    detByMov[d.movimiento_id].push(d);
  }

  // Transform to JS objects
  const result = movements.map(m => ({
    _uuid: m.id,
    id: m.movimiento_number,
    tipoOperacion: m.tipo_operacion,
    estado: m.estado,
    cantidadTotal: m.cantidad_total || 0,
    pesoTotalKg: Number(m.peso_total_kg) || 0,
    establecimientoOrigenId: m.establecimiento_origen_id,
    establecimientoDestinoId: m.establecimiento_destino_id,
    destinoNombre: m.destino_nombre,
    fechaEmision: m.fecha_emision,
    nroGuia: m.nro_guia,
    nroCota: m.nro_cota,
    finalidad: m.finalidad,
    precioPorKg: Number(m.precio_por_kg) || 0,
    precioTotal: Number(m.precio_total) || 0,
    moneda: m.moneda,
    observaciones: m.observaciones,
    createdBy: m.created_by_name || "",
    createdAt: m.created_at,
    updatedAt: m.updated_at,
    categorias: (detByMov[m.id] || []).map(d => ({
      id: d.id,
      categoriaId: d.categoria_id,
      cantidad: d.cantidad,
      pesoKg: Number(d.peso_kg) || 0,
      pesoPromedioKg: Number(d.peso_promedio_kg) || 0,
    })),
  }));

  return result;
}

// ============================================================
// ETL ANALYTICS — Read from normalized pipeline tables
// ============================================================

/** Total cattle by establishment (from ETL data) */
export async function fetchGanadoPorEstablecimiento() {
  const { data, error } = await supabase
    .from("vw_ganado_por_establecimiento")
    .select("*")
    .order("total_animales_comprados", { ascending: false });
  if (error) {
    console.error("[Ganado ETL] fetchGanadoPorEstablecimiento:", error.message);
    return [];
  }
  return data || [];
}

/** Purchases by provider (from ETL data) */
export async function fetchComprasPorProveedor() {
  const { data, error } = await supabase
    .from("vw_compras_por_proveedor")
    .select("*")
    .order("total_animales", { ascending: false });
  if (error) {
    console.error("[Ganado ETL] fetchComprasPorProveedor:", error.message);
    return [];
  }
  return data || [];
}

/** Average weight per category (from ETL data) */
export async function fetchPesoPorCategoria() {
  const { data, error } = await supabase
    .from("vw_peso_por_categoria")
    .select("*");
  if (error) {
    console.error("[Ganado ETL] fetchPesoPorCategoria:", error.message);
    return [];
  }
  return data || [];
}

/** Movement distribution by destination (from ETL data) */
export async function fetchMovimientosPorDestino() {
  const { data, error } = await supabase
    .from("vw_movimientos_por_destino")
    .select("*");
  if (error) {
    console.error("[Ganado ETL] fetchMovimientosPorDestino:", error.message);
    return [];
  }
  return data || [];
}

/** Yearly purchase trends (from ETL data) */
export async function fetchTendenciaAnual() {
  const { data, error } = await supabase
    .from("vw_tendencia_compras_anual")
    .select("*");
  if (error) {
    console.error("[Ganado ETL] fetchTendenciaAnual:", error.message);
    return [];
  }
  return data || [];
}

/** Full traceability view (from ETL data) */
export async function fetchTrazabilidad({ limit = 100, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from("vw_trazabilidad_completa")
    .select("*")
    .range(offset, offset + limit - 1)
    .order("fecha_emision", { ascending: false });
  if (error) {
    console.error("[Ganado ETL] fetchTrazabilidad:", error.message);
    return [];
  }
  return data || [];
}

// ============================================================
// GANADO METRICS — Server-side KPI aggregation via RPC
// ============================================================
let _metricsCache = { data: null, ts: 0, key: "" };
const METRICS_CACHE_TTL = 30_000; // 30s

export async function fetchGanadoMetrics({ fechaDesde = null, fechaHasta = null, establecimientoId = null } = {}) {
  const cacheKey = `${fechaDesde}|${fechaHasta}|${establecimientoId}`;
  const now = Date.now();
  if (_metricsCache.data && _metricsCache.key === cacheKey && (now - _metricsCache.ts) < METRICS_CACHE_TTL) {
    return _metricsCache.data;
  }

  const params = {};
  if (fechaDesde) params.p_fecha_desde = fechaDesde;
  if (fechaHasta) params.p_fecha_hasta = fechaHasta;
  if (establecimientoId) params.p_establecimiento_id = establecimientoId;

  const { data, error } = await supabase.rpc("get_ganado_metrics", params);
  if (error) {
    console.error("[Ganado] fetchGanadoMetrics:", error.message);
    return null;
  }

  if (import.meta.env.DEV) {
    console.log("[Ganado] metrics:", data);
  }

  _metricsCache = { data, ts: now, key: cacheKey };
  return data;
}

/** Invalidate metrics cache (call after mutations) */
export function invalidateGanadoMetrics() {
  _metricsCache = { data: null, ts: 0, key: "" };
}

/** Raw ETL fazendas with coordinates (for map).
 *  By default, only returns fazendas in the active provider network.
 *  Pass showAll=true for exploration mode (all providers).
 */
export async function fetchETLFazendas({ showAll = false } = {}) {
  const { data, error } = await supabase
    .from("etl_fazendas")
    .select("id, nome, tipo, latitude, longitude, departamento, distrito")
    .not("latitude", "is", null)
    .order("nome");
  if (error) {
    console.error("[Ganado ETL] fetchETLFazendas:", error.message);
    return [];
  }
  if (showAll) return data || [];
  // Import lazily to avoid circular deps
  const { filterActiveNetwork } = await import("./establecimientos");
  return filterActiveNetwork(data || [], { showAll, nameField: "nome" });
}
