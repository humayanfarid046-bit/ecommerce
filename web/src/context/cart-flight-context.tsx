"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const FLY = 28;

type Flight = {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  thumb?: string;
};

type CartFlightContextValue = {
  cartIconRef: RefObject<HTMLAnchorElement | null>;
  flyToCart: (sourceEl: HTMLElement | null, thumbSrc?: string) => void;
};

const CartFlightContext = createContext<CartFlightContextValue | null>(null);

export function CartFlightProvider({ children }: { children: React.ReactNode }) {
  const cartIconRef = useRef<HTMLAnchorElement | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const flyToCart = useCallback((sourceEl: HTMLElement | null, thumbSrc?: string) => {
    if (typeof window === "undefined") return;
    const cart = cartIconRef.current?.getBoundingClientRect();
    const src = sourceEl?.getBoundingClientRect();
    if (!cart || !src) return;

    const fromX = src.left + src.width / 2;
    const fromY = src.top + src.height / 2;
    const toX = cart.left + cart.width / 2;
    const toY = cart.top + cart.height / 2;

    idRef.current += 1;
    setFlight({
      id: idRef.current,
      fromX,
      fromY,
      toX,
      toY,
      thumb: thumbSrc,
    });
  }, []);

  const overlay =
    mounted && flight ? (
      <AnimatePresence>
        <motion.div
          key={flight.id}
          initial={{
            x: flight.fromX - FLY,
            y: flight.fromY - FLY,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: flight.toX - FLY,
            y: flight.toY - FLY,
            scale: 0.2,
            opacity: 0.9,
          }}
          exit={{ opacity: 0 }}
          transition={{
            type: "tween",
            duration: 0.55,
            ease: [0.22, 0.61, 0.36, 1],
          }}
          onAnimationComplete={() => setFlight(null)}
          className="pointer-events-none fixed left-0 top-0 z-[100] h-14 w-14 overflow-hidden rounded-xl border-2 border-white shadow-[0_8px_32px_rgba(0,102,255,0.45)]"
        >
          {flight.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flight.thumb}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#0066ff] to-[#7c3aed]" />
          )}
        </motion.div>
      </AnimatePresence>
    ) : null;

  return (
    <CartFlightContext.Provider value={{ cartIconRef, flyToCart }}>
      {children}
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </CartFlightContext.Provider>
  );
}

export function useCartFlight() {
  const ctx = useContext(CartFlightContext);
  if (!ctx) throw new Error("useCartFlight must be used within CartFlightProvider");
  return ctx;
}
