/**
 * ENGINEERVERSE — Badge Primitive
 * Reflects Shree Labs pill aesthetic (e.g. "✨ Shree Labs", "All", "Poetry").
 */

export function Badge({
  children,
  variant = 'default', // 'default' | 'purple' | 'success' | 'warning' | 'outline' | 'glow'
  size = 'sm',
  className = '',
  icon: Icon,
}) {
  const baseClasses = 'inline-flex items-center font-medium select-none whitespace-nowrap rounded-full';

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[11px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2',
  };

  const variantClasses = {
    default: 'bg-white/5 text-slate-300 border border-white/10',
    purple: 'bg-purple-950/60 text-purple-200 border border-purple-800/40',
    glow: 'bg-purple-900/30 text-purple-200 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
    success: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40',
    warning: 'bg-amber-950/60 text-amber-300 border border-amber-800/40',
    outline: 'bg-transparent text-slate-300 border border-white/20',
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
