/**
 * Shared layout + surface styles for inner feature pages (Rewards, Help, Support panel).
 * Dark cards use global `.app-glass-surface` (glass + gradient border) from globals.css.
 */

export const innerPageShell =
  "mx-auto w-full max-w-lg px-5 pb-28 pt-6 sm:max-w-xl sm:px-6 sm:pb-12 sm:pt-8";

/** Wider shell: legal, about, compare empty state */
export const innerPageShellWide =
  "mx-auto w-full max-w-3xl px-5 pb-24 pt-6 sm:px-6 sm:pb-16 sm:pt-8";

/** Full-width inner pages (e.g. product compare table) */
export const innerPageShellMax =
  "mx-auto w-full max-w-7xl px-5 pb-24 pt-6 sm:px-6 sm:pb-16 sm:pt-8";

/** Body copy for legal / policy pages */
export const legalProse =
  "space-y-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300/90";

/** Primary elevated card — premium glass in dark (see `.app-glass-surface`) */
export const appCard =
  "app-glass-surface rounded-[18px] border border-slate-100/90 bg-white shadow-[0_2px_20px_rgba(15,23,42,0.07)] dark:border-transparent dark:bg-transparent";

export const appCardSubtle =
  "app-glass-surface rounded-[18px] border border-slate-100/60 bg-white/95 shadow-sm dark:border-transparent dark:bg-transparent";

/** Tap feedback — use on tappable rows / cards */
export const pressable =
  "transition-transform duration-150 ease-out will-change-transform active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

export const appHeading =
  "text-lg font-semibold tracking-tight text-slate-900 dark:text-[#e8edf5]";

export const appSubhead =
  "text-[13px] leading-relaxed text-slate-600 dark:text-slate-300/85";

/** Card / section titles inside inner pages */
export const appTextTitle =
  "text-[15px] font-semibold tracking-tight text-slate-900 dark:text-[#e8edf5]";

export const sectionLabel =
  "text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400/90";

/** Primary CTA — blue → indigo → cyan */
export const gradientCta =
  "rounded-2xl bg-gradient-to-r from-[#0066ff] via-[#5b21b6] to-[#0891b2] font-semibold text-white shadow-lg shadow-[#0066ff]/25 transition hover:brightness-105 active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

/** Game / rewards accent — gold + neon hint */
export const rewardsAccentRing =
  "ring-1 ring-amber-400/35 dark:ring-amber-300/25 shadow-[0_0_24px_-4px_rgba(251,191,36,0.35)]";
