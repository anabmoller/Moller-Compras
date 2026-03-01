// ============================================================
// YPOTI — Supabase Query Layer
// READs: anon client (RLS handles filtering)
// WRITEs: Edge Functions via direct fetch (bypasses supabase-js locks)
// ============================================================
// FIX v4: More robust token retrieval with clear error messages
// ============================================================

import { supabase, supabaseUrl, supabaseAnonKey, getStoredToken } from "./supabase";

// ---- Edge Function helper: direct fetch, no supabase-js dependency ----
async function invokeEdgeFunction(functionName, body) {
  // Primary: use the in-memory stored token (set by login or onAuthStateChange)
  let token = getStoredToken();

  // Fallback 1: try supabase-js session (with 3s timeout)
  if (!token) {
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 3000)),
      ]);
      token = result?.data?.session?.access_token;
      // If we got it from supabase-js, also update the store for next time
      if (token) {
        const { setStoredToken } = await import("./supabase");
        setStoredToken(token);
      }
    } catch {
      // getSession timed out or failed — try localStorage directly
    }
  }

  // Fallback 2: try reading from localStorage directly
  if (!token) {
    try {
      const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
      if (ref) {
        const raw = localStorage.getItem(`sb-${ref}-auth-token`);
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.access_token;
        }
      }
    } catch {}
  }

  if (!token) {
    throw new Error("No hay sesión activa. Por favor, inicia sesión de nuevo.");
  }

  // Direct fetch to Edge Function endpoint
  const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // If 401, the token might be expired — try to refresh
    if (res.status === 401) {
      const freshToken = await tryRefreshToken();
      if (freshToken) {
        // Retry with the fresh token
        const retryRes = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${freshToken}`,
            "apikey": supabaseAnonKey,
          },
          body: JSON.stringify(body),
        });

        if (retryRes.ok) {
          const data = await retryRes.json();
          if (data?.error) throw new Error(data.error);
          return data;
        }
      }

      // Refresh failed — force re-login
      throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
    }

    const errBody = await res.json().catch(() => ({}));
    const msg = errBody.error || errBody.message || `Error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return data;
}

// ---- Try to refresh the token when we get a 401 ----
async function tryRefreshToken() {
  try {
    const { data, error } = await Promise.race([
      supabase.auth.refreshSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 5000)),
    ]);

    if (error || !data?.session?.access_token) return null;

    const newToken = data.session.access_token;
    const { setStoredToken } = await import("./supabase");
    setStoredToken(newToken);
    return newToken;
  } catch {
    return null;
  }
}

// ---- Transformers: Supabase (snake_case) -> Frontend (camelCase) ----

function transformRequest(row, items = [], quotations = [], comments = [], steps = [], history = []) {
  return {
    id: row.request_number,
    _uuid: row.id,
    name: row.name,
    requester: row.requester,
    createdBy: row.created_by_name || "",
    createdById: row.created_by,
    establishment: row.establishment,
    company: row.company,
    sector: row.sector,
    type: row.type,
    priority: row.priority,
    status: row.status,
    totalAmount: Number(row.total_amount) || 0,
    quantity: row.quantity,
    reason: row.reason,
    purpose: row.purpose,
    equipment: row.equipment,
    suggestedSupplier: row.suggested_supplier,
    notes: row.notes,
    supplier: row.supplier,
    assignee: row.assignee,
    budgetId: row.budget_id,
    budgetExceeded: row.budget_exceeded || false,
    date: row.date,
    confirmedAt: row.confirmed_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    createdAt: row.created_at,
    items: items.map(transformItem),
    quotations: quotations.map(transformQuotation),
    comments: comments.map(transformComment),
    approvalSteps: steps.length > 0 ? steps.map(transformStep) : null,
    approvalHistory: history.map(transformHistoryEntry),
  };
}

function transformItem(row) {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    unitPrice: Number(row.unit_price) || 0,
    totalPrice: Number(row.total_price) || 0,
    notes: row.notes,
    sortOrder: row.sort_order,
  };
}

function transformQuotation(row) {
  return {
    id: row.id,
    supplier: row.supplier,
    currency: row.currency,
    price: Number(row.price) || 0,
    deliveryDays: row.delivery_days,
    paymentTerms: row.payment_terms,
    notes: row.notes,
    selected: row.selected,
    date: row.date,
  };
}

function transformComment(row) {
  return {
    id: row.id,
    author: row.author_name,
    authorId: row.author_id,
    texto: row.texto,
    createdAt: row.created_at,
  };
}

function transformStep(row) {
  return {
    id: row.id,
    stepOrder: row.step_order,
    type: row.type,
    label: row.label,
    approverUsername: row.approver_username,
    approverName: row.approver_name,
    sla: row.sla_hours,
    conditional: row.conditional,
    status: row.status,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
  };
}

function transformHistoryEntry(row) {
  return {
    id: row.id,
    action: row.action,
    step: row.step_label,
    by: row.performed_by_name,
    performedById: row.performed_by,
    at: row.created_at,
    note: row.note,
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

// ============================================================
// FETCH OPERATIONS (anon client + RLS)
// ============================================================

export async function fetchAllRequests() {
  const [reqRes, itemsRes, quotRes, commRes, stepsRes, histRes] = await Promise.all([
    supabase.from("requests").select("*").order("created_at", { ascending: false }),
    supabase.from("request_items").select("*"),
    supabase.from("quotations").select("*"),
    supabase.from("comments").select("*").order("created_at", { ascending: true }),
    supabase.from("approval_steps").select("*").order("step_order", { ascending: true }),
    supabase.from("approval_history").select("*").order("created_at", { ascending: true }),
  ]);

  if (reqRes.error) {
    console.error("[Queries] Failed to fetch requests:", reqRes.error.message);
    return [];
  }

  const requests = reqRes.data || [];
  const items = itemsRes.data || [];
  const quotations = quotRes.data || [];
  const comments = commRes.data || [];
  const steps = stepsRes.data || [];
  const history = histRes.data || [];

  const itemsByReq = groupBy(items, "request_id");
  const quotByReq = groupBy(quotations, "request_id");
  const commByReq = groupBy(comments, "request_id");
  const stepsByReq = groupBy(steps, "request_id");
  const histByReq = groupBy(history, "request_id");

  return requests.map(r => transformRequest(
    r,
    itemsByReq[r.id] || [],
    quotByReq[r.id] || [],
    commByReq[r.id] || [],
    stepsByReq[r.id] || [],
    histByReq[r.id] || [],
  ));
}

export async function fetchSingleRequest(requestUuid) {
  const [reqRes, itemsRes, quotRes, commRes, stepsRes, histRes] = await Promise.all([
    supabase.from("requests").select("*").eq("id", requestUuid).single(),
    supabase.from("request_items").select("*").eq("request_id", requestUuid),
    supabase.from("quotations").select("*").eq("request_id", requestUuid),
    supabase.from("comments").select("*").eq("request_id", requestUuid).order("created_at", { ascending: true }),
    supabase.from("approval_steps").select("*").eq("request_id", requestUuid).order("step_order", { ascending: true }),
    supabase.from("approval_history").select("*").eq("request_id", requestUuid).order("created_at", { ascending: true }),
  ]);

  if (reqRes.error) {
    console.error("[Queries] Failed to fetch request:", reqRes.error.message);
    return null;
  }

  return transformRequest(
    reqRes.data,
    itemsRes.data || [],
    quotRes.data || [],
    commRes.data || [],
    stepsRes.data || [],
    histRes.data || [],
  );
}

// ============================================================
// WRITE OPERATIONS — Via Edge Functions (direct fetch)
// ============================================================

export async function insertRequest(req) {
  const data = await invokeEdgeFunction("request-mutations", {
    action: "create", request: req,
  });
  return data.requestUuid;
}

export async function confirmRequestInDb(requestUuid) {
  await invokeEdgeFunction("request-workflow", {
    action: "confirm", requestUuid,
  });
}

export async function approveStepInDb(requestUuid, comment) {
  return await invokeEdgeFunction("request-workflow", {
    action: "approve", requestUuid, comment,
  });
}

export async function rejectRequestInDb(requestUuid, reason) {
  await invokeEdgeFunction("request-workflow", {
    action: "reject", requestUuid, reason,
  });
}

export async function sendForRevisionInDb(requestUuid, reason) {
  await invokeEdgeFunction("request-workflow", {
    action: "revision", requestUuid, reason,
  });
}

export async function advanceStatusInDb(requestUuid, newStatus) {
  await invokeEdgeFunction("request-workflow", {
    action: "advance", requestUuid, newStatus,
  });
}

export async function updateRequestInDb(requestUuid, updates) {
  await invokeEdgeFunction("request-mutations", {
    action: "update", requestUuid, updates,
  });
}

export async function addCommentInDb(requestUuid, texto) {
  await invokeEdgeFunction("request-mutations", {
    action: "add-comment", requestUuid, texto,
  });
}

export async function addQuotationInDb(requestUuid, quotation) {
  await invokeEdgeFunction("request-mutations", {
    action: "add-quotation", requestUuid, quotation,
  });
}
