import { useState, useMemo, useRef, useEffect } from "react";
import { ROLES } from "../../constants/users";

// ---- Searchable Name ComboBox ----
function NameComboBox({ value, onChange, existingNames = [] }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(value || "");
  const ref = useRef(null);

  const uniqueNames = useMemo(() => [...new Set(existingNames)].sort(), [existingNames]);
  const filtered = useMemo(() => {
    if (!filter || filter.length < 1) return uniqueNames.slice(0, 10);
    const q = filter.toLowerCase();
    return uniqueNames.filter(n => n.toLowerCase().includes(q)).slice(0, 10);
  }, [filter, uniqueNames]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Nombre completo *</label>
      <input
        value={filter}
        onChange={e => { setFilter(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-[42px]"
        placeholder="Buscar o escribir nombre..."
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1b23] border border-white/[0.1] rounded-lg shadow-xl max-h-[200px] overflow-y-auto">
          {filtered.map(n => (
            <button
              key={n}
              onClick={() => { onChange(n); setFilter(n); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-sm border-none cursor-pointer transition-colors ${
                n === value ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'bg-transparent text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Multi-Role Checkboxes ----
function RoleCheckboxes({ selectedRoles, onChange }) {
  const toggle = (roleKey) => {
    if (selectedRoles.includes(roleKey)) {
      // Don't allow unchecking the last role
      if (selectedRoles.length <= 1) return;
      onChange(selectedRoles.filter(r => r !== roleKey));
    } else {
      onChange([...selectedRoles, roleKey]);
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Roles * <span className="text-slate-500 font-normal">(selecciona uno o mas)</span></label>
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(ROLES).map(([key, role]) => {
          const checked = selectedRoles.includes(key);
          return (
            <label
              key={key}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                checked
                  ? 'bg-white/[0.06] border-emerald-500/30'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(key)}
                className="w-3.5 h-3.5 accent-emerald-500 cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold" style={{ color: checked ? role.color : '#94a3b8' }}>
                  {role.label}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <div className="text-[11px] text-slate-400 mt-1.5">
        Rol principal: <span className="font-semibold text-white">{ROLES[selectedRoles[0]]?.label || "—"}</span>
        {selectedRoles.length > 1 && ` + ${selectedRoles.length - 1} adicional${selectedRoles.length > 2 ? "es" : ""}`}
      </div>
    </div>
  );
}

// ---- Position Select (filterable dropdown with custom entry) ----
const POSITION_OPTIONS = [
  "Capataz", "Tractorista", "Peon", "Encargado", "Supervisor",
  "Gerente", "Director", "Administrativo", "Veterinario",
  "Tecnico Agricola", "Mecanico", "Chofer", "Auxiliar Contable",
  "Coordinador de Compras", "Asistente",
];

function PositionSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(value || "");
  const ref = useRef(null);

  const filtered = POSITION_OPTIONS.filter(o =>
    o.toLowerCase().includes((filter || "").toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Cargo / Posicion</label>
      <input
        value={filter}
        onChange={e => { setFilter(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-[42px]"
        placeholder="Buscar o escribir cargo..."
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1b23] border border-white/[0.1] rounded-lg shadow-xl max-h-[200px] overflow-y-auto">
          {filtered.map(o => (
            <button
              key={o}
              onClick={() => { onChange(o); setFilter(o); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2 text-sm border-none cursor-pointer transition-colors ${
                o === value ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'bg-transparent text-slate-300 hover:bg-white/[0.06]'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- User Form Modal ----
export default function UserFormModal({ user, title, establishments, existingNames, loading, onSave, onResetPassword, onClose }) {
  const isEditing = !!user;

  // Parse existing roles (could be comma-separated or single)
  const initialRoles = user?.roles
    ? (Array.isArray(user.roles) ? user.roles : user.roles.split(","))
    : user?.role ? [user.role] : ["solicitante"];

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || user?.username || "",
    roles: initialRoles,
    establishment: user?.establishment || "General",
    position: user?.position || "",
    avatar: user?.avatar || "",
  });
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setError("Nombre es obligatorio"); return; }
    if (!isEditing && !form.email.trim()) { setError("Usuario es obligatorio"); return; }
    if (form.roles.length === 0) { setError("Selecciona al menos un rol"); return; }

    const parts = form.name.trim().split(/\s+/);
    const avatar = form.avatar || (parts[0]?.charAt(0) + (parts[1]?.charAt(0) || "")).toUpperCase();

    const saveData = {
      name: form.name.trim(),
      role: form.roles[0], // Primary role for backward compatibility
      roles: form.roles,   // All selected roles
      establishment: form.establishment,
      position: form.position,
      avatar,
    };

    if (!isEditing) {
      saveData.email = form.email.trim();
    }

    onSave(saveData);
  };

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setError(""); };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1b23] rounded-2xl p-6 w-full max-w-[440px] max-h-[90vh] overflow-auto shadow-2xl border border-white/[0.08]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-white mb-5 mt-0">
          {title}
        </h3>

        <div className="flex flex-col gap-4">
          {/* Searchable Name */}
          <NameComboBox
            value={form.name}
            onChange={(v) => set("name", v)}
            existingNames={existingNames}
          />

          {/* Username (only for new users) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Usuario (login) *</label>
              <input
                value={form.email}
                onChange={e => set("email", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-[42px]"
                placeholder="Ej: juan.rodriguez"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <div className="text-[11px] text-slate-400 mt-1">
                La contraseña por defecto será "ypoti2026" — el usuario deberá cambiarla al primer inicio de sesión.
              </div>
            </div>
          )}

          {isEditing && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Usuario (login)</label>
              <div className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.02] text-sm text-slate-500 h-[42px] flex items-center">
                @{user.email || user.username}
              </div>
            </div>
          )}

          {/* Multi-Role Checkboxes */}
          <RoleCheckboxes
            selectedRoles={form.roles}
            onChange={(roles) => set("roles", roles)}
          />

          {/* Establishment */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Establecimiento</label>
            <select
              value={form.establishment}
              onChange={e => set("establishment", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-[42px] cursor-pointer"
            >
              <option value="">Sin asignar</option>
              {establishments.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Position */}
          <PositionSelect value={form.position} onChange={(v) => set("position", v)} />

          {/* Reset password button (only for editing) */}
          {isEditing && onResetPassword && (
            <button
              onClick={onResetPassword}
              disabled={loading}
              className={`px-3.5 py-2.5 rounded-lg border border-amber-500/[0.19] bg-amber-500/[0.05] text-amber-400 text-xs font-semibold text-center ${loading ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {loading ? "Reseteando..." : "Resetear contraseña a valor por defecto"}
            </button>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/[0.06] border border-red-300/20 rounded-lg px-3 py-2 text-[13px] text-red-400 font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 mt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/[0.06] bg-transparent text-white text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex-1 py-3 rounded-xl border-none text-sm font-semibold ${
                loading
                  ? 'bg-slate-500 text-white cursor-default'
                  : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white cursor-pointer shadow-md shadow-emerald-500/20'
              }`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
