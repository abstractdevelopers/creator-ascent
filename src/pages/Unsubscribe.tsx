import { useEffect, useState } from "react";

export default function Unsubscribe() {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing unsubscribe token.");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe?token=${encodeURIComponent(token)}`,
          {
            method: "POST",
            headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setStatus("done");
        setMessage(json.email ? `${json.email} has been removed from broadcasts.` : "You've been unsubscribed.");
      } catch (e: any) {
        setStatus("error");
        setMessage(e.message);
      }
    })();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0D0707] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#E6A9FF]/20 bg-white/[0.03] p-8 text-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-[#E6A9FF]">
          Unify Creator Academy
        </span>
        <h1 className="font-display mt-3 text-2xl">
          {status === "loading" ? "Processing…" : status === "done" ? "Unsubscribed" : "Something went wrong"}
        </h1>
        <p className="mt-3 text-sm text-white/70">{message}</p>
        <a href="/" className="mt-6 inline-block text-sm text-[#E6A9FF] underline">
          Back to home
        </a>
      </div>
    </main>
  );
}