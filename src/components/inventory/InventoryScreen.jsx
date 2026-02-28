import { useState, useMemo } from "react";
import { colors, font, shadows, radius } from "../../styles/theme";
import { INVENTORY_ITEMS, GROUP_COLORS } from "../../constants";
import BackButton from "../common/BackButton";
import SearchInput from "../common/SearchInput";
import PageHeader from "../common/PageHeader";

export default function InventoryScreen({ onBack }) {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");

  const groups = useMemo(() => [...new Set(INVENTORY_ITEMS.map(i => i.group))].sort(), []);
  const types = useMemo(() => [...new Set(INVENTORY_ITEMS.map(i => i.type))].sort(), []);

  const filtered = useMemo(() => {
    return INVENTORY_ITEMS.filter(item => {
      if (filterGroup !== "all" && item.group !== filterGroup) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, filterGroup]);

  const groupedItems = useMemo(() => {
    const g = {};
    filtered.forEach(item => {
      if (!g[item.group]) g[item.group] = [];
      g[item.group].push(item);
    });
    return g;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: INVENTORY_ITEMS.length,
    groups: groups.length,
    types: types.length,
  }), [groups, types]);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <BackButton onClick={onBack} />
      <PageHeader
        title="Catálogo de Productos"
        subtitle={`${stats.total} productos · ${stats.groups} grupos · ${stats.types} tipos`}
      />

      {/* KPI cards */}
      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8 }}>
        {groups.slice(0, 4).map(g => {
          const count = INVENTORY_ITEMS.filter(i => i.group === g).length;
          return (
            <div
              key={g}
              onClick={() => setFilterGroup(filterGroup === g ? "all" : g)}
              style={{
                flex: 1, background: filterGroup === g
                  ? (GROUP_COLORS[g] || colors.primary) + "12"
                  : colors.card,
                borderRadius: radius.lg, padding: "10px 12px",
                border: `1px solid ${filterGroup === g
                  ? (GROUP_COLORS[g] || colors.primary) + "40"
                  : colors.borderLight}`,
                cursor: "pointer", textAlign: "center",
                transition: "all 0.15s",
                boxShadow: shadows.xs,
              }}
            >
              <div style={{
                fontSize: 18, fontWeight: 700,
                color: GROUP_COLORS[g] || colors.primary,
              }}>
                {count}
              </div>
              <div style={{
                fontSize: 9, color: colors.textLight, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: 0.5,
              }}>
                {g}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div style={{ padding: "0 20px 8px" }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, código o tipo..."
          style={{ marginBottom: 10 }}
        />

        <div style={{
          display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
          scrollbarWidth: "none",
        }}>
          <button
            onClick={() => setFilterGroup("all")}
            style={{
              padding: "5px 12px", borderRadius: radius.full,
              border: filterGroup === "all"
                ? `2px solid ${colors.primary}`
                : `1px solid ${colors.borderLight}`,
              background: filterGroup === "all" ? colors.primary + "12" : colors.card,
              color: filterGroup === "all" ? colors.primary : colors.textLight,
              fontSize: 11, fontWeight: 600, fontFamily: font,
              cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            Todos ({INVENTORY_ITEMS.length})
          </button>
          {groups.map(g => {
            const count = INVENTORY_ITEMS.filter(i => i.group === g).length;
            return (
              <button
                key={g}
                onClick={() => setFilterGroup(filterGroup === g ? "all" : g)}
                style={{
                  padding: "5px 12px", borderRadius: radius.full,
                  border: filterGroup === g
                    ? `2px solid ${GROUP_COLORS[g] || colors.primary}`
                    : `1px solid ${colors.borderLight}`,
                  background: filterGroup === g
                    ? (GROUP_COLORS[g] || colors.primary) + "12"
                    : colors.card,
                  color: filterGroup === g
                    ? (GROUP_COLORS[g] || colors.primary)
                    : colors.textLight,
                  fontSize: 11, fontWeight: 600, fontFamily: font,
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                {g} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div style={{ padding: "4px 20px 8px" }}>
        <div style={{ fontSize: 11, color: colors.textLight, fontWeight: 500 }}>
          {filtered.length} productos
          {filterGroup !== "all" && ` · ${filterGroup}`}
          {search && ` · "${search}"`}
        </div>
      </div>

      {/* Items list grouped */}
      <div style={{ padding: "4px 20px 120px" }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 40, color: colors.textLight, fontSize: 14,
          }}>
            No se encontraron productos
          </div>
        ) : (
          Object.entries(groupedItems)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, items]) => (
              <div key={group}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: GROUP_COLORS[group] || colors.textLight,
                  textTransform: "uppercase", letterSpacing: 1.5,
                  padding: "14px 0 6px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: radius.full,
                    background: GROUP_COLORS[group] || colors.textLight,
                  }} />
                  {group}
                  <span style={{ fontWeight: 500, fontSize: 10, color: colors.textLight }}>
                    ({items.length})
                  </span>
                </div>

                {items.map(item => (
                  <div key={item.code} style={{
                    background: colors.card, borderRadius: radius.lg, padding: "12px 14px",
                    marginBottom: 4, border: `1px solid ${colors.borderLight}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    boxShadow: shadows.xs,
                  }}>
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
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10,
                      background: (GROUP_COLORS[item.group] || colors.primary) + "12",
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
      </div>
    </div>
  );
}
