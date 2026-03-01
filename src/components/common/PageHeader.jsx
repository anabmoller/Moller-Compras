/**
 * Shared page header with title and optional subtitle.
 * Replaces duplicate header patterns across admin screens.
 */
export default function PageHeader({
  title,
  subtitle,
  children, // optional right-side content (buttons, etc.)
}) {
  return (
    <div className="px-5 pb-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-[22px] font-normal text-white m-0 mb-1">
            {title}
          </h2>
          {subtitle && (
            <div className="text-[13px] text-slate-400">{subtitle}</div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
