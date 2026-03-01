// ============================================================
// YPOTI — AddItemModal (extracted from RequestDetail)
// Catalog search + manual item entry for adding to a request
// ============================================================
import { useState } from "react";
import { colors, font, fontDisplay, inputStyle, radius } from "../../styles/theme";
import { INVENTORY_ITEMS } from "../../constants";
import ModalBackdrop from "../common/ModalBackdrop";

export default function AddItemModal({ onClose, onAdd }) {
  const [tab, setTab] = useState("catalogo"); // catalogo | manual
  const [search, setSearch] = useState("");
  const [manual, setManual] = useState({ codigo: "", nombre: "", cantidad: 1, unidad: "un", precioUnitario: 0, proveedor: "" });

  const filtered = INVENTORY_ITEMS.filter(it =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    it.code.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 15);

  const handleSelectCatalog = (item) => {
    onAdd({
      codigo: item.code,
      nombre: item.name,
      cantidad: 1,
      unidad: "un",
      precioUnitario: 0,
      proveedor: "",
    });
  };

  const handleManualAdd = () => {
    if (!manual.nombre) return;
    onAdd({ ...manual, precioUnitario: Number(manual.precioUnitario) || 0, cantidad: Number(manual.cantidad) || 1 });
  };

  return (
    <ModalBackdrop onClose={onClose} variant="center">
      <div style={{
        background: colors.bg, borderRadius: radius.xl,
        maxWidth: 480, width: "100%", maxHeight: "70vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        animation: "slideUp 0.25s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 20px 12px", display: "flex",
          justifyContent: "space-between", alignItems: "center",
        }}>
          <h3 style={{ fontFamily: fontDisplay, fontSize: 18, fontWeight: 600, color: colors.text, margin: 0 }}>
            Agregar Item
          </h3>
          <button onClick={onClose} style={{
            background: colors.border, border: "none", width: 30, height: 30,
            borderRadius: radius.md, cursor: "pointer", fontSize: 14,
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, padding: "0 20px", marginBottom: 12,
        }}>
          {[{ key: "catalogo", label: "Catálogo" }, { key: "manual", label: "Manual" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "10px", border: "none",
              background: tab === t.key ? colors.primary : colors.card,
              color: tab === t.key ? "#fff" : colors.text,
              fontSize: 12, fontWeight: 600, fontFamily: font, cursor: "pointer",
              borderRadius: t.key === "catalogo" ? `${radius.md}px 0 0 ${radius.md}px` : `0 ${radius.md}px ${radius.md}px 0`,
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ overflow: "auto", padding: "0 20px 20px", flex: 1 }}>
          {tab === "catalogo" ? (
            <>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por código o nombre..."
                style={{ ...inputStyle, marginBottom: 10 }}
                autoFocus
              />
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: colors.textLight }}>
                  Sin resultados
                </div>
              ) : (
                filtered.map(it => (
                  <button key={it.code} onClick={() => handleSelectCatalog(it)} style={{
                    width: "100%", textAlign: "left", padding: "10px 12px",
                    background: colors.card, borderRadius: radius.md,
                    border: `1px solid ${colors.borderLight}`,
                    marginBottom: 6, cursor: "pointer", fontFamily: font,
                  }}>
                    <div style={{ fontSize: 10, color: colors.primary, fontWeight: 600 }}>{it.code}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{it.name}</div>
                    <div style={{ fontSize: 10, color: colors.textLight }}>{it.type} · {it.group}</div>
                  </button>
                ))
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>Nombre *</label>
                <input value={manual.nombre} onChange={e => setManual({ ...manual, nombre: e.target.value })} placeholder="Nombre del item" style={inputStyle} autoFocus />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>Código</label>
                  <input value={manual.codigo} onChange={e => setManual({ ...manual, codigo: e.target.value })} placeholder="Ej: VET-001" style={inputStyle} />
                </div>
                <div style={{ width: 80 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>Cantidad</label>
                  <input type="number" value={manual.cantidad} onChange={e => setManual({ ...manual, cantidad: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ width: 70 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>Unidad</label>
                  <input value={manual.unidad} onChange={e => setManual({ ...manual, unidad: e.target.value })} placeholder="un" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>Precio Unitario ₲</label>
                  <input type="number" value={manual.precioUnitario} onChange={e => setManual({ ...manual, precioUnitario: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.textLight, display: "block", marginBottom: 4 }}>Proveedor</label>
                  <input value={manual.proveedor} onChange={e => setManual({ ...manual, proveedor: e.target.value })} placeholder="Opcional" style={inputStyle} />
                </div>
              </div>
              <button onClick={handleManualAdd} disabled={!manual.nombre} style={{
                width: "100%", padding: 14, borderRadius: radius.lg,
                border: "none",
                background: manual.nombre
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
                  : colors.border,
                color: manual.nombre ? "#fff" : colors.textLight,
                fontSize: 13, fontWeight: 600, fontFamily: font,
                cursor: manual.nombre ? "pointer" : "default",
                marginTop: 4,
              }}>
                Agregar Item
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}
