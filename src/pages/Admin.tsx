import { useState } from "react";
import { toast } from "sonner";

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
  unsubscribed?: boolean;
};

export default function Admin() {
  const [password, setPassword] = useState("");
  const [apps, setApps] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tab, setTab] = useState<"apps" | "broadcast">("apps");

  // Broadcast composer state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("Hi {{first_name}},\n\n");
  const [headerUrl, setHeaderUrl] = useState("");
  const [footerUrl, setFooterUrl] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<null | "header" | "footer" | "inline">(null);
  const [inlineAssets, setInlineAssets] = useState<string[]>([]);

  const FN_BASE = `/api`;
  const authHeaders = {
    "x-admin-password": password,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  async function load(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${FN_BASE}/admin-applications`, {
        method: "GET",
        headers: authHeaders,
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

  async function uploadImage(file: File, kind: "header" | "footer" | "inline") {
    setUploadingKind(kind);
    try {
      const b64: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          const s = (r.result as string).split(",")[1];
          resolve(s);
        };
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const res = await fetch(`${FN_BASE}/email-upload`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: b64,
          fileName: file.name,
          contentType: file.type,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      if (kind === "header") setHeaderUrl(json.url);
      else if (kind === "footer") setFooterUrl(json.url);
      else setInlineAssets(prev => [json.url, ...prev]);

      toast.success(`${kind} image uploaded`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingKind(null);
    }
  }

  async function sendBroadcast(test: boolean) {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    if (test && !testEmail) {
      toast.error("Enter a test email first");
      return;
    }

    const activeApps = apps?.filter(a => !a.unsubscribed) || [];
    const targetIds = !test && selectedRecipients.size > 0
      ? Array.from(selectedRecipients)
      : undefined;

    const count = targetIds ? targetIds.length : activeApps.length;

    if (!test) {
      if (!confirm(`Send to ${count} subscriber${count === 1 ? "" : "s"}?`)) return;
    }
    setSending(true);
    try {
      const res = await fetch(`${FN_BASE}/send-broadcast`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          headerImageUrl: headerUrl || undefined,
          footerImageUrl: footerUrl || undefined,
          testEmail: test ? testEmail : undefined,
          recipientIds: targetIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      toast.success(
        test
          ? `Test sent to ${testEmail}`
          : `Sent ${json.sent}/${json.total} (${json.failed_count} failed)`,
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
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
            <h1 className="font-display mt-2 text-3xl sm:text-4xl">
              {tab === "apps" ? "Applications" : "Broadcast"}
            </h1>
          </div>
          {apps && (
            <div className="flex items-center gap-3 text-sm text-white/60">
              <span>
                {apps.length} submission{apps.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </header>

        {apps && (
          <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button
              onClick={() => setTab("apps")}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                tab === "apps" ? "bg-[#E6A9FF] text-black" : "text-white/70"
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setTab("broadcast")}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                tab === "broadcast" ? "bg-[#E6A9FF] text-black" : "text-white/70"
              }`}
            >
              Broadcast
            </button>
          </div>
        )}

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

        {apps && tab === "apps" && apps.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/60">
            No applications yet.
          </div>
        )}

        {apps && tab === "apps" && apps.length > 0 && (
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

        {apps && tab === "broadcast" && (
          <BroadcastComposer
            apps={apps}
            subject={subject}
            setSubject={setSubject}
            body={body}
            setBody={setBody}
            headerUrl={headerUrl}
            setHeaderUrl={setHeaderUrl}
            footerUrl={footerUrl}
            setFooterUrl={setFooterUrl}
            testEmail={testEmail}
            setTestEmail={setTestEmail}
            selectedRecipients={selectedRecipients}
            setSelectedRecipients={setSelectedRecipients}
            sending={sending}
            uploadingKind={uploadingKind}
            inlineAssets={inlineAssets}
            onUpload={uploadImage}
            onSend={sendBroadcast}
          />
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

type ComposerProps = {
  apps: Application[];
  subject: string;
  setSubject: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  headerUrl: string;
  setHeaderUrl: (s: string) => void;
  footerUrl: string;
  setFooterUrl: (s: string) => void;
  testEmail: string;
  setTestEmail: (s: string) => void;
  selectedRecipients: Set<string>;
  setSelectedRecipients: (s: Set<string>) => void;
  sending: boolean;
  uploadingKind: null | "header" | "footer" | "inline";
  inlineAssets: string[];
  onUpload: (f: File, kind: "header" | "footer" | "inline") => void;
  onSend: (test: boolean) => void;
};

function BroadcastComposer(p: ComposerProps) {
  const [search, setSearch] = useState("");

  const activeApps = p.apps.filter(a => !a.unsubscribed);

  const filteredApps = activeApps.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRecipient = (id: string) => {
    const next = new Set(p.selectedRecipients);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    p.setSelectedRecipients(next);
  };

  const selectNew = () => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const newIds = activeApps
      .filter(a => new Date(a.created_at) > fortyEightHoursAgo)
      .map(a => a.id);
    p.setSelectedRecipients(new Set(newIds));
  };

  const effectiveCount = p.selectedRecipients.size > 0 ? p.selectedRecipients.size : activeApps.length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
            Subject
          </label>
          <input
            value={p.subject}
            onChange={(e) => p.setSubject(e.target.value)}
            placeholder="e.g. Welcome to UCA, {{first_name}}"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm focus:border-[#E6A9FF]/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
            Message body
          </label>
          <p className="mt-1 text-xs text-white/50">
            Use <code className="text-[#E6A9FF]">{"{{first_name}}"}</code> to personalize.
            Insert inline images with <code className="text-[#E6A9FF]">[[img:URL]]</code>.
          </p>
          <textarea
            value={p.body}
            onChange={(e) => p.setBody(e.target.value)}
            rows={14}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm leading-relaxed focus:border-[#E6A9FF]/60 focus:outline-none"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploader
            label="Header image"
            url={p.headerUrl}
            uploading={p.uploadingKind === "header"}
            onClear={() => p.setHeaderUrl("")}
            onFile={(f) => p.onUpload(f, "header")}
          />
          <ImageUploader
            label="Footer image"
            url={p.footerUrl}
            uploading={p.uploadingKind === "footer"}
            onClear={() => p.setFooterUrl("")}
            onFile={(f) => p.onUpload(f, "footer")}
          />
        </div>

        <div className="border-t border-white/10 pt-5">
          <label className="block text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
            Inline Image Assets
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
             <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-[10px] text-white/40 hover:border-[#E6A9FF]/40">
              {p.uploadingKind === "inline" ? "..." : "+ Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) p.onUpload(f, "inline");
                  e.target.value = "";
                }}
              />
            </label>
            {p.inlineAssets.map((url, i) => (
              <button
                key={i}
                onClick={() => copyToClipboard(`[[img:${url}]]`)}
                className="group relative h-20 w-20 overflow-hidden rounded-xl border border-white/10"
                title="Click to copy tag"
              >
                <img src={url} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                  <span className="text-[10px] font-bold text-[#E6A9FF]">COPY TAG</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-5">
          <label className="block text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
            Target Recipients
          </label>
          <p className="mt-1 text-xs text-white/50">
            Select specific people or leave empty to send to all active subscribers.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => p.setSelectedRecipients(new Set(activeApps.map(a => a.id)))}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider hover:bg-white/10"
            >
              Select All
            </button>
            <button
              onClick={selectNew}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider hover:bg-white/10"
            >
              New (Last 48h)
            </button>
            <button
              onClick={() => p.setSelectedRecipients(new Set())}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider hover:bg-white/10"
            >
              Clear
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search subscribers..."
              className="w-full border-b border-white/10 bg-transparent px-4 py-2 text-xs focus:outline-none"
            />
            <div className="max-h-[300px] overflow-y-auto">
              {filteredApps.map(a => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-2 text-xs hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={p.selectedRecipients.has(a.id)}
                    onChange={() => toggleRecipient(a.id)}
                    className="accent-[#E6A9FF]"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-medium">{a.full_name}</div>
                    <div className="truncate text-[10px] text-white/40">{a.email}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="sticky top-10 h-fit space-y-5 rounded-2xl border border-[#E6A9FF]/20 bg-white/[0.03] p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">Audience</div>
          <div className="mt-2 text-2xl font-display">{effectiveCount}</div>
          <div className="text-xs text-white/50">
            {p.selectedRecipients.size > 0 ? "selected recipients" : "active subscribers (all)"}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
            Send test
          </label>
          <input
            type="email"
            value={p.testEmail}
            onChange={(e) => p.setTestEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:border-[#E6A9FF]/60 focus:outline-none"
          />
          <button
            onClick={() => p.onSend(true)}
            disabled={p.sending}
            className="mt-2 w-full rounded-full border border-[#E6A9FF]/40 px-4 py-2 text-sm text-[#E6A9FF] hover:bg-[#E6A9FF]/10 disabled:opacity-50"
          >
            {p.sending ? "Sending…" : "Send test"}
          </button>
        </div>

        <button
          onClick={() => p.onSend(false)}
          disabled={p.sending}
          className="btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {p.sending ? "Sending…" : `Send to ${effectiveCount} subscriber${effectiveCount === 1 ? "" : "s"}`}
        </button>

        <p className="text-[11px] leading-relaxed text-white/45">
          Sender: noreply@launchverse.app. Make sure this domain is verified
          in Resend or sends will fail.
        </p>
      </aside>
    </div>
  );
}

function ImageUploader({
  label,
  url,
  uploading,
  onFile,
  onClear,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
        {label}
      </label>
      {url ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
          <img src={url} alt="" className="block w-full" />
          <button
            onClick={onClear}
            className="block w-full bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:text-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-xs text-white/50 hover:border-[#E6A9FF]/40">
          {uploading ? "Uploading…" : "Click to upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
