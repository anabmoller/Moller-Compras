// ============================================================
// YPOTI — Edge Function: ganado-mutations
// Actions: create, update, validate, advance-status,
//          add-categories, update-category, remove-category,
//          add-divergence, resolve-divergence,
//          add-attachment, anular,
//          add-pesaje, update-pesaje, delete-pesaje
// ============================================================

import { getCorsHeaders } from "../_shared/cors.ts";
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

// Helper: log a status change
async function logStatusChange(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  movimientoId: string,
  estadoAnterior: string,
  estadoNuevo: string,
  caller: { id: string; name: string },
  comentario?: string,
) {
  await supabaseAdmin.from("movimiento_estados_log").insert({
    movimiento_id: movimientoId,
    estado_anterior: estadoAnterior,
    estado_nuevo: estadoNuevo,
    comentario: comentario || null,
    changed_by: caller.id,
    changed_by_name: caller.name,
  });
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
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

        // Insert main movement (without animal details - those go in detalle)
        const { data, error } = await supabaseAdmin
          .from("movimientos_ganado")
          .insert({
            tipo_operacion: m.tipoOperacion,
            finalidad: m.finalidad,
            establecimiento_origen_id: m.establecimientoOrigenId || null,
            empresa_destino_id: m.empresaDestinoId || null,
            establecimiento_destino_id: m.establecimientoDestinoId || null,
            destino_nombre: sanitizeName(m.destinoNombre),
            cantidad_total: 0,
            peso_total_kg: 0,
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

        // Insert category details if provided
        if (Array.isArray(m.categorias) && m.categorias.length > 0) {
          const rows = m.categorias.map((c: Record<string, unknown>) => ({
            movimiento_id: data.id,
            categoria_id: c.categoriaId,
            cantidad: sanitizeNumber(c.cantidad as number, { min: 1 }),
            peso_kg: c.pesoKg ? sanitizeNumber(c.pesoKg as number, { min: 0 }) : null,
            precio_por_kg: c.precioPorKg ? sanitizeNumber(c.precioPorKg as number, { min: 0 }) : null,
            precio_subtotal: c.precioSubtotal ? sanitizeNumber(c.precioSubtotal as number, { min: 0 }) : null,
            observaciones: c.observaciones ? sanitizeMultiline(c.observaciones as string, 500) : null,
          }));
          const { error: catError } = await supabaseAdmin
            .from("detalle_movimiento_categorias")
            .insert(rows);
          if (catError) throw catError;
        }

        // Log initial status
        await logStatusChange(supabaseAdmin, data.id, "", "borrador", caller, "Movimiento creado");

        return new Response(
          JSON.stringify({ ok: true, movimientoUuid: data.id }),
          { headers: { ...cors, "Content-Type": "application/json" } },
        );
      }

      // ─────────────────────────────────────────────────
      // UPDATE MOVIMIENTO (only in borrador)
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
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADD CATEGORIES (batch upsert detalle rows)
      // ─────────────────────────────────────────────────
      case "add-categories": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission");
        }
        const { movimientoUuid: catUuid, categorias } = payload;
        if (!catUuid || !Array.isArray(categorias) || categorias.length === 0) {
          throw new Error("movimientoUuid and categorias array are required");
        }

        // Check movement exists and is in borrador
        const { data: catMov, error: catMovErr } = await supabaseAdmin
          .from("movimientos_ganado")
          .select("estado")
          .eq("id", catUuid)
          .single();
        if (catMovErr) throw catMovErr;
        if (catMov.estado !== "borrador") {
          throw new Error("Can only add categories in borrador state");
        }

        const rows = categorias.map((c: Record<string, unknown>) => ({
          movimiento_id: catUuid,
          categoria_id: c.categoriaId,
          cantidad: sanitizeNumber(c.cantidad as number, { min: 1 }),
          peso_kg: c.pesoKg ? sanitizeNumber(c.pesoKg as number, { min: 0 }) : null,
          precio_por_kg: c.precioPorKg ? sanitizeNumber(c.precioPorKg as number, { min: 0 }) : null,
          precio_subtotal: c.precioSubtotal ? sanitizeNumber(c.precioSubtotal as number, { min: 0 }) : null,
          observaciones: c.observaciones ? sanitizeMultiline(c.observaciones as string, 500) : null,
        }));

        const { error } = await supabaseAdmin
          .from("detalle_movimiento_categorias")
          .upsert(rows, { onConflict: "movimiento_id,categoria_id" });
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // UPDATE CATEGORY (single detail row)
      // ─────────────────────────────────────────────────
      case "update-category": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission");
        }
        const { detalleId, updates: catUpdates } = payload;
        if (!detalleId) throw new Error("detalleId is required");

        const dbCat: Record<string, unknown> = {};
        if (catUpdates.cantidad !== undefined) dbCat.cantidad = sanitizeNumber(catUpdates.cantidad, { min: 1 });
        if (catUpdates.pesoKg !== undefined) dbCat.peso_kg = catUpdates.pesoKg ? sanitizeNumber(catUpdates.pesoKg, { min: 0 }) : null;
        if (catUpdates.precioPorKg !== undefined) dbCat.precio_por_kg = catUpdates.precioPorKg ? sanitizeNumber(catUpdates.precioPorKg, { min: 0 }) : null;
        if (catUpdates.precioSubtotal !== undefined) dbCat.precio_subtotal = catUpdates.precioSubtotal ? sanitizeNumber(catUpdates.precioSubtotal, { min: 0 }) : null;

        if (Object.keys(dbCat).length > 0) {
          const { error } = await supabaseAdmin
            .from("detalle_movimiento_categorias")
            .update(dbCat)
            .eq("id", detalleId);
          if (error) throw error;
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // REMOVE CATEGORY (delete detail row)
      // ─────────────────────────────────────────────────
      case "remove-category": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission");
        }
        const { detalleId: delId } = payload;
        if (!delId) throw new Error("detalleId is required");

        const { error } = await supabaseAdmin
          .from("detalle_movimiento_categorias")
          .delete()
          .eq("id", delId);
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // VALIDATE MOVIMIENTO (borrador/pendiente → validado)
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

        await logStatusChange(supabaseAdmin, valUuid, mov.estado, "validado", caller);

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADVANCE STATUS
      // ─────────────────────────────────────────────────
      case "advance-status": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission to advance cattle movement status");
        }

        const { movimientoUuid: advUuid, newStatus, comentario } = payload;
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

        await logStatusChange(supabaseAdmin, advUuid, advMov.estado, newStatus, caller, comentario);

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
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
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // RESOLVE DIVERGENCE
      // ─────────────────────────────────────────────────
      case "resolve-divergence": {
        const { divergenciaId, resolucion } = payload;
        if (!divergenciaId) throw new Error("divergenciaId is required");

        const { error } = await supabaseAdmin
          .from("movimiento_divergencias")
          .update({
            resuelto: true,
            resolucion: resolucion ? sanitizeMultiline(resolucion, 1000) : "Resuelto",
          })
          .eq("id", divergenciaId);
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
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
          headers: { ...cors, "Content-Type": "application/json" },
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

        const sanitizedReason = reason ? sanitizeMultiline(reason, 2000) : undefined;

        const { error: anulError } = await supabaseAdmin
          .from("movimientos_ganado")
          .update({
            estado: "anulado",
            observaciones: sanitizedReason,
          })
          .eq("id", anulUuid);
        if (anulError) throw anulError;

        await logStatusChange(supabaseAdmin, anulUuid, anulMov.estado, "anulado", caller, sanitizedReason);

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADD PESAJE (weighing record)
      // ─────────────────────────────────────────────────
      case "add-pesaje": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission to add weighing records");
        }

        const { movimientoUuid: pesUuid, pesaje } = payload;
        if (!pesUuid || !pesaje) throw new Error("movimientoUuid and pesaje are required");

        // Verify movement exists and is in appropriate state (recibido or en_transito)
        const { data: pesMov, error: pesMovErr } = await supabaseAdmin
          .from("movimientos_ganado")
          .select("estado")
          .eq("id", pesUuid)
          .single();
        if (pesMovErr) throw pesMovErr;

        const allowedStates = ["en_transito", "recibido", "validado"];
        if (!allowedStates.includes(pesMov.estado)) {
          throw new Error(`Cannot add weighing in estado '${pesMov.estado}'`);
        }

        const { data: pesData, error: pesError } = await supabaseAdmin
          .from("pesajes_ganado")
          .insert({
            movimiento_id: pesUuid,
            detalle_categoria_id: pesaje.detalleCategoriaId || null,
            fecha_pesaje: pesaje.fechaPesaje || new Date().toISOString().slice(0, 10),
            hora_pesaje: pesaje.horaPesaje || null,
            cantidad_pesada: sanitizeNumber(pesaje.cantidadPesada, { min: 1 }),
            peso_bruto_kg: sanitizeNumber(pesaje.pesoBrutoKg, { min: 0.01 }),
            peso_tara_kg: pesaje.pesoTaraKg ? sanitizeNumber(pesaje.pesoTaraKg, { min: 0 }) : 0,
            nro_tropa: pesaje.nroTropa ? sanitizeText(pesaje.nroTropa, 50) : null,
            nro_lote: pesaje.nroLote ? sanitizeText(pesaje.nroLote, 50) : null,
            categoria_id: pesaje.categoriaId || null,
            tipo_pesaje: ["recepcion", "despacho", "intermedio", "verificacion"].includes(pesaje.tipoPesaje)
              ? pesaje.tipoPesaje : "recepcion",
            cantidad_esperada: pesaje.cantidadEsperada ? sanitizeNumber(pesaje.cantidadEsperada, { min: 0 }) : null,
            peso_esperado_kg: pesaje.pesoEsperadoKg ? sanitizeNumber(pesaje.pesoEsperadoKg, { min: 0 }) : null,
            balanza_id: pesaje.balanzaId ? sanitizeText(pesaje.balanzaId, 50) : null,
            balanza_nombre: pesaje.balanzaNombre ? sanitizeName(pesaje.balanzaNombre) : null,
            ticket_nro: pesaje.ticketNro ? sanitizeText(pesaje.ticketNro, 50) : null,
            conforme: pesaje.conforme ?? false,
            observaciones: pesaje.observaciones ? sanitizeMultiline(pesaje.observaciones, 1000) : null,
            pesado_por: caller.id,
            pesado_por_nombre: caller.name,
          })
          .select()
          .single();

        if (pesError) throw pesError;

        return new Response(
          JSON.stringify({ ok: true, pesajeId: pesData.id }),
          { headers: { ...cors, "Content-Type": "application/json" } },
        );
      }

      // ─────────────────────────────────────────────────
      // UPDATE PESAJE
      // ─────────────────────────────────────────────────
      case "update-pesaje": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission to update weighing records");
        }

        const { pesajeId: upPesId, updates: pesUpdates } = payload;
        if (!upPesId) throw new Error("pesajeId is required");

        const dbPes: Record<string, unknown> = {};
        if (pesUpdates.cantidadPesada !== undefined) dbPes.cantidad_pesada = sanitizeNumber(pesUpdates.cantidadPesada, { min: 1 });
        if (pesUpdates.pesoBrutoKg !== undefined) dbPes.peso_bruto_kg = sanitizeNumber(pesUpdates.pesoBrutoKg, { min: 0.01 });
        if (pesUpdates.pesoTaraKg !== undefined) dbPes.peso_tara_kg = sanitizeNumber(pesUpdates.pesoTaraKg, { min: 0 });
        if (pesUpdates.conforme !== undefined) dbPes.conforme = !!pesUpdates.conforme;
        if (pesUpdates.observaciones !== undefined) dbPes.observaciones = pesUpdates.observaciones ? sanitizeMultiline(pesUpdates.observaciones, 1000) : null;
        if (pesUpdates.ticketNro !== undefined) dbPes.ticket_nro = pesUpdates.ticketNro ? sanitizeText(pesUpdates.ticketNro, 50) : null;
        if (pesUpdates.nroTropa !== undefined) dbPes.nro_tropa = pesUpdates.nroTropa ? sanitizeText(pesUpdates.nroTropa, 50) : null;
        if (pesUpdates.nroLote !== undefined) dbPes.nro_lote = pesUpdates.nroLote ? sanitizeText(pesUpdates.nroLote, 50) : null;
        if (pesUpdates.verificadoPor !== undefined) {
          dbPes.verificado_por = caller.id;
          dbPes.verificado_por_nombre = caller.name;
        }

        if (Object.keys(dbPes).length > 0) {
          const { error } = await supabaseAdmin
            .from("pesajes_ganado")
            .update(dbPes)
            .eq("id", upPesId);
          if (error) throw error;
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // DELETE PESAJE
      // ─────────────────────────────────────────────────
      case "delete-pesaje": {
        if (!hasPermission(caller, "create_movimiento_ganado")) {
          throw new Error("No permission to delete weighing records");
        }

        const { pesajeId: delPesId } = payload;
        if (!delPesId) throw new Error("pesajeId is required");

        const { error } = await supabaseAdmin
          .from("pesajes_ganado")
          .delete()
          .eq("id", delPesId);
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...cors, "Content-Type": "application/json" },
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
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
