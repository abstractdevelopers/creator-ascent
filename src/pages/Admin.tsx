import { useState } from "react";

type Application = {
  id: string;
  full_name: string;
  email: string;
  current_focus: string;
  reason: string;
  skill_interest: string;
  commitment: string;
  social_handle: string | null;
  created_at: string;
};

export default function Admin() {
  const [password, setPassword] = useState("");
  const [apps, setApps] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-applications`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "x-admin-password": password,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setApps(json.applications);
    } catch (err: any) {
      setError(err.message);
      setApps(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0707] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#E6A9FF]">
              UCA Admin
            </span>
            <h1 className="font-display mt-2 text-3xl sm:text-4xl">Applications</h1>
          </div>
          {apps && (
            <div className="text-sm text-white/60">
              {apps.length} submission{apps.length === 1 ? "" : "s"}
            </div>
          )}
        </header>

        {!apps && (
          <form
            onSubmit={load}
            className="mx-auto max-w-md rounded-2xl border border-[#E6A9FF]/20 bg-white/[0.03] p-6"
          >
            <label className="block text-sm text-white/80">Admin password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#E6A9FF]/60 focus:outline-none"
              placeholder="••••••••"
              autoFocus
            />
            {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold tracking-wide disabled:opacity-50"
            >
              {loading ? "Loading…" : "Unlock"}
            </button>
          </form>
        )}

        {apps && apps.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/60">
            No applications yet.
          </div>
        )}

        {apps && apps.length > 0 && (
          <div className="space-y-3">
            {apps.map((a) => {
              const open = expanded === a.id;
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <button
                    onClick={() => setExpanded(open ? null : a.id)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <div>
                      <div className="font-display text-lg">{a.full_name}</div>
                      <div className="text-sm text-white/60">{a.email}</div>
                      <div className="mt-1 text-xs text-white/40">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[#E6A9FF]">{open ? "−" : "+"}</span>
                  </button>
                  {open && (
                    <dl className="mt-5 grid gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-2">
                      <Field label="Current focus" value={a.current_focus} />
                      <Field label="Skill interest" value={a.skill_interest} />
                      <Field label="Commitment" value={a.commitment} />
                      <Field label="Social" value={a.social_handle || "—"} />
                      <div className="sm:col-span-2">
                        <dt className="text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
                          Reason
                        </dt>
                        <dd className="mt-2 whitespace-pre-wrap leading-relaxed text-white/85">
                          {a.reason}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">{label}</dt>
      <dd className="mt-1 text-white/85">{value}</dd>
    </div>
  );
}