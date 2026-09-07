/**
 * ENGINEERVERSE — Button Primitive
 * Pure JavaScript / React.
 * Matches Shree Labs visual language: dark with glowing purple accents or sleek borders.
 */

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'pill'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050510]';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-full gap-1.5 min-h-[36px]',
    md: 'px-4 py-2 text-sm rounded-full gap-2 min-h-[44px]',
    lg: 'px-6 py-3 text-base rounded-full gap-2.5 min-h-[48px]',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/50 hover:shadow-purple-700/40 hover:-translate-y-0.5 active:translate-y-0',
    secondary:
      'bg-[#0f0f26] hover:bg-[#161638] text-purple-200 border border-purple-900/40 hover:border-purple-600/50',
    outline:
      'bg-transparent hover:bg-purple-950/20 text-white border border-white/20 hover:border-purple-400',
    ghost:
      'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white',
    pill:
      'bg-purple-950/50 hover:bg-purple-900/60 text-purple-200 border border-purple-500/30 rounded-full',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

export default Button;
