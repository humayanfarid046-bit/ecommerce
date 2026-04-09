import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { verifyModuleAccess, verifyModuleAccessAny } from "@/lib/server-access";
import { normalizeAppRole } from "@/lib/rbac";

export async function GET(req: Request) {
  const gate = await verifyModuleAccess(req, "orders");
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const auth = getAdminAuth();
  const db = getAdminFirestore();
  if (!auth || !db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  const users = await auth.listUsers(1000);
  const rows: Array<{
    uid: string;
    name: string;
    phone: string;
    email: string;
    disabled: boolean;
  }> = [];
  for (const u of users.users) {
    const snap = await db.doc(`users/${u.uid}/profile/account`).get();
    const d = (snap.data() ?? {}) as Record<string, unknown>;
    if (normalizeAppRole(d.role) !== "DELIVERY_PARTNER") continue;
    rows.push({
      uid: u.uid,
      name:
        (typeof d.displayName === "string" && d.displayName.trim()) ||
        u.displayName ||
        "Delivery Partner",
      phone:
        (typeof d.phone === "string" && d.phone.replace(/\D/g, "")) ||
        (u.phoneNumber ?? "").replace(/\D/g, ""),
      email: u.email ?? "",
      disabled: Boolean(u.disabled),
    });
  }
  return NextResponse.json({ partners: rows });
}

/** BD-style 01… / 880… / 10-digit mobile → E.164 for Firebase Auth; omit if invalid (profile still stores digits). */
function phoneToE164(digits: string): string | undefined {
  if (!digits) return undefined;
  if (digits.startsWith("880") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+880${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `+880${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return undefined;
}

export async function POST(req: Request) {
  const gate = await verifyModuleAccessAny(req, ["orders", "users"]);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const auth = getAdminAuth();
  const db = getAdminFirestore();
  if (!auth || !db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    phone?: string;
    password?: string;
  };
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim() || "Delivery Partner";
  const phoneDigits = String(body.phone ?? "").replace(/\D/g, "");
  const password = String(body.password ?? "").trim();
  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "email and password(min 6 chars) required" },
      { status: 400 }
    );
  }
  const phoneE164 = phoneToE164(phoneDigits);
  try {
    const created = await auth.createUser({
      email,
      password,
      displayName: name,
      ...(phoneE164 ? { phoneNumber: phoneE164 } : {}),
      emailVerified: true,
    });
    await db.doc(`users/${created.uid}/profile/account`).set(
      {
        displayName: name,
        phone: phoneDigits,
        role: "DELIVERY_PARTNER",
        accessScope: "none",
        invitedBy: gate.uid,
        invitedAt: Date.now(),
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true, uid: created.uid });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create delivery partner" },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  const gate = await verifyModuleAccessAny(req, ["orders", "users"]);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const auth = getAdminAuth();
  const db = getAdminFirestore();
  if (!auth || !db) {
    return NextResponse.json(
      { error: "FIREBASE_SERVICE_ACCOUNT_JSON not configured on server." },
      { status: 503 }
    );
  }
  const body = (await req.json().catch(() => ({}))) as {
    uid?: string;
    action?: "block" | "unblock" | "delete";
  };
  const uid = String(body.uid ?? "").trim();
  if (!uid || !body.action) {
    return NextResponse.json({ error: "uid and action required" }, { status: 400 });
  }
  const snap = await db.doc(`users/${uid}/profile/account`).get();
  const d = (snap.data() ?? {}) as Record<string, unknown>;
  if (normalizeAppRole(d.role) !== "DELIVERY_PARTNER") {
    return NextResponse.json({ error: "Not a delivery partner account" }, { status: 400 });
  }
  try {
    if (body.action === "block") {
      await auth.updateUser(uid, { disabled: true });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "unblock") {
      await auth.updateUser(uid, { disabled: false });
      return NextResponse.json({ ok: true });
    }
    if (body.action === "delete") {
      await auth.deleteUser(uid);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Partner update failed" },
      { status: 400 }
    );
  }
}

