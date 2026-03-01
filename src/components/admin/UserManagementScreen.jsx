import { useState, useMemo, useCallback } from "react";
import { getEstablishments } from "../../constants/parameters";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/users";
import BackButton from "../common/BackButton";

// ============================================================
// YPOTI — User Management Screen (Supabase Backend)
// Phase 7: Async CRUD via AuthContext → users.js → Supabase
// ============================================================

export default function UserManagementScreen({ onBack }) {
  const { users, editUser, addNewUser, resetUsers, resetUserPassword, can, refreshUsers } = useAuth();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterEstab, setFilterEstab] = useState("all");
  const [filterActive, setFilterActive] = useState("active");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const establishments = useMemo(() => getEstablishments().map(e => e.name), []);

  if (!can("manage_users")) {
    return (
      <div className="p-10 text-center text-slate-400">
        No tienes permiso para acceder a esta seccion.
      </div>
    );
  }

  const filtered = users.filter(u => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (filterEstab !== "all" && u.establishment !== filterEstab) return false;
    if (filterActive === "active" && u.active === false) return false;
    if (filterActive === "inactive" && u.active !== false) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.position || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const roleCounts = {};
  users.filter(u => u.active !== false).forEach(u => {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  });

  const handleToggleActive = async (user) => {
    setActionLoading(true);
    setActionError("");
    try {
      await editUser(user.id, { active: user.active === false ? true : false });
    } catch (err) {
      setActionError("Error al cambiar estado del usuario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSave = async (data) => {
    setActionLoading(true);
    setActionError("");
    try {
      await editUser(editingUser.id, data);
      setEditingUser(null);
    } catch (err) {
      setActionError("Error al guardar cambios");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSave = async (data) => {
    setActionLoading(true);
    setActionError("");
    try {
      await addNewUser(data);
      setShowAddForm(false);
    } catch (err) {
      setActionError(err.message || "Error al crear usuario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId) => {
    setActionLoading(true);
    setActionError("");
    try {
      await resetUserPassword(userId);
      setEditingUser(null);
    } catch (err) {
      setActionError("Error al resetear contraseña");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAll = async () => {
    setActionLoading(true);
    try {
      await resetUsers();
      setShowResetConfirm(false);
    } catch (err) {
      setActionError("Error al refrescar usuarios");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <BackButton onClick={onBack} />

      <div className="px-5 pb-[120px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-semibold text-white m-0">
            Gestion de Usuarios
          </h2>
          <button
            onClick={() => { setShowAddForm(true); setEditingUser(null); setActionError(""); }}
            className="px-4 py-2 rounded-lg border-none bg-emerald-500 text-white text-[13px] font-semibold cursor-pointer"
          >
            + Nuevo
          </button>
        </div>

        {/* Action error banner */}
        {actionError && (
          <div className="bg-red-500/[0.06] border border-red-300/20 rounded-lg px-3 py-2 mb-3 text-[13px] text-red-400 font-medium">
            {actionError}
          </div>
        )}

        {/* Role summary pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(ROLES).map(([key, role]) => (
            <button
              key={key}
              onClick={() => setFilterRole(filterRole === key ? "all" : key)}
              className="px-2.5 py-1 rounded-lg border-none text-[11px] font-semibold cursor-pointer transition-all duration-150"
              style={{
                background: filterRole === key ? (role.color || '#10b981') : (role.color || '#10b981') + "12",
                color: filterRole === key ? '#fff' : (role.color || '#10b981'),
              }}
            >
              {role.label} ({roleCounts[key] || 0})
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <input
            type="text"
            placeholder="Buscar nombre, usuario o cargo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] h-10 px-3 rounded-lg border border-white/[0.1] bg-white/[0.05] text-[13px] text-white outline-none transition-colors focus:border-emerald-500/50"
          />
          <select
            value={filterEstab}
            onChange={e => setFilterEstab(e.target.value)}
            className="w-auto h-10 px-2 rounded-lg border border-white/[0.1] bg-white/[0.05] text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">Todos establec.</option>
            {establishments.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="w-auto h-10 px-2 rounded-lg border border-white/[0.1] bg-white/[0.05] text-xs text-white outline-none cursor-pointer"
          >
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="all">Todos</option>
          </select>
        </div>

        {/* Results count */}
        <div className="text-xs text-slate-400 mb-3">
          {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
          {filterRole !== "all" && ` · ${ROLES[filterRole]?.label}`}
          {filterEstab !== "all" && ` · ${filterEstab}`}
        </div>

        {/* User list */}
        <div className="flex flex-col gap-1.5">
          {filtered.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={() => { setEditingUser(user); setShowAddForm(false); setActionError(""); }}
              onToggleActive={() => handleToggleActive(user)}
              disabled={actionLoading}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center p-8 text-slate-400 text-sm">
              No se encontraron usuarios
            </div>
          )}
        </div>

        {/* Admin actions */}
        <div className="mt-6 pt-4 border-t border-white/[0.06]">
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={actionLoading}
            className="w-full p-3 rounded-xl border border-emerald-500/[0.19] bg-emerald-500/[0.05] text-emerald-400 text-[13px] font-semibold cursor-pointer"
          >
            Refrescar lista de usuarios desde servidor
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <UserFormModal
          user={editingUser}
          title="Editar Usuario"
          establishments={establishments}
          loading={actionLoading}
          onSave={handleEditSave}
          onResetPassword={() => handleResetPassword(editingUser.id)}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* Add Modal */}
      {showAddForm && (
        <UserFormModal
          user={null}
          title="Nuevo Usuario"
          establishments={establishments}
          loading={actionLoading}
          onSave={handleAddSave}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Reset Confirm */}
      {showResetConfirm && (
        <ConfirmModal
          title="Refrescar Usuarios"
          message="Se recargarán todos los usuarios desde el servidor. Los datos locales se actualizarán."
          confirmLabel="Refrescar"
          onConfirm={handleResetAll}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}

// ---- User Card ----
function UserCard({ user, onEdit, onToggleActive, disabled }) {
  const role = ROLES[user.role];
  const isActive = user.active !== false;

  return (
    <div
      className={`bg-white/[0.03] rounded-xl px-3.5 py-3 border border-white/[0.06] flex items-center gap-3 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-50'}`}
    >
      {/* Avatar */}
      <div
        className="w-[38px] h-[38px] rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-[13px]"
        style={{ background: `linear-gradient(135deg, ${role?.color || '#10b981'} 0%, ${role?.color || '#10b981'}cc 100%)` }}
      >
        {user.avatar || user.name.charAt(0)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="text-sm font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
          {user.name}
        </div>
        <div className="text-[11px] text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis">
          @{user.email || user.username} · {user.position || "—"} · {user.establishment}
        </div>
      </div>

      {/* Role badge */}
      <div
        className="text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0"
        style={{
          background: (role?.color || '#10b981') + "15",
          color: role?.color || '#10b981',
        }}
      >
        {role?.label || user.role}
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          disabled={disabled}
          className="w-8 h-8 rounded-lg border-none bg-white/[0.02] cursor-pointer flex items-center justify-center text-sm"
          title="Editar"
        >
          ✏
        </button>
        <button
          onClick={onToggleActive}
          disabled={disabled}
          className={`w-8 h-8 rounded-lg border-none cursor-pointer flex items-center justify-center text-sm ${isActive ? 'bg-red-500/[0.06]' : 'bg-green-500/[0.06]'}`}
          title={isActive ? "Desactivar" : "Activar"}
        >
          {isActive ? "🚫" : "✅"}
        </button>
      </div>
    </div>
  );
}

// ---- User Form Modal ----
function UserFormModal({ user, title, establishments, loading, onSave, onResetPassword, onClose }) {
  const isEditing = !!user;
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || user?.username || "",
    role: user?.role || "solicitante",
    establishment: user?.establishment || "General",
    position: user?.position || "",
    avatar: user?.avatar || "",
  });
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setError("Nombre es obligatorio"); return; }
    if (!isEditing && !form.email.trim()) { setError("Usuario es obligatorio"); return; }

    const parts = form.name.trim().split(/\s+/);
    const avatar = form.avatar || (parts[0]?.charAt(0) + (parts[1]?.charAt(0) || "")).toUpperCase();

    const saveData = {
      name: form.name.trim(),
      role: form.role,
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
        className="bg-[#111218] rounded-2xl p-6 w-full max-w-[440px] max-h-[90vh] overflow-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-white mb-5 mt-0">
          {title}
        </h3>

        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Nombre completo *</label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-[42px]"
              placeholder="Ej: Juan Rodriguez"
            />
          </div>

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

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Rol *</label>
            <select
              value={form.role}
              onChange={e => set("role", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-[42px] cursor-pointer"
            >
              {Object.entries(ROLES).map(([key, role]) => (
                <option key={key} value={key}>{role.label} — {role.description}</option>
              ))}
            </select>
            <div className="text-[11px] text-slate-400 mt-1">
              {ROLES[form.role]?.description}
            </div>
          </div>

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
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 tracking-wide">Cargo / Posicion</label>
            <input
              value={form.position}
              onChange={e => set("position", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.1] bg-white/[0.05] text-sm text-white outline-none transition-colors focus:border-emerald-500/50 h-[42px]"
              placeholder="Ej: Capataz, Tractorista..."
            />
          </div>

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

// ---- Confirm Modal ----
function ConfirmModal({ title, message, confirmLabel = "Confirmar", onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-[#111218] rounded-2xl p-6 w-full max-w-[360px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[17px] font-semibold text-white mb-2 mt-0">
          {title}
        </h3>
        <p className="text-[13px] text-slate-400 mb-5 mt-0 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/[0.06] bg-transparent text-white text-sm font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl border-none bg-emerald-500 text-white text-sm font-semibold cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
