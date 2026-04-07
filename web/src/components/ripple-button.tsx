"use client";

import {
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  rippleClassName?: string;
};

export const RippleButton = forwardRef<HTMLButtonElement, Props>(
  function RippleButton(
    { children, className, rippleClassName, onClick, ...rest },
    ref
  ) {
    const innerRef = useRef<HTMLButtonElement>(null);
    useImperativeHandle(ref, () => innerRef.current!, []);
    const [ripples, setRipples] = useState<
      { id: number; x: number; y: number }[]
    >([]);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = innerRef.current;
        if (btn) {
          const r = btn.getBoundingClientRect();
          const id = Date.now() + Math.random();
          setRipples((prev) => [
            ...prev,
            { id, x: e.clientX - r.left, y: e.clientY - r.top },
          ]);
          window.setTimeout(() => {
            setRipples((prev) => prev.filter((x) => x.id !== id));
          }, 650);
        }
        onClick?.(e);
      },
      [onClick]
    );

    return (
      <button
        ref={innerRef}
        type="button"
        className={cn(
          "relative overflow-hidden transition-transform active:scale-[0.98]",
          className
        )}
        onClick={handleClick}
        {...rest}
      >
        {ripples.map((r) => (
          <span
            key={r.id}
            className={cn(
              "pointer-events-none absolute h-11 w-11 rounded-full bg-white/40 animate-ripple-ring",
              rippleClassName
            )}
            style={{ left: r.x, top: r.y }}
          />
        ))}
        <span className="relative z-[1] inline-flex w-full items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);
