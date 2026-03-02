/**
 * getUserInitials — Extract 2-letter initials from a user's full name.
 * "Ana Moller" → "AM", "Paulo" → "PA", "" → "?"
 */
export default function getUserInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
