import { useState, useMemo } from "react";
import { colors, font, fontDisplay, inputStyle, labelStyle, shadows, radius } from "../../styles/theme";
import { ESTABLISHMENTS } from "../../constants";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/users";
import BackButton from "../common/BackButton";

export default function UserManagementScreen({ onBack }) {
  const { users, editUser, addNewUser, resetUsers, can } = useAuth();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterEstab, setFilterEstab] = useState("all");
  const [filterActive, setFilterActive] = useState("active");
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!can("manage_users")) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.textLight }}>
        No tienes permiso para acceder a esta seccion.
      </div>
    );
  }

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (filterRole !== "all" && u.role !== filterRole) return false;
      if (filterEstab !== "all" && u.establishment !== filterEstab) return false;
      if (filterActive === "active" && u.active === false) return false;
      if (filterActive === "inactive" && u.active !== false) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.position || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, search, filterRole, filterEstab, filterActive]);

  const roleCounts = useMemo(() => {
    const counts = {};
    users.filter(u => u.active !== false).forEach(u => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

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
            onClick={() => { setShowAddForm(true); setEditingUser(null); }}
            style={{
              padding: "8px 16px", borderRadius: radius.md, border: "none",
              background: colors.primary, color: "#fff",
              fontSize: 13, fontWeight: 600, fontFamily: font, cursor: "pointer",
            }}
          >
            + Nuevo
          </button>
        </div>

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
            {ESTABLISHMENTS.map(e => <option key={e} value={e}>{e}</option>)}
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
              onEdit={() => { setEditingUser(user); setShowAddForm(false); }}
              onToggleActive={() => editUser(user.id, { active: user.active === false ? true : false })}
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
            style={{
              width: "100%", padding: "12px", borderRadius: radius.lg,
              border: `1px solid ${colors.danger}30`,
              background: colors.danger + "08",
              color: colors.danger,
              fontSize: 13, fontWeight: 600, fontFamily: font, cursor: "pointer",
            }}
          >
            Resetear usuarios a datos originales
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <UserFormModal
          user={editingUser}
          title="Editar Usuario"
          onSave={(data) => { editUser(editingUser.id, data); setEditingUser(null); }}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* Add Modal */}
      {showAddForm && (
        <UserFormModal
          user={null}
          title="Nuevo Usuario"
          onSave={(data) => { addNewUser(data); setShowAddForm(false); }}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Reset Confirm */}
      {showResetConfirm && (
        <ConfirmModal
          title="Resetear Usuarios"
          message="Se perderan todos los cambios realizados a usuarios y se restauraran los datos originales del organigrama. Esta accion no se puede deshacer."
          onConfirm={() => { resetUsers(); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}

// ---- User Card ----
function UserCard({ user, onEdit, onToggleActive }) {
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
          @{user.email} · {user.position || "—"} · {user.establishment}
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
          style={{
            width: 32, height: 32, borderRadius: radius.md, border: "none",
            background: colors.surface, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}
          title="Editar"
        >
          ✏
        </button>
        <button
          onClick={onToggleActive}
          style={{
            width: 32, height: 32, borderRadius: radius.md, border: "none",
            background: isActive ? colors.danger + "10" : colors.success + "10",
            cursor: "pointer",
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
function UserFormModal({ user, title, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: user?.password || "ypoti2026",
    role: user?.role || "solicitante",
    establishment: user?.establishment || "General",
    position: user?.position || "",
    avatar: user?.avatar || "",
  });
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setError("Nombre es obligatorio"); return; }
    if (!form.email.trim()) { setError("Usuario es obligatorio"); return; }
    if (!form.password) { setError("Contraseña es obligatoria"); return; }

    // Generate avatar if empty
    const parts = form.name.trim().split(/\s+/);
    const avatar = form.avatar || (parts[0]?.charAt(0) + (parts[1]?.charAt(0) || "")).toUpperCase();

    onSave({ ...form, name: form.name.trim(), email: form.email.trim(), avatar });
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

          {/* Username */}
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
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Contraseña *</label>
            <input
              value={form.password}
              onChange={e => set("password", e.target.value)}
              style={{ ...inputStyle, borderRadius: radius.md, height: 42 }}
              placeholder="Contraseña"
            />
          </div>

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
              {ESTABLISHMENTS.map(e => <option key={e} value={e}>{e}</option>)}
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

          {/* Error */}
          {error && (
            <div style={{
              background: "#fef2f2", border: `1px solid #fecaca`,
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
              style={{
                flex: 1, padding: "12px", borderRadius: radius.lg,
                border: "none",
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
                color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: font,
                cursor: "pointer", boxShadow: `0 4px 12px ${colors.primary}30`,
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Confirm Modal ----
function ConfirmModal({ title, message, onConfirm, onCancel }) {
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
              background: colors.danger, color: "#fff",
              fontSize: 14, fontWeight: 600, fontFamily: font, cursor: "pointer",
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
