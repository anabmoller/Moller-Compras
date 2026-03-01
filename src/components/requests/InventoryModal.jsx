import { useState, useMemo } from "react";
import { colors, font, fontDisplay, radius, shadows } from "../../styles/theme";
import { INVENTORY_ITEMS, GROUP_COLORS } from "../../constants";
import SearchInput from "../common/SearchInput";

export default function InventoryModal({ onSelect, onClose, onNewProduct }) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");

  // Get unique groups
  const groups = useMemo(() => {
    const g = [...new Set(INVENTORY_ITEMS.map(i => i.group))];
    return ["all", ...g.sort()];
  }, []);

  const filtered = useMemo(() => {
    let items = INVENTORY_ITEMS;
    if (activeGroup !== "all") {
      items = items.filter(i => i.group === activeGroup);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, activeGroup]);

  // Group items by group for display
  const groupedItems = useMemo(() => {
    if (activeGroup !== "all") return { [activeGroup]: filtered };
    const groups = {};
    filtered.forEach(item => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, [filtered, activeGroup]);


  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: colors.bg, borderRadius: radius.xl,
        maxWidth: 560, width: "100%", maxHeight: "70vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        animation: "fadeIn 0.2s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 14,
          }}>
            <div>
              <h3 style={{
                fontFamily: fontDisplay, fontSize: 20, fontWeight: 600,
                color: colors.text, margin: 0,
              }}>
                Catálogo de Productos
              </h3>
              <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
                {INVENTORY_ITEMS.length} productos disponibles
              </div>
            </div>
            <button onClick={onClose} style={{
              background: colors.border, border: "none", width: 32, height: 32,
              borderRadius: radius.md, cursor: "pointer", fontSize: 16,
            }}>
              ✕
            </button>
          </div>

          {/* Search */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, código o tipo..."
            autoFocus
            style={{ marginBottom: 10 }}
          />

          {/* Group pills */}
          <div style={{
            display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12,
            scrollbarWidth: "none",
          }}>
            {groups.map(g => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                style={{
                  padding: "5px 12px", borderRadius: radius.full,
                  border: activeGroup === g
                    ? `2px solid ${g === "all" ? colors.primary : (GROUP_COLORS[g] || colors.primary)}`
                    : `1px solid ${colors.borderLight}`,
                  background: activeGroup === g
                    ? (g === "all" ? colors.primary : (GROUP_COLORS[g] || colors.primary)) + "12"
                    : colors.card,
                  color: activeGroup === g
                    ? (g === "all" ? colors.primary : (GROUP_COLORS[g] || colors.primary))
                    : colors.textLight,
                  fontSize: 11, fontWeight: 600, fontFamily: font,
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {g === "all" ? `Todos (${INVENTORY_ITEMS.length})` : g}
              </button>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div style={{ overflow: "auto", padding: "0 20px 20px", flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: 30,
              color: colors.textLight, fontSize: 13,
            }}>
              No se encontraron productos para "{search}"
            </div>
          ) : (
            Object.entries(groupedItems).map(([group, items]) => (
              <div key={group}>
                {activeGroup === "all" && (
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: GROUP_COLORS[group] || colors.textLight,
                    textTransform: "uppercase", letterSpacing: 1,
                    padding: "10px 0 6px", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: radius.xs,
                      background: GROUP_COLORS[group] || colors.textLight,
                    }} />
                    {group} ({items.length})
                  </div>
                )}
                {items.map(item => (
                  <div
                    key={item.code}
                    onClick={() => onSelect(item)}
                    style={{
                      background: colors.card, borderRadius: radius.lg, padding: "12px 14px",
                      marginBottom: 4, cursor: "pointer",
                      border: `1px solid ${colors.borderLight}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = colors.primary + "60";
                      e.currentTarget.style.background = colors.primary + "04";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = colors.borderLight;
                      e.currentTarget.style.background = colors.card;
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: 11, color: colors.textLight, marginTop: 2,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{
                          fontFamily: "monospace", fontSize: 10,
                          background: colors.surface, padding: "1px 5px",
                          borderRadius: radius.xs,
                        }}>
                          {item.code}
                        </span>
                        <span>·</span>
                        <span>{item.group}</span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, background: (GROUP_COLORS[item.group] || colors.primary) + "12",
                      color: GROUP_COLORS[item.group] || colors.primary,
                      padding: "3px 8px", borderRadius: radius.sm, fontWeight: 600,
                      whiteSpace: "nowrap", marginLeft: 8,
                    }}>
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* New product option */}
          <div
            onClick={onNewProduct}
            style={{
              background: colors.accent + "06", borderRadius: radius.lg, padding: "16px",
              marginTop: 12, cursor: "pointer",
              border: `1px dashed ${colors.accent}40`,
              textAlign: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.accent + "10"}
            onMouseLeave={e => e.currentTarget.style.background = colors.accent + "06"}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>
              + Agregar producto nuevo
            </div>
            <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
              ¿No está en el catálogo? Créalo manualmente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
