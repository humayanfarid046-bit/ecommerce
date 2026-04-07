import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionTokenConfigured,
} from "@/lib/admin-auth";

export async function POST(req: Request) {
  if (!adminSessionTokenConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_SESSION_TOKEN is not set on the server." },
      { status: 503 }
    );
  }
  const { password } = (await req.json()) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = process.env.ADMIN_SESSION_TOKEN!.trim();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return res;
}
