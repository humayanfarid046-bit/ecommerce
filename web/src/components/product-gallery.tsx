"use client";

import Image from "next/image";
import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCw, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = {
  images: string[];
  title: string;
  videoUrl?: string | null;
  /** Hex — behind main product image (from admin) */
  galleryBackground?: string | null;
};

type Tab = "photos" | "spin" | "video";

function imgUnoptimized(src: string) {
  return src.startsWith("data:") || src.startsWith("blob:");
}

export function ProductGallery({
  images,
  title,
  videoUrl,
  galleryBackground,
}: Props) {
  const t = useTranslations("product.gallery");
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState<Tab>("photos");
  const [lensHover, setLensHover] = useState(false);
  const [lensOrigin, setLensOrigin] = useState({ x: 50, y: 50 });
  const dragRef = useRef({ active: false, startX: 0, startIdx: 0 });

  const src = images[idx] ?? images[0];
  const showSpin = images.length >= 2;
  const showVideo = Boolean(videoUrl);

  const onPointerDownSpin = useCallback(
    (e: React.PointerEvent) => {
      if (tab !== "spin") return;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startIdx: idx,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [tab, idx]
  );

  const onPointerMoveSpin = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.active || tab !== "spin") return;
      const dx = e.clientX - dragRef.current.startX;
      const step = Math.round(dx / 45);
      const n = images.length;
      const next = (((dragRef.current.startIdx - step) % n) + n) % n;
      setIdx(next);
    },
    [tab, images.length]
  );

  const onPointerUpSpin = useCallback((e: React.PointerEvent) => {
    dragRef.current.active = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onLensMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (tab !== "photos") return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setLensOrigin({
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      });
    },
    [tab]
  );

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex gap-2 lg:flex-col">
        {images.map((im, i) => (
          <button
            key={`${i}-${im.slice(0, 48)}`}
            type="button"
            onClick={() => {
              setIdx(i);
              setTab("photos");
            }}
            className={cn(
              "relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition",
              !galleryBackground && "bg-[#fafafa] dark:bg-slate-800/50",
              i === idx && tab === "photos"
                ? "border-[#2874f0] ring-2 ring-[#2874f0]/20"
                : "border-transparent opacity-80 hover:opacity-100"
            )}
            style={
              galleryBackground ? { backgroundColor: galleryBackground } : undefined
            }
          >
            <Image
              src={im}
              alt=""
              fill
              className="object-contain p-0.5"
              sizes="64px"
              unoptimized={imgUnoptimized(im)}
            />
          </button>
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {(showSpin || showVideo) && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("photos")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                tab === "photos"
                  ? "bg-[#2874f0] text-white"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              )}
            >
              {t("tabPhotos")}
            </button>
            {showSpin ? (
              <button
                type="button"
                onClick={() => setTab("spin")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition",
                  tab === "spin"
                    ? "bg-[#2874f0] text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                <RotateCw className="h-3.5 w-3.5" />
                {t("tab360")}
              </button>
            ) : null}
            {showVideo ? (
              <button
                type="button"
                onClick={() => setTab("video")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition",
                  tab === "video"
                    ? "bg-[#2874f0] text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                <Video className="h-3.5 w-3.5" />
                {t("tabVideo")}
              </button>
            ) : null}
          </div>
        )}

        <div
          className={cn(
            "group/main relative aspect-square w-full max-w-[min(100%,640px)] overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(40,116,240,0.12)] dark:border-slate-700 xl:max-w-none",
            !galleryBackground &&
              "bg-[#fafafa] dark:bg-slate-900/40"
          )}
          style={
            galleryBackground
              ? { backgroundColor: galleryBackground }
              : undefined
          }
        >
          {tab === "video" && videoUrl ? (
            <video
              className="h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
              poster={images[0]}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${tab}-${idx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                  style={{ transform: `scale(${zoom})` }}
                  transition={{ duration: 0.2 }}
                  onPointerDown={onPointerDownSpin}
                  onPointerMove={onPointerMoveSpin}
                  onPointerUp={onPointerUpSpin}
                  onPointerCancel={onPointerUpSpin}
                >
                  <div
                    className={cn(
                      "absolute inset-0",
                      tab === "photos" && "cursor-crosshair",
                      tab === "spin" && "pointer-events-none"
                    )}
                    onMouseMove={onLensMove}
                    onMouseEnter={() => tab === "photos" && setLensHover(true)}
                    onMouseLeave={() => setLensHover(false)}
                  >
                    <Image
                      src={src!}
                      alt={title}
                      fill
                      priority
                      unoptimized={imgUnoptimized(src!)}
                      className={cn(
                        tab === "photos"
                          ? "object-contain transition-transform duration-200 ease-out"
                          : "object-contain p-4 transition-transform duration-500 ease-out",
                        tab === "spin" && "cursor-ew-resize select-none"
                      )}
                      style={
                        tab === "photos"
                          ? {
                              transformOrigin: `${lensOrigin.x}% ${lensOrigin.y}%`,
                              transform: lensHover ? "scale(1.5)" : "scale(1)",
                            }
                          : undefined
                      }
                      sizes="(max-width: 1024px) 100vw, min(50vw, 640px)"
                      draggable={false}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
              {tab === "spin" ? (
                <p className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                  {t("spinHint")}
                </p>
              ) : null}
              {tab !== "photos" ? (
                <div className="absolute bottom-3 right-3 flex gap-2 rounded-xl border border-[#E5E7EB] bg-white/90 p-1 shadow-sm backdrop-blur dark:border-slate-600 dark:bg-slate-900/90">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-slate-800"
                    aria-label="Zoom out"
                    onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-slate-800"
                    aria-label="Zoom in"
                    onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <p className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur dark:bg-slate-900/90 dark:text-slate-300">
                  {t("hoverZoomHint")}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
