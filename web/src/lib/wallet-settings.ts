/** Global wallet feature flags (demo — localStorage; production: DB). */

const KEY = "lc_wallet_global_settings_v1";

export type WalletGlobalSettings = {
  /** Allow “Use wallet balance” at checkout */
  walletPaymentsEnabled: boolean;
  /** Allow Razorpay wallet top-up */
  walletTopUpEnabled: boolean;
  /** Max single top-up in paise (₹1 = 100 paise) */
  maxRechargePaise: number;
};

const DEFAULTS: WalletGlobalSettings = {
  walletPaymentsEnabled: true,
  walletTopUpEnabled: true,
  maxRechargePaise: 50_000_00, // ₹50,000
};

export function getWalletGlobalSettings(): WalletGlobalSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<WalletGlobalSettings>;
    return {
      ...DEFAULTS,
      ...p,
      maxRechargePaise: Math.max(
        100,
        Number(p.maxRechargePaise) || DEFAULTS.maxRechargePaise
      ),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveWalletGlobalSettings(next: WalletGlobalSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("lc-wallet-settings"));
}
