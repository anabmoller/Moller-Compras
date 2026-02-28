// ============================================================
// YPOTI — Approval Actions (Aprobar / Rechazar / Devolver)
// Botones de acción para el aprobador actual
// ============================================================
import { useState } from "react";
import { colors, font, shadows, radius } from "../../styles/theme";
import { getCurrentStep, canUserApproveStep, STEP_STATUS } from "../../constants/approvalConfig";

export default function ApprovalActions({ request, currentUser, onApprove, onReject, onRevision }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [reason, setReason] = useState("");

  if (!request.approvalSteps || request.status === "rechazado") return null;

  const currentStep = getCurrentStep(request.approvalSteps);
  if (!currentStep) return null;

  const canApprove = canUserApproveStep(currentUser, currentStep);
  if (!canApprove) {
    return (
      <div style={{
        background: colors.warningLight, borderRadius: radius.lg, padding: "14px 16px",
        border: `1px solid ${colors.warning}30`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>⏳</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.warning }}>
            Pendiente de autorización/aprobación
          </div>
          <div style={{ fontSize: 12, color: colors.warning }}>
            Esperando: {currentStep.approverName} ({currentStep.label})
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        borderRadius: radius.xl, padding: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: shadows.md,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)",
          marginBottom: 4, textTransform: "uppercase", letterSpacing: 1,
        }}>
          Tu autorización requerida
        </div>
        <div style={{ fontSize: 14, color: "#fff", fontWeight: 500, marginBottom: 14 }}>
          {currentStep.label} — Paso {request.approvalSteps.indexOf(currentStep) + 1} de {request.approvalSteps.length}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowRevisionModal(true)}
            style={{
              flex: 1, padding: "12px 8px", borderRadius: radius.lg,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff", fontSize: 12, fontWeight: 600,
              fontFamily: font, cursor: "pointer",
            }}
          >
            ↩ Devolver
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            style={{
              flex: 1, padding: "12px 8px", borderRadius: radius.lg,
              border: "none",
              background: colors.danger,
              color: "#fff", fontSize: 12, fontWeight: 600,
              fontFamily: font, cursor: "pointer",
              boxShadow: `0 2px 8px ${colors.danger}40`,
            }}
          >
            ✕ Rechazar
          </button>

          <button
            onClick={() => onApprove(request.id)}
            style={{
              flex: 1.5, padding: "12px 8px", borderRadius: radius.lg,
              border: "none",
              background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}cc 100%)`,
              color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: font, cursor: "pointer",
              boxShadow: `0 2px 12px ${colors.success}40`,
            }}
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
          confirmColor={colors.danger}
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
          confirmColor={colors.warning}
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
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 1000, padding: 0,
    }}>
      <div style={{
        background: colors.card, width: "100%", maxWidth: 480,
        borderRadius: `${radius.xl}px ${radius.xl}px 0 0`, padding: "24px 20px 32px",
        animation: "slideUp 0.25s ease",
        boxShadow: shadows.modal,
      }}>
        <div style={{
          fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 16,
        }}>
          {title}
        </div>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: "100%", borderRadius: radius.lg, border: `1.5px solid ${colors.border}`,
            padding: "12px 14px", fontSize: 14, fontFamily: font,
            background: colors.bg, color: colors.text, resize: "none",
            boxSizing: "border-box",
          }}
          autoFocus
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: 14, borderRadius: radius.lg,
              border: `1px solid ${colors.border}`, background: colors.bg,
              color: colors.text, fontSize: 14, fontWeight: 500,
              fontFamily: font, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: 14, borderRadius: radius.lg,
              border: "none", background: confirmColor,
              color: "#fff", fontSize: 14, fontWeight: 600,
              fontFamily: font, cursor: "pointer",
              boxShadow: `0 2px 8px ${confirmColor}40`,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
