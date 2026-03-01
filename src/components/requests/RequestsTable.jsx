import { useState } from "react";
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
    { key: "id", label: "# SC", width: "w-[110px]" },
    { key: "name", label: "Producto", width: "w-auto" },
    { key: "establishment", label: "Estab.", width: "w-[120px]" },
    { key: "requester", label: "Solicitante", width: "w-[130px]" },
    { key: "status", label: "Estado", width: "w-[140px]" },
    { key: "urgency", label: "Urgencia", width: "w-[100px]" },
    { key: "totalAmount", label: "Monto", width: "w-[120px]" },
    { key: "date", label: "Fecha", width: "w-[100px]" },
  ];

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span className="opacity-30 text-[10px]">↕</span>;
    return <span className="text-[10px] text-emerald-500">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-sans text-[13px] min-w-[900px]">
          <thead>
            <tr className="border-b-2 border-white/[0.06]">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-3.5 py-3 text-left font-semibold text-slate-400 text-[11px] uppercase tracking-wide cursor-pointer whitespace-nowrap select-none bg-white/[0.05] ${col.width !== "w-auto" ? col.width : ""}`}
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
                  className={`border-b border-white/[0.06] cursor-pointer transition-colors duration-150 ${
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.05]"
                  } hover:bg-emerald-500/[0.04]`}
                >
                  <td className="px-3.5 py-2.5 font-semibold text-emerald-500 text-xs">
                    {r.id}
                  </td>
                  <td className="px-3.5 py-2.5 font-medium text-white max-w-[250px]">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {r.name}
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-white text-xs">
                    📍 {r.establishment}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-400 text-xs">
                    {r.requester}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className="text-[11px] px-2.5 py-[3px] rounded-md font-semibold whitespace-nowrap"
                      style={{
                        background: status.colorLight || (status.color + "12"),
                        color: status.color,
                      }}
                    >
                      {status.icon} {status.label}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    {urgency && (
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: urgency.color }}
                      >
                        {urgency.icon} {urgency.label}
                      </span>
                    )}
                  </td>
                  <td className="px-3.5 py-2.5 font-semibold text-emerald-500 text-xs text-right">
                    {r.totalAmount > 0 ? formatGuaranies(r.totalAmount) : "—"}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-400 text-xs">
                    {r.date}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-[13px]">
          No se encontraron solicitudes
        </div>
      )}
    </div>
  );
}
