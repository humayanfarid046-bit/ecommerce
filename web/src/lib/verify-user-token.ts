import { getAdminAuth } from "@/lib/firebase-admin";

export async function verifyUserIdToken(req: Request): Promise<
  { ok: true; uid: string } | { ok: false; status: number; error: string }
> {
  const authz = req.headers.get("authorization") ?? "";
  const m = authz.match(/^Bearer\s+(.+)$/i);
  if (!m) return { ok: false, status: 401, error: "Unauthorized" };
  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return { ok: false, status: 503, error: "Server auth is not configured." };
  }
  try {
    const decoded = await adminAuth.verifyIdToken(m[1]!);
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
}
