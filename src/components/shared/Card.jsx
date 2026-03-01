export default function Card({ children, className = '', hover = true, onClick, ...props }) {
  return (
    <div
      className={`
        bg-white/[0.03] border border-white/[0.06] rounded-xl
        ${hover ? 'hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
