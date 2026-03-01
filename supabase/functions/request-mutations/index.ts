// ============================================================
// YPOTI — Edge Function: request-mutations
// Actions: create, update, add-comment, add-quotation
// ============================================================

import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient, getCallerProfile, hasPermission } from "../_shared/auth.ts";
import {
  sanitizeName,
  sanitizeText,
  sanitizeMultiline,
  sanitizeNumber,
} from "../_shared/sanitize.ts";

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
      // CREATE REQUEST (status: borrador)
      // ─────────────────────────────────────────────────
      case "create": {
        if (!hasPermission(caller, "create_request")) {
          throw new Error("No permission to create requests");
        }

        const r = payload.request;
        if (!r) throw new Error("request object is required");

        const { data, error } = await supabaseAdmin
          .from("requests")
          .insert({
            name: sanitizeName(r.name),
            requester: sanitizeName(r.requester),
            created_by: caller.id,          // <-- from JWT, not client
            created_by_name: caller.name,    // <-- from JWT, not client
            establishment: r.establishment,
            company: r.company || null,
            sector: r.sector || null,
            type: r.type || null,
            priority: (r.urgency || r.priority || "media").toLowerCase(),
            status: "borrador",
            total_amount: sanitizeNumber(r.totalAmount, { min: 0 }),
            quantity: r.quantity || null,
            reason: sanitizeMultiline(r.reason, 1000),
            purpose: sanitizeMultiline(r.purpose, 1000),
            equipment: sanitizeName(r.equipment),
            suggested_supplier: sanitizeName(r.suggestedSupplier),
            notes: sanitizeMultiline(r.notes, 2000),
            assignee: r.assignee || null,
            date: new Date().toISOString().slice(0, 10),
          })
          .select()
          .single();

        if (error) throw error;

        // Insert items if present
        if (Array.isArray(r.items) && r.items.length > 0) {
          const itemRows = r.items.map(
            (item: Record<string, unknown>, idx: number) => ({
              request_id: data.id,
              name: sanitizeName(item.name as string),
              quantity: item.quantity || 1,
              unit: item.unit || null,
              unit_price: sanitizeNumber(item.unitPrice, { min: 0 }),
              total_price: sanitizeNumber(item.totalPrice, { min: 0 }),
              notes: sanitizeMultiline(item.notes as string, 500),
              sort_order: idx,
            }),
          );
          const { error: itemsErr } = await supabaseAdmin
            .from("request_items")
            .insert(itemRows);
          if (itemsErr) {
            console.error("[request-mutations] Insert items failed:", itemsErr.message);
          }
        }

        return new Response(
          JSON.stringify({ ok: true, requestUuid: data.id }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // ─────────────────────────────────────────────────
      // UPDATE REQUEST
      // ─────────────────────────────────────────────────
      case "update": {
        const { requestUuid, updates } = payload;
        if (!requestUuid) throw new Error("requestUuid is required");

        // Load the request to check ownership
        const { data: existing, error: fetchErr } = await supabaseAdmin
          .from("requests")
          .select("created_by, status")
          .eq("id", requestUuid)
          .single();
        if (fetchErr) throw fetchErr;

        // Creator in borrador OR admin
        const isCreator = existing.created_by === caller.id;
        const isAdmin = caller.role === "admin";
        if (!isCreator && !isAdmin) {
          throw new Error("Not authorized to update this request");
        }

        // Lock financial/critical fields after confirmation
        const isLocked = existing.status !== "borrador";
        const dbUpdates: Record<string, unknown> = {};

        if (!isLocked) {
          if (updates.name !== undefined)
            dbUpdates.name = sanitizeName(updates.name);
          if (updates.totalAmount !== undefined)
            dbUpdates.total_amount = sanitizeNumber(updates.totalAmount, { min: 0 });
          if (updates.establishment !== undefined)
            dbUpdates.establishment = updates.establishment;
          if (updates.sector !== undefined) dbUpdates.sector = updates.sector;
          if (updates.company !== undefined)
            dbUpdates.company = updates.company;
          if (updates.requester !== undefined)
            dbUpdates.requester = sanitizeName(updates.requester);
          if (updates.priority !== undefined)
            dbUpdates.priority = updates.priority;
          if (updates.equipment !== undefined)
            dbUpdates.equipment = sanitizeName(updates.equipment);
          if (updates.purpose !== undefined)
            dbUpdates.purpose = sanitizeMultiline(updates.purpose, 1000);
        }

        // Always-editable fields
        if (updates.notes !== undefined)
          dbUpdates.notes = sanitizeMultiline(updates.notes, 2000);
        if (updates.reason !== undefined)
          dbUpdates.reason = sanitizeMultiline(updates.reason, 1000);
        if (updates.suggestedSupplier !== undefined)
          dbUpdates.suggested_supplier = sanitizeName(updates.suggestedSupplier);
        if (updates.supplier !== undefined)
          dbUpdates.supplier = sanitizeName(updates.supplier);
        if (updates.assignee !== undefined)
          dbUpdates.assignee = updates.assignee;

        if (Object.keys(dbUpdates).length > 0) {
          const { error: updateErr } = await supabaseAdmin
            .from("requests")
            .update(dbUpdates)
            .eq("id", requestUuid);
          if (updateErr) throw updateErr;
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADD COMMENT
      // ─────────────────────────────────────────────────
      case "add-comment": {
        const { requestUuid: commentReqId, texto } = payload;
        if (!commentReqId || !texto) {
          throw new Error("requestUuid and texto are required");
        }

        const { error } = await supabaseAdmin.from("comments").insert({
          request_id: commentReqId,
          author_id: caller.id,           // from JWT
          author_name: caller.name,        // from JWT
          texto: sanitizeMultiline(texto, 2000),
        });
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADD QUOTATION
      // ─────────────────────────────────────────────────
      case "add-quotation": {
        // Admin, comprador, or request creator
        const { requestUuid: quotReqId, quotation } = payload;
        if (!quotReqId || !quotation) {
          throw new Error("requestUuid and quotation are required");
        }

        // Check authorization
        const isQuotAdmin = caller.role === "admin";
        const isComprador = caller.role === "comprador";
        if (!isQuotAdmin && !isComprador) {
          // Check if creator
          const { data: reqData, error: reqErr } = await supabaseAdmin
            .from("requests")
            .select("created_by")
            .eq("id", quotReqId)
            .single();
          if (reqErr) throw reqErr;
          if (reqData.created_by !== caller.id) {
            throw new Error("Not authorized to add quotations");
          }
        }

        const { error } = await supabaseAdmin.from("quotations").insert({
          request_id: quotReqId,
          supplier: sanitizeName(quotation.supplier),
          currency: quotation.currency || "PYG",
          price: sanitizeNumber(quotation.price, { min: 0 }),
          delivery_days: quotation.deliveryDays || 0,
          payment_terms: quotation.paymentTerms || null,
          notes: sanitizeMultiline(quotation.notes, 500),
          selected: quotation.selected || false,
          date:
            quotation.date || new Date().toISOString().slice(0, 10),
        });
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[request-mutations]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
