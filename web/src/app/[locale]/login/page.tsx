"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
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

const authInputBase =
  "w-full rounded-[12px] border border-[rgba(37,99,235,0.35)] bg-white px-4 py-3.5 text-sm font-semibold text-text-primary outline-none transition placeholder:text-slate-400/90 shadow-[0_2px_12px_rgba(37,99,235,0.04)] focus:border-[#2563eb] focus:ring-2 focus:ring-[rgba(37,99,235,0.2)] dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-[#60a5fa] dark:focus:ring-[rgba(59,130,246,0.22)]";

const authInput = `mt-1.5 ${authInputBase}`;

const authInputPassword =
  `${authInputBase} py-3.5 pl-4 pr-12`;

const btnLoginGradient =
  "w-full rounded-[12px] bg-gradient-to-r from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] py-3.5 text-sm font-extrabold text-white shadow-[0_10px_32px_rgba(37,99,235,0.28)] transition hover:brightness-[1.04] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:shadow-[0_8px_28px_rgba(37,99,235,0.2)]";

const btnGoogleOutline =
  "flex w-full items-center justify-center gap-3 rounded-[12px] border-2 border-[rgba(37,99,235,0.5)] bg-white py-3.5 text-sm font-bold text-text-primary shadow-[0_2px_14px_rgba(37,99,235,0.06)] transition hover:border-[#2563eb] hover:bg-[rgba(37,99,235,0.04)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-500 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900";

const btnOtpOutline =
  "w-full rounded-[12px] border-2 border-[rgba(37,99,235,0.42)] bg-white py-3 text-sm font-bold text-[#2563eb] shadow-[0_2px_12px_rgba(37,99,235,0.05)] transition hover:bg-[rgba(37,99,235,0.06)] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-950 dark:text-[#7eb3ff]";

const linkAccent =
  "text-xs font-bold text-[#2563eb] transition hover:text-[#1d4ed8] hover:underline";

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

function OrDivider({ label }: { label: string }) {
  return (
    <div className="relative my-7">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[rgba(37,99,235,0.15)] dark:border-slate-700" />
      </div>
      <div className="relative flex justify-center text-xs font-bold uppercase tracking-[0.14em]">
        <span className="bg-white px-3 text-text-secondary dark:bg-slate-950">
          {label}
        </span>
      </div>
    </div>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const { signInEmail, signUpEmail, requestOtp, user, status } = useAuth();
  const router = useRouter();
  const t = useTranslations("login");
  const tb = useTranslations("brand");
  const returnUrl = searchParams.get("returnUrl");

  const [view, setView] = useState<View>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
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
    setOtpError(null);
    const raw = identifier.trim();
    if (!raw) {
      setOtpError(t("errorIdentifierRequired"));
      return;
    }
    if (looksLikeEmail(raw)) {
      setOtpError(t("otpNeedsPhone"));
      return;
    }
    setLoading(true);
    try {
      await requestOtp(raw);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "OTP request failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSignInPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOtpError(null);
    const id = loginEmail.trim();
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
    setOtpError(null);
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
    <div className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col px-4 py-10 sm:px-6 md:min-h-[calc(100vh-4.5rem)] md:py-14">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
        {/* Brand */}
        <div className="mb-8 text-center md:mb-10">
          <Link
            href="/"
            className="inline-flex flex-col items-center gap-1 transition hover:opacity-90"
          >
            <span className="text-[1.75rem] font-black italic leading-none tracking-tight text-[#2563eb] md:text-[2rem]">
              {tb("short")}
            </span>
            <span className="max-w-[280px] text-lg font-extrabold leading-snug tracking-tight text-text-primary md:text-xl">
              {tb("name")}
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-[rgba(37,99,235,0.22)] bg-white p-7 shadow-[0_8px_40px_rgba(37,99,235,0.08)] sm:p-9 dark:border-slate-700 dark:bg-slate-900/90 dark:shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
          {view === "login" ? (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary md:text-[1.65rem]">
                {t("welcomeBack")}
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-text-secondary">
                {t("subtitleSignIn")}
              </p>

              <form onSubmit={onSignInPassword} className="mt-8 space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary"
                  >
                    {t("email")}
                  </label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    data-no-filled
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@email.com"
                    className={authInput}
                  />
                </div>
                <div>
                  <div className="flex items-end justify-between gap-2">
                    <label
                      htmlFor="password"
                      className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary"
                    >
                      {t("password")}
                    </label>
                    <Link href="/forgot-password" className={linkAccent}>
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      data-no-filled
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={authInputPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
                {error ? (
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                ) : null}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.99 }}
                  className={btnLoginGradient}
                >
                  {t("loginButton")}
                </motion.button>
              </form>

              <OrDivider label={t("dividerOr")} />

              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary">
                {t("socialContinue")}
              </p>

              <button
                type="button"
                disabled
                className={`${btnGoogleOutline} mt-4`}
              >
                <GoogleIcon className="h-5 w-5 shrink-0" />
                {t("loginGoogle")}
              </button>

              <form onSubmit={onRequestOtp} className="mt-8 space-y-3">
                <label
                  htmlFor="identifier"
                  className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary"
                >
                  {t("mobileOrEmail")}
                </label>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  data-no-filled
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t("mobileOrEmailPlaceholder")}
                  className={authInput}
                />
                {otpError ? (
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    {otpError}
                  </p>
                ) : null}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.99 }}
                  className={btnOtpOutline}
                >
                  {t("requestOtp")}
                </motion.button>
              </form>

              <p className="mt-8 text-center text-sm text-text-secondary">
                {t("noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("register");
                    setError(null);
                    setOtpError(null);
                  }}
                  className="font-extrabold text-[#2563eb] transition hover:text-[#1d4ed8] hover:underline"
                >
                  {t("signUp")}
                </button>
              </p>

              <Link
                href="/"
                className="mt-6 block text-center text-sm font-bold text-text-secondary transition hover:text-[#2563eb]"
              >
                {t("backHome")}
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary md:text-[1.65rem]">
                {t("titleRegister")}
              </h1>
              <p className="mt-2 text-sm font-medium leading-relaxed text-text-secondary">
                {t("subtitleRegister")}
              </p>
              <p className="mt-1 text-xs font-medium text-text-secondary/90">
                {t("registerNoOtpHint")}
              </p>

              <form onSubmit={onSignUp} className="mt-8 space-y-4">
                <div>
                  <label
                    htmlFor="reg-email"
                    className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary"
                  >
                    {t("email")}
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    data-no-filled
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={authInput}
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-password"
                    className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary"
                  >
                    {t("password")}
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      data-no-filled
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={authInputPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
                    className="text-[11px] font-bold uppercase tracking-[0.12em] text-text-secondary"
                  >
                    {t("confirmPassword")}
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="reg-confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      data-no-filled
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className={authInputPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
                {error ? (
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                ) : null}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.99 }}
                  className={btnLoginGradient}
                >
                  {t("createAccount")}
                </motion.button>
              </form>

              <OrDivider label={t("dividerOr")} />

              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary">
                {t("socialContinue")}
              </p>

              <button
                type="button"
                disabled
                className={`${btnGoogleOutline} mt-4`}
              >
                <GoogleIcon className="h-5 w-5 shrink-0" />
                {t("loginGoogle")}
              </button>

              <p className="mt-8 text-center text-sm text-text-secondary">
                {t("haveAccount")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setError(null);
                    setOtpError(null);
                  }}
                  className="font-extrabold text-[#2563eb] transition hover:text-[#1d4ed8] hover:underline"
                >
                  {t("signIn")}
                </button>
              </p>

              <Link
                href="/"
                className="mt-6 block text-center text-sm font-bold text-text-secondary transition hover:text-[#2563eb]"
              >
                {t("backHome")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center bg-white text-sm font-medium text-text-secondary dark:bg-slate-950">
          Loading
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
