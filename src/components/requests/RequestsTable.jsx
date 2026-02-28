import { useState } from "react";
import { colors, font, shadows, radius } from "../../styles/theme";
import { URGENCY_LEVELS } from "../../constants";
import { formatGuaranies } from "../../constants/budgets";
import { getStatusDisplay, getPriorityDisplay } from "../../utils/statusHelpers";

export default function RequestsTable({ requests, onSelectRequest }) {
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...requests].sort((a, b) => {
    let aVal = a[sortKey] ?? "";
    let bVal = b[sortKey] ?? "";
    if (sortKey === "totalAmount") { aVal = aVal || 0; bVal = bVal || 0; }
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const columns = [
    { key: "id", label: "# SC", width: 110 },
    { key: "name", label: "Producto", width: "auto" },
    { key: "establishment", label: "Estab.", width: 120 },
    { key: "requester", label: "Solicitante", width: 130 },
    { key: "status", label: "Estado", width: 140 },
    { key: "urgency", label: "Urgencia", width: 100 },
    { key: "totalAmount", label: "Monto", width: 120 },
    { key: "date", label: "Fecha", width: 100 },
  ];

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ opacity: 0.3, fontSize: 10 }}>↕</span>;
    return <span style={{ fontSize: 10, color: colors.primary }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div style={{
      background: colors.card, borderRadius: radius.lg,
      border: `1px solid ${colors.borderLight}`,
      overflow: "hidden",
      boxShadow: shadows.card,
    }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%", borderCollapse: "collapse",
          fontFamily: font, fontSize: 13, minWidth: 900,
        }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.borderLight}` }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{
                    padding: "12px 14px", textAlign: "left", fontWeight: 600,
                    color: colors.textLight, fontSize: 11, textTransform: "uppercase",
                    letterSpacing: 0.5, cursor: "pointer", whiteSpace: "nowrap",
                    width: col.width === "auto" ? undefined : col.width,
                    userSelect: "none", background: colors.surface,
                  }}
                >
                  {col.label} <SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const status = getStatusDisplay(r.status);
              const urgency = URGENCY_LEVELS.find(u => u.value === (r.priority || r.urgency));

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRequest(r)}
                  style={{
                    borderBottom: `1px solid ${colors.borderLight}`,
                    cursor: "pointer",
                    background: i % 2 === 0 ? "#fff" : colors.surface,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.primary + "06"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : colors.surface}
                >
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: colors.primary, fontSize: 12 }}>
                    {r.id}
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 500, color: colors.text, maxWidth: 250 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.name}
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", color: colors.text, fontSize: 12 }}>
                    📍 {r.establishment}
                  </td>
                  <td style={{ padding: "10px 14px", color: colors.textLight, fontSize: 12 }}>
                    {r.requester}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: radius.sm,
                      background: status.colorLight || (status.color + "12"),
                      color: status.color,
                      fontWeight: 600, whiteSpace: "nowrap",
                    }}>
                      {status.icon} {status.label}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {urgency && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: urgency.color,
                      }}>
                        {urgency.icon} {urgency.label}
                      </span>
                    )}
                  </td>
                  <td style={{
                    padding: "10px 14px", fontWeight: 600, color: colors.primary,
                    fontSize: 12, textAlign: "right",
                  }}>
                    {r.totalAmount > 0 ? formatGuaranies(r.totalAmount) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", color: colors.textLight, fontSize: 12 }}>
                    {r.date}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: colors.textLight, fontSize: 13 }}>
          No se encontraron solicitudes
        </div>
      )}
    </div>
  );
}
