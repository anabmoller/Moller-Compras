export default function Badge({ children, variant = 'default', size = 'sm', dot = false, className = '' }) {
  const variants = {
    default: 'bg-slate-500/10 text-slate-400',
    success: 'bg-emerald-500/10 text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-red-500/10 text-red-400',
    info: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant] || variants.default} ${sizes[size] || sizes.sm} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full bg-current ${variant === 'danger' ? 'animate-pulse' : ''}`} />}
      {children}
    </span>
  );
}
