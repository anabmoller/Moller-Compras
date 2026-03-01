// ============================================================
// YPOTI — RequestDetail — Módulo 3 (PRD Completo)
// Detalle Precoro-style: Header, InfoGrid, Items, Comments,
// Trazabilidad, Approval, Budget, Quotations, Attachments
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { colors, font, fontDisplay, inputStyle, shadows, radius } from "../../styles/theme";
import { STATUS_FLOW, URGENCY_LEVELS, PRIORITY_LEVELS } from "../../constants";
import { generateCommentId } from "../../utils/ids";
import AddItemModal from "./AddItemModal";
import AttachmentUpload from "./AttachmentUpload";
import QuotationPanel from "../quotations/QuotationPanel";
import ApprovalFlow from "../approval/ApprovalFlow";
import ApprovalActions from "../approval/ApprovalActions";
import BudgetWidget from "../approval/BudgetWidget";
import { useAuth } from "../../context/AuthContext";
import { formatGuaranies } from "../../constants/budgets";
import { getStatusDisplay, getPriorityDisplay } from "../../utils/statusHelpers";
import { fmtDate, fmtDateTime } from "../../utils/dateFormatters";
import { getSectors, getProductTypes } from "../../constants/parameters";

// ---- Sub-components ----

function SectionTitle({ children, count, collapsed, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: collapsed ? 0 : 12,
        cursor: onToggle ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      <div style={{
        fontSize: 12, fontWeight: 600, color: colors.textLight,
        textTransform: "uppercase", letterSpacing: 1,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {children}
        {count != null && (
          <span style={{
            background: colors.primary + "15", color: colors.primary,
            fontSize: 10, fontWeight: 700, padding: "1px 7px",
            borderRadius: radius.md, minWidth: 18, textAlign: "center",
          }}>{count}</span>
        )}
      </div>
      {onToggle && (
        <span style={{ fontSize: 14, color: colors.textLight, transition: "transform 0.2s",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0)" }}>▾</span>
      )}
    </div>
  );
}

function InfoGrid({ children }) {
  return (
    <div className="info-grid" style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 0,
      background: colors.card, borderRadius: radius.lg,
      border: `1px solid ${colors.borderLight}`, overflow: "hidden",
      boxShadow: shadows.card,
    }}>
      {children}
    </div>
  );
}

function InfoCell({ label, value, color, icon, span2 }) {
  return (
    <div style={{
      padding: "12px 16px",
      borderBottom: `1px solid ${colors.borderLight}`,
      gridColumn: span2 ? "1 / -1" : undefined,
    }}>
      <div style={{ fontSize: 11, color: colors.textLight, fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <div style={{
        fontSize: 13, fontWeight: 500, color: color || colors.text,
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
        {value || "—"}
      </div>
    </div>
  );
}

function ActionBtn({ label, icon, color, bg, outline, onClick, flex }) {
  return (
    <button onClick={onClick} style={{
      flex: flex || 1, padding: "11px 12px", borderRadius: radius.md,
      border: outline ? `1.5px solid ${color || colors.border}` : "none",
      background: outline ? "transparent" : (bg || color || colors.primary),
      color: outline ? (color || colors.text) : "#fff",
      fontSize: 12, fontWeight: 600, fontFamily: font, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      boxShadow: outline ? "none" : shadows.sm,
      transition: "all 0.15s",
    }}>
      {icon && <span>{icon}</span>}{label}
    </button>
  );
}

function NavBtn({ icon, label, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: "transparent", border: "none", cursor: disabled ? "default" : "pointer",
      fontFamily: font, fontSize: 13, color: disabled ? colors.border : colors.primary,
      fontWeight: 500, padding: "6px 8px", display: "flex", alignItems: "center", gap: 3,
      opacity: disabled ? 0.4 : 1,
    }}>
      {icon} {label}
    </button>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function RequestDetail({
  request: r, onBack, onAdvance, onUpdateRequest, canManageQuotations,
  onConfirm, onApprove, onReject, onRevision,
  onPrev, onNext, hasPrev, hasNext,
}) {
  const { currentUser } = useAuth();
  const [showQuotations, setShowQuotations] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

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

  const status = getStatusDisplay(r.status);
  const statusIdx = STATUS_FLOW.findIndex(s => s.key === r.status);
  const isLast = statusIdx === STATUS_FLOW.length - 1;
  const isRejected = r.status === "rechazado";
  const isBorrador = r.status === "borrador";
  const isInApproval = r.status === "pendiente_aprobacion";

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

  // ---- Handlers ----
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: generateCommentId(),
      author: currentUser.name,
      autor: currentUser.name,       // backward compat
      avatar: currentUser.avatar,
      createdAt: new Date().toISOString(),
      fecha: new Date().toISOString(), // backward compat
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
    <div style={{ animation: "fadeIn 0.3s ease", paddingBottom: 100 }}>

      {/* ===== HEADER ===== */}
      <div style={{
        padding: "10px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: `1px solid ${colors.borderLight}`,
        background: colors.card, position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavBtn icon="✕" onClick={onBack} />
          <div style={{ width: 1, height: 18, background: colors.border, margin: "0 2px" }} />
          <NavBtn icon="←" label="" onClick={onPrev} disabled={!hasPrev} />
          <NavBtn icon="→" label="" onClick={onNext} disabled={!hasNext} />
        </div>

        <div style={{
          fontSize: 12, fontWeight: 600, color: colors.text,
          textAlign: "center", flex: 1, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 8px",
        }}>
          {r.id}
        </div>

        {/* Status badge */}
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
          color: status.color,
          background: status.colorLight || (status.color + "14"),
          padding: "4px 10px", borderRadius: radius.sm,
          border: `1px solid ${status.color}20`,
          whiteSpace: "nowrap",
        }}>
          {status.icon} {status.label}
        </div>
      </div>

      {/* ===== TITLE + PRIORITY ===== */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
          <h2 style={{
            fontFamily: fontDisplay, fontSize: 20, fontWeight: 600,
            color: colors.text, margin: 0, lineHeight: 1.3, flex: 1,
          }}>
            {r.name}
          </h2>
          {priority && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 8px",
              borderRadius: radius.xs,
              color: priority.color,
              background: priority.colorLight || (priority.color + "12"),
              whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {priority.icon} {priority.label}
            </span>
          )}
        </div>
        {r.supplier && (
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            Proveedor: {r.supplier}
          </div>
        )}
      </div>

      {/* ===== REJECTED BANNER ===== */}
      {isRejected && (
        <div style={{ padding: "0 20px 8px" }}>
          <div style={{
            background: colors.dangerLight, border: `1px solid ${colors.danger}20`,
            borderRadius: radius.lg, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>❌</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.danger }}>Solicitud Rechazada</div>
              {r.approvalHistory?.length > 0 && (
                <div style={{ fontSize: 12, color: colors.danger, opacity: 0.8, marginTop: 2 }}>
                  {r.approvalHistory[r.approvalHistory.length - 1].note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== APPROVAL ACTIONS (for current approver) ===== */}
      {isInApproval && r.approvalSteps && (
        <div style={{ padding: "0 20px", marginBottom: 12 }}>
          <ApprovalActions
            request={r} currentUser={currentUser}
            onApprove={onApprove} onReject={onReject} onRevision={onRevision}
          />
        </div>
      )}

      {/* ===== PROGRESS BAR ===== */}
      {!isRejected && statusIdx >= 0 && (
        <div style={{ padding: "0 20px 4px" }}>
          <div style={{
            display: "flex", gap: 3, marginBottom: 6,
            padding: "0 2px",
          }}>
            {STATUS_FLOW.map((s, i) => (
              <div key={s.key} style={{
                flex: 1, height: 5, borderRadius: 3,
                background: i <= statusIdx ? status.color : colors.border,
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0 2px",
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: status.color }}>
              Paso {statusIdx + 1} de {STATUS_FLOW.length}
            </span>
            {/* Contextual action buttons inline */}
            <div style={{ display: "flex", gap: 6 }}>
              {isBorrador && onConfirm && (
                <button onClick={() => onConfirm(r.id)} style={{
                  background: colors.primary,
                  color: "#fff", border: "none", borderRadius: radius.sm,
                  padding: "6px 14px", fontSize: 11, fontWeight: 600,
                  fontFamily: font, cursor: "pointer",
                  boxShadow: shadows.xs,
                }}>Confirmar ✓</button>
              )}
              {!isBorrador && !isInApproval && !isLast && !isRejected && onAdvance && (
                <button onClick={() => onAdvance(r.id)} style={{
                  background: STATUS_FLOW[statusIdx + 1]?.color || colors.primary,
                  color: "#fff", border: "none", borderRadius: radius.sm,
                  padding: "6px 14px", fontSize: 11, fontWeight: 600,
                  fontFamily: font, cursor: "pointer",
                  boxShadow: shadows.xs,
                }}>→ {STATUS_FLOW[statusIdx + 1]?.label}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== APPROVAL FLOW (dots) ===== */}
      {r.approvalSteps?.length > 0 && (
        <div style={{ padding: "8px 20px" }}>
          <ApprovalFlow steps={r.approvalSteps} />
        </div>
      )}

      {/* ===== INFO GRID ===== */}
      <div style={{ padding: "8px 20px" }}>
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
            <InfoCell label="Total Estimado" value={formatGuaranies(displayTotal)} color={colors.primary} span2 />
          )}
        </InfoGrid>
      </div>

      {/* ===== NOTE (editable) ===== */}
      <div style={{ padding: "8px 20px" }}>
        <div style={{
          background: colors.card, borderRadius: radius.lg, padding: "12px 16px",
          border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 11, color: colors.textLight, fontWeight: 500, marginBottom: 6 }}>
            Nota / Motivo
          </div>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); saveNote(e.target.value); }}
            placeholder="+ Agregar nota..."
            rows={2}
            style={{
              width: "100%", border: "none", background: "transparent",
              fontFamily: font, fontSize: 13, color: colors.text,
              resize: "none", outline: "none", padding: 0,
              lineHeight: 1.5,
            }}
          />
        </div>
      </div>

      {/* ===== ITEMS TABLE ===== */}
      <div style={{ padding: "8px 20px" }}>
        <SectionTitle count={items.length}>Items</SectionTitle>
        {items.length > 0 ? (
          <div style={{
            background: colors.card, borderRadius: radius.lg,
            border: `1px solid ${colors.borderLight}`, overflow: "hidden",
            boxShadow: shadows.card,
          }}>
            {items.map((it, idx) => (
              <div key={idx} style={{
                padding: "12px 16px",
                borderBottom: idx < items.length - 1 ? `1px solid ${colors.borderLight}` : "none",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: colors.textLight,
                      background: colors.bg, padding: "2px 6px", borderRadius: radius.xs,
                    }}>{idx + 1}</span>
                    {(it.codigo || it.code) && (
                      <span style={{ fontSize: 10, color: colors.primary, fontWeight: 600 }}>{it.codigo || it.code}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginTop: 3 }}>
                    {it.name || it.nombre || "Item"}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                    {it.quantity || it.cantidad || 0} {it.unit || it.unidad || "un"} × {formatGuaranies(it.unitPrice || it.precioUnitario || 0)}
                  </div>
                  {(it.proveedor || it.supplier) && (
                    <div style={{ fontSize: 10, color: colors.textLight, marginTop: 1 }}>
                      Prov: {it.proveedor || it.supplier}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>
                    {formatGuaranies((it.unitPrice || it.precioUnitario || 0) * (it.quantity || it.cantidad || 0))}
                  </div>
                  {isBorrador && (
                    <button onClick={() => handleRemoveItem(idx)} style={{
                      background: "transparent", border: "none",
                      fontSize: 14, cursor: "pointer", padding: "4px",
                      color: colors.danger, marginTop: 2,
                    }}>🗑</button>
                  )}
                </div>
              </div>
            ))}
            {/* Total footer */}
            <div style={{
              padding: "10px 16px", background: colors.surface,
              borderTop: `1px solid ${colors.borderLight}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.textLight }}>
                TOTAL ({items.length} item{items.length !== 1 ? "s" : ""})
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: colors.primary }}>
                {formatGuaranies(itemsTotal || displayTotal)}
              </span>
            </div>
          </div>
        ) : (
          <div style={{
            background: colors.card, borderRadius: radius.lg, padding: 20,
            border: `1px solid ${colors.borderLight}`, textAlign: "center",
          }}>
            <div style={{ fontSize: 13, color: colors.textLight }}>Sin items registrados</div>
            {displayTotal > 0 && (
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.primary, marginTop: 6 }}>
                Monto estimado: {formatGuaranies(displayTotal)}
              </div>
            )}
          </div>
        )}
        {/* Add item button (borrador only) */}
        {isBorrador && (
          <button onClick={() => setShowAddItem(true)} style={{
            width: "100%", padding: 12, borderRadius: radius.lg, marginTop: 8,
            border: `1px dashed ${colors.primary}40`, background: colors.primary + "06",
            color: colors.primary, fontSize: 12, fontWeight: 600,
            fontFamily: font, cursor: "pointer",
          }}>
            + Agregar Item
          </button>
        )}
      </div>

      {/* ===== BUDGET WIDGET ===== */}
      <div style={{ padding: "8px 20px" }}>
        <BudgetWidget
          establishment={r.establishment}
          sector={r.sector || r.type}
          requestAmount={displayTotal}
        />
      </div>

      {/* ===== QUOTATIONS ===== */}
      {(showQuotationBtn || quotationCount > 0) && (
        <div style={{ padding: "8px 20px" }}>
          <div style={{
            background: r.status === "cotizacion" ? colors.primary + "06" : colors.card,
            borderRadius: radius.lg, padding: 16,
            border: `1px solid ${r.status === "cotizacion" ? colors.primary + "30" : colors.borderLight}`,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: quotationCount > 0 ? 10 : 0,
            }}>
              <SectionTitle count={quotationCount}>Cotizaciones</SectionTitle>
              {canManageQuotations && (
                <button onClick={() => setShowQuotations(true)} style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                  color: "#fff", border: "none", borderRadius: radius.md,
                  padding: "7px 14px", fontSize: 11, fontWeight: 600,
                  fontFamily: font, cursor: "pointer",
                }}>
                  {quotationCount > 0 ? "Ver / Editar" : "+ Agregar"}
                </button>
              )}
            </div>
            {quotationCount > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {r.quotations.slice(0, 3).map(q => (
                  <div key={q.id} style={{
                    display: "flex", justifyContent: "space-between",
                    background: q.selected ? colors.success + "10" : colors.bg,
                    borderRadius: radius.md, padding: "8px 10px",
                    border: q.selected ? `1px solid ${colors.success}30` : `1px solid ${colors.borderLight}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: q.selected ? 600 : 400, color: colors.text }}>
                      {q.selected && "✓ "}{q.supplier}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: q.selected ? colors.success : colors.text }}>
                      {q.currency} {q.price?.toLocaleString()}
                    </span>
                  </div>
                ))}
                {quotationCount > 3 && (
                  <div style={{ fontSize: 11, color: colors.textLight, textAlign: "center" }}>
                    +{quotationCount - 3} mas...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== COMMENTS ===== */}
      <div style={{ padding: "8px 20px" }}>
        <SectionTitle count={comments.length}>Comentarios</SectionTitle>
        <div style={{
          background: colors.card, borderRadius: radius.lg,
          border: `1px solid ${colors.borderLight}`, overflow: "hidden",
        }}>
          {/* Comment list */}
          {comments.length > 0 ? (
            <div>
              {comments.map((c, i) => (
                <div key={c.id || i} style={{
                  padding: "12px 16px",
                  borderBottom: i < comments.length - 1 ? `1px solid ${colors.borderLight}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: radius.md,
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {(c.avatar || (c.author || c.autor || "?")?.[0] || "?").toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{c.author || c.autor}</span>
                    {c.interno && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: colors.warning,
                        background: colors.warning + "15", padding: "1px 6px",
                        borderRadius: radius.xs, textTransform: "uppercase", letterSpacing: 0.5,
                      }}>Interno</span>
                    )}
                    <span style={{ fontSize: 10, color: colors.textLight, marginLeft: "auto" }}>
                      {fmtDateTime(c.createdAt || c.fecha)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5, paddingLeft: 34 }}>
                    {c.texto}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: colors.textLight }}>
              Sin comentarios aún
            </div>
          )}

          {/* Comment input */}
          <div style={{
            padding: "10px 16px", borderTop: `1px solid ${colors.borderLight}`,
            background: colors.surface,
          }}>
            <div style={{ display: "flex", gap: 8 }}>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Agregar comentario..."
                rows={1}
                style={{
                  flex: 1, border: `1px solid ${colors.border}`, borderRadius: radius.md,
                  padding: "8px 12px", fontFamily: font, fontSize: 13,
                  color: colors.text, background: colors.card, resize: "none",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
                }}
              />
              <button onClick={handleAddComment} disabled={!commentText.trim()} style={{
                background: commentText.trim()
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                  : colors.border,
                color: commentText.trim() ? "#fff" : colors.textLight,
                border: "none", borderRadius: radius.md, padding: "0 14px",
                fontSize: 12, fontWeight: 600, fontFamily: font,
                cursor: commentText.trim() ? "pointer" : "default",
              }}>
                →
              </button>
            </div>
            <label style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11, color: colors.textLight, marginTop: 6,
              cursor: "pointer", userSelect: "none",
            }}>
              <input
                type="checkbox"
                checked={commentInternal}
                onChange={(e) => setCommentInternal(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: colors.warning }}
              />
              Solo empresa (interno)
            </label>
          </div>
        </div>
      </div>

      {/* ===== TRAZABILIDAD (collapsible) ===== */}
      <div style={{ padding: "8px 20px" }}>
        <SectionTitle
          count={(r.approvalHistory?.length || 0) + STATUS_FLOW.length}
          collapsed={!showTrazabilidad}
          onToggle={() => setShowTrazabilidad(!showTrazabilidad)}
        >
          Trazabilidad
        </SectionTitle>

        {/* Always show last 3 approval history entries */}
        {r.approvalHistory?.length > 0 && (
          <div style={{ marginBottom: showTrazabilidad ? 8 : 0 }}>
            {(showTrazabilidad ? r.approvalHistory : r.approvalHistory.slice(-3)).map((entry, i) => {
              const actionStyles = {
                confirmed: { icon: "📤", color: colors.info, label: "Confirmada" },
                approved: { icon: "✅", color: colors.success, label: "Aprobada" },
                rejected: { icon: "❌", color: colors.danger, label: "Rechazada" },
                revision: { icon: "↩", color: colors.warning, label: "Devuelta" },
                advanced: { icon: "→", color: colors.primary, label: "Avanzada" },
              };
              const a = actionStyles[entry.action] || { icon: "•", color: colors.textLight, label: entry.action };
              return (
                <div key={i} style={{
                  display: "flex", gap: 10, marginBottom: 6,
                  padding: "8px 12px", borderRadius: radius.md,
                  background: colors.surface, border: `1px solid ${colors.borderLight}`,
                }}>
                  <span style={{ fontSize: 14 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: a.color }}>
                      {entry.step ? `${entry.step}: ` : ""}{a.label}
                      {entry.note ? ` — ${entry.note}` : ""}
                    </div>
                    <div style={{ fontSize: 10, color: colors.textLight, marginTop: 1 }}>
                      {entry.by} · {fmtDateTime(entry.at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pipeline timeline (shown when expanded) */}
        {showTrazabilidad && (
          <div style={{
            background: colors.card, borderRadius: radius.lg, padding: "14px 16px",
            border: `1px solid ${colors.borderLight}`,
          }}>
            {STATUS_FLOW.map((s, i) => {
              const reached = i <= statusIdx;
              return (
                <div key={s.key} style={{ display: "flex", gap: 12 }}>
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", width: 24,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: reached ? s.color : colors.border,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, color: "#fff", transition: "all 0.3s",
                      border: i === statusIdx ? `2px solid ${s.color}` : "none",
                      boxShadow: i === statusIdx ? `0 0 0 3px ${s.color}20` : "none",
                    }}>
                      {reached ? "✓" : ""}
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div style={{
                        width: 2, height: 22,
                        background: i < statusIdx ? s.color : colors.border,
                      }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 8, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: reached ? 600 : 400,
                      color: reached ? colors.text : colors.textLight,
                    }}>
                      {s.icon} {s.label}
                    </div>
                    {reached && i === 0 && (
                      <div style={{ fontSize: 10, color: colors.textLight }}>{fmtDate(r.date)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!showTrazabilidad && (r.approvalHistory?.length || 0) === 0 && (
          <div style={{
            fontSize: 12, color: colors.textLight, padding: "6px 0",
          }}>
            Sin historial de acciones todavía
          </div>
        )}
      </div>

      {/* ===== ATTACHMENTS ===== */}
      <div style={{ padding: "8px 20px" }}>
        <SectionTitle
          count={attachments.length}
          collapsed={!showAttachments}
          onToggle={() => setShowAttachments(!showAttachments)}
        >
          Adjuntos
        </SectionTitle>
        {showAttachments && (
          <div style={{
            background: colors.card, borderRadius: radius.lg, padding: 16,
            border: `1px solid ${colors.borderLight}`,
          }}>
            <AttachmentUpload
              requestUuid={r._uuid}
              attachments={attachments}
              onAttachmentsChange={handleAttachmentsChange}
            />
          </div>
        )}
      </div>

      {/* ===== MOBILE BOTTOM ACTION BAR ===== */}
      <div className="mobile-bottom-action-bar" style={{
        position: "fixed", bottom: 64, left: 0, right: 0,
        padding: "10px 20px", background: colors.card,
        borderTop: `1px solid ${colors.borderLight}`,
        display: "flex", gap: 8, zIndex: 30,
        maxWidth: 480, margin: "0 auto",
      }}>
        {isBorrador && onConfirm && (
          <ActionBtn label="Confirmar ✓" color={colors.primary} bg={`linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`} onClick={() => onConfirm(r.id)} flex={2} />
        )}
        {!isBorrador && !isInApproval && !isLast && !isRejected && onAdvance && (
          <ActionBtn
            label={`→ ${STATUS_FLOW[statusIdx + 1]?.label || "Avanzar"}`}
            color={STATUS_FLOW[statusIdx + 1]?.color || colors.primary}
            onClick={() => onAdvance(r.id)}
            flex={2}
          />
        )}
        {(isBorrador || (!isBorrador && !isInApproval && !isLast && !isRejected)) && (
          <ActionBtn label="✕" color={colors.danger} outline onClick={onBack} />
        )}
        {/* If in approval, ApprovalActions component handles buttons */}
        {isInApproval && (
          <div style={{ flex: 1, fontSize: 12, color: colors.textLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ⏳ Acciones de aprobación arriba
          </div>
        )}
        {isRejected && (
          <div style={{ flex: 1, fontSize: 12, color: colors.danger, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>
            ❌ Solicitud rechazada
          </div>
        )}
        {isLast && (
          <div style={{ flex: 1, fontSize: 12, color: colors.success, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500 }}>
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

