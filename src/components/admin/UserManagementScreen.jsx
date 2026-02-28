import { useState, useMemo, useCallback } from "react";
import { colors, font, fontDisplay, inputStyle, labelStyle, shadows, radius } from "../../styles/theme";
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
      <div style={{ padding: 40, textAlign: "center", color: colors.textLight }}>
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
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* Header */}
      <BackButton onClick={onBack} />

      <div style={{ padding: "0 20px 120px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{
            fontFamily: fontDisplay, fontSize: 22, fontWeight: 600,
            color: colors.text, margin: 0,
          }}>
            Gestion de Usuarios
          </h2>
          <button
            onClick={() => { setShowAddForm(true); setEditingUser(null); setActionError(""); }}
            style={{
              padding: "8px 16px", borderRadius: radius.md, border: "none",
              background: colors.primary, color: "#fff",
              fontSize: 13, fontWeight: 600, fontFamily: font, cursor: "pointer",
            }}
          >
            + Nuevo
          </button>
        </div>

        {/* Action error banner */}
        {actionError && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: radius.md, padding: "8px 12px", marginBottom: 12,
            fontSize: 13, color: colors.danger, fontWeight: 500,
          }}>
            {actionError}
          </div>
        )}

        {/* Role summary pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {Object.entries(ROLES).map(([key, role]) => (
            <button
              key={key}
              onClick={() => setFilterRole(filterRole === key ? "all" : key)}
              style={{
                padding: "4px 10px", borderRadius: radius.md, border: "none",
                background: filterRole === key ? (role.color || colors.primary) : (role.color || colors.primary) + "12",
                color: filterRole === key ? "#fff" : (role.color || colors.primary),
                fontSize: 11, fontWeight: 600, fontFamily: font, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {role.label} ({roleCounts[key] || 0})
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Buscar nombre, usuario o cargo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              flex: 1, minWidth: 180, height: 40, fontSize: 13,
              borderRadius: radius.md, padding: "0 12px",
            }}
          />
          <select
            value={filterEstab}
            onChange={e => setFilterEstab(e.target.value)}
            style={{
              ...inputStyle,
              width: "auto", height: 40, fontSize: 12, borderRadius: radius.md,
              padding: "0 8px", cursor: "pointer",
            }}
          >
            <option value="all">Todos establec.</option>
            {establishments.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            style={{
              ...inputStyle,
              width: "auto", height: 40, fontSize: 12, borderRadius: radius.md,
              padding: "0 8px", cursor: "pointer",
            }}
          >
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="all">Todos</option>
          </select>
        </div>

        {/* Results count */}
        <div style={{ fontSize: 12, color: colors.textLight, marginBottom: 12 }}>
          {filtered.length} usuario{filtered.length !== 1 ? "s" : ""}
          {filterRole !== "all" && ` · ${ROLES[filterRole]?.label}`}
          {filterEstab !== "all" && ` · ${filterEstab}`}
        </div>

        {/* User list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
            <div style={{
              textAlign: "center", padding: 32, color: colors.textLight, fontSize: 14,
            }}>
              No se encontraron usuarios
            </div>
          )}
        </div>

        {/* Admin actions */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${colors.borderLight}` }}>
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={actionLoading}
            style={{
              width: "100%", padding: "12px", borderRadius: radius.lg,
              border: `1px solid ${colors.primary}30`,
              background: colors.primary + "08",
              color: colors.primary,
              fontSize: 13, fontWeight: 600, fontFamily: font, cursor: "pointer",
            }}
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
      style={{
        background: colors.card,
        borderRadius: radius.lg,
        padding: "12px 14px",
        border: `1px solid ${colors.borderLight}`,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: isActive ? 1 : 0.5,
        transition: "opacity 0.2s",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: radius.md, flexShrink: 0,
        background: `linear-gradient(135deg, ${role?.color || colors.primary} 0%, ${role?.color || colors.primary}cc 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 700, fontSize: 13,
      }}>
        {user.avatar || user.name.charAt(0)}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: colors.text,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {user.name}
        </div>
        <div style={{
          fontSize: 11, color: colors.textLight,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          @{user.email || user.username} · {user.position || "—"} · {user.establishment}
        </div>
      </div>

      {/* Role badge */}
      <div style={{
        fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: radius.sm,
        background: (role?.color || colors.primary) + "15",
        color: role?.color || colors.primary,
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {role?.label || user.role}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button
          onClick={onEdit}
          disabled={disabled}
          style={{
            width: 32, height: 32, borderRadius: radius.md, border: "none",
            background: colors.surface, cursor: disabled ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}
          title="Editar"
        >
          ✏
        </button>
        <button
          onClick={onToggleActive}
          disabled={disabled}
          style={{
            width: 32, height: 32, borderRadius: radius.md, border: "none",
            background: isActive ? colors.danger + "10" : colors.success + "10",
            cursor: disabled ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}
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

    // Generate avatar if empty
    const parts = form.name.trim().split(/\s+/);
    const avatar = form.avatar || (parts[0]?.charAt(0) + (parts[1]?.charAt(0) || "")).toUpperCase();

    const saveData = {
      name: form.name.trim(),
      role: form.role,
      establishment: form.establishment,
      position: form.position,
      avatar,
    };

    // Only include email for new users
    if (!isEditing) {
      saveData.email = form.email.trim();
    }

    onSave(saveData);
  };

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setError(""); };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.card, borderRadius: radius.xl, padding: 24,
          width: "100%", maxWidth: 440, maxHeight: "90vh", overflow: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{
          fontFamily: fontDisplay, fontSize: 20, fontWeight: 600,
          color: colors.text, margin: "0 0 20px",
        }}>
          {title}
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Nombre completo *</label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              style={{ ...inputStyle, borderRadius: radius.md, height: 42 }}
              placeholder="Ej: Juan Rodriguez"
            />
          </div>

          {/* Username (only for new users) */}
          {!isEditing && (
            <div>
              <label style={labelStyle}>Usuario (login) *</label>
              <input
                value={form.email}
                onChange={e => set("email", e.target.value)}
                style={{ ...inputStyle, borderRadius: radius.md, height: 42 }}
                placeholder="Ej: juan.rodriguez"
                autoCapitalize="none"
                autoCorrect="off"
              />
              <div style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }}>
                La contraseña por defecto será "ypoti2026" — el usuario deberá cambiarla al primer inicio de sesión.
              </div>
            </div>
          )}

          {isEditing && (
            <div>
              <label style={labelStyle}>Usuario (login)</label>
              <div style={{
                ...inputStyle, borderRadius: radius.md, height: 42,
                display: "flex", alignItems: "center", color: colors.textMuted,
                background: colors.surface,
              }}>
                @{user.email || user.username}
              </div>
            </div>
          )}

          {/* Role */}
          <div>
            <label style={labelStyle}>Rol *</label>
            <select
              value={form.role}
              onChange={e => set("role", e.target.value)}
              style={{ ...inputStyle, borderRadius: radius.md, height: 42, cursor: "pointer" }}
            >
              {Object.entries(ROLES).map(([key, role]) => (
                <option key={key} value={key}>{role.label} — {role.description}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }}>
              {ROLES[form.role]?.description}
            </div>
          </div>

          {/* Establishment */}
          <div>
            <label style={labelStyle}>Establecimiento</label>
            <select
              value={form.establishment}
              onChange={e => set("establishment", e.target.value)}
              style={{ ...inputStyle, borderRadius: radius.md, height: 42, cursor: "pointer" }}
            >
              <option value="">Sin asignar</option>
              {establishments.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Position */}
          <div>
            <label style={labelStyle}>Cargo / Posicion</label>
            <input
              value={form.position}
              onChange={e => set("position", e.target.value)}
              style={{ ...inputStyle, borderRadius: radius.md, height: 42 }}
              placeholder="Ej: Capataz, Tractorista..."
            />
          </div>

          {/* Reset password button (only for editing) */}
          {isEditing && onResetPassword && (
            <button
              onClick={onResetPassword}
              disabled={loading}
              style={{
                padding: "10px 14px", borderRadius: radius.md,
                border: `1px solid ${colors.warning}30`,
                background: colors.warningLight || "#FFFBEB",
                color: colors.warning, fontSize: 12, fontWeight: 600,
                fontFamily: font, cursor: loading ? "default" : "pointer",
                textAlign: "center",
              }}
            >
              {loading ? "Reseteando..." : "Resetear contraseña a valor por defecto"}
            </button>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: radius.md, padding: "8px 12px",
              fontSize: 13, color: colors.danger, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "12px", borderRadius: radius.lg,
                border: `1px solid ${colors.border}`,
                background: "transparent", color: colors.text,
                fontSize: 14, fontWeight: 500, fontFamily: font, cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                flex: 1, padding: "12px", borderRadius: radius.lg,
                border: "none",
                background: loading
                  ? colors.textMuted
                  : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: font,
                cursor: loading ? "default" : "pointer",
                boxShadow: loading ? "none" : `0 4px 12px ${colors.primary}30`,
              }}
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
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }}
      onClick={onCancel}
    >
      <div
        style={{
          background: colors.card, borderRadius: radius.xl, padding: 24,
          width: "100%", maxWidth: 360,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{
          fontSize: 17, fontWeight: 600, color: colors.text, margin: "0 0 8px",
        }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: colors.textLight, margin: "0 0 20px", lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "12px", borderRadius: radius.lg,
              border: `1px solid ${colors.border}`,
              background: "transparent", color: colors.text,
              fontSize: 14, fontWeight: 500, fontFamily: font, cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "12px", borderRadius: radius.lg,
              border: "none",
              background: colors.primary, color: "#fff",
              fontSize: 14, fontWeight: 600, fontFamily: font, cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
