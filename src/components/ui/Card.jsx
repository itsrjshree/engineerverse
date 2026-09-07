/**
 * ENGINEERVERSE — Card Primitive
 * Deep dark surface container (#09091b / #0f0f26) with subtle purple border and hover glow.
 * Matches Project & Writings cards from screenshots.
 */

export function Card({
  children,
  className = '',
  hoverEffect = true,
  glow = false,
  onClick,
  ...props
}) {
  const baseClasses =
    'relative rounded-2xl bg-[#0a0a1e]/90 border border-purple-950/40 backdrop-blur-sm transition-all duration-300 overflow-hidden';
  const hoverClasses = hoverEffect
    ? 'hover:border-purple-500/40 hover:bg-[#0f0f2a] hover:shadow-[0_8px_30px_rgba(147,51,234,0.15)] hover:-translate-y-1'
    : '';
  const glowClasses = glow ? 'shadow-[0_0_25px_rgba(168,85,247,0.15)] border-purple-500/30' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${glowClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
