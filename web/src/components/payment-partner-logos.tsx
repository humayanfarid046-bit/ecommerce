/**
 * Simplified payment-brand marks for footer / trust UI (demo).
 * Geometric approximations — replace with official assets if required for production.
 */

import { cn } from "@/lib/utils";

export function VisaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>Visa</title>
      <rect width="64" height="40" rx="4" fill="#1434CB" />
      <text
        x="32"
        y="26"
        fill="#fff"
        fontSize="14"
        fontWeight="800"
        fontFamily="system-ui, Inter, Arial, sans-serif"
        fontStyle="italic"
        textAnchor="middle"
      >
        VISA
      </text>
    </svg>
  );
}

export function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>Mastercard</title>
      <rect width="64" height="40" rx="4" fill="#f7f7f7" />
      <circle cx="26" cy="20" r="12" fill="#EB001B" />
      <circle cx="38" cy="20" r="12" fill="#F79E1B" fillOpacity={0.92} />
    </svg>
  );
}

export function UpiLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>UPI</title>
      <rect width="64" height="40" rx="4" fill="#fff" stroke="#e2e8f0" />
      <rect x="8" y="12" width="4" height="16" fill="#FF9933" rx="1" />
      <rect x="14" y="12" width="4" height="16" fill="#fff" stroke="#ccc" rx="1" />
      <rect x="20" y="12" width="4" height="16" fill="#138808" rx="1" />
      <text
        x="32"
        y="25"
        fill="#5f259f"
        fontSize="11"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
      >
        UPI
      </text>
    </svg>
  );
}

export function RuPayLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>RuPay</title>
      <defs>
        <linearGradient id="rupayGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00a651" />
          <stop offset="100%" stopColor="#007b3a" />
        </linearGradient>
      </defs>
      <rect width="64" height="40" rx="4" fill="url(#rupayGrad)" />
      <text
        x="32"
        y="25"
        fill="#fff"
        fontSize="12"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
        textAnchor="middle"
      >
        RuPay
      </text>
    </svg>
  );
}

/** PhonePe — UPI / wallet channel on Razorpay (India). */
export function PhonePeLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>PhonePe</title>
      <rect width="64" height="40" rx="4" fill="#5F259F" />
      <text
        x="32"
        y="25"
        fill="#fff"
        fontSize="10"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
        textAnchor="middle"
      >
        PhonePe
      </text>
    </svg>
  );
}

/** Paytm — wallet / UPI on Razorpay (India). */
export function PaytmLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>Paytm</title>
      <rect width="64" height="40" rx="4" fill="#00BAF2" />
      <text
        x="32"
        y="25"
        fill="#012B72"
        fontSize="11"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
        textAnchor="middle"
      >
        Paytm
      </text>
    </svg>
  );
}

export function NetBankingLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>Net banking</title>
      <rect width="64" height="40" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
      <rect x="10" y="14" width="44" height="18" rx="2" fill="#fff" stroke="#94a3b8" />
      <rect x="14" y="18" width="12" height="3" rx="0.5" fill="#64748b" />
      <rect x="14" y="24" width="20" height="2" rx="0.5" fill="#94a3b8" />
      <circle cx="48" cy="22" r="4" fill="#0066ff" />
    </svg>
  );
}

export function CodLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>Cash on delivery</title>
      <rect width="64" height="40" rx="4" fill="#fef3c7" stroke="#f59e0b" />
      <text
        x="32"
        y="25"
        fill="#92400e"
        fontSize="10"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
        textAnchor="middle"
      >
        COD
      </text>
    </svg>
  );
}

/** EMI — often available via Razorpay on checkout. */
export function EmiLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      className={className}
      aria-hidden
      role="img"
    >
      <title>EMI</title>
      <rect width="64" height="40" rx="4" fill="#eff6ff" stroke="#93c5fd" />
      <text
        x="32"
        y="25"
        fill="#1d4ed8"
        fontSize="11"
        fontWeight="800"
        fontFamily="system-ui,sans-serif"
        textAnchor="middle"
      >
        EMI
      </text>
    </svg>
  );
}

/** Razorpay wordmark-style badge (demo; not an official logo file). */
export function RazorpayBrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-[#0C2451]/15 bg-[#0C2451] px-3 py-2 text-white shadow-sm",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0"
        aria-hidden
      >
        <rect width="24" height="24" rx="6" fill="#3395FF" />
        <path
          d="M8 7h8v2h-3v8H11V9H8V7z"
          fill="#fff"
        />
      </svg>
      <span className="text-[13px] font-bold tracking-tight">Razorpay</span>
    </div>
  );
}
