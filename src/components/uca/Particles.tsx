import { useMemo } from "react";

export function Particles({ count = 24 }: { count?: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 8,
        duration: 8 + Math.random() * 10,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: "rgba(230,169,255,0.55)",
            boxShadow: "0 0 10px rgba(230,169,255,0.8)",
            animation: `float-slow ${d.duration}s ease-in-out ${d.delay}s infinite, pulse-glow ${d.duration / 2}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}