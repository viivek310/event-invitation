type ArrowDirection = "right" | "outward" | "down" | "chevron";

export function RoyalArrow({ direction = "right", className }: { direction?: ArrowDirection; className?: string }) {
  const paths: Record<ArrowDirection, string> = {
    right: "M4 12h15m-6-6 6 6-6 6",
    outward: "M6 18 18 6M7 6h11v11",
    down: "M12 4v15m-6-6 6 6 6-6",
    chevron: "m6 9 6 6 6-6",
  };
  return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none"
    aria-hidden="true" focusable="false" data-royal-icon={direction}>
    <path d={paths[direction]} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function RoyalMark({ className }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 32 32" fill="none"
    aria-hidden="true" focusable="false" data-royal-mark>
    <path d="m16 3 3.5 7.5L27 14l-7.5 3.5L16 25l-3.5-7.5L5 14l7.5-3.5Z"
      stroke="currentColor" strokeWidth=".85" />
    <path d="m16 9 5 5-5 5-5-5Z" stroke="currentColor" strokeWidth=".6" opacity=".65" />
    <circle cx="16" cy="14" r="1.35" fill="currentColor" />
    <path d="M16 28v2M1 14h1m28 0h1" stroke="currentColor" strokeWidth=".8" opacity=".5" />
  </svg>;
}
