import { useState, useMemo, useEffect } from "react";
import { GROUP_COLORS, MODULE_CATEGORIES } from "../../constants";
import { supabase } from "../../lib/supabase";
import BackButton from "../common/BackButton";
import SearchInput from "../common/SearchInput";
import PageHeader from "../common/PageHeader";
import ProductDetailPanel from "./ProductDetailPanel";
import InventoryProductList from "./InventoryProductList";

// ---- Map Supabase category -> master catalog group ----
const CATEGORY_TO_GROUP = {
  "Veterinaria": "Veterinaria",
  "Hacienda": "Hacienda",
  "Productos Agrícolas": "Agrícola",
  "Insumos Agrícolas": "Agrícola",
  "Combustible": "Combustible",
  "Lubricantes": "Equipos",
  "Repuestos": "Equipos",
  "Materia Prima": "Materia Prima",
  "Infraestructura": "Equipos",
  "Tecnología": "Equipos",
  "Menaje/Cocina": "Equipos",
  "Mercadería": "Equipos",
  "Nutrición Animal": "Materia Prima",
};

// ---- Filter pill button ----
function FilterPill({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-[5px] rounded-full text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
        active
          ? "border-2"
          : "bg-[#F8F9FB]/[0.03] text-slate-400 border border-white/[0.06] hover:bg-[#F8F9FB]/[0.06]"
      }`}
      style={active ? {
        background: (color || "#C8A03A") + "12",
        color: color || "#C8A03A",
        borderColor: color || "#C8A03A",
      } : undefined}
    >
      {label}
    </button>
  );
}

export default function InventoryScreen({ onBack, accessibleModules }) {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ---- Compute allowed categories from module access ----
  const allowedCategories = useMemo(() => {
    if (!accessibleModules || accessibleModules.length === 0) return null; // null = show all
    const cats = new Set();
    accessibleModules.forEach(mod => {
      (MODULE_CATEGORIES[mod] || []).forEach(c => cats.add(c));
    });
    return cats.size > 0 ? cats : null;
  }, [accessibleModules]);

  // ---- Fetch products from Supabase ----
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, code, name, unit_of_measure, presentation, manufacturer,
          species, administration_route, deposit, grupo_contable,
          tipo_uso, criticality, proveedor_notion,
          categories(name)
        `)
        .order("name");

      if (error) {
        console.error("[YPOTI] Error fetching products:", error);
        setLoading(false);
        return;
      }

      const mapped = (data || []).map(p => {
        const catName = p.categories?.name || "";
        const group = CATEGORY_TO_GROUP[catName] || catName || "Otro";
        return {
          id: p.id,
          code: p.code || "—",
          name: p.name || "Sin nombre",
          group,
          category: catName,
          manufacturer: p.manufacturer || "",
          species: p.species || "",
          presentation: p.presentation || "",
          unit: p.unit_of_measure || "",
          administration_route: p.administration_route || "",
          deposit: p.deposit || "",
          tipo_uso: p.tipo_uso || "",
          criticality: p.criticality || "",
          proveedor_notion: p.proveedor_notion || "",
        };
      });

      setItems(mapped);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // ---- Permission-filtered items ----
  const permittedItems = useMemo(() => {
    if (!allowedCategories) return items;
    return items.filter(item => allowedCategories.has(item.group));
  }, [items, allowedCategories]);

  const groups = useMemo(() => [...new Set(permittedItems.map(i => i.group))].sort(), [permittedItems]);
  const types = useMemo(() => [...new Set(permittedItems.map(i => i.category).filter(Boolean))].sort(), [permittedItems]);

  const filtered = useMemo(() => {
    return permittedItems.filter(item => {
      if (filterGroup !== "all" && item.group !== filterGroup) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q) ||
          item.manufacturer.toLowerCase().includes(q) ||
          item.proveedor_notion.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, filterGroup, permittedItems]);

  const groupedItems = useMemo(() => {
    const g = {};
    filtered.forEach(item => {
      if (!g[item.group]) g[item.group] = [];
      g[item.group].push(item);
    });
    return g;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: permittedItems.length,
    groups: groups.length,
    types: types.length,
  }), [permittedItems, groups, types]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="animate-[fadeIn_0.3s_ease]">
        <BackButton onClick={onBack} />
        <PageHeader title="Catálogo de Productos" subtitle="Cargando..." />
        <div className="text-center py-[60px] text-slate-400">
          <div className="text-[28px] mb-2">{"📦"}</div>
          <div className="text-[13px]">Cargando cat{"á"}logo...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <BackButton onClick={onBack} />
      <PageHeader
        title="Catálogo de Productos"
        subtitle={`${stats.total} productos · ${stats.groups} categorías · Catálogo maestro`}
      />

      {/* KPI cards -- top groups by count */}
      <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
        {groups
          .map(g => ({ g, count: permittedItems.filter(i => i.group === g).length }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map(({ g, count }) => (
            <div
              key={g}
              onClick={() => setFilterGroup(filterGroup === g ? "all" : g)}
              className="flex-none min-w-[80px] rounded-xl px-3 py-2.5 cursor-pointer text-center transition-all shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              style={{
                background: filterGroup === g
                  ? (GROUP_COLORS[g] || "#9CA3AF") + "12"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${filterGroup === g
                  ? (GROUP_COLORS[g] || "#9CA3AF") + "40"
                  : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: GROUP_COLORS[g] || "#9CA3AF" }}
              >
                {count}
              </div>
              <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">
                {g}
              </div>
            </div>
          ))}
      </div>

      {/* Search & Filter */}
      <div className="px-5 pb-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, código, fabricante, categoría..."
          style={{ marginBottom: 10 }}
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <FilterPill
            label={`Todos (${permittedItems.length})`}
            active={filterGroup === "all"}
            color="#C8A03A"
            onClick={() => setFilterGroup("all")}
          />
          {groups.map(g => {
            const count = permittedItems.filter(i => i.group === g).length;
            return (
              <FilterPill
                key={g}
                label={`${g} (${count})`}
                active={filterGroup === g}
                color={GROUP_COLORS[g]}
                onClick={() => setFilterGroup(filterGroup === g ? "all" : g)}
              />
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="px-5 pt-1 pb-2">
        <div className="text-[11px] text-slate-400 font-medium">
          {filtered.length} productos
          {filterGroup !== "all" && ` · ${filterGroup}`}
          {search && ` · "${search}"`}
        </div>
      </div>

      {/* Items list grouped */}
      <InventoryProductList
        groupedItems={groupedItems}
        onSelectProduct={setSelectedProduct}
      />

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
