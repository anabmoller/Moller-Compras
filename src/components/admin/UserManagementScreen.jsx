import { useState, useMemo } from "react";
import { getEstablishments } from "../../constants/parameters";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/users";
import BackButton from "../common/BackButton";
import UserCard from "./UserCard";
import UserFormModal from "./UserFormModal";
import ConfirmModal from "./ConfirmModal";

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
      const msg = err.message || "";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered") || msg.toLowerCase().includes("existe") || msg.toLowerCase().includes("duplicate")) {
        setActionError("Este usuario ya fue registrado. Verifica el nombre de usuario e intenta de nuevo.");
      } else {
        setActionError(msg || "Error al crear usuario");
      }
      // Keep modal open so user can fix the issue
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
          existingNames={users.map(u => u.name)}
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
          existingNames={users.map(u => u.name)}
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
