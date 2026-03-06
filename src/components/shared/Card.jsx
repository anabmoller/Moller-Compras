export default function Card({ children, className = '', hover = true, onClick, ...props }) {
  return (
    <div
      className={`
        bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl
        ${hover ? 'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border)] transition-all duration-300' : ''}
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
