import { GROUP_COLORS } from "../../constants";

const ALL_GROUP_COLORS = {
  ...GROUP_COLORS,
  "Mercadería": "#6366F1",
  "Agrícola": "#2563EB",
  "Otro": "#9CA3AF",
};

export default function InventoryProductList({ groupedItems, onSelectProduct }) {
  return (
    <div className="px-5 pt-1 pb-[120px]">
      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          No se encontraron productos
        </div>
      ) : (
        Object.entries(groupedItems)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, groupItems]) => (
            <div key={group}>
              <div
                className="text-[10px] font-bold uppercase tracking-[1.5px] pt-3.5 pb-1.5 flex items-center gap-2"
                style={{ color: ALL_GROUP_COLORS[group] || "#94a3b8" }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: ALL_GROUP_COLORS[group] || "#94a3b8" }}
                />
                {group}
                <span className="font-medium text-[10px] text-slate-400">
                  ({groupItems.length})
                </span>
              </div>

              {groupItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct(item)}
                  className="bg-[#F8F9FB]/[0.03] rounded-xl px-3.5 py-3 mb-1 border border-white/[0.06] flex justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.3)] cursor-pointer transition-all hover:border-white/[0.12] hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-white">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-[#F8F9FB]/5 px-1.5 py-px rounded">
                        {item.code}
                      </span>
                      {item.manufacturer && (
                        <span className="text-[10px] text-slate-500">
                          {item.manufacturer}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] px-2 py-[3px] rounded-md font-semibold whitespace-nowrap"
                      style={{
                        background: (ALL_GROUP_COLORS[item.group] || "#10b981") + "12",
                        color: ALL_GROUP_COLORS[item.group] || "#10b981",
                      }}
                    >
                      {item.presentation || item.unit || item.category}
                    </span>
                    <span className="text-xs text-slate-500">{"›"}</span>
                  </div>
                </div>
              ))}
            </div>
          ))
      )}
    </div>
  );
}
