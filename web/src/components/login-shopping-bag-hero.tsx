"use client";

import { motion } from "framer-motion";

/** Shopping bag hero — brand-aligned electric blue / violet glow (matches site theme). */
export function LoginShoppingBagHero() {
  return (
    <div className="relative flex min-h-[260px] w-full items-center justify-center overflow-hidden px-6 py-10 md:min-h-0 md:py-0 lg:min-h-[calc(100vh-5rem)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        aria-hidden
      >
        <div className="absolute left-1/4 top-1/4 h-[min(420px,50vw)] w-[min(420px,50vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0066ff]/15 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[min(360px,45vw)] w-[min(360px,45vw)] translate-x-1/4 rounded-full bg-[#7c3aed]/12 blur-[90px]" />
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0066ff]/10 blur-[50px]" />
      </div>

      <motion.div
        className="relative z-[1]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: "1200px" }}
      >
        <motion.div
          animate={{ rotateY: [0, 4, -3, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
          style={{ transformStyle: "preserve-3d" }}
        >
          <svg
            viewBox="0 0 280 320"
            className="h-[min(320px,40vh)] w-auto max-w-[min(92vw,380px)] drop-shadow-[0_0_40px_rgba(0,102,255,0.2)] md:h-[min(400px,50vh)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="bagBody"
                x1="40"
                y1="120"
                x2="240"
                y2="300"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#f8fafc" />
                <stop offset="0.45" stopColor="#e2e8f0" />
                <stop offset="1" stopColor="#cbd5e1" />
              </linearGradient>
              <linearGradient id="bagSheen" x1="60" y1="100" x2="200" y2="240">
                <stop stopColor="#0066ff" stopOpacity="0.35" />
                <stop offset="1" stopColor="#7c3aed" stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id="handleGrad" x1="100" y1="40" x2="180" y2="100">
                <stop stopColor="#0066ff" />
                <stop offset="1" stopColor="#7c3aed" />
              </linearGradient>
              <filter
                id="neonGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <ellipse
              cx="140"
              cy="268"
              rx="88"
              ry="14"
              fill="black"
              opacity="0.08"
            />
            <path
              d="M52 118 L228 118 L218 268 L62 268 Z"
              fill="url(#bagBody)"
              stroke="url(#bagSheen)"
              strokeWidth="1.2"
              filter="url(#neonGlow)"
            />
            <path
              d="M72 118 L72 98 C72 58 100 32 140 32 C180 32 208 58 208 98 L208 118"
              stroke="url(#handleGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.95"
            />
            <path
              d="M100 150 L180 150"
              stroke="#0066ff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.45"
            />
            <circle cx="140" cy="190" r="6" fill="#0066ff" opacity="0.85" />
            <circle cx="140" cy="190" r="14" fill="#0066ff" opacity="0.12" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
