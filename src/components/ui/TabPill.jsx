/**
 * ENGINEERVERSE — TabPill Primitive
 * Faithfully matches Screenshot 3 writings filter pills ("All", "Poetry", "Tech").
 */

export function TabPill({
  label,
  count,
  active = false,
  onClick,
  icon: Icon,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
        active
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60 font-semibold'
          : 'bg-purple-950/30 text-purple-200/75 border border-purple-900/30 hover:bg-purple-900/40 hover:text-white'
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
            active ? 'bg-purple-800/80 text-white' : 'bg-white/10 text-purple-300'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default TabPill;
