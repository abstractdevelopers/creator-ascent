import { useMemo, useState } from "react";
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

type UploadKind = "header" | "footer" | "inline";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [apps, setApps] = useState<Application[] | null>(null);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
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
  const [sending, setSending] = useState(false);
  const [checkingService, setCheckingService] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<null | UploadKind>(null);

  const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  const authHeaders = {
    "x-admin-password": password,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  const activeApps = useMemo(
    () => apps?.filter((a) => !a.unsubscribed) ?? [],
    [apps],
  );

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
      const applications = (json.applications ?? []) as Application[];
      setApps(applications);
      setSelectedRecipientIds(
        applications.filter((a) => !a.unsubscribed).map((a) => a.id),
      );
    } catch (err: any) {
      setError(err.message);
      setApps(null);
      setSelectedRecipientIds([]);
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File, kind: UploadKind) {
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
      if (kind === "footer") setFooterUrl(json.url);
      if (kind === "inline") {
        setBody((current) => `${current.trimEnd()}\n\n![UCA image](${json.url})\n\n`);
      }
      toast.success(
        kind === "inline" ? "Inline image added to message" : `${kind} image uploaded`,
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploadingKind(null);
    }
  }

  function toggleRecipient(id: string) {
    setSelectedRecipientIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
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
    if (!test) {
      if (selectedRecipientIds.length === 0) {
        toast.error("Select at least one recipient");
        return;
      }
      if (
        !confirm(
          `Send to ${selectedRecipientIds.length} selected subscriber${
            selectedRecipientIds.length === 1 ? "" : "s"
          }?`,
        )
      ) {
        return;
      }
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
          recipientIds: test ? undefined : selectedRecipientIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const firstFailure = json.failed?.[0]?.error ? ` — ${json.failed[0].error}` : "";
        throw new Error((json.error || "Send failed") + firstFailure);
      }
      toast.success(
        test
          ? `Test sent to ${testEmail}`
          : `Sent ${json.sent}/${json.total} (${json.failed_count} failed)`,
      );
      if (!test && json.failed_count > 0) {
        console.error("Broadcast failures", json.failed);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  async function checkEmailService() {
    setCheckingService(true);
    try {
      const res = await fetch(`${FN_BASE}/send-broadcast`, {
        method: "GET",
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Resend check failed");
      const domains = Array.isArray(json.domains?.data) ? json.domains.data : [];
      const ucaDomain = domains.find((d: any) => d.name === "uca.launchverse.online");
      const fallbackDomain = domains.find((d: any) => d.name === "launchverse.app");
      if (ucaDomain?.status === "verified") {
        toast.success("Resend is connected and uca.launchverse.online is verified");
      } else if (fallbackDomain?.status === "verified") {
        toast.message("Email can send now using the verified fallback domain", {
          description: "Verify uca.launchverse.online in Resend to switch the sender to your UCA domain.",
        });
      } else {
        toast.message("Resend responded, but no usable sending domain is verified", {
          description: "Verify uca.launchverse.online in Resend before sending broadcasts.",
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCheckingService(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0707] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
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
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/40">
                        <span>{new Date(a.created_at).toLocaleString()}</span>
                        {a.unsubscribed && (
                          <span className="rounded-full border border-red-400/30 px-2 py-0.5 text-red-300">
                            unsubscribed
                          </span>
                        )}
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
            sending={sending}
            checkingService={checkingService}
            uploadingKind={uploadingKind}
            onUpload={uploadImage}
            onSend={sendBroadcast}
            onCheckService={checkEmailService}
            recipients={activeApps}
            selectedRecipientIds={selectedRecipientIds}
            onToggleRecipient={toggleRecipient}
            onSelectAll={() => setSelectedRecipientIds(activeApps.map((a) => a.id))}
            onClearSelection={() => setSelectedRecipientIds([])}
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
  sending: boolean;
  checkingService: boolean;
  uploadingKind: null | UploadKind;
  onUpload: (f: File, kind: UploadKind) => void;
  onSend: (test: boolean) => void;
  onCheckService: () => void;
  recipients: Application[];
  selectedRecipientIds: string[];
  onToggleRecipient: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
};

function BroadcastComposer(p: ComposerProps) {
  const selectedCount = p.selectedRecipientIds.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
                Message body
              </label>
              <p className="mt-1 text-xs text-white/50">
                Use <code className="text-[#E6A9FF]">{"{{first_name}}"}</code>,{" "}
                <code className="text-[#E6A9FF]">{"{{last_name}}"}</code>, or{" "}
                <code className="text-[#E6A9FF]">{"{{full_name}}"}</code>. Add inline
                images with the upload button.
              </p>
            </div>
            <InlineImageUploader
              uploading={p.uploadingKind === "inline"}
              onFile={(f) => p.onUpload(f, "inline")}
            />
          </div>
          <textarea
            value={p.body}
            onChange={(e) => p.setBody(e.target.value)}
            rows={16}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm leading-relaxed focus:border-[#E6A9FF]/60 focus:outline-none"
          />
          <p className="mt-2 text-[11px] text-white/40">
            Inline images are inserted as <span className="text-white/60">![Image](url)</span> and auto-scale in email clients.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploader
            label="Header image"
            helper="Full-width, auto-scales down on mobile."
            url={p.headerUrl}
            uploading={p.uploadingKind === "header"}
            onClear={() => p.setHeaderUrl("")}
            onFile={(f) => p.onUpload(f, "header")}
          />
          <ImageUploader
            label="Footer image"
            helper="Full-width, auto-scales down on mobile."
            url={p.footerUrl}
            uploading={p.uploadingKind === "footer"}
            onClear={() => p.setFooterUrl("")}
            onFile={(f) => p.onUpload(f, "footer")}
          />
        </div>
      </div>

      <aside className="space-y-5 rounded-2xl border border-[#E6A9FF]/20 bg-white/[0.03] p-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">Audience</div>
          <div className="mt-2 text-2xl font-display">{selectedCount}</div>
          <div className="text-xs text-white/50">
            selected of {p.recipients.length} active subscribers
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-[#E6A9FF]">
              Recipients
            </span>
            <div className="flex gap-2 text-[11px]">
              <button onClick={p.onSelectAll} className="text-[#E6A9FF] hover:underline">
                Select all
              </button>
              <button onClick={p.onClearSelection} className="text-white/50 hover:text-white">
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {p.recipients.map((r) => {
              const checked = p.selectedRecipientIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    checked
                      ? "border-[#E6A9FF]/45 bg-[#E6A9FF]/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => p.onToggleRecipient(r.id)}
                    className="mt-1 accent-[#E6A9FF]"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-white/90">{r.full_name}</span>
                    <span className="block truncate text-xs text-white/45">{r.email}</span>
                  </span>
                </label>
              );
            })}
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
          disabled={p.sending || selectedCount === 0}
          className="btn-primary w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
        >
          {p.sending ? "Sending…" : `Send to ${selectedCount} subscriber${selectedCount === 1 ? "" : "s"}`}
        </button>

        <button
          onClick={p.onCheckService}
          disabled={p.checkingService}
          className="w-full rounded-full border border-white/15 px-4 py-2 text-xs text-white/60 hover:border-[#E6A9FF]/40 hover:text-white disabled:opacity-50"
        >
          {p.checkingService ? "Checking…" : "Check Resend connection"}
        </button>

        <p className="text-[11px] leading-relaxed text-white/45">
          Preferred sender: noreply@uca.launchverse.online. Until that domain is verified in Resend,
          the system automatically falls back to noreply@launchverse.app so emails can still send.
          Every broadcast includes an unsubscribe link.
        </p>
      </aside>
    </div>
  );
}

function ImageUploader({
  label,
  helper,
  url,
  uploading,
  onFile,
  onClear,
}: {
  label: string;
  helper?: string;
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
      {helper && <p className="mt-1 text-[11px] text-white/40">{helper}</p>}
      {url ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
          <img src={url} alt="" className="block h-auto w-full object-contain" />
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

function InlineImageUploader({
  uploading,
  onFile,
}: {
  uploading: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center rounded-full border border-[#E6A9FF]/35 px-4 py-2 text-xs text-[#E6A9FF] hover:bg-[#E6A9FF]/10">
      {uploading ? "Uploading…" : "Upload inline image"}
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
  );
}
