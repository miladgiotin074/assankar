export function Mark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect
        x="7"
        y="8"
        width="18"
        height="16"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M7 13.5h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function Seal({ className = "size-11" }: { className?: string }) {
  return (
    <span className={`seal ${className}`}>
      <Mark />
    </span>
  );
}
