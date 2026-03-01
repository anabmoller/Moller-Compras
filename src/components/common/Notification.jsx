export default function Notification({ notification }) {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-xl z-[9999] font-medium text-sm shadow-lg animate-[slideDown_0.3s_ease] ${
        notification.type === "success" ? "bg-emerald-500" : "bg-red-500"
      }`}
    >
      {notification.msg}
    </div>
  );
}
