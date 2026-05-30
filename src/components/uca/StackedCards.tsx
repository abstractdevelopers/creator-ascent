import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useState } from "react";

/**
 * A stack of cards that swipe away to reveal the next. Designed to surface
 * long-form copy as bite-sized cinematic beats instead of one wall of text.
 */
export function StackedCards({
  items,
  eyebrow,
}: {
  items: { kicker?: string; text: string }[];
  eyebrow?: string;
}) {
  const [index, setIndex] = useState(0);
  const total = items.length;

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x < -60 || info.velocity.x < -300) next();
    else if (info.offset.x > 60 || info.velocity.x > 300) prev();
  };

  return (
    <div className="w-full select-none">
      {eyebrow && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF] sm:text-sm">
            {eyebrow}
          </span>
          <span className="text-[10px] tracking-[0.3em] text-white/40">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>
      )}

      <div className="relative h-[260px] sm:h-[240px]">
        {items.map((item, i) => {
          const offset = (i - index + total) % total;
          if (offset > 2) return null;
          const isTop = offset === 0;
          return (
            <motion.div
              key={i}
              drag={isTop ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={isTop ? handleDragEnd : undefined}
              initial={false}
              animate={{
                scale: 1 - offset * 0.05,
                y: offset * 14,
                opacity: offset === 2 ? 0.35 : 1 - offset * 0.15,
                zIndex: total - offset,
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <div
                className="flex h-full w-full flex-col justify-between rounded-3xl border border-[#E6A9FF]/20 p-7 sm:p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
                style={{
                  background:
                    "linear-gradient(160deg, #1a0a26 0%, #120516 60%, #0D0707 100%)",
                }}
              >
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#E6A9FF]">
                  {item.kicker ?? `/ ${String(i + 1).padStart(2, "0")}`}
                </div>
                <p className="font-display text-2xl leading-snug sm:text-3xl">
                  {item.text}
                </p>
                <div className="flex items-center justify-between text-[11px] text-white/40">
                  <span>Swipe</span>
                  <span>←  →</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to card ${i + 1}`}
            className={`h-1 rounded-full transition-all ${
              i === index ? "w-8 bg-[#E6A9FF]" : "w-4 bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}