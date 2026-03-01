// ============================================================
// YPOTI — RequestDetail — Módulo 3 (PRD Completo)
// Detalle Precoro-style: Header, InfoGrid, Items, Comments,
// Trazabilidad, Approval, Budget, Quotations, Attachments
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { STATUS_FLOW, URGENCY_LEVELS } from "../../constants";
import { generateCommentId } from "../../utils/ids";
import AddItemModal from "./AddItemModal";
import QuotationPanel from "../quotations/QuotationPanel";
import ApprovalFlow from "../approval/ApprovalFlow";
import ApprovalActions from "../approval/ApprovalActions";
import BudgetWidget from "../approval/BudgetWidget";
import { useAuth } from "../../context/AuthContext";
import { formatGuaranies } from "../../constants/budgets";
import { getStatusDisplay, getPriorityDisplay, normalizeStatus } from "../../utils/statusHelpers";
import { fmtDate } from "../../utils/dateFormatters";
import { getSectors, getProductTypes } from "../../constants/parameters";
import { MANAGER_MAP, COMPANY_MAP, PRESIDENT_MAP, ESTABLISHMENT_COMPANY, USER_DISPLAY_NAMES } from "../../constants/approvalConfig";

// ---- Extracted sub-components ----
import RequestHeader from "./RequestHeader";
import RequestItemsTable from "./RequestItemsTable";
import QuotationComparison from "./QuotationComparison";
import RequestComments from "./RequestComments";
import RequestTimeline from "./RequestTimeline";

// ---- Shared sub-components (kept inline — small & used only here) ----

function InfoGrid({ children }) {
  return (
    <div className="info-grid grid grid-cols-2 gap-0 bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden shadow-sm">
      {children}
    </div>
  );
}

function InfoCell({ label, value, color, icon, span2 }) {
  return (
    <div
      className={`px-4 py-3 border-b border-white/[0.06] ${span2 ? 'col-span-full' : ''}`}
    >
      <div className="text-[11px] text-slate-400 font-medium mb-0.5">{label}</div>
      <div
        className="text-[13px] font-medium text-white flex items-center gap-1"
        style={color ? { color } : undefined}
      >
        {icon && <span className="text-xs">{icon}</span>}
        {value || "—"}
      </div>
    </div>
  );
}

function ActionBtn({ label, icon, color, bg, outline, onClick, flex }) {
  return (
    <button
      onClick={onClick}
      className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
        outline
          ? 'bg-transparent border-[1.5px]'
          : 'border-none text-white shadow-sm'
      }`}
      style={{
        flex: flex || 1,
        ...(outline
          ? { borderColor: color || 'rgba(255,255,255,0.06)', color: color || '#fff' }
          : { background: bg || color || '#10b981' }),
      }}
    >
      {icon && <span>{icon}</span>}{label}
    </button>
  );
}

function getApprovalChain(amount, establishment) {
  const dn = (u) => USER_DISPLAY_NAMES[u] || u;
  const managerUsername = MANAGER_MAP[establishment] || "ronei";
  const steps = [{ label: "Autorización Gerente", person: dn(managerUsername), icon: "①" }];
  if (amount >= 5_000_000) {
    const company = ESTABLISHMENT_COMPANY[establishment] || "Rural Bioenergia S.A.";
    const directorUsername = COMPANY_MAP[company] || "ronei";
    steps.push({ label: "Aprobación Director", person: dn(directorUsername), icon: "②" });
  }
  if (amount >= 50_000_000) {
    const company = ESTABLISHMENT_COMPANY[establishment] || "Rural Bioenergia S.A.";
    const presidentUsername = PRESIDENT_MAP[company];
    if (presidentUsername) {
      steps.push({ label: "Aprobación Presidente", person: dn(presidentUsername), icon: "③" });
    }
  }
  return steps;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function RequestDetail({
  request: r, onBack, onAdvance, onUpdateRequest, canManageQuotations,
  onConfirm, onApprove, onReject, onRevision, onCancel,
  onPrev, onNext, hasPrev, hasNext, usdRate,
}) {
  const { currentUser } = useAuth();
  const [showQuotations, setShowQuotations] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Comments state
  const [comments, setComments] = useState(r.comments || []);
  const [commentText, setCommentText] = useState("");
  const [commentInternal, setCommentInternal] = useState(false);

  // Editable note (maps to `reason` column in DB)
  const [note, setNote] = useState(r.reason || r.notes || "");
  const noteTimer = useRef(null);
  const saveNote = useCallback((val) => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      if (onUpdateRequest) onUpdateRequest(r.id, { reason: val });
    }, 500);
  }, [r.id, onUpdateRequest]);

  // Collapsible sections
  const [showTrazabilidad, setShowTrazabilidad] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  // Items state (editable in borrador)
  const [items, setItems] = useState(r.items || []);

  // Attachments state
  const [attachments, setAttachments] = useState(r.adjuntos || []);

  // Sync state if request changes
  useEffect(() => {
    setComments(r.comments || []);
    setNote(r.reason || r.notes || "");
    setItems(r.items || []);
    setAttachments(r.adjuntos || []);
  }, [r.id, r.comments, r.notes, r.reason, r.items, r.adjuntos]);

  const normalizedStatus = normalizeStatus(r.status);
  const status = getStatusDisplay(r.status);
  const statusIdx = STATUS_FLOW.findIndex(s => s.key === normalizedStatus);
  const isLast = statusIdx === STATUS_FLOW.length - 1;
  const isRejected = r.status === "rechazado";
  const isBorrador = normalizedStatus === "borrador";
  const isCancelado = r.status === "cancelado";
  const isInApproval = normalizedStatus === "pend_autorizacion" || normalizedStatus === "pend_aprobacion";
  const canCancel = onCancel && !isCancelado && normalizedStatus !== "recibido" && normalizedStatus !== "sap"
    && (r.createdBy === currentUser?.name || currentUser?.role === "diretoria");

  const urgency = URGENCY_LEVELS.find(u => u.value === (r.priority || r.urgency));
  const priority = getPriorityDisplay(r.priority || r.urgency);
  const showQuotationBtn = canManageQuotations && statusIdx >= 2;
  const quotationCount = r.quotations?.length || 0;

  // Items total — handles both DB field names (English) and AddItemModal field names (Spanish)
  const itemsTotal = items.reduce((sum, it) => {
    const price = it.unitPrice || it.precioUnitario || 0;
    const qty = it.quantity || it.cantidad || 0;
    return sum + (price * qty);
  }, 0);
  const displayTotal = itemsTotal > 0 ? itemsTotal : (r.totalAmount || 0);
  const rate = usdRate || 7800;

  // ---- Handlers ----
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: generateCommentId(),
      author: currentUser.name,
      autor: currentUser.name,
      avatar: currentUser.avatar,
      createdAt: new Date().toISOString(),
      fecha: new Date().toISOString(),
      texto: commentText.trim(),
      interno: commentInternal,
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setCommentText("");
    setCommentInternal(false);
    if (onUpdateRequest) onUpdateRequest(r.id, { comments: updated });
  };

  const calcItemsTotal = (arr) => arr.reduce((s, it) => {
    const price = it.unitPrice || it.precioUnitario || 0;
    const qty = it.quantity || it.cantidad || 0;
    return s + (price * qty);
  }, 0);

  const handleRemoveItem = (idx) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    if (onUpdateRequest) onUpdateRequest(r.id, { items: updated, totalAmount: calcItemsTotal(updated) });
  };

  const handleAddItem = (item) => {
    const updated = [...items, item];
    setItems(updated);
    setShowAddItem(false);
    if (onUpdateRequest) onUpdateRequest(r.id, { items: updated, totalAmount: calcItemsTotal(updated) });
  };

  const handleAttachmentsChange = (updated) => {
    setAttachments(updated);
    if (onUpdateRequest) onUpdateRequest(r.id, { adjuntos: updated });
  };

  // ---- RENDER ----
  return (
    <div className="animate-fadeIn pb-[100px]">

      {/* ===== HEADER (nav, title, priority, rejected banner) ===== */}
      <RequestHeader
        request={r}
        status={status}
        priority={priority}
        urgency={urgency}
        rate={rate}
        onBack={onBack}
        onPrev={onPrev}
        onNext={onNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      {/* ===== APPROVAL ACTIONS (for current approver) ===== */}
      {isInApproval && r.approvalSteps && (
        <div className="px-5 mb-3">
          <ApprovalActions
            request={r} currentUser={currentUser}
            onApprove={onApprove} onReject={onReject} onRevision={onRevision}
          />
        </div>
      )}

      {/* ===== PROGRESS BAR ===== */}
      {!isRejected && !isCancelado && statusIdx >= 0 && (
        <div className="px-5 pb-1">
          <div className="flex gap-0.5 mb-1.5 px-0.5">
            {STATUS_FLOW.map((s, i) => (
              <div
                key={s.key}
                className="flex-1 h-[5px] rounded-sm transition-colors duration-300"
                style={{ background: i <= statusIdx ? status.color : 'rgba(255,255,255,0.06)' }}
              />
            ))}
          </div>
          <div className="flex justify-between items-center px-0.5">
            <span className="text-xs font-medium" style={{ color: status.color }}>
              Paso {statusIdx + 1} de {STATUS_FLOW.length}
            </span>
            <div className="flex gap-1.5">
              {isBorrador && onConfirm && (
                <button
                  onClick={() => onConfirm(r.id)}
                  className="bg-emerald-500 text-white border-none rounded px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer shadow-sm"
                >
                  Confirmar ✓
                </button>
              )}
              {!isBorrador && !isInApproval && !isLast && !isRejected && onAdvance && (
                <button
                  onClick={() => onAdvance(r.id)}
                  className="text-white border-none rounded px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer shadow-sm"
                  style={{ background: STATUS_FLOW[statusIdx + 1]?.color || '#10b981' }}
                >
                  → {STATUS_FLOW[statusIdx + 1]?.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== APPROVAL FLOW (dots) ===== */}
      {r.approvalSteps?.length > 0 && (
        <div className="px-5 py-2">
          <ApprovalFlow steps={r.approvalSteps} />
        </div>
      )}

      {/* ===== APPROVAL CHAIN VISUAL STEPPER ===== */}
      {displayTotal > 0 && !isRejected && (() => {
        const chain = getApprovalChain(displayTotal, r.establishment);
        const approvedCount = r.approvalHistory?.filter(h => h.action === "approved").length || 0;
        return (
          <div className="px-5 py-2">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Flujo de Aprobación
            </div>
            <div className="bg-white/[0.03] rounded-xl px-4 py-3.5 border border-white/[0.06]">
              <div className="flex items-center gap-0">
                {chain.map((step, i) => {
                  const isApproved = i < approvedCount;
                  const isPending = i === approvedCount && isInApproval;
                  const textColor = isApproved ? "#22c55e" : isPending ? "#eab308" : "#64748b";
                  return (
                    <div key={i} className="flex items-center" style={{ flex: i < chain.length - 1 ? 1 : "none" }}>
                      <div className="flex flex-col items-center" style={{ minWidth: 56 }}>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                          style={{
                            background: isApproved ? "#22c55e" : isPending ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.06)",
                            color: isApproved ? "#fff" : isPending ? "#eab308" : "#475569",
                            border: isPending ? "2px solid #eab308" : isApproved ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.08)",
                            boxShadow: isPending ? "0 0 0 3px rgba(234,179,8,0.12)" : isApproved ? "0 0 0 3px rgba(34,197,94,0.12)" : "none",
                          }}
                        >
                          {isApproved ? "✓" : step.icon}
                        </div>
                        <div className="text-[10px] font-semibold mt-1.5 text-center leading-tight" style={{ color: textColor }}>
                          {step.person}
                        </div>
                        <div className="text-[9px] text-slate-500 text-center mt-0.5">
                          {step.label}
                        </div>
                      </div>
                      {i < chain.length - 1 && (
                        <div
                          className="h-0.5 flex-1 mx-1 rounded-full"
                          style={{ background: isApproved ? "#22c55e" : "rgba(255,255,255,0.08)" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== INFO GRID ===== */}
      <div className="px-5 py-2">
        <InfoGrid>
          <InfoCell label="Solicitante" value={r.requester} icon="👤" />
          <InfoCell label="Fecha de Creación" value={fmtDate(r.date)} />
          <InfoCell label="Establecimiento" value={r.establishment} />
          <InfoCell
            label="Urgencia"
            value={priority?.label || r.priority || r.urgency || "—"}
            color={urgency?.color}
            icon={urgency?.icon}
          />
          <InfoCell
            label="Sector"
            value={r.sector || r.type}
            icon={getSectors().find(s => s.name === (r.sector || r.type))?.icon}
          />
          <InfoCell
            label="Tipo de Producto"
            value={r.type}
            icon={getProductTypes().find(t => t.name === r.type)?.icon}
          />
          <InfoCell label="Cantidad" value={r.quantity} />
          <InfoCell label="Asignado a" value={r.assignee || "Sin asignar"} />
          {r.equipment && <InfoCell label="Equipo" value={r.equipment} span2 />}
          {displayTotal > 0 && (
            <InfoCell
              label="Total Estimado"
              value={`${formatGuaranies(displayTotal)} / USD ${Math.round(displayTotal / rate).toLocaleString("es-PY")}`}
              color="#10b981"
              span2
            />
          )}
        </InfoGrid>
      </div>

      {/* ===== NOTE (editable) ===== */}
      <div className="px-5 py-2">
        <div className="bg-white/[0.03] rounded-xl px-4 py-3 border border-white/[0.06]">
          <div className="text-[11px] text-slate-400 font-medium mb-1.5">
            Nota / Motivo
          </div>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); saveNote(e.target.value); }}
            placeholder="+ Agregar nota..."
            rows={2}
            className="w-full border-none bg-transparent text-[13px] text-white resize-none outline-none p-0 leading-relaxed"
          />
        </div>
      </div>

      {/* ===== ITEMS TABLE ===== */}
      <RequestItemsTable
        items={items}
        itemsTotal={itemsTotal}
        displayTotal={displayTotal}
        rate={rate}
        isBorrador={isBorrador}
        onRemoveItem={handleRemoveItem}
        onShowAddItem={() => setShowAddItem(true)}
      />

      {/* ===== BUDGET WIDGET ===== */}
      <div className="px-5 py-2">
        <BudgetWidget
          establishment={r.establishment}
          sector={r.sector || r.type}
          requestAmount={displayTotal}
        />
      </div>

      {/* ===== LEGAL NOTICE ===== */}
      <div className="px-5 py-1">
        <div className="bg-amber-500/[0.04] rounded-lg px-3 py-2 border border-amber-500/[0.1]">
          <div className="text-[10px] text-amber-400 font-medium text-center">
            Toda compra debe contar con factura legal vigente
          </div>
        </div>
      </div>

      {/* ===== QUOTATIONS + COMPARISON ===== */}
      <QuotationComparison
        request={r}
        normalizedStatus={normalizedStatus}
        quotationCount={quotationCount}
        showQuotationBtn={showQuotationBtn}
        canManageQuotations={canManageQuotations}
        rate={rate}
        onShowQuotations={() => setShowQuotations(true)}
      />

      {/* ===== COMMENTS ===== */}
      <RequestComments
        comments={comments}
        commentText={commentText}
        commentInternal={commentInternal}
        onCommentTextChange={setCommentText}
        onCommentInternalChange={setCommentInternal}
        onAddComment={handleAddComment}
      />

      {/* ===== TRAZABILIDAD + ATTACHMENTS ===== */}
      <RequestTimeline
        request={r}
        statusIdx={statusIdx}
        showTrazabilidad={showTrazabilidad}
        onToggleTrazabilidad={() => setShowTrazabilidad(!showTrazabilidad)}
        showAttachments={showAttachments}
        onToggleAttachments={() => setShowAttachments(!showAttachments)}
        attachments={attachments}
        onAttachmentsChange={handleAttachmentsChange}
      />

      {/* ===== MOBILE BOTTOM ACTION BAR ===== */}
      <div className="mobile-bottom-action-bar fixed bottom-16 left-0 right-0 px-5 py-2.5 bg-white/[0.03] border-t border-white/[0.06] flex gap-2 z-30 max-w-[480px] mx-auto">
        {isBorrador && onConfirm && (
          <ActionBtn label="Confirmar ✓" color="#10b981" bg="linear-gradient(135deg, #10b981, #059669)" onClick={() => onConfirm(r.id)} flex={2} />
        )}
        {!isBorrador && !isInApproval && !isLast && !isRejected && !isCancelado && onAdvance && (
          <ActionBtn
            label={`→ ${STATUS_FLOW[statusIdx + 1]?.label || "Avanzar"}`}
            color={STATUS_FLOW[statusIdx + 1]?.color || "#10b981"}
            onClick={() => onAdvance(r.id)}
            flex={2}
          />
        )}
        {(isBorrador || (!isBorrador && !isInApproval && !isLast && !isRejected && !isCancelado)) && (
          <ActionBtn label="✕" color="#ef4444" outline onClick={onBack} />
        )}
        {canCancel && (
          <ActionBtn label="Cancelar" icon="🚫" color="#ef4444" outline onClick={() => setShowCancelModal(true)} />
        )}
        {isRejected && (
          <div className="flex-1 text-xs text-red-400 flex items-center justify-center font-medium">
            ❌ Solicitud rechazada
          </div>
        )}
        {isCancelado && (
          <div className="flex-1 text-xs text-red-400 flex items-center justify-center font-medium">
            🚫 Solicitud cancelada
          </div>
        )}
        {isLast && (
          <div className="flex-1 text-xs text-green-400 flex items-center justify-center font-medium">
            ✅ Proceso completado
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}
      {showQuotations && (
        <QuotationPanel
          request={r}
          onClose={() => setShowQuotations(false)}
          onSave={(reqId, updates) => { onUpdateRequest(reqId, updates); setShowQuotations(false); }}
        />
      )}
      {showAddItem && (
        <AddItemModal onClose={() => setShowAddItem(false)} onAdd={handleAddItem} />
      )}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-5" onClick={() => setShowCancelModal(false)}>
          <div className="bg-[#1a1b23] rounded-2xl w-full max-w-sm border border-white/[0.08] p-5" onClick={e => e.stopPropagation()}>
            <div className="text-base font-semibold text-white mb-1">Cancelar Solicitud</div>
            <div className="text-xs text-slate-400 mb-4">Esta acción no se puede deshacer. La solicitud quedará en estado cancelado.</div>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelación (requerido)..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none mb-3 resize-none focus:border-red-500/50"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="flex-1 py-2.5 rounded-lg border border-white/[0.06] bg-transparent text-white text-sm font-medium cursor-pointer"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  if (!cancelReason.trim()) return;
                  onCancel(r.id, cancelReason.trim());
                  setShowCancelModal(false);
                  setCancelReason("");
                }}
                disabled={!cancelReason.trim()}
                className="flex-1 py-2.5 rounded-lg border-none text-white text-sm font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: cancelReason.trim() ? '#ef4444' : '#ef444466' }}
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* InfoGrid responsive style */}
      <style>{`
        @media (max-width: 480px) {
          .info-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 768px) {
          .mobile-bottom-action-bar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
