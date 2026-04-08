"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { getFirebaseAuth } from "@/lib/firebase/client";

export default function OwnerBootstrapPage() {
  const { user } = useAuth();
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function makeOwner() {
    setMsg(null);
    setBusy(true);
    try {
      const token = await getFirebaseAuth()?.currentUser?.getIdToken();
      if (!token) {
        setMsg("Please sign in first.");
        return;
      }
      const res = await fetch("/api/admin/bootstrap-owner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ secret }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !j.ok) {
        setMsg(j.error ?? "Could not set owner scope.");
        return;
      }
      setMsg("Done. Sign out and sign in again, then open /admin.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Bootstrap failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
        One-time Owner Bootstrap
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Use this only once to promote the currently logged-in account to owner.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-500">
          Current user:{" "}
          <span className="font-mono">{user?.email ?? "not signed in"}</span>
        </p>
        <label className="mt-3 block text-xs font-bold text-slate-500">
          Bootstrap secret
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            placeholder="ADMIN_BOOTSTRAP_SECRET"
          />
        </label>
        <button
          type="button"
          onClick={makeOwner}
          disabled={busy || !secret.trim()}
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Working..." : "Make me owner"}
        </button>
        {msg ? <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{msg}</p> : null}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        After success, disable bootstrap env vars for safety.
      </p>
      <Link href="/login" className="mt-2 inline-block text-sm font-bold text-[#0066ff] hover:underline">
        Go to login
      </Link>
    </div>
  );
}
