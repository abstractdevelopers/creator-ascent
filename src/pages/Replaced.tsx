import { Bot } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Replaced() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0707] px-6 py-20 text-white">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 40%, rgba(230,169,255,0.18) 0%, rgba(13,7,7,0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(230,169,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(230,169,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-[680px] flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="relative"
        >
          <div
            className="absolute inset-0 -z-10 rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, #E6A9FF55 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-44 w-44 items-center justify-center rounded-[2rem] border border-[#E6A9FF]/30 bg-white/[0.03] backdrop-blur-sm sm:h-56 sm:w-56"
          >
            <Bot
              className="h-28 w-28 sm:h-36 sm:w-36"
              color="#E6A9FF"
              strokeWidth={2.4}
              absoluteStrokeWidth
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-10"
        >
          <div className="text-xs uppercase tracking-[0.5em] text-[#E6A9FF]">
            System override
          </div>
          <h1 className="font-display mt-5 text-4xl leading-[1.02] sm:text-5xl md:text-6xl">
            You just got
            <br />
            <span style={{ color: "#E6A9FF" }}>replaced by AI.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
            The algorithms moved on. The audience moved on. The opportunity moved on.
            <br />
            <span className="text-white">Get back now to save yourself.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-10"
        >
          <Link
            to="/"
            className="btn-primary inline-block rounded-full px-8 py-4 text-sm font-semibold tracking-[0.18em]"
          >
            GO BACK & SAVE YOURSELF
          </Link>
        </motion.div>
      </div>
    </main>
  );
}