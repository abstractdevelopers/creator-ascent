import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FOCUS_OPTIONS = [
  "I want to build a personal brand",
  "I want to become a content creator",
  "I already create content but need structure",
  "I want to grow my visibility online",
  "I want to learn creator skills for the AI era",
  "I know I'm capable of more but I've been stuck",
];

const SKILL_OPTIONS = [
  "Personal Branding",
  "Content & Scriptwriting",
  "Graphic Design & Branding",
  "Video Editing",
  "Communication & Influence",
  "Social Media Growth Systems",
];

const COMMITMENT_OPTIONS = [
  "I'm fully ready to participate seriously",
  "I'll participate when I can",
  "I'm mostly just exploring for now",
];

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

export function ApplicationForm({ open, onOpenChange }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    current_focus: "",
    reason: "",
    skill_interest: "",
    commitment: "",
    social_handle: "",
  });

  const update = <K extends keyof typeof form>(k: K, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const valid = !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/submit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          current_focus: form.current_focus,
          reason: form.reason.trim(),
          skill_interest: form.skill_interest,
          commitment: form.commitment,
          social_handle: form.social_handle.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Submission failed");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSubmitted(false);
    setForm({
      full_name: "",
      email: "",
      current_focus: "",
      reason: "",
      skill_interest: "",
      commitment: "",
      social_handle: "",
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 300);
      }}
    >
      <DialogContent
        className="max-h-[92vh] w-[calc(100vw-24px)] max-w-[640px] overflow-y-auto rounded-3xl border-[#E6A9FF]/25 p-0 text-white sm:rounded-3xl"
        style={{
          background:
            "linear-gradient(160deg, #1a0a26 0%, #120516 60%, #0D0707 100%)",
          boxShadow: "0 30px 80px -20px rgba(0,0,0,0.9)",
        }}
      >
        <DialogTitle className="sr-only">Apply for UCA Access</DialogTitle>
        {submitted ? (
          <div className="px-6 py-14 text-center sm:px-10">
            <div className="mx-auto mb-6 h-12 w-12 rounded-full border border-[#E6A9FF]/40 bg-[#E6A9FF]/10" />
            <h3 className="font-display text-3xl leading-tight sm:text-4xl">
              Application Received.
            </h3>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/70">
              Once applications are reviewed, selected applicants will receive
              updates through email, including early access information for the
              private Creator Community.
            </p>
            <p className="mt-8 font-display text-lg text-[#E6A9FF]">
              The next generation of creators is being built now.
            </p>

            <div className="mt-10 rounded-2xl border border-[#E6A9FF]/20 bg-white/[0.03] p-6 text-center">
              <p className="text-sm text-white/70">
                Follow us on Instagram for the latest updates
              </p>
              <a
                href="https://instagram.com/unifycreatoracademy"
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[#E6A9FF]/30 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#E6A9FF]/60 hover:bg-white/[0.07]"
              >
                <Instagram size={18} className="text-[#E6A9FF]" />
                @unifycreatoracademy
              </a>
              <p className="mt-4 text-xs text-white/50">
                Also check your email for confirmation and future updates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-ghost mt-10 rounded-full px-7 py-3 text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-10 sm:py-10">
            <header className="text-center">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#E6A9FF]">
                UCA Waitlist
              </span>
              <h2 className="font-display mt-3 text-3xl leading-tight sm:text-4xl">
                Apply For Access
              </h2>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/65">
                You are applying for early access into the Unify Creator Academy
                ecosystem and private Creator Community. Applications are
                reviewed individually.
              </p>
              <p className="mt-3 text-xs text-white/40">
                This should only take 2–3 minutes.
              </p>
            </header>

            <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-[#E6A9FF]/30 to-transparent" />

            <div className="space-y-7">
              <Field label="Full Name">
                <input
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className={inputCls}
                  placeholder="Jane Creator"
                />
              </Field>

              <Field
                label="Email Address"
                hint="All Academy updates, community access information, and selection notices will be sent here."
              >
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className={inputCls}
                  placeholder="you@domain.com"
                />
              </Field>

              <Field label="Which best describes you right now?">
                <RadioList
                  name="current_focus"
                  value={form.current_focus}
                  options={FOCUS_OPTIONS}
                  onChange={(v) => update("current_focus", v)}
                />
              </Field>

              <Field
                label="Why do you want to join UCA?"
                hint="Be honest. We are not looking for perfect answers — we are looking for intention."
              >
                <textarea
                  value={form.reason}
                  onChange={(e) => update("reason", e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder="Tell us in a few sentences…"
                />
              </Field>

              <Field
                label="Which creator skill interests you the most right now?"
              >
                <RadioList
                  name="skill_interest"
                  value={form.skill_interest}
                  options={SKILL_OPTIONS}
                  onChange={(v) => update("skill_interest", v)}
                />
              </Field>

              <Field
                label="If selected, how committed are you to participating in the community and Academy experience?"
              >
                <RadioList
                  name="commitment"
                  value={form.commitment}
                  options={COMMITMENT_OPTIONS}
                  onChange={(v) => update("commitment", v)}
                />
              </Field>

              <Field label="Instagram or TikTok username (optional)">
                <input
                  value={form.social_handle}
                  onChange={(e) => update("social_handle", e.target.value)}
                  className={inputCls}
                  placeholder="@yourhandle"
                />
              </Field>
            </div>

            <motion.button
              whileHover={{ scale: valid ? 1.01 : 1 }}
              whileTap={{ scale: valid ? 0.99 : 1 }}
              type="submit"
              disabled={!valid || submitting}
              className="btn-primary mt-10 w-full rounded-full px-7 py-4 text-sm font-semibold tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "SUBMITTING…" : "SUBMIT APPLICATION"}
            </motion.button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:border-[#E6A9FF]/60 focus:outline-none focus:ring-2 focus:ring-[#E6A9FF]/20 transition";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/85">
        {label}
        {required && <span className="ml-1 text-[#E6A9FF]">*</span>}
      </label>
      <div className="mt-3">{children}</div>
      {hint && (
        <p className="mt-2 text-xs leading-relaxed text-white/45">{hint}</p>
      )}
    </div>
  );
}

function RadioList({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
              selected
                ? "border-[#E6A9FF]/60 bg-[#E6A9FF]/[0.08]"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={selected}
              onChange={() => onChange(opt)}
              className="sr-only"
            />
            <span
              className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full border ${
                selected
                  ? "border-[#E6A9FF] bg-[#E6A9FF] shadow-[0_0_12px_rgba(230,169,255,0.6)]"
                  : "border-white/30"
              }`}
            />
            <span className="text-sm leading-snug text-white/85">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}