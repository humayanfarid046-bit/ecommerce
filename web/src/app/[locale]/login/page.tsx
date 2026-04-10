"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginShoppingBagHero } from "@/components/login-shopping-bag-hero";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { safeReturnPath } from "@/lib/safe-return-path";
import { normalizeAppRole } from "@/lib/rbac";

type View = "login" | "register";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.72h5.28c-.24 1.38-.96 2.52-2.04 3.3v2.76h3.3c1.92-1.76 3.04-4.38 3.04-7.5 0-.72-.06-1.4-.18-2.04H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.46l-3.3-2.54c-.9.6-2.04.96-3.32.96-2.56 0-4.72-1.72-5.5-4.04H3.06v2.64C4.7 19.98 8.1 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.5 13.92c-.2-.6-.32-1.24-.32-1.92s.12-1.32.32-1.92V7.44H3.06A9.97 9.97 0 0 0 2 12c0 1.62.4 3.14 1.06 4.48l3.44-2.56z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.38c1.44 0 2.74.5 3.76 1.48l2.82-2.82C16.94 2.98 14.68 2 12 2 8.1 2 4.7 4.02 3.06 7.44l3.44 2.64c.78-2.32 2.94-4.04 5.5-4.04z"
      />
    </svg>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20";

const inputPasswordClass =
  "w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-4 pr-12 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20";

const btnPrimary =
  "w-full rounded-xl bg-gradient-to-r from-[#0066ff] to-[#0052cc] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#0066ff]/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50";

const btnSecondary =
  "w-full rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const linkAccent =
  "text-xs font-bold text-[#0066ff] transition hover:text-[#0052cc] hover:underline";

/** Match auth-context cookie so middleware sees role before React hydrates Firestore role. */
function setLcRoleCookieClient(role: string) {
  if (typeof document === "undefined") return;
  document.cookie = `lc_role=${encodeURIComponent(role)}; path=/; max-age=2592000; samesite=lax`;
}

async function resolvePostLoginTarget(returnUrl: string | null): Promise<string> {
  const safe = safeReturnPath(returnUrl);
  try {
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    if (!token) return safe ?? "/account";
    const res = await fetch("/api/user/access-scope", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as {
      accessScope?: string;
      role?: unknown;
    };
    const role = normalizeAppRole(body.role);
    if (role === "DELIVERY_PARTNER") {
      setLcRoleCookieClient("DELIVERY_PARTNER");
      if (safe) return safe;
      return "/delivery/dashboard";
    }
    if (safe) return safe;
    return body.accessScope === "owner" ? "/admin" : "/account";
  } catch {
    return safe ?? "/account";
  }
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const { signInEmail, signUpEmail, requestOtp, user, status } = useAuth();
  const router = useRouter();
  const t = useTranslations("login");
  const returnUrl = searchParams.get("returnUrl");

  const [view, setView] = useState<View>("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== "ready" || !user) return;
    void (async () => {
      const to = await resolvePostLoginTarget(returnUrl);
      router.replace(to);
    })();
  }, [status, user, router, returnUrl]);

  function looksLikeEmail(s: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  }

  async function onRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const raw = identifier.trim();
    if (!raw) {
      setError(t("errorIdentifierRequired"));
      return;
    }
    if (looksLikeEmail(raw)) {
      setError(t("otpNeedsPhone"));
      return;
    }
    setLoading(true);
    try {
      await requestOtp(raw);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP request failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSignInPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = identifier.trim();
    if (!id) {
      setError(t("errorIdentifierRequired"));
      return;
    }
    if (!looksLikeEmail(id)) {
      setError(t("passwordNeedsEmail"));
      return;
    }
    if (!password) {
      setError(t("errorPasswordRequired"));
      return;
    }
    setLoading(true);
    try {
      await signInEmail(id, password);
      const to = await resolvePostLoginTarget(returnUrl);
      router.push(to);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await signUpEmail(email.trim(), password);
      const to = await resolvePostLoginTarget(returnUrl);
      router.push(to);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 15% 10%, rgba(0,102,255,0.06), transparent), radial-gradient(ellipse 60% 45% at 90% 90%, rgba(124,58,237,0.06), transparent)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1400px] lg:min-h-[calc(100vh-5rem)] lg:grid-cols-2">
        <div className="border-b border-slate-200/90 bg-gradient-to-br from-[#0066ff]/[0.07] via-white to-[#7c3aed]/[0.06] lg:border-b-0 lg:border-r">
          <div className="lg:hidden">
            <LoginShoppingBagHero />
          </div>
          <div className="relative hidden lg:flex lg:flex-col lg:justify-center">
            <LoginShoppingBagHero />
            <div className="pointer-events-none absolute bottom-8 left-8 right-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#0066ff]/80">
                {t("panelEyebrow")}
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {t("panelTitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="glass glass-premium mx-auto w-full max-w-[420px] rounded-3xl p-8 sm:p-10">
            {view === "login" ? (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                  {t("welcomeBack")}
                </h1>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                  {t("subtitleSignIn")}
                </p>

                <form onSubmit={onRequestOtp} className="mt-8 space-y-3">
                  <label
                    htmlFor="identifier"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {t("mobileOrEmail")}
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={t("mobileOrEmailPlaceholder")}
                    className={inputClass}
                  />
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className={cn(btnPrimary, "mt-2")}
                  >
                    {t("requestOtp")}
                  </motion.button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wider">
                    <span className="bg-[rgba(255,255,255,0.85)] px-3 text-slate-500 backdrop-blur-sm">
                      {t("dividerOr")}
                    </span>
                  </div>
                </div>

                <form onSubmit={onSignInPassword} className="space-y-4">
                  <div className="flex items-end justify-between gap-2">
                    <label
                      htmlFor="password"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {t("password")}
                    </label>
                    <Link href="/forgot-password" className={linkAccent}>
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputPasswordClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="text-sm font-medium text-rose-600">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className={btnSecondary}
                  >
                    {t("signIn")}
                  </button>
                </form>

                <div className="mt-8">
                  <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t("socialContinue")}
                  </p>
                  <button
                    type="button"
                    disabled
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    <GoogleIcon className="h-5 w-5" />
                    {t("continueWithGoogle")}
                  </button>
                </div>

                <p className="mt-8 text-center text-sm text-slate-600">
                  {t("noAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setView("register");
                      setError(null);
                    }}
                    className="font-extrabold text-[#0066ff] transition hover:text-[#0052cc] hover:underline"
                  >
                    {t("signUp")}
                  </button>
                </p>

                <Link
                  href="/"
                  className="mt-6 block text-center text-sm font-bold text-slate-500 transition hover:text-[#0066ff]"
                >
                  {t("backHome")}
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                  {t("titleRegister")}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  {t("subtitleRegister")}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {t("registerNoOtpHint")}
                </p>

                <form onSubmit={onSignUp} className="mt-8 space-y-4">
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {t("email")}
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {t("password")}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputPasswordClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label={
                          showPassword ? t("hidePassword") : t("showPassword")
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="reg-confirm"
                      className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {t("confirmPassword")}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="reg-confirm"
                        type={showConfirm ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={inputPasswordClass}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label={
                          showConfirm ? t("hidePassword") : t("showPassword")
                        }
                      >
                        {showConfirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm font-medium text-rose-600">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className={btnPrimary}
                  >
                    {t("createAccount")}
                  </button>
                </form>

                <p className="mt-8 text-center text-sm text-slate-600">
                  {t("haveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      setError(null);
                    }}
                    className="font-extrabold text-[#0066ff] transition hover:text-[#0052cc] hover:underline"
                  >
                    {t("signIn")}
                  </button>
                </p>

                <Link
                  href="/"
                  className="mt-6 block text-center text-sm font-bold text-slate-500 transition hover:text-[#0066ff]"
                >
                  {t("backHome")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center text-sm font-medium text-slate-500">
          Loading
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
