// ============================================================
// YPOTI — Approval Actions (Aprobar / Rechazar / Devolver)
// Botones de acción para el aprobador actual
// ============================================================
import { useState } from "react";
import { getCurrentStep, canUserApproveStep, STEP_STATUS } from "../../constants/approvalConfig";

export default function ApprovalActions({ request, currentUser, onApprove, onReject, onRevision }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [reason, setReason] = useState("");

  if (!request.approvalSteps || request.status === "rechazado") return null;

  const currentStep = getCurrentStep(request.approvalSteps);
  if (!currentStep) return null;

  const canApprove = canUserApproveStep(currentUser, currentStep, request.totalAmount || 0);
  if (!canApprove) {
    return (
      <div className="bg-amber-500/[0.06] rounded-xl px-4 py-3.5 border border-amber-500/[0.19] flex items-center gap-2.5">
        <span className="text-xl">⏳</span>
        <div>
          <div className="text-[13px] font-semibold text-amber-400">
            Pendiente de autorización/aprobación
          </div>
          <div className="text-xs text-amber-400">
            Esperando: {currentStep.approverName} ({currentStep.label})
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-[#1F2A44] to-[#C8A03A] rounded-2xl p-4 border border-white/10 shadow-md">
        <div className="text-xs font-semibold text-white/70 mb-1 uppercase tracking-wide">
          Tu autorización requerida
        </div>
        <div className="text-sm text-white font-medium mb-3.5">
          {currentStep.label} — Paso {request.approvalSteps.indexOf(currentStep) + 1} de {request.approvalSteps.length}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowRevisionModal(true)}
            className="flex-1 py-3 px-2 rounded-xl border border-white/25 bg-[#F8F9FB]/[0.08] text-white text-xs font-semibold cursor-pointer"
          >
            ↩ Devolver
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 py-3 px-2 rounded-xl border-none bg-red-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-red-500/30"
          >
            ✕ Rechazar
          </button>

          <button
            onClick={() => onApprove(request.id)}
            className="rounded-xl border-none bg-gradient-to-br from-green-500 to-green-500/80 text-white text-[13px] font-bold cursor-pointer shadow-md shadow-green-500/30"
            style={{ flex: 1.5, padding: "12px 8px" }}
          >
            ✓ Aprobar
          </button>
        </div>
      </div>

      {showRejectModal && (
        <ReasonModal
          title="Rechazar Solicitud"
          placeholder="Motivo del rechazo..."
          confirmLabel="Rechazar"
          confirmColor="#ef4444"
          reason={reason}
          setReason={setReason}
          onConfirm={() => {
            onReject(request.id, reason);
            setReason("");
            setShowRejectModal(false);
          }}
          onCancel={() => { setReason(""); setShowRejectModal(false); }}
        />
      )}

      {showRevisionModal && (
        <ReasonModal
          title="Devolver para Revisión"
          placeholder="Observaciones para el solicitante..."
          confirmLabel="Devolver"
          confirmColor="#f59e0b"
          reason={reason}
          setReason={setReason}
          onConfirm={() => {
            onRevision(request.id, reason);
            setReason("");
            setShowRevisionModal(false);
          }}
          onCancel={() => { setReason(""); setShowRevisionModal(false); }}
        />
      )}
    </>
  );
}

function ReasonModal({ title, placeholder, confirmLabel, confirmColor, reason, setReason, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-[1000] p-0 md:p-4">
      <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl px-5 pt-6 pb-8 animate-slideUp shadow-2xl bg-[var(--color-modal)] border border-[var(--color-border)]"
      >
        <div className="text-base font-semibold text-[var(--color-text)] mb-4">
          {title}
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl border-[1.5px] border-[var(--color-border)] px-3.5 py-3 text-sm bg-[var(--color-surface)] text-[var(--color-text)] resize-none box-border outline-none"
          autoFocus
        />
        <div className="flex gap-2.5 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl border-none text-white text-sm font-semibold cursor-pointer"
            style={{ background: confirmColor, boxShadow: `0 2px 8px ${confirmColor}40` }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
