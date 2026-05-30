import { motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "@/components/uca/Reveal";
import { StackedCards } from "@/components/uca/StackedCards";
import { ApplicationForm } from "@/components/uca/ApplicationForm";
import section1 from "@/assets/section1.webp";
import section2 from "@/assets/section2.webp";
import section3 from "@/assets/section3.webp";
import section4 from "@/assets/section4.webp";

export default function Index() {
  const [open, setOpen] = useState(false);
  const apply = () => setOpen(true);
  return (
    <main className="relative overflow-x-hidden bg-[#0D0707] text-white">
      <Hero apply={apply} />
      <UCAIntro apply={apply} />
      <Community apply={apply} />
      <Structure apply={apply} />
      <FinalClose apply={apply} />
      <Footer />
      <ApplicationForm open={open} onOpenChange={setOpen} />
    </main>
  );
}

function KeyArt({
  src,
  alt,
  bg = "#4B0E83",
  priority = false,
}: {
  src: string;
  alt: string;
  bg?: string;
  priority?: boolean;
}) {
  return (
    <div className="relative w-full" style={{ background: bg }}>
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "low"}
        className="block h-auto w-full select-none"
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(180deg, transparent 0%, #0D0707 100%)" }}
      />
    </div>
  );
}

/* ───────────────────── HERO ───────────────────── */
function Hero({ apply }: { apply: () => void }) {
  return (
    <section className="relative">
      <KeyArt src={section1} alt="UCA — Unify Creator Academy" bg="#4B0E83" priority />

      <div className="relative -mt-[22vh] bg-gradient-to-b from-transparent via-[#0D0707] to-[#0D0707] px-6 pb-16 pt-0 sm:-mt-32 sm:pt-4">
        <div className="mx-auto max-w-[750px] text-center">
          <Reveal>
            <h1 className="font-display text-[38px] leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              AI IS GOING
              <br />
              TO REPLACE
              <br />
              EVERYTHING
              <br />
              EXCEPT{" "}
              <span style={{ color: "#E6A9FF" }}>YOU.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mx-auto mt-5 h-px w-40 bg-gradient-to-r from-transparent via-[#E6A9FF] to-transparent" />
          </Reveal>

          <Reveal delay={0.25}>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={apply}
                className="btn-primary rounded-full px-7 py-4 text-center text-sm font-semibold tracking-wide"
              >
                BECOME THE NEXT PUBLIC FIGURE
              </button>
              <a
                href="/replaced"
                className="btn-ghost rounded-full px-7 py-4 text-center text-sm font-medium"
              >
                Get replaced by AI
              </a>
            </div>
          </Reveal>

          <div className="mt-16 space-y-4 text-center">
            <Reveal delay={0.15}>
              <p className="text-[15px] leading-relaxed text-white/55 sm:text-base">
                The next generation of creators, voices, founders and personal brands is being built right now.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="font-display text-xl leading-snug text-white sm:text-2xl">
                This is your opportunity to become one of them.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── UCA INTRO ───────────────────── */
function UCAIntro({ apply }: { apply: () => void }) {
  const features = [
    "Private Creator Community",
    "Academy launch environment",
    "Creator challenges & competitions",
    "Visibility opportunities",
    "Personal brand development",
    "Content creation systems",
    "Network of ambitious creators",
  ];

  return (
    <section className="relative">
      <KeyArt src={section2} alt="UCA — A 3-month accelerator" bg="#4B0E83" />

      <div className="relative bg-[#0D0707] px-6 pb-24 pt-12 sm:pt-20">
        <div className="mx-auto max-w-[750px] text-center">
          <Reveal delay={0.1}>
            <h2 className="font-display mt-5 text-4xl leading-[1.02] sm:text-5xl md:text-6xl">
              A 3-month accelerator
              <br />
              <span className="text-white/55">made for you.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-14 text-left">
              <StackedCards
                eyebrow="Listen — swipe through"
                items={[
                  { kicker: "/ 01", text: "You were not meant to disappear into the crowd." },
                  { kicker: "/ 02", text: "Not when you have ideas." },
                  { kicker: "/ 03", text: "Not when you have vision." },
                  { kicker: "/ 04", text: "Not when you know you are capable of more." },
                ]}
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="my-16 h-px w-full bg-gradient-to-r from-transparent via-[#E6A9FF]/30 to-transparent" />
          </Reveal>

          <div className="space-y-6 text-center text-lg text-white/70">
            <Reveal><p>The internet is changing fast.</p></Reveal>
            <Reveal delay={0.1}>
              <p className="text-white">
                Those who learn to build visibility, influence and presence now will enter the future with an unfair advantage.
              </p>
            </Reveal>
            <Reveal delay={0.2}><p>That is why UCA exists.</p></Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="mt-16">
              <p className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">
                If selected, you gain access to
              </p>
            </div>
          </Reveal>
        </div>

        <div className="-mx-6 mt-6 overflow-x-auto hide-scrollbar">
          <div className="flex gap-3 px-6 pb-4 snap-x snap-mandatory">
            {features.map((f, i) => (
              <Reveal key={f} delay={0.04 * i}>
                <div className="glass min-w-[230px] snap-start rounded-2xl p-5 text-left">
                  <div className="text-[10px] tracking-[0.3em] text-[#E6A9FF]">
                    / {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-3 font-display text-lg leading-tight">{f}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-[750px] text-center">
          <Reveal delay={0.2}>
            <div className="mt-16 space-y-3 text-center text-white/70">
              <p>This is not open to everybody.</p>
              <p className="text-white text-xl font-display">
                And that is exactly why you should take this seriously.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <button
              onClick={apply}
              className="btn-primary mt-10 inline-block rounded-full px-7 py-4 text-sm font-semibold tracking-wide"
            >
              APPLY FOR ACCESS
            </button>
            <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-white/45">
              Applications close June 15. Selected applicants get early access to the private Creator Community before launch.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── COMMUNITY ───────────────────── */
function Community({ apply }: { apply: () => void }) {
  const experiences = [
    "Creator challenges",
    "Competitions",
    "Networking",
    "Collaboration opportunities",
    "Engagement activities",
    "Visibility games",
    "Creator spotlights",
    "Live interactions",
    "Weekly experiences",
  ];
  const perks = [
    "Full 3-Month Academy Access For Free",
    "Premium Recognition",
    "Priority Opportunities",
    "Early Visibility Access",
  ];

  return (
    <section id="community" className="relative">
      <KeyArt src={section3} alt="UCA Community" bg="#EFE6F7" />

      <div className="relative bg-[#0D0707] px-6 pb-24 pt-12 sm:pt-20">
        <div className="mx-auto max-w-[750px] text-center">
          <Reveal>
            <span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">
              Community
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display mt-5 text-4xl leading-[1.02] sm:text-5xl md:text-6xl">
              Before the Academy begins,
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #E6A9FF, #fff)" }}
              >
                the movement begins.
              </span>
            </h2>
          </Reveal>

          <div className="mt-12 space-y-6 text-center text-lg text-white/70">
            <Reveal><p>Once accepted, you enter a private Creator Community.</p></Reveal>
            <Reveal delay={0.1}>
              <p>Filled with ambitious creators, future founders, digital builders and upcoming influencers.</p>
            </Reveal>
            <Reveal delay={0.2}><p className="text-white">Preparing for the next era of the internet.</p></Reveal>
          </div>
        </div>

        <div className="mt-14 overflow-x-auto hide-scrollbar">
          <div className="flex gap-3 px-1 pb-4 snap-x snap-mandatory">
            {experiences.map((e, i) => (
              <Reveal key={e} delay={0.03 * i}>
                <div className="glass min-w-[220px] snap-start rounded-2xl p-5">
                  <div className="text-[10px] tracking-[0.3em] text-[#E6A9FF]">
                    / {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-3 font-display text-lg leading-tight">{e}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-[750px] space-y-4 text-center text-white/75">
          <Reveal><p>This is where creators build momentum before the Academy officially starts.</p></Reveal>
          <Reveal delay={0.1}><p className="text-white font-display text-xl">The energy inside will not be normal.</p></Reveal>
        </div>

        <div className="mx-auto mt-16 max-w-[750px]">
          <Reveal>
            <div className="rounded-3xl border border-[#E6A9FF]/20 bg-white/[0.03] p-8 text-center sm:p-10">
              <div className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">
                Top 20 Reward
              </div>
              <h3 className="font-display mt-4 text-2xl leading-tight sm:text-3xl">
                The Top 20 members will receive:
              </h3>
              <div className="mt-8 space-y-3 text-left">
                {perks.map((p, i) => (
                  <Reveal key={p} delay={0.05 * i}>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
                      <span className="font-display text-sm text-[#E6A9FF]">0{i + 1}</span>
                      <span className="text-white/90">{p}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <p className="mt-8 text-white/70">
                The people who stand out early <span className="text-white">will not be ignored.</span>
              </p>
              <button
                onClick={apply}
                className="btn-primary mt-8 inline-block rounded-full px-7 py-4 text-sm font-semibold tracking-wide"
              >
                ENTER THE COMMUNITY
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── ACADEMY STRUCTURE ───────────────────── */
function Structure({ apply }: { apply: () => void }) {
  const learning = [
    { t: "Personal Branding", d: "Position who you are with intention." },
    { t: "Content Creation", d: "Make work that demands attention." },
    { t: "Storytelling & Scriptwriting", d: "Engineer narratives that move people." },
    { t: "Communication & Influence", d: "Speak in a way that shifts rooms." },
    { t: "Social Media Growth", d: "Build audiences with compounding momentum." },
    { t: "Visibility Systems", d: "Be seen by the right people, on purpose." },
  ];
  const access = [
    "Creator assignments",
    "Accountability systems",
    "Implementation tasks",
    "Feedback environments",
    "Guided growth systems",
  ];

  return (
    <section id="academy" className="relative">
      <KeyArt src={section4} alt="UCA Structure" bg="#4B0E83" />

      <div className="relative bg-[#0D0707] px-6 pb-24 pt-12 sm:pt-20">
        <div className="mx-auto max-w-[750px] text-center">
          <Reveal delay={0.1}>
            <h2 className="font-display mt-5 text-5xl leading-[0.95] sm:text-6xl md:text-7xl">
              UCA<br />STRUCTURE
            </h2>
          </Reveal>

          <div className="mt-10 space-y-5 text-center text-lg text-white/70">
            <Reveal><p>This is where your creator journey actually begins.</p></Reveal>
            <Reveal delay={0.1}>
              <p className="text-white">
                It starts with <span className="text-[#E6A9FF]">one full month of free access.</span>
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-14 overflow-x-auto hide-scrollbar">
          <div className="flex gap-4 px-1 pb-4 snap-x snap-mandatory">
            {learning.map((l, i) => (
              <Reveal key={l.t} delay={0.03 * i}>
                <div className="glass min-w-[260px] max-w-[280px] snap-start rounded-2xl p-6">
                  <div className="text-[10px] tracking-[0.3em] text-[#E6A9FF]">
                    MODULE / {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-display mt-3 text-xl leading-tight">{l.t}</h3>
                  <p className="mt-3 text-sm text-white/60">{l.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-[750px] text-center">
          <Reveal>
            <div className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">
              Inside the Academy
            </div>
            <h3 className="font-display mt-4 text-3xl sm:text-4xl">
              Real execution.
              <br />
              <span className="text-white/55">Real accountability.</span>
            </h3>
          </Reveal>

          <div className="mt-8 space-y-3 text-left">
            {access.map((a, i) => (
              <Reveal key={a} delay={0.04 * i}>
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
                  <span>{a}</span>
                  <span className="text-[#E6A9FF]">→</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-16 rounded-3xl border border-[#E6A9FF]/20 bg-white/[0.03] p-8 text-center sm:p-10">
              <div className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">
                Continue Deeper
              </div>
              <h3 className="font-display mt-4 text-3xl leading-tight sm:text-4xl">
                After the first month
              </h3>
              <p className="mt-5 text-white/70">
                Continue into the remaining two-month program for just
              </p>
              <div className="mt-6 flex items-baseline justify-center gap-2">
                <span className="font-display text-6xl">₦30,000</span>
                <span className="text-white/60">/ month</span>
              </div>
              <div className="mt-10 space-y-3 text-white/70">
                <Reveal><p>No pressure.</p></Reveal>
                <Reveal delay={0.1}><p>No empty promises.</p></Reveal>
                <Reveal delay={0.2}>
                  <p className="text-white">Just growth, structure, visibility and execution.</p>
                </Reveal>
              </div>
              <p className="mt-8 text-sm italic text-white/50">
                This is not for people who want to stay hidden.
              </p>
              <button
                onClick={apply}
                className="btn-primary mt-8 inline-block rounded-full px-7 py-4 text-sm font-semibold tracking-wide"
              >
                APPLY BEFORE JUNE 15
              </button>
              <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-white/45">
                Apply. Get selected. Enjoy the free experience. Opt out when dissatisfied.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── FINAL CLOSE ───────────────────── */
function FinalClose({ apply }: { apply: () => void }) {
  return (
    <section id="final" className="relative">
      <div className="relative bg-[#0D0707] px-6 pb-24 pt-24 sm:pt-32">
        <div className="mx-auto max-w-[750px] text-center">
          <Reveal delay={0.1}>
            <h2 className="font-display mt-6 text-5xl leading-[0.95] sm:text-6xl md:text-7xl">
              A NEW
              <br />
              GENERATION
              <br />
              <span className="text-white/55">is rising.</span>
            </h2>
          </Reveal>

          <div className="mt-12 space-y-6 text-center text-lg text-white/70">
            <Reveal><p>The internet will reward people who know how to:</p></Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {["communicate", "create", "position", "build trust", "build influence", "become visible"].map((w) => (
                <span key={w} className="rounded-full border border-[#E6A9FF]/25 bg-white/[0.03] px-4 py-2 text-sm text-white/85">
                  {w}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-12 text-left">
              <StackedCards
                eyebrow="A note to you — swipe"
                items={[
                  { kicker: "/ 01", text: "This Academy was built for that future." },
                  { kicker: "/ 02", text: "And if you are reading this right now…" },
                  { kicker: "/ 03", text: "You already know you belong in rooms like this." },
                ]}
              />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="my-14 h-px w-full bg-gradient-to-r from-transparent via-[#E6A9FF]/30 to-transparent" />
          </Reveal>

          <div className="space-y-4 text-center text-white/70">
            <Reveal><p className="text-white font-display text-2xl">Applications close June 15.</p></Reveal>
            <Reveal delay={0.1}>
              <p className="text-sm">
                Once registration closes, selected applicants receive access to the private Creator Community before the Academy officially begins.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <p className="mt-10 font-display text-2xl leading-snug text-white">
              The next version of your life may begin with one decision.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={apply}
              className="btn-primary mt-12 inline-block rounded-full px-10 py-5 text-sm font-semibold tracking-[0.18em]"
            >
              APPLY FOR ACCESS NOW
            </motion.button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0D0707] px-6 py-10">
      <div className="mx-auto flex max-w-[750px] flex-col gap-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs uppercase tracking-[0.3em] text-white/40">
          Unify Creator Academy
        </span>
        <div className="flex flex-wrap items-center gap-5">
          <a href="#" className="transition hover:text-white">Instagram</a>
          <a href="#" className="transition hover:text-white">X</a>
          <a href="#" className="transition hover:text-white">TikTok</a>
          <a href="#" className="transition hover:text-white">YouTube</a>
        </div>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} UCA</p>
      </div>
    </footer>
  );
}