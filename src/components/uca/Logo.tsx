export function UCALogo({ className = "" }: { className?: string }) {
  return (
    <div className={`font-display text-2xl tracking-tight ${className}`}>
      <span style={{ color: "#fff" }}>U</span>
      <span style={{ color: "var(--uca-purple-3)" }}>C</span>
      <span style={{ color: "#fff" }}>A</span>
    </div>
  );
}