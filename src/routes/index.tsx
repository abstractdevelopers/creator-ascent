import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "@/components/uca/Reveal";
import { Particles } from "@/components/uca/Particles";
import { UCALogo } from "@/components/uca/Logo";
import section1 from "@/assets/section1.jpg";
import section2 from "@/assets/section2.jpg";
import section3 from "@/assets/section3.jpg";
import section4 from "@/assets/section4.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UCA — Unify Creator Academy | Become Impossible to Ignore" },
      {
        name: "description",
        content:
          "A 3-month creator accelerator for the next generation of voices, founders, and personal brands. Applications close June 15.",
      },
      { property: "og:title", content: "Unify Creator Academy" },
      {
        property: "og:description",
        content: "AI is going to replace everything except you. Apply for access.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative overflow-x-hidden bg-[#0D0707] text-white">
      <Nav />
      <Hero />
      <UCAIntro />
      <Community />
      <Structure />
      <FinalClose />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <UCALogo />
        <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#academy" className="hover:text-white transition">Academy</a>
          <a href="#community" className="hover:text-white transition">Community</a>
          <a href="#apply" className="hover:text-white transition">Apply</a>
        </nav>
        <a
          href="#apply"
          className="btn-primary rounded-full px-5 py-2 text-sm font-semibold"
        >
          Apply
        </a>
      </div>
    </header>
  );
}

function CinematicImage({ src, overlay = "dark" }: { src: string; overlay?: "dark" | "bottom" | "side" }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 cinematic-zoom bg-cover bg-center"
        style={{ backgroundImage: `url(${src})` }}
      />
      {overlay === "dark" && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(13,7,7,0.35) 0%, rgba(13,7,7,0.85) 75%, #0D0707 100%)",
          }}
        />
      )}
      {overlay === "bottom" && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(13,7,7,0.3) 0%, rgba(13,7,7,0.6) 55%, #0D0707 100%)",
          }}
        />
      )}
      {overlay === "side" && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #0D0707 0%, rgba(13,7,7,0.55) 45%, rgba(13,7,7,0.1) 100%)",
          }}
        />
      )}
      {/* purple ambient glow */}
      <div
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, #570E83 0%, transparent 70%)" }}
      />
    </div>
  );
}

/* ───────────────────── HERO ───────────────────── */
function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center">
      <CinematicImage src={section1} overlay="dark" />
      <Particles count={28} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-32 text-center">
        <Reveal>
          <span className="inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/70 backdrop-blur">
            Unify Creator Academy
          </span>
        </Reveal>

        <Reveal delay={0.15}>
          <h1 className="font-display mt-8 text-5xl leading-[1.05] sm:text-6xl md:text-7xl lg:text-[88px]">
            AI is going to replace
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #E6A9FF 0%, #fff 50%, #E6A9FF 100%)",
              }}
            >
              everything except you.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.4} className="mx-auto mt-10 max-w-2xl space-y-5 text-lg text-white/70 sm:text-xl">
          <p>The next generation of creators, voices, founders, and influential personal brands is being built right now.</p>
          <p className="text-white/90">This is your opportunity to become one of them.</p>
        </Reveal>

        <Reveal delay={0.6} className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href="#apply" className="btn-primary rounded-full px-8 py-4 text-base font-semibold">
            Become The Next Public Figure
          </a>
          <a href="#final" className="btn-ghost rounded-full px-8 py-4 text-base font-medium">
            Get replaced by AI
          </a>
        </Reveal>

        <Reveal delay={0.9}>
          <div className="mt-24 flex flex-col items-center text-xs uppercase tracking-[0.4em] text-white/40">
            <span>Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-3 h-10 w-px bg-gradient-to-b from-[#E6A9FF] to-transparent"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────── UCA INTRO ───────────────────── */
function UCAIntro() {
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
    <section className="relative min-h-screen overflow-hidden py-32">
      <CinematicImage src={section2} overlay="bottom" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-20 px-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal>
            <span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Chapter 01</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display mt-6 text-4xl leading-tight sm:text-5xl md:text-6xl">
              Unify Creator Academy.
              <br />
              <span className="text-white/60">A 3-month accelerator made for you.</span>
            </h2>
          </Reveal>

          <div className="mt-12 max-w-xl space-y-6 text-lg text-white/70">
            <Reveal delay={0.1}><p>Listen,</p></Reveal>
            <Reveal delay={0.15}><p className="text-white">You were not meant to disappear into the crowd.</p></Reveal>
            <Reveal delay={0.2}><p>Not when you have ideas.</p></Reveal>
            <Reveal delay={0.25}><p>Not when you have vision.</p></Reveal>
            <Reveal delay={0.3}><p>Not when you know you are capable of more.</p></Reveal>
            <Reveal delay={0.4}><p>The internet is changing fast.</p></Reveal>
            <Reveal delay={0.45}>
              <p>
                And the people who learn how to build visibility, influence, communication, and digital presence now…
                <span className="text-white"> will enter the future with an unfair advantage.</span>
              </p>
            </Reveal>
            <Reveal delay={0.5}><p>That is why UCA exists.</p></Reveal>
            <Reveal delay={0.55}>
              <p className="text-white/90">
                To help you build the skills, confidence, positioning, and visibility needed to become impossible to ignore online.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="lg:pt-32">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.3em] text-[#E6A9FF]">If selected,</p>
            <h3 className="font-display mt-3 text-3xl sm:text-4xl">you will gain access to:</h3>
          </Reveal>

          <div className="mt-10 grid gap-3">
            {features.map((f, i) => (
              <Reveal key={f} delay={0.05 * i}>
                <div className="glass group flex items-center gap-4 rounded-2xl px-5 py-4 transition hover:border-[#E6A9FF]/40">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold"
                    style={{ background: "var(--uca-gradient)", color: "#fff" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-white/85 group-hover:text-white">{f}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-12 space-y-3 text-white/70">
              <p>This is not open to everybody.</p>
              <p className="text-white">And that is exactly why you should take this seriously.</p>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="#apply" className="btn-primary rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide">
                APPLY FOR ACCESS
              </a>
              <a href="#final" className="btn-ghost rounded-full px-7 py-3.5 text-sm font-medium">
                No thanks. Let AI replace me
              </a>
            </div>
            <p className="mt-6 max-w-md text-xs leading-relaxed text-white/45">
              Applications close June 15. Selected applicants will receive early access to the private Creator Community before launch.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── COMMUNITY ───────────────────── */
function Community() {
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
    <section id="community" className="relative min-h-screen overflow-hidden py-32">
      <CinematicImage src={section3} overlay="side" />
      <Particles count={20} />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <Reveal>
            <span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Chapter 02 — Community</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display mt-6 text-4xl leading-tight sm:text-5xl md:text-6xl">
              Before the Academy begins,
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #E6A9FF, #fff)" }}
              >
                the movement begins first.
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 text-lg text-white/70">
              Once your application is accepted, you will be added into a private Creator Community filled with ambitious creators, future founders, digital builders, and upcoming influencers preparing for the next era of the internet.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((e, i) => (
            <Reveal key={e} delay={0.04 * i}>
              <div className="glass relative h-full overflow-hidden rounded-2xl p-6 transition hover:-translate-y-1 hover:border-[#E6A9FF]/40">
                <div
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-30"
                  style={{ background: "var(--uca-purple-3)" }}
                />
                <div className="text-xs text-[#E6A9FF]">/ {String(i + 1).padStart(2, "0")}</div>
                <div className="mt-3 font-display text-xl">{e}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mx-auto mt-24 max-w-2xl space-y-4 text-center text-white/75">
            <p>This is where creators begin building momentum before the Academy officially starts.</p>
            <p className="text-white">And the energy inside will not be normal.</p>
          </div>
        </Reveal>

        {/* Highlight panel */}
        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-20 max-w-4xl overflow-hidden rounded-3xl p-[1px]" style={{ background: "linear-gradient(135deg, rgba(230,169,255,0.6), rgba(87,14,131,0.2), rgba(230,169,255,0.6))" }}>
            <div className="relative rounded-[calc(1.5rem-1px)] bg-[#0D0707]/85 p-10 backdrop-blur-xl sm:p-14">
              <div
                className="absolute inset-0 opacity-30"
                style={{ background: "radial-gradient(ellipse at top, #570E83 0%, transparent 70%)" }}
              />
              <div className="relative">
                <div className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Top 20 Reward</div>
                <h3 className="font-display mt-4 text-3xl sm:text-4xl">
                  The Top 20 Members Inside The Community Will Receive:
                </h3>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {perks.map((p) => (
                    <div key={p} className="glass flex items-center gap-3 rounded-xl px-5 py-4">
                      <div className="h-2 w-2 rounded-full bg-[#E6A9FF] animate-pulse-glow" />
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-10 text-white/70">
                  The people who stand out early <span className="text-white">will not be ignored.</span>
                </p>
                <a
                  href="#apply"
                  className="btn-primary mt-8 inline-block rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide"
                >
                  ENTER THE COMMUNITY
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────── ACADEMY STRUCTURE ───────────────────── */
function Structure() {
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
    <section id="academy" className="relative min-h-screen overflow-hidden py-32">
      <CinematicImage src={section4} overlay="dark" />
      <div className="absolute inset-0 grid-overlay opacity-60" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="text-center">
          <Reveal>
            <span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Chapter 03</span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display mt-6 text-5xl sm:text-6xl md:text-7xl">UCA STRUCTURE</h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
              This is where your creator journey actually begins.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              The Academy starts with <span className="text-[#E6A9FF]">one full month of free access.</span>
            </p>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {learning.map((l, i) => (
            <Reveal key={l.t} delay={0.04 * i}>
              <div className="glass group relative h-full overflow-hidden rounded-2xl p-7 transition hover:-translate-y-1">
                <div
                  className="absolute -left-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl transition group-hover:opacity-60"
                  style={{ background: "var(--uca-purple-1)" }}
                />
                <div className="relative">
                  <div className="text-xs text-[#E6A9FF]">MODULE / {String(i + 1).padStart(2, "0")}</div>
                  <h3 className="font-display mt-3 text-2xl">{l.t}</h3>
                  <p className="mt-3 text-sm text-white/60">{l.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <div>
              <div className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Inside the Academy</div>
              <h3 className="font-display mt-4 text-3xl sm:text-4xl">Real execution. Real accountability.</h3>
              <div className="mt-8 space-y-3">
                {access.map((a, i) => (
                  <div
                    key={a}
                    className="glass flex items-center justify-between rounded-xl px-5 py-4"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <span>{a}</span>
                    <span className="text-[#E6A9FF]">→</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="glass relative overflow-hidden rounded-3xl p-10">
              <div
                className="absolute inset-0 opacity-40"
                style={{ background: "radial-gradient(circle at 80% 0%, #570E83 0%, transparent 60%)" }}
              />
              <div className="relative">
                <div className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Continue Deeper</div>
                <h3 className="font-display mt-4 text-3xl sm:text-4xl leading-tight">
                  After the first month
                </h3>
                <p className="mt-5 text-white/70">
                  Members who want to continue deeper into the Academy experience can proceed into the remaining two-month program for just
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-6xl">₦30,000</span>
                  <span className="text-white/60">/ month</span>
                </div>
                <div className="mt-10 space-y-2 text-white/70">
                  <p>No pressure.</p>
                  <p>No empty promises.</p>
                  <p className="text-white">Just growth, structure, visibility, and execution.</p>
                </div>
                <p className="mt-8 text-sm italic text-white/50">
                  This is not for people who want to stay hidden.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="#apply" className="btn-primary rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide">
                    APPLY BEFORE JUNE 15
                  </a>
                </div>
                <p className="mt-5 text-xs leading-relaxed text-white/45">
                  Apply. Get selected. Enjoy the free experience. Opt out when dissatisfied. No pressure.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── FINAL CLOSE + FORM ───────────────────── */
function FinalClose() {
  return (
    <section id="final" className="relative min-h-screen overflow-hidden py-32">
      {/* Animated gradient atmosphere */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 animate-gradient"
          style={{
            background:
              "linear-gradient(135deg, #0D0707 0%, #410B61 35%, #570E83 65%, #0D0707 100%)",
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-50"
          style={{ background: "radial-gradient(circle, #E6A9FF 0%, transparent 70%)" }}
        />
      </div>
      <Particles count={40} />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">The Final Chapter</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display mt-8 text-5xl leading-[1.05] sm:text-6xl md:text-7xl lg:text-8xl">
            A new generation
            <br />
            of creators is rising.
          </h2>
        </Reveal>

        <div className="mx-auto mt-16 max-w-2xl space-y-6 text-lg text-white/80">
          <Reveal delay={0.1}><p>Over the next few years, the internet will reward people who know how to:</p></Reveal>

          <Reveal delay={0.15}>
            <div className="my-8 flex flex-wrap justify-center gap-2">
              {["communicate", "create", "position", "build trust", "build influence", "become visible"].map((w, i) => (
                <span
                  key={w}
                  className="glass rounded-full px-4 py-2 text-sm"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {w}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2}><p>This Academy was built for that future.</p></Reveal>
          <Reveal delay={0.25}><p>And if you are reading this right now…</p></Reveal>
          <Reveal delay={0.3}><p className="text-white">There is a chance you already know you belong in rooms like this.</p></Reveal>
          <Reveal delay={0.4}><p>Applications close June 15.</p></Reveal>
          <Reveal delay={0.45}><p className="text-white/60 text-base">Once registration closes, selected applicants will receive access to the private Creator Community before the Academy officially begins.</p></Reveal>
          <Reveal delay={0.55}><p className="font-display text-2xl text-white">The next version of your life may begin with one decision.</p></Reveal>
        </div>

        <WaitlistForm />
      </div>
    </section>
  );
}

function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div id="apply" className="mx-auto mt-16 max-w-xl">
      <Reveal>
        <div className="glass rounded-3xl p-8 sm:p-10 glow-purple">
          {submitted ? (
            <div className="py-10 text-center">
              <div className="font-display text-3xl">You're on the list.</div>
              <p className="mt-4 text-white/70">
                Selected applicants will be contacted before June 15.
              </p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name && email) setSubmitted(true);
              }}
              className="space-y-4 text-left"
            >
              <div className="text-center">
                <h3 className="font-display text-3xl">Apply for Access</h3>
                <p className="mt-2 text-sm text-white/60">Selection is limited. Applications reviewed individually.</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">Your Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#E6A9FF]/60 focus:outline-none focus:ring-2 focus:ring-[#E6A9FF]/20"
                  placeholder="Jane Creator"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">Email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#E6A9FF]/60 focus:outline-none focus:ring-2 focus:ring-[#E6A9FF]/20"
                  placeholder="you@domain.com"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-primary mt-4 w-full rounded-full px-7 py-4 text-sm font-semibold tracking-[0.15em]"
              >
                APPLY FOR ACCESS NOW
              </motion.button>
            </form>
          )}
        </div>
      </Reveal>
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#0D0707] py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-4">
          <UCALogo />
          <span className="text-xs text-white/40">Unify Creator Academy</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/50">
          <a href="#" className="hover:text-white transition">Instagram</a>
          <a href="#" className="hover:text-white transition">X / Twitter</a>
          <a href="#" className="hover:text-white transition">TikTok</a>
          <a href="#" className="hover:text-white transition">YouTube</a>
        </div>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} UCA. All rights reserved.</p>
      </div>
    </footer>
  );
}
