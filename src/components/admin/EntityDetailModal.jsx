import { TIPO_ENTIDAD_LABELS, REGIMEN_CONTROL_LABELS } from "../../constants/establecimientos";

const BADGE_COLORS = {
  establecimiento:  "bg-blue-500/[0.12] text-blue-400 border-blue-500/20",
  proveedor_ganado: "bg-amber-500/[0.12] text-amber-400 border-amber-500/20",
  proveedor_granos: "bg-green-500/[0.12] text-green-400 border-green-500/20",
  industria:        "bg-purple-500/[0.12] text-purple-400 border-purple-500/20",
  propio:    "bg-emerald-500/[0.12] text-emerald-400 border-emerald-500/20",
  arrendado: "bg-orange-500/[0.12] text-orange-400 border-orange-500/20",
  cenabico:  "bg-cyan-500/[0.12] text-cyan-400 border-cyan-500/20",
};

function formatName(raw) {
  if (!raw) return "\u2014";
  const username = raw.includes("@") ? raw.split("@")[0] : raw;
  const parts = username.split(/[.\s_-]+/);
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function InfoRow({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-2 border-b border-white/[0.04] last:border-none">
      <span className="text-[11px] text-slate-400 font-medium w-[120px] flex-shrink-0">{label}</span>
      <span className={`text-[12px] text-white text-right flex-1 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h4>
      <div className="bg-[#F8F9FB]/[0.02] rounded-xl p-3 border border-white/[0.06]">
        {children}
      </div>
    </div>
  );
}

export default function EntityDetailModal({ item, onClose, onEdit }) {
  if (!item) return null;

  const tipo = item.tipo_entidad || "establecimiento";
  const regimen = item.regimen_control;
  const hasCoords = item.latitude && item.longitude;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#0F1729] rounded-t-2xl border-t border-x border-white/[0.08] animate-fadeIn"
        onClick={e => e.stopPropagation()}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0F1729] border-b border-white/[0.06] px-5 py-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white m-0 truncate">{item.name}</h3>
              {item.code && (
                <span className="text-[10px] text-slate-400 bg-[#F8F9FB]/[0.04] px-2 py-0.5 rounded mt-1 inline-block font-mono">
                  {item.code}
                </span>
              )}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${BADGE_COLORS[tipo] || ""}`}>
                  {TIPO_ENTIDAD_LABELS[tipo] || tipo}
                </span>
                {regimen && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${BADGE_COLORS[regimen] || ""}`}>
                    {REGIMEN_CONTROL_LABELS[regimen] || regimen}
                  </span>
                )}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${item.active !== false ? "bg-green-500/[0.12] text-green-400 border-green-500/20" : "bg-red-500/[0.12] text-red-400 border-red-500/20"}`}>
                  {item.active !== false ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="bg-transparent border-none text-slate-400 text-xl cursor-pointer p-1 hover:text-white">
              {"\u2715"}
            </button>
          </div>
        </div>

        <div className="px-5 pb-6 pt-3">
          {/* General Info */}
          <Section title="Informaci\u00f3n General">
            <InfoRow label="Empresa" value={item.company} />
            <InfoRow label="Gerente" value={formatName(item.manager)} />
            <InfoRow label="C\u00f3d. SENACSA" value={item.senacsa_code} mono />
            <InfoRow label="Unidad Zonal" value={item.senacsa_unidad_zonal} />
          </Section>

          {/* Location */}
          <Section title="Ubicaci\u00f3n">
            <InfoRow label="Departamento" value={item.departamento} />
            <InfoRow label="Municipio" value={item.municipio} />
            <InfoRow label="Ubicaci\u00f3n" value={item.location} />
            {hasCoords && (
              <>
                <InfoRow label="Coordenadas" value={`${item.latitude}, ${item.longitude}`} mono />
                <div className="mt-2 rounded-xl overflow-hidden border border-white/[0.06] h-[180px]">
                  <iframe
                    title="Ubicaci\u00f3n"
                    width="100%"
                    height="180"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(item.longitude) - 0.03}%2C${Number(item.latitude) - 0.02}%2C${Number(item.longitude) + 0.03}%2C${Number(item.latitude) + 0.02}&layer=mapnik&marker=${item.latitude}%2C${item.longitude}`}
                    loading="lazy"
                  />
                </div>
              </>
            )}
          </Section>

          {/* Related Activity (placeholder links) */}
          <Section title="Actividad Relacionada">
            <div className="text-[11px] text-slate-400 py-2">
              {tipo === "establecimiento" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{"📊"}</span>
                    <span>Panel General &rarr; ver indicadores de este establecimiento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{"🐄"}</span>
                    <span>Ganado &rarr; movimientos desde/hacia este establecimiento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{"📦"}</span>
                    <span>Inventario &rarr; stock actual en este establecimiento</span>
                  </div>
                </div>
              ) : tipo === "proveedor_ganado" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{"🐄"}</span>
                    <span>Ganado &rarr; compras realizadas a este proveedor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{"📋"}</span>
                    <span>Gu\u00edas SENACSA &rarr; documentos de este origen</span>
                  </div>
                </div>
              ) : tipo === "industria" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{"🏭"}</span>
                    <span>Ganado &rarr; ventas y env\u00edos a esta industria</span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-500 italic">Sin actividad registrada</span>
              )}
            </div>
          </Section>

          {/* Documents (placeholder) */}
          <Section title="Documentos">
            <div className="text-[11px] text-slate-500 italic py-3 text-center">
              Funcionalidad de documentos pr\u00f3ximamente
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notas">
            {item.notas ? (
              <div className="text-[12px] text-slate-300 whitespace-pre-wrap py-1">
                {item.notas}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic py-2 text-center">
                Sin notas
              </div>
            )}
          </Section>

          {/* Actions */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onEdit(item)}
              className="flex-1 py-3 rounded-xl border-none bg-gradient-to-br from-[#1F2A44] to-[#C8A03A] text-white text-[13px] font-semibold cursor-pointer"
            >
              Editar Entidad
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/[0.06] bg-[#F8F9FB]/[0.03] text-white text-[13px] font-semibold cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
