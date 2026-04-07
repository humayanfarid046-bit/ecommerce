/**
 * Optional Express API (`server/`) — set NEXT_PUBLIC_API_URL in .env.local.
 * Sends Firebase ID token when a user is signed in.
 */

import { getFirebaseAuth } from "@/lib/firebase/client";

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

export function isApiUrlConfigured(): boolean {
  return Boolean(baseUrl());
}

export async function apiFetch(
  path: string,
  init?: RequestInit & { skipAuth?: boolean }
): Promise<Response> {
  const base = baseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  const pathPart = path.startsWith("http")
    ? path
    : `${base}/${path.replace(/^\//, "")}`;
  const { skipAuth, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (!skipAuth) {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(pathPart, { ...rest, headers });
}

/** Public: no auth header. */
export async function getApiHealth(): Promise<{
  ok: boolean;
  service?: string;
} | null> {
  if (!isApiUrlConfigured()) return null;
  try {
    const r = await apiFetch("/health", { skipAuth: true, cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as { ok: boolean; service?: string };
  } catch {
    return null;
  }
}

/** Requires signed-in Firebase user. */
export async function getApiMe(): Promise<{ uid: string; email: string | null } | null> {
  if (!isApiUrlConfigured()) return null;
  try {
    const r = await apiFetch("/api/me");
    if (!r.ok) return null;
    return (await r.json()) as { uid: string; email: string | null };
  } catch {
    return null;
  }
}
