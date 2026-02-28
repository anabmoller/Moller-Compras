// ============================================================
// YPOTI — Supabase Query Layer
// READs: anon client (RLS handles filtering)
// WRITEs: Edge Functions (service_role server-side)
// ============================================================

import { supabase } from "./supabase";

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

// ---- Helper: group array items by a key ----
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

/** Fetch all requests with nested data */
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

/** Fetch a single request with all nested data */
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
// WRITE OPERATIONS — Via Edge Functions
// ============================================================

/** Insert a new request (status: borrador) + its items */
export async function insertRequest(req) {
  const { data, error } = await supabase.functions.invoke("request-mutations", {
    body: { action: "create", request: req },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data.requestUuid;
}

/** Confirm request: server calculates steps, submits for approval */
export async function confirmRequestInDb(requestUuid) {
  const { data, error } = await supabase.functions.invoke("request-workflow", {
    body: { action: "confirm", requestUuid },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Approve current step */
export async function approveStepInDb(requestUuid, comment) {
  const { data, error } = await supabase.functions.invoke("request-workflow", {
    body: { action: "approve", requestUuid, comment },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Reject request at current step */
export async function rejectRequestInDb(requestUuid, reason) {
  const { data, error } = await supabase.functions.invoke("request-workflow", {
    body: { action: "reject", requestUuid, reason },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Send request back for revision */
export async function sendForRevisionInDb(requestUuid, reason) {
  const { data, error } = await supabase.functions.invoke("request-workflow", {
    body: { action: "revision", requestUuid, reason },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Advance request status to next step in STATUS_FLOW */
export async function advanceStatusInDb(requestUuid, newStatus) {
  const { data, error } = await supabase.functions.invoke("request-workflow", {
    body: { action: "advance", requestUuid, newStatus },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Update request fields */
export async function updateRequestInDb(requestUuid, updates) {
  const { data, error } = await supabase.functions.invoke("request-mutations", {
    body: { action: "update", requestUuid, updates },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Add a comment to a request */
export async function addCommentInDb(requestUuid, texto) {
  const { data, error } = await supabase.functions.invoke("request-mutations", {
    body: { action: "add-comment", requestUuid, texto },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

/** Add a quotation to a request */
export async function addQuotationInDb(requestUuid, quotation) {
  const { data, error } = await supabase.functions.invoke("request-mutations", {
    body: { action: "add-quotation", requestUuid, quotation },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}
