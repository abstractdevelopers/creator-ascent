import { motion } from "framer-motion";
import { useState } from "react";
import { Reveal } from "./components/uca/Reveal";
import { StackedCards } from "./components/uca/StackedCards";
import section1 from "./assets/section1.jpg";
import section2 from "./assets/section2.jpg";
import section3 from "./assets/section3.jpg";
import section4 from "./assets/section4.jpg";

export default function App() {
  return (
    <main className="relative overflow-x-hidden bg-[#0D0707] text-white">
      <Hero />
      <UCAIntro />
      <Community />
      <Structure />
      <FinalClose />
      <Footer />
    </main>
  );
}

function KeyArt({ src, alt, bg = "#4B0E83", priority = false }: { src: string; alt: string; bg?: string; priority?: boolean }) {
  return (
    <div className="relative w-full" style={{ background: bg }}>
      <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className="block h-auto w-full select-none" draggable={false} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24" style={{ background: "linear-gradient(180deg, transparent 0%, #0D0707 100%)" }} />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <KeyArt src={section1} alt="UCA — Unify Creator Academy" bg="#4B0E83" priority />
      <div className="relative -mt-[22vh] bg-gradient-to-b from-transparent via-[#0D0707] to-[#0D0707] px-6 pb-16 pt-0 sm:-mt-32 sm:pt-4">
        <div className="mx-auto max-w-[750px]">
          <Reveal>
            <h1 className="font-display text-[38px] leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
              AI IS GOING<br />TO REPLACE<br />EVERYTHING<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #E6A9FF 0%, #fff 100%)" }}>YOU.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}><div className="mt-5 h-px w-40 bg-gradient-to-r from-[#E6A9FF] to-transparent" /></Reveal>
          <Reveal delay={0.25}>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="#apply" className="btn-primary rounded-full px-7 py-4 text-center text-sm font-semibold tracking-wide">BECOME THE NEXT PUBLIC FIGURE</a>
              <a href="#final" className="btn-ghost rounded-full px-7 py-4 text-center text-sm font-medium">Get replaced by AI</a>
            </div>
          </Reveal>
          <div className="mt-16 grid gap-6 sm:grid-cols-[88px_1fr] sm:gap-8">
            <Reveal delay={0.1}>
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#E6A9FF]">Now</span>
                <span className="h-px w-12 bg-[#E6A9FF]/40 sm:w-16" />
              </div>
            </Reveal>
            <div className="space-y-4">
              <Reveal delay={0.15}><p className="text-[15px] leading-relaxed text-white/55 sm:text-base">The next generation of creators, voices, founders and personal brands is being built right now.</p></Reveal>
              <Reveal delay={0.25}><p className="font-display text-xl leading-snug text-white sm:text-2xl">This is your opportunity to become one of them.</p></Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UCAIntro() {
  const features = ["Private Creator Community", "Academy launch environment", "Creator challenges & competitions", "Visibility opportunities", "Personal brand development", "Content creation systems", "Network of ambitious creators"];
  return (
    <section className="relative">
      <KeyArt src={section2} alt="UCA — A 3-month accelerator" bg="#4B0E83" />
      <div className="relative bg-[#0D0707] px-6 pb-24 pt-12 sm:pt-20">
        <div className="mx-auto max-w-[750px]">
          <Reveal><span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Chapter 01</span></Reveal>
          <Reveal delay={0.1}><h2 className="font-display mt-5 text-4xl leading-[1.02] sm:text-5xl md:text-6xl">A 3-month accelerator<br /><span className="text-white/55">made for you.</span></h2></Reveal>
          <Reveal delay={0.1}>
            <div className="mt-14">
              <StackedCards eyebrow="Listen — swipe through" items={[
                { kicker: "/ 01", text: "You were not meant to disappear into the crowd." },
                { kicker: "/ 02", text: "Not when you have ideas." },
                { kicker: "/ 03", text: "Not when you have vision." },
                { kicker: "/ 04", text: "Not when you know you are capable of more." }
              ]} />
            </div>
          </Reveal>
          <Reveal delay={0.1}><div className="my-16 h-px w-full bg-gradient-to-r from-transparent via-[#E6A9FF]/30 to-transparent" /></Reveal>
          <div className="space-y-6 text-lg text-white/70">
            <Reveal><p>The internet is changing fast.</p></Reveal>
            <Reveal delay={0.1}><p className="text-white">Those who learn to build visibility, influence and presence now will enter the future with an unfair advantage.</p></Reveal>
            <Reveal delay={0.2}><p>That is why UCA exists.</p></Reveal>
          </div>
          <Reveal delay={0.1}><div className="mt-16"><p className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">If selected, you gain access to</p></div></Reveal>
          <div className="-mx-6 mt-6 overflow-x-auto hide-scrollbar">
            <div className="flex gap-3 px-6 pb-4 snap-x snap-mandatory">
              {features.map((f, i) => (<Reveal key={f} delay={0.04 * i}><div className="glass min-w-[230px] snap-start rounded-2xl p-5"><div className="text-[10px] tracking-[0.25em] text-[#E6A9FF]">{f}</div></div></Reveal>))}
            </div>
          </div>
          <Reveal delay={0.1}>
            <div className="mt-16 rounded-3xl border border-[#E6A9FF]/20 bg-white/[0.03] p-8 sm:p-10">
              <div className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">First Month Free</div>
              <h3 className="font-display mt-4 text-3xl sm:text-4xl leading-tight">Try before you buy.</h3>
              <p className="mt-5 text-white/70">Full access to the entire first month — completely free. No hidden tricks.</p>
              <div className="mt-6 flex items-baseline gap-2"><span className="font-display text-6xl">FREE</span></div>
              <div className="mt-10 space-y-3 text-white/70">
                <Reveal><p>Zero risk.</p></Reveal>
                <Reveal delay={0.1}><p>Full access to community, resources, and launch environment.</p></Reveal>
                <Reveal delay={0.2}><p className="text-white">See if UCA is for you before spending a cent.</p></Reveal>
              </div>
              <a href="#apply" className="btn-primary mt-8 inline-block rounded-full px-7 py-4 text-sm font-semibold tracking-wide">APPLY NOW</a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Community() {
  return (
    <section className="relative">
      <KeyArt src={section3} alt="Community" bg="#4B0E83" />
      <div className="relative bg-[#0D0707] px-6 pb-24 pt-12 sm:pt-20">
        <div className="mx-auto max-w-[750px]">
          <Reveal><span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Chapter 02</span></Reveal>
          <Reveal delay={0.1}><h2 className="font-display mt-5 text-4xl leading-[1.02] sm:text-5xl md:text-6xl">Find your<br /><span className="text-white/55">people.</span></h2></Reveal>
          <div className="mt-16 space-y-6 text-lg text-white/70">
            <Reveal delay={0.1}><p>You can go further with a group than you ever could alone.</p></Reveal>
            <Reveal delay={0.2}><p className="text-white">That is why we built a private community of ambitious creators.</p></Reveal>
            <Reveal delay={0.3}><p>People who want to build. People who want to grow. People who refuse to stay small.</p></Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="mt-16 rounded-3xl border border-[#E6A9FF]/20 bg-white/[0.03] p-8 sm:p-10">
              <div className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Continue Deeper</div>
              <h3 className="font-display mt-4 text-3xl sm:text-4xl leading-tight">After the first month</h3>
              <p className="mt-5 text-white/70">Continue into the remaining two-month program for just</p>
              <div className="mt-6 flex items-baseline gap-2"><span className="font-display text-6xl">₦30,000</span><span className="text-white/60">/ month</span></div>
              <div className="mt-10 space-y-3 text-white/70">
                <Reveal><p>No pressure.</p></Reveal>
                <Reveal delay={0.1}><p>No empty promises.</p></Reveal>
                <Reveal delay={0.2}><p className="text-white">Just growth, structure, visibility and execution.</p></Reveal>
              </div>
              <p className="mt-8 text-sm italic text-white/50">This is not for people who want to stay hidden.</p>
              <a href="#apply" className="btn-primary mt-8 inline-block rounded-full px-7 py-4 text-sm font-semibold tracking-wide">APPLY BEFORE JUNE 15</a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Structure() {
  return (
    <section className="relative">
      <KeyArt src={section4} alt="Structure" bg="#4B0E83" />
      <div className="relative bg-[#0D0707] px-6 pb-24 pt-12 sm:pt-20">
        <div className="mx-auto max-w-[750px]">
          <Reveal><span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">Chapter 03</span></Reveal>
          <Reveal delay={0.1}><h2 className="font-display mt-5 text-4xl leading-[1.02] sm:text-5xl md:text-6xl">Build your<br /><span className="text-white/55">future.</span></h2></Reveal>
          <div className="mt-16 space-y-6 text-lg text-white/70">
            <Reveal delay={0.1}><p>The industry will not slow down for you.</p></Reveal>
            <Reveal delay={0.2}><p className="text-white">So we built a structure that keeps you moving forward every single day.</p></Reveal>
            <Reveal delay={0.3}><p>Daily prompts. Weekly challenges. Monthly milestones.</p></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalClose() {
  return (
    <section id="final" className="relative">
      <div className="relative bg-[#0D0707] px-6 pb-24 pt-24 sm:pt-32">
        <div className="mx-auto max-w-[750px]">
          <Reveal><span className="text-xs uppercase tracking-[0.4em] text-[#E6A9FF]">The Final Chapter</span></Reveal>
          <Reveal delay={0.1}><h2 className="font-display mt-6 text-5xl leading-[0.95] sm:text-6xl md:text-7xl">A NEW<br />GENERATION<br /><span className="text-white/55">is rising.</span></h2></Reveal>
          <div className="mt-12 space-y-6 text-lg text-white/70">
            <Reveal><p>The internet will reward people who know how to:</p></Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="mt-6 flex flex-wrap gap-2">
              {["communicate", "create", "position", "build trust", "build influence", "become visible"].map((w) => (
                <span key={w} className="rounded-full border border-[#E6A9FF]/25 bg-white/[0.03] px-4 py-2 text-sm text-white/85">{w}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-12">
              <StackedCards eyebrow="A note to you — swipe" items={[
                { kicker: "/ 01", text: "This Academy was built for that future." },
                { kicker: "/ 02", text: "And if you are reading this right now…" },
                { kicker: "/ 03", text: "You already know you belong in rooms like this." }
              ]} />
            </div>
          </Reveal>
          <Reveal delay={0.1}><div className="my-14 h-px w-full bg-gradient-to-r from-transparent via-[#E6A9FF]/30 to-transparent" /></Reveal>
          <div className="space-y-4 text-white/70">
            <Reveal><p className="text-white font-display text-2xl">Applications close June 15.</p></Reveal>
            <Reveal delay={0.1}><p className="text-sm">Once registration closes, selected applicants receive access to the private Creator Community before the Academy officially begins.</p></Reveal>
          </div>
          <Reveal delay={0.2}><p className="mt-10 font-display text-2xl text-white leading-snug">The next version of your life may begin with one decision.</p></Reveal>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}

function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <div id="apply" className="mt-16">
      <Reveal>
        <div className="rounded-3xl border border-[#E6A9FF]/20 bg-white/[0.03] p-8 sm:p-10">
          {submitted ? (
            <div className="py-10 text-center">
              <div className="font-display text-3xl">You're on the list.</div>
              <p className="mt-4 text-white/70">Selected applicants will be contacted before June 15.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (name && email) setSubmitted(true); }} className="space-y-4">
              <div>
                <h3 className="font-display text-3xl">Apply for Access</h3>
                <p className="mt-2 text-sm text-white/60">Selection is limited. Applications reviewed individually.</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">Your Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#E6A9FF]/60 focus:outline-none focus:ring-2 focus:ring-[#E6A9FF]/20" placeholder="Jane Creator" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-white/50">Email</label>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/30 focus:border-[#E6A9FF]/60 focus:outline-none focus:ring-2 focus:ring-[#E6A9FF]/20" placeholder="you@domain.com" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary mt-4 w-full rounded-full px-7 py-4 text-sm font-semibold tracking-[0.15em]">
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
    <footer className="border-t border-white/10 bg-[#0D0707] px-6 py-10">
      <div className="mx-auto flex max-w-[750px] flex-col gap-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs uppercase tracking-[0.3em] text-white/40">Unify Creator Academy</span>
        <div className="flex flex-wrap items-center gap-5">
          <a href="#" className="hover:text-white transition">Instagram</a>
          <a href="#" className="hover:text-white transition">X</a>
          <a href="#" className="hover:text-white transition">TikTok</a>
          <a href="#" className="hover:text-white transition">YouTube</a>
        </div>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} UCA</p>
      </div>
    </footer>
  );
}
