"use client";

import { useCallback, useEffect, useRef } from "react";

type Props = {
  onChange: (dataUrl: string) => void;
  className?: string;
};

const W = 300;
const H = 120;

export function SignaturePad({ onChange, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const paintBg = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    paintBg();
  }, [paintBg]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const scaleX = W / r.width;
    const scaleY = H / r.height;
    return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
  };

  const emit = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      onChange(c.toDataURL("image/jpeg", 0.82));
    } catch {
      onChange("");
    }
  }, [onChange]);

  const clear = useCallback(() => {
    paintBg();
    onChange("");
    last.current = null;
  }, [onChange, paintBg]);

  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-medium text-slate-400">Customer signature (optional)</p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-[300px] touch-none rounded-lg border border-slate-600 bg-slate-950"
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const p = pos(e);
          last.current = p;
        }}
        onPointerMove={(e) => {
          if (!drawing.current || !last.current) return;
          const c = canvasRef.current;
          const ctx = c?.getContext("2d");
          if (!ctx) return;
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(last.current.x, last.current.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          last.current = p;
        }}
        onPointerUp={() => {
          drawing.current = false;
          last.current = null;
          emit();
        }}
        onPointerCancel={() => {
          drawing.current = false;
          last.current = null;
          emit();
        }}
      />
      <button
        type="button"
        onClick={clear}
        className="mt-1 text-xs font-semibold text-slate-400 underline hover:text-white"
      >
        Clear signature
      </button>
    </div>
  );
}
