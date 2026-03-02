export default function Notification({ notification }) {
  if (!notification) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 max-w-[calc(100vw-2rem)] text-white px-6 py-3 rounded-xl z-[9999] font-medium text-sm shadow-lg animate-[slideDown_0.3s_ease] text-center ${
        notification.type === "success" ? "bg-[#C8A03A]" : "bg-red-500"
      }`}
    >
      {notification.msg}
    </div>
  );
}
