// ============================================================
// YPOTI — Edge Function: request-workflow
// Actions: confirm, approve, reject, revision, advance
// The most security-critical function: handles approval flow,
// budget consumption, and status transitions SERVER-SIDE.
// ============================================================

import { corsHeaders } from "../_shared/cors.ts";
import {
  createAdminClient,
  getCallerProfile,
  hasPermission,
  type CallerProfile,
} from "../_shared/auth.ts";
import {
  calculateApprovalSteps,
  isFullyApproved,
  STEP_STATUS,
} from "../_shared/approvalEngine.ts";
import { sanitizeText, sanitizeMultiline } from "../_shared/sanitize.ts";

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
      // CONFIRM — Calculate steps server-side, submit for approval
      // ─────────────────────────────────────────────────
      case "confirm": {
        const { requestUuid } = payload;
        if (!requestUuid) throw new Error("requestUuid is required");

        // Load the full request
        const { data: request, error: reqErr } = await supabaseAdmin
          .from("requests")
          .select("*")
          .eq("id", requestUuid)
          .single();
        if (reqErr) throw reqErr;

        // Authorization: creator or admin/diretoria
        const isCreator = request.created_by === caller.id;
        const canConfirm =
          isCreator ||
          hasPermission(caller, "view_all_requests");
        if (!canConfirm) throw new Error("Not authorized to confirm");
        if (request.status !== "borrador")
          throw new Error("Only borrador requests can be confirmed");

        // Load all users for approval engine
        const { data: allUsers } = await supabaseAdmin
          .from("profiles")
          .select("username, name")
          .eq("active", true);
        const users = (allUsers || []).map((u) => ({
          email: u.username,
          name: u.name,
        }));

        // Load dynamic params for approval engine
        const [estabRes, compRes] = await Promise.all([
          supabaseAdmin.from("establishments").select("name, company:companies(name), manager").eq("active", true),
          supabaseAdmin.from("companies").select("name, director"),
        ]);
        const dynamicParams = {
          establishments: (estabRes.data || []).map((e: Record<string, unknown>) => ({
            name: e.name as string,
            company: (e.company as Record<string, string>)?.name || "",
            manager: e.manager as string || "",
          })),
          companies: (compRes.data || []).map((c: Record<string, unknown>) => ({
            name: c.name as string,
            director: c.director as string || "",
          })),
        };

        // Find matching budget
        const { data: budgets } = await supabaseAdmin
          .from("budgets")
          .select("*")
          .eq("active", true);

        const establishment = request.establishment;
        const sector = request.sector;
        const totalAmount = Number(request.total_amount) || 0;

        // Budget matching logic (mirrors frontend)
        let matchedBudget = (budgets || []).find(
          (b: Record<string, unknown>) =>
            b.establishment === establishment && b.sector === sector,
        );
        if (!matchedBudget) {
          matchedBudget = (budgets || []).find(
            (b: Record<string, unknown>) => b.establishment === establishment,
          );
        }

        const budgetId = matchedBudget?.id || null;
        const budgetExceeded = matchedBudget
          ? (Number(matchedBudget.consumed) || 0) + totalAmount >
            (Number(matchedBudget.planned) || 0)
          : false;

        // Calculate approval steps SERVER-SIDE
        const steps = calculateApprovalSteps(
          {
            establishment,
            totalAmount,
            urgency: (request.priority || "media").toLowerCase(),
            sector: sector || "",
            company: request.company || null,
            budgetExceeded,
          },
          users,
          dynamicParams,
        );

        const now = new Date().toISOString();

        // Update request status
        const { error: updateErr } = await supabaseAdmin
          .from("requests")
          .update({
            status: "pendiente_aprobacion",
            budget_id: budgetId,
            budget_exceeded: budgetExceeded,
            confirmed_at: now,
          })
          .eq("id", requestUuid);
        if (updateErr) throw updateErr;

        // Insert approval steps
        if (steps.length > 0) {
          const stepRows = steps.map((s, idx) => ({
            request_id: requestUuid,
            step_order: idx + 1,
            type: s.type,
            label: s.label,
            approver_username: s.approverUsername,
            approver_name: s.approverName,
            sla_hours: s.sla,
            conditional: s.conditional,
            status: s.status || "pending",
          }));
          const { error: stepsErr } = await supabaseAdmin
            .from("approval_steps")
            .insert(stepRows);
          if (stepsErr) throw stepsErr;
        }

        // Insert history entry
        await supabaseAdmin.from("approval_history").insert({
          request_id: requestUuid,
          action: "confirmed",
          performed_by: caller.id,
          performed_by_name: caller.name,
          note: "Solicitud confirmada y enviada para aprobación",
        });

        return new Response(
          JSON.stringify({ ok: true, steps: steps.length }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // ─────────────────────────────────────────────────
      // APPROVE — Approve current step, optionally consume budget
      // ─────────────────────────────────────────────────
      case "approve": {
        const { requestUuid, comment } = payload;
        if (!requestUuid) throw new Error("requestUuid is required");

        // Load request + steps
        const { data: request, error: reqErr } = await supabaseAdmin
          .from("requests")
          .select("*")
          .eq("id", requestUuid)
          .single();
        if (reqErr) throw reqErr;

        const { data: steps, error: stepsErr } = await supabaseAdmin
          .from("approval_steps")
          .select("*")
          .eq("request_id", requestUuid)
          .order("step_order", { ascending: true });
        if (stepsErr) throw stepsErr;

        // Find current pending step
        const currentStep = (steps || []).find(
          (s: Record<string, unknown>) => s.status === "pending",
        );
        if (!currentStep) throw new Error("No pending step found");

        // Authorization: caller must be the designated approver
        if (caller.username !== currentStep.approver_username) {
          throw new Error(
            `Not authorized: expected ${currentStep.approver_username}, got ${caller.username}`,
          );
        }

        const now = new Date().toISOString();

        // Update the step
        const { error: stepUpdateErr } = await supabaseAdmin
          .from("approval_steps")
          .update({
            status: "approved",
            approved_at: now,
            approved_by: caller.name,
          })
          .eq("id", currentStep.id);
        if (stepUpdateErr) throw stepUpdateErr;

        // Check if all steps are now approved
        const updatedSteps = (steps || []).map(
          (s: Record<string, unknown>) =>
            s.id === currentStep.id
              ? { ...s, status: STEP_STATUS.APPROVED }
              : s,
        );
        const allApproved = isFullyApproved(
          updatedSteps as Array<{ status: string }>,
        );

        if (allApproved) {
          // Update request status to aprobado
          const { error: reqUpdateErr } = await supabaseAdmin
            .from("requests")
            .update({ status: "aprobado", approved_at: now })
            .eq("id", requestUuid);
          if (reqUpdateErr) throw reqUpdateErr;

          // Atomic budget consumption
          if (request.budget_id && Number(request.total_amount) > 0) {
            const amount = Number(request.total_amount);
            const { error: budgetErr } = await supabaseAdmin.rpc(
              "increment_budget_consumed",
              { budget_uuid: request.budget_id, amount },
            );
            // Fallback if RPC doesn't exist: read-update
            if (budgetErr) {
              console.warn(
                "[request-workflow] RPC fallback for budget consumption",
              );
              const { data: bData } = await supabaseAdmin
                .from("budgets")
                .select("consumed")
                .eq("id", request.budget_id)
                .single();
              if (bData) {
                await supabaseAdmin
                  .from("budgets")
                  .update({
                    consumed: (Number(bData.consumed) || 0) + amount,
                  })
                  .eq("id", request.budget_id);
              }
            }
          }
        }

        // Insert history entry
        await supabaseAdmin.from("approval_history").insert({
          request_id: requestUuid,
          action: "approved",
          step_label: currentStep.label,
          performed_by: caller.id,
          performed_by_name: caller.name,
          note: sanitizeText(comment) || `Aprobado por ${caller.name}`,
        });

        return new Response(
          JSON.stringify({ ok: true, allApproved }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // ─────────────────────────────────────────────────
      // REJECT — Reject at current step
      // ─────────────────────────────────────────────────
      case "reject": {
        const { requestUuid, reason } = payload;
        if (!requestUuid) throw new Error("requestUuid is required");

        // Load steps
        const { data: steps } = await supabaseAdmin
          .from("approval_steps")
          .select("*")
          .eq("request_id", requestUuid)
          .order("step_order", { ascending: true });

        const currentStep = (steps || []).find(
          (s: Record<string, unknown>) => s.status === "pending",
        );
        if (!currentStep) throw new Error("No pending step found");

        // Authorization
        if (caller.username !== currentStep.approver_username) {
          throw new Error("Not authorized to reject this step");
        }

        const now = new Date().toISOString();

        // Update the step
        await supabaseAdmin
          .from("approval_steps")
          .update({
            status: "rejected",
            approved_at: now,
            approved_by: caller.name,
          })
          .eq("id", currentStep.id);

        // Update request
        await supabaseAdmin
          .from("requests")
          .update({ status: "rechazado", rejected_at: now })
          .eq("id", requestUuid);

        // Insert history
        await supabaseAdmin.from("approval_history").insert({
          request_id: requestUuid,
          action: "rejected",
          step_label: currentStep.label,
          performed_by: caller.id,
          performed_by_name: caller.name,
          note:
            sanitizeMultiline(reason, 1000) ||
            `Rechazado por ${caller.name}`,
        });

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // REVISION — Send back to borrador, reset steps
      // ─────────────────────────────────────────────────
      case "revision": {
        const { requestUuid, reason } = payload;
        if (!requestUuid) throw new Error("requestUuid is required");

        // Authorization
        if (
          !hasPermission(caller, "approve_manager") &&
          !hasPermission(caller, "approve_purchase")
        ) {
          throw new Error("No permission to send for revision");
        }

        // Reset all approval steps to pending
        const { data: steps } = await supabaseAdmin
          .from("approval_steps")
          .select("id")
          .eq("request_id", requestUuid);

        if (steps && steps.length > 0) {
          const stepIds = steps.map((s: { id: string }) => s.id);
          await supabaseAdmin
            .from("approval_steps")
            .update({
              status: "pending",
              approved_at: null,
              approved_by: null,
            })
            .in("id", stepIds);
        }

        // Update request back to borrador
        await supabaseAdmin
          .from("requests")
          .update({ status: "borrador" })
          .eq("id", requestUuid);

        // Insert history
        await supabaseAdmin.from("approval_history").insert({
          request_id: requestUuid,
          action: "revision",
          performed_by: caller.id,
          performed_by_name: caller.name,
          note:
            sanitizeMultiline(reason, 1000) || "Devuelto para revisión",
        });

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ─────────────────────────────────────────────────
      // ADVANCE — Move to next status in STATUS_FLOW
      // ─────────────────────────────────────────────────
      case "advance": {
        const { requestUuid, newStatus } = payload;
        if (!requestUuid || !newStatus) {
          throw new Error("requestUuid and newStatus are required");
        }

        if (!hasPermission(caller, "advance_status")) {
          throw new Error("No permission to advance status");
        }

        // Validate status is a known value
        const VALID_STATUSES = [
          "borrador",
          "pendiente_aprobacion",
          "aprobado",
          "en_proceso_compra",
          "orden_emitida",
          "en_transito",
          "recibido",
          "entregado",
        ];
        if (!VALID_STATUSES.includes(newStatus)) {
          throw new Error(`Invalid status: ${newStatus}`);
        }

        const { error } = await supabaseAdmin
          .from("requests")
          .update({ status: newStatus })
          .eq("id", requestUuid);
        if (error) throw error;

        await supabaseAdmin.from("approval_history").insert({
          request_id: requestUuid,
          action: "advanced",
          performed_by: caller.id,
          performed_by_name: caller.name,
          note: `Avanzado a ${newStatus}`,
        });

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[request-workflow]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
