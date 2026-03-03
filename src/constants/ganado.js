// ============================================================
// YPOTI — MODULO DE GANADO (Data Layer)
// Reads via anon client (RLS), writes via Edge Functions
// ============================================================

import { supabase } from "../lib/supabase";
import { invokeEdgeFunction } from "../lib/queries";

// ---- Status flow ----
export const GANADO_STATUS_FLOW = [
  { key: "borrador",               label: "Borrador",       color: "#64748b", icon: "📝" },
  { key: "pendiente_validacion",    label: "Pend. Validación", color: "#f59e0b", icon: "⏳" },
  { key: "validado",               label: "Validado",       color: "#3b82f6", icon: "✅" },
  { key: "en_transito",            label: "En Tránsito",    color: "#8b5cf6", icon: "🚚" },
  { key: "recibido",               label: "Recibido",       color: "#10b981", icon: "📥" },
  { key: "cerrado",                label: "Cerrado",        color: "#1e293b", icon: "🔒" },
];

export const GANADO_EXTRA_STATUSES = [
  { key: "anulado", label: "Anulado", color: "#ef4444", icon: "❌" },
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

function transformMovimiento(row, divergencias = [], archivos = []) {
  return {
    id: row.movimiento_number,
    _uuid: row.id,
    tipoOperacion: row.tipo_operacion,
    finalidad: row.finalidad,
    establecimientoOrigenId: row.establecimiento_origen_id,
    empresaDestinoId: row.empresa_destino_id,
    establecimientoDestinoId: row.establecimiento_destino_id,
    destinoNombre: row.destino_nombre,
    categoriaId: row.categoria_id,
    cantidad: row.cantidad,
    pesoTotalKg: Number(row.peso_total_kg) || 0,
    pesoPromedioKg: Number(row.peso_promedio_kg) || 0,
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

export async function fetchMovimientos() {
  const [movRes, divRes, archRes] = await Promise.all([
    supabase.from("movimientos_ganado").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("movimiento_divergencias").select("*").limit(500),
    supabase.from("movimiento_archivos").select("*").limit(500),
  ]);

  if (movRes.error) {
    console.error("[Ganado] Failed to fetch movimientos:", movRes.error.message);
    return [];
  }

  const movimientos = movRes.data || [];
  const divergencias = divRes.data || [];
  const archivos = archRes.data || [];

  const divByMov = groupBy(divergencias, "movimiento_id");
  const archByMov = groupBy(archivos, "movimiento_id");

  return movimientos.map(m => transformMovimiento(
    m,
    divByMov[m.id] || [],
    archByMov[m.id] || [],
  ));
}

export async function fetchSingleMovimiento(uuid) {
  const [movRes, divRes, archRes] = await Promise.all([
    supabase.from("movimientos_ganado").select("*").eq("id", uuid).single(),
    supabase.from("movimiento_divergencias").select("*").eq("movimiento_id", uuid),
    supabase.from("movimiento_archivos").select("*").eq("movimiento_id", uuid),
  ]);

  if (movRes.error) {
    console.error("[Ganado] Failed to fetch movimiento:", movRes.error.message);
    return null;
  }

  return transformMovimiento(
    movRes.data,
    divRes.data || [],
    archRes.data || [],
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

export async function validateMovimiento(movimientoUuid) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "validate", movimientoUuid,
  });
}

export async function advanceGanadoStatus(movimientoUuid, newStatus) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "advance-status", movimientoUuid, newStatus,
  });
}

export async function addDivergencia(movimientoUuid, divergencia) {
  await invokeEdgeFunction("ganado-mutations", {
    action: "add-divergence", movimientoUuid, divergencia,
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
