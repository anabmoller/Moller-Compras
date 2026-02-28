import { useState } from "react";
import { colors, font, radius, shadows } from "../../styles/theme";
import { getEstablishments } from "../../constants/parameters";
import RequestCard from "./RequestCard";
import RequestsTable from "./RequestsTable";
import { formatGuaranies } from "../../utils/statusHelpers";

export default function Dashboard({
  requests,
  filtered,
  statusCounts,
  filterStatus,
  setFilterStatus,
  filterEstablishment,
  setFilterEstablishment,
  searchQuery,
  setSearchQuery,
  onSelectRequest,
}) {
  const [viewMode, setViewMode] = useState("cards");

  // Action counters for top bar
  const pendingCount = requests.filter(r => r.status === "pendiente_aprobacion").length;
  const draftCount = requests.filter(r => r.status === "borrador").length;
  const inProcessCount = requests.filter(r => r.status === "en_proceso" || r.status === "cotizacion").length;
  const totalAmount = requests.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  return (
    <div style={{ animation: "fadeIn 0.25s ease" }}>
      {/* Page title */}
      <div style={{ padding: "20px 20px 0" }}>
        <h2 style={{
          fontSize: 22, fontWeight: 700, color: colors.text,
          fontFamily: font, margin: "0 0 4px", letterSpacing: "-0.02em",
        }}>
          Solicitudes de Compra
        </h2>
        <p style={{ fontSize: 13, color: colors.textLight, margin: 0 }}>
          {requests.length} solicitudes · {filtered.length} mostradas
        </p>
      </div>

      {/* Action counters (Module 1) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        padding: "16px 20px",
      }}>
        <CounterCard label="Por aprobar" value={pendingCount} color={colors.warning} icon="⏳" />
        <CounterCard label="Borradores" value={draftCount} color="#6B7280" icon="📝" />
        <CounterCard label="En proceso" value={inProcessCount} color={colors.info} icon="🔄" />
        <CounterCard label="Total ₲" value={formatGuaranies(totalAmount)} color={colors.primary} icon="💰" small />
      </div>

      {/* Status filter pills */}
      <div style={{ padding: "4px 20px 12px" }}>
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
          scrollbarWidth: "none",
        }}>
          <FilterPill
            active={filterStatus === "all"}
            onClick={() => setFilterStatus("all")}
            label={`Todos (${requests.length})`}
            color={colors.text}
          />
          {statusCounts.filter(s => s.count > 0).map(s => (
            <FilterPill
              key={s.key}
              active={filterStatus === s.key}
              onClick={() => setFilterStatus(s.key)}
              label={`${s.icon} ${s.label} (${s.count})`}
              color={s.color}
            />
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: colors.card, border: `1px solid ${colors.border}`,
            borderRadius: radius.md, padding: "9px 14px",
          }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill={colors.textMuted}>
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              placeholder="Buscar solicitud..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: "none", background: "transparent", outline: "none",
                fontFamily: font, fontSize: 14, color: colors.text, width: "100%",
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: colors.textMuted, padding: "2px 4px",
              }}>✕</button>
            )}
          </div>
          <select
            value={filterEstablishment}
            onChange={e => setFilterEstablishment(e.target.value)}
            style={{
              background: colors.card, border: `1px solid ${colors.border}`,
              borderRadius: radius.md, padding: "9px 12px",
              fontFamily: font, fontSize: 13, color: colors.text,
              cursor: "pointer", minWidth: 110,
            }}
          >
            <option value="all">Todos estab.</option>
            {getEstablishments().map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
          </select>
          {/* View Toggle (desktop) */}
          <div className="desktop-view-toggle" style={{
            display: "flex", gap: 1, background: colors.surface,
            borderRadius: radius.sm, padding: 3, border: `1px solid ${colors.border}`,
          }}>
            <button onClick={() => setViewMode("cards")} style={{
              padding: "6px 10px", borderRadius: radius.xs, border: "none",
              background: viewMode === "cards" ? colors.card : "transparent",
              color: viewMode === "cards" ? colors.text : colors.textMuted,
              fontSize: 13, cursor: "pointer",
              boxShadow: viewMode === "cards" ? shadows.xs : "none",
            }}>☰</button>
            <button onClick={() => setViewMode("table")} style={{
              padding: "6px 10px", borderRadius: radius.xs, border: "none",
              background: viewMode === "table" ? colors.card : "transparent",
              color: viewMode === "table" ? colors.text : colors.textMuted,
              fontSize: 13, cursor: "pointer",
              boxShadow: viewMode === "table" ? shadows.xs : "none",
            }}>▤</button>
          </div>
        </div>
      </div>

      {/* Requests List / Table */}
      <div style={{ padding: "0 20px 120px" }}>
        {viewMode === "table" ? (
          <RequestsTable requests={filtered} onSelectRequest={onSelectRequest} />
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 48, color: colors.textMuted, fontSize: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📋</div>
            No se encontraron solicitudes
          </div>
        ) : (
          filtered.map(r => (
            <RequestCard key={r.id} request={r} onClick={() => onSelectRequest(r)} />
          ))
        )}
      </div>
    </div>
  );
}

function CounterCard({ label, value, color, icon, small }) {
  return (
    <div style={{
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
      padding: "12px 10px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 14, marginBottom: 4 }}>{icon}</div>
      <div style={{
        fontSize: small ? 11 : 20,
        fontWeight: 700,
        color: color,
        fontFamily: font,
        lineHeight: 1.2,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10,
        color: colors.textMuted,
        fontWeight: 500,
        marginTop: 2,
      }}>
        {label}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, label, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px",
      borderRadius: radius.full,
      border: active ? "none" : `1px solid ${colors.border}`,
      background: active ? color + "12" : colors.card,
      color: active ? color : colors.textLight,
      fontSize: 12,
      fontWeight: active ? 600 : 450,
      fontFamily: font,
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}
