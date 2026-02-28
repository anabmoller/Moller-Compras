// ============================================================
// YPOTI — Edge Function: admin-data
// Actions: add-parameter, update-parameter, toggle-parameter,
//          add-budget, update-budget
// Authorization: Admin only
// ============================================================

import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient, getCallerProfile, assertRole } from "../_shared/auth.ts";
import { sanitizeName, sanitizeNumber } from "../_shared/sanitize.ts";

// ---- Supabase table name mapping ----
const TABLE_MAP: Record<string, string> = {
  establishments: "establishments",
  sectors: "sectors",
  productTypes: "product_types",
  suppliers: "suppliers",
  companies: "companies",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const caller = await getCallerProfile(req, supabaseAdmin);
    assertRole(caller, ["admin"]);

    const { action, ...payload } = await req.json();

    switch (action) {
      // ─────────────────────────────────────────────────
      // ADD PARAMETER ITEM
      // ─────────────────────────────────────────────────
      case "add-parameter": {
        const { category, item } = payload;
        const table = TABLE_MAP[category];
        if (!table) throw new Error(`Unknown category: ${category}`);

        const row: Record<string, unknown> = {};

        if (category === "establishments") {
          row.name = sanitizeName(item.name);
          row.code = item.code || "";
          row.manager = item.manager || "";
          row.location = item.location || "";
          row.active = true;
          if (item.companyId) {
            row.company_id = item.companyId;
          } else if (item.company) {
            // Look up company by name
            const { data: comp } = await supabaseAdmin
              .from("companies")
              .select("id")
              .eq("name", item.company)
              .maybeSingle();
            row.company_id = comp?.id || null;
          }
        } else if (category === "companies") {
          row.name = sanitizeName(item.name);
          row.ruc = item.ruc || "";
          row.type = item.type || "empresa";
          row.director = item.director || "";
        } else if (category === "suppliers") {
          row.name = sanitizeName(item.name);
          row.ruc = item.ruc || "";
          row.phone = item.phone || "";
          row.email = item.email || "";
          row.category = item.category || "";
          row.active = true;
        } else {
          // sectors, productTypes
          row.name = sanitizeName(item.name);
          row.icon = item.icon || "";
          row.description = item.description || "";
          row.active = true;
        }

        const { data, error } = await supabaseAdmin
          .from(table)
          .insert(row)
          .select()
          .single();
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true, data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // UPDATE PARAMETER ITEM
      // ─────────────────────────────────────────────────
      case "update-parameter": {
        const { category: cat, id, updates } = payload;
        const tbl = TABLE_MAP[cat];
        if (!tbl) throw new Error(`Unknown category: ${cat}`);

        const row: Record<string, unknown> = {};
        if (updates.name !== undefined) row.name = sanitizeName(updates.name);
        if (updates.code !== undefined) row.code = updates.code;
        if (updates.manager !== undefined) row.manager = updates.manager;
        if (updates.location !== undefined) row.location = updates.location;
        if (updates.icon !== undefined) row.icon = updates.icon;
        if (updates.description !== undefined)
          row.description = updates.description;
        if (updates.ruc !== undefined) row.ruc = updates.ruc;
        if (updates.phone !== undefined) row.phone = updates.phone;
        if (updates.email !== undefined) row.email = updates.email;
        if (updates.category !== undefined) row.category = updates.category;
        if (updates.type !== undefined) row.type = updates.type;
        if (updates.director !== undefined) row.director = updates.director;
        if (updates.active !== undefined) row.active = updates.active;
        if (updates.company !== undefined) {
          const { data: comp } = await supabaseAdmin
            .from("companies")
            .select("id")
            .eq("name", updates.company)
            .maybeSingle();
          row.company_id = comp?.id || null;
        }

        if (Object.keys(row).length === 0) {
          return new Response(
            JSON.stringify({ ok: true, message: "No changes" }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }

        const { error } = await supabaseAdmin
          .from(tbl)
          .update(row)
          .eq("id", id);
        if (error) throw error;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // TOGGLE PARAMETER ITEM (active/inactive)
      // ─────────────────────────────────────────────────
      case "toggle-parameter": {
        const { category: toggleCat, id: toggleId } = payload;
        const toggleTbl = TABLE_MAP[toggleCat];
        if (!toggleTbl) throw new Error(`Unknown category: ${toggleCat}`);

        // Fetch current state
        const { data: current, error: fetchErr } = await supabaseAdmin
          .from(toggleTbl)
          .select("active")
          .eq("id", toggleId)
          .single();
        if (fetchErr) throw fetchErr;

        const { error: toggleErr } = await supabaseAdmin
          .from(toggleTbl)
          .update({ active: !current.active })
          .eq("id", toggleId);
        if (toggleErr) throw toggleErr;

        return new Response(
          JSON.stringify({ ok: true, active: !current.active }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // ─────────────────────────────────────────────────
      // ADD BUDGET
      // ─────────────────────────────────────────────────
      case "add-budget": {
        const { budget } = payload;
        const budgetRow = {
          name: sanitizeName(budget.name),
          establishment: budget.establishment,
          sector: budget.sector,
          period: budget.period || "2026",
          start_date: budget.startDate || null,
          end_date: budget.endDate || null,
          planned: sanitizeNumber(budget.planned, { min: 0 }),
          consumed: sanitizeNumber(budget.consumed, { min: 0 }),
          active: true,
        };

        const { data: bData, error: bErr } = await supabaseAdmin
          .from("budgets")
          .insert(budgetRow)
          .select()
          .single();
        if (bErr) throw bErr;

        return new Response(JSON.stringify({ ok: true, data: bData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // UPDATE BUDGET
      // ─────────────────────────────────────────────────
      case "update-budget": {
        const { budgetId, updates: bUpdates } = payload;
        if (!budgetId) throw new Error("budgetId is required");

        const bRow: Record<string, unknown> = {};
        if (bUpdates.name !== undefined) bRow.name = sanitizeName(bUpdates.name);
        if (bUpdates.establishment !== undefined)
          bRow.establishment = bUpdates.establishment;
        if (bUpdates.sector !== undefined) bRow.sector = bUpdates.sector;
        if (bUpdates.period !== undefined) bRow.period = bUpdates.period;
        if (bUpdates.startDate !== undefined)
          bRow.start_date = bUpdates.startDate;
        if (bUpdates.endDate !== undefined) bRow.end_date = bUpdates.endDate;
        if (bUpdates.planned !== undefined)
          bRow.planned = sanitizeNumber(bUpdates.planned, { min: 0 });
        if (bUpdates.consumed !== undefined)
          bRow.consumed = sanitizeNumber(bUpdates.consumed, { min: 0 });
        if (bUpdates.active !== undefined) bRow.active = bUpdates.active;

        if (Object.keys(bRow).length === 0) {
          return new Response(
            JSON.stringify({ ok: true, message: "No changes" }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }

        const { error: bUpdateErr } = await supabaseAdmin
          .from("budgets")
          .update(bRow)
          .eq("id", budgetId);
        if (bUpdateErr) throw bUpdateErr;

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin-data]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
