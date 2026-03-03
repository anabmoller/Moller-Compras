// ============================================================
// YPOTI — Edge Function: ganado-mutations
// Actions: create, update, validate, advance-status,
//          add-divergence, add-attachment, anular
// ============================================================

import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient, getCallerProfile, hasPermission } from "../_shared/auth.ts";
import {
  sanitizeName,
  sanitizeText,
  sanitizeMultiline,
  sanitizeNumber,
} from "../_shared/sanitize.ts";

const GANADO_STATUS_FLOW = [
  "borrador",
  "pendiente_validacion",
  "validado",
  "en_transito",
  "recibido",
  "cerrado",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const caller = await getCallerProfile(req, supabaseAdmin);
    const { action, ...payload } = await req.json();

    switch (action) {
      // ─────────────────────────────────────────────────
      // CREATE MOVIMIENTO (estado: borrador)
      // ─────────────────────────────────────────────────
      case "create": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission to create cattle movements");
        }

        const m = payload.movimiento;
        if (!m) throw new Error("movimiento object is required");

        const { data, error } = await supabaseAdmin
          .from("movimientos_ganado")
          .insert({
            tipo_operacion: m.tipoOperacion,
            finalidad: m.finalidad,
            establecimiento_origen_id: m.establecimientoOrigenId || null,
            empresa_destino_id: m.empresaDestinoId || null,
            establecimiento_destino_id: m.establecimientoDestinoId || null,
            destino_nombre: sanitizeName(m.destinoNombre),
            categoria_id: m.categoriaId,
            cantidad: sanitizeNumber(m.cantidad, { min: 1 }),
            peso_total_kg: m.pesoTotalKg ? sanitizeNumber(m.pesoTotalKg, { min: 0 }) : null,
            nro_guia: sanitizeText(m.nroGuia, 100),
            nro_cota: sanitizeText(m.nroCota, 100),
            fecha_emision: m.fechaEmision || new Date().toISOString().slice(0, 10),
            precio_por_kg: m.precioPorKg ? sanitizeNumber(m.precioPorKg, { min: 0 }) : null,
            precio_total: m.precioTotal ? sanitizeNumber(m.precioTotal, { min: 0 }) : null,
            moneda: ["PYG", "USD", "BRL"].includes(m.moneda) ? m.moneda : "PYG",
            observaciones: sanitizeMultiline(m.observaciones, 2000),
            estado: "borrador",
            created_by: caller.id,
            created_by_name: caller.name,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ ok: true, movimientoUuid: data.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // ─────────────────────────────────────────────────
      // UPDATE MOVIMIENTO
      // ─────────────────────────────────────────────────
      case "update": {
        const { movimientoUuid, updates } = payload;
        if (!movimientoUuid) throw new Error("movimientoUuid is required");

        const { data: existing, error: fetchErr } = await supabaseAdmin
          .from("movimientos_ganado")
          .select("created_by, estado")
          .eq("id", movimientoUuid)
          .single();
        if (fetchErr) throw fetchErr;

        const isCreator = existing.created_by === caller.id;
        const isAdmin = caller.role === "admin";
        if (!isCreator && !isAdmin) {
          throw new Error("Not authorized to update this movement");
        }

        const isLocked = existing.estado !== "borrador";
        const dbUpdates: Record<string, unknown> = {};

        if (!isLocked) {
          if (updates.tipoOperacion !== undefined) dbUpdates.tipo_operacion = updates.tipoOperacion;
          if (updates.finalidad !== undefined) dbUpdates.finalidad = updates.finalidad;
          if (updates.establecimientoOrigenId !== undefined) dbUpdates.establecimiento_origen_id = updates.establecimientoOrigenId;
          if (updates.empresaDestinoId !== undefined) dbUpdates.empresa_destino_id = updates.empresaDestinoId;
          if (updates.establecimientoDestinoId !== undefined) dbUpdates.establecimiento_destino_id = updates.establecimientoDestinoId;
          if (updates.destinoNombre !== undefined) dbUpdates.destino_nombre = sanitizeName(updates.destinoNombre);
          if (updates.categoriaId !== undefined) dbUpdates.categoria_id = updates.categoriaId;
          if (updates.cantidad !== undefined) dbUpdates.cantidad = sanitizeNumber(updates.cantidad, { min: 1 });
          if (updates.pesoTotalKg !== undefined) dbUpdates.peso_total_kg = updates.pesoTotalKg ? sanitizeNumber(updates.pesoTotalKg, { min: 0 }) : null;
          if (updates.precioPorKg !== undefined) dbUpdates.precio_por_kg = updates.precioPorKg ? sanitizeNumber(updates.precioPorKg, { min: 0 }) : null;
          if (updates.precioTotal !== undefined) dbUpdates.precio_total = updates.precioTotal ? sanitizeNumber(updates.precioTotal, { min: 0 }) : null;
          if (updates.moneda !== undefined) dbUpdates.moneda = ["PYG", "USD", "BRL"].includes(updates.moneda) ? updates.moneda : "PYG";
          if (updates.nroGuia !== undefined) dbUpdates.nro_guia = sanitizeText(updates.nroGuia, 100);
          if (updates.nroCota !== undefined) dbUpdates.nro_cota = sanitizeText(updates.nroCota, 100);
          if (updates.fechaEmision !== undefined) dbUpdates.fecha_emision = updates.fechaEmision;
        }

        // Always-editable
        if (updates.observaciones !== undefined) dbUpdates.observaciones = sanitizeMultiline(updates.observaciones, 2000);

        if (Object.keys(dbUpdates).length > 0) {
          const { error: updateErr } = await supabaseAdmin
            .from("movimientos_ganado")
            .update(dbUpdates)
            .eq("id", movimientoUuid);
          if (updateErr) throw updateErr;
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // VALIDATE MOVIMIENTO (borrador → validado)
      // ─────────────────────────────────────────────────
      case "validate": {
        if (!hasPermission(caller, "validate_movimiento_ganado")) {
          throw new Error("No permission to validate cattle movements");
        }

        const { movimientoUuid: valUuid } = payload;
        if (!valUuid) throw new Error("movimientoUuid is required");

        const { data: mov, error: movErr } = await supabaseAdmin
          .from("movimientos_ganado")
          .select("estado")
          .eq("id", valUuid)
          .single();
        if (movErr) throw movErr;

        if (mov.estado !== "borrador" && mov.estado !== "pendiente_validacion") {
          throw new Error(`Cannot validate from estado '${mov.estado}'`);
        }

        const { error: valError } = await supabaseAdmin
          .from("movimientos_ganado")
          .update({
            estado: "validado",
            validated_by: caller.id,
            validated_by_name: caller.name,
            validated_at: new Date().toISOString(),
          })
          .eq("id", valUuid);
        if (valError) throw valError;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADVANCE STATUS
      // ─────────────────────────────────────────────────
      case "advance-status": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission to advance cattle movement status");
        }

        const { movimientoUuid: advUuid, newStatus } = payload;
        if (!advUuid || !newStatus) throw new Error("movimientoUuid and newStatus are required");

        const { data: advMov, error: advErr } = await supabaseAdmin
          .from("movimientos_ganado")
          .select("estado")
          .eq("id", advUuid)
          .single();
        if (advErr) throw advErr;

        // Verify valid transition
        const currentIdx = GANADO_STATUS_FLOW.indexOf(advMov.estado);
        const newIdx = GANADO_STATUS_FLOW.indexOf(newStatus);
        if (currentIdx < 0 || newIdx < 0 || newIdx !== currentIdx + 1) {
          throw new Error(`Invalid status transition: ${advMov.estado} → ${newStatus}`);
        }

        const { error: advError } = await supabaseAdmin
          .from("movimientos_ganado")
          .update({ estado: newStatus })
          .eq("id", advUuid);
        if (advError) throw advError;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADD DIVERGENCE
      // ─────────────────────────────────────────────────
      case "add-divergence": {
        const { movimientoUuid: divUuid, divergencia } = payload;
        if (!divUuid || !divergencia) throw new Error("movimientoUuid and divergencia are required");

        const { error } = await supabaseAdmin.from("movimiento_divergencias").insert({
          movimiento_id: divUuid,
          tipo: divergencia.tipo,
          descripcion: sanitizeMultiline(divergencia.descripcion, 1000),
          cantidad_diferencia: divergencia.cantidadDiferencia || null,
          peso_diferencia_kg: divergencia.pesoDiferenciaKg || null,
          reportado_por: caller.id,
          reportado_por_nombre: caller.name,
        });
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADD ATTACHMENT
      // ─────────────────────────────────────────────────
      case "add-attachment": {
        const { movimientoUuid: attUuid, archivo } = payload;
        if (!attUuid || !archivo) throw new Error("movimientoUuid and archivo are required");

        const { error } = await supabaseAdmin.from("movimiento_archivos").insert({
          movimiento_id: attUuid,
          tipo: archivo.tipo,
          nombre: sanitizeName(archivo.nombre),
          storage_path: archivo.storagePath,
          mime_type: archivo.mimeType || null,
          size_bytes: archivo.sizeBytes || null,
          uploaded_by: caller.id,
          uploaded_by_name: caller.name,
        });
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ANULAR (cancel)
      // ─────────────────────────────────────────────────
      case "anular": {
        const { movimientoUuid: anulUuid, reason } = payload;
        if (!anulUuid) throw new Error("movimientoUuid is required");

        const { data: anulMov, error: anulErr } = await supabaseAdmin
          .from("movimientos_ganado")
          .select("estado, created_by")
          .eq("id", anulUuid)
          .single();
        if (anulErr) throw anulErr;

        if (anulMov.estado === "cerrado" || anulMov.estado === "anulado") {
          throw new Error("Cannot annul a closed or already annulled movement");
        }

        const isCreator = anulMov.created_by === caller.id;
        const isAdmin = caller.role === "admin";
        if (!isCreator && !isAdmin) {
          throw new Error("Not authorized to annul this movement");
        }

        const { error: anulError } = await supabaseAdmin
          .from("movimientos_ganado")
          .update({
            estado: "anulado",
            observaciones: reason
              ? sanitizeMultiline(reason, 2000)
              : undefined,
          })
          .eq("id", anulUuid);
        if (anulError) throw anulError;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ganado-mutations]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
