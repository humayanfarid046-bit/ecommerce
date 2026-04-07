"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  /** Optional profile photo URL (e.g. OAuth or future upload). */
  imageSrc?: string | null;
  /** Initials for gradient avatar when no image. */
  initials: string;
  /** Accessible label for the avatar button. */
  nameLabel: string;
  className?: string;
  /** Size classes for the trigger (default: h-20 w-20). */
  sizeClassName?: string;
};

const DURATION_MS = 300;

export function ProfileAvatarPreview({
  imageSrc,
  initials,
  nameLabel,
  className,
  sizeClassName = "h-20 w-20",
}: Props) {
  const t = useTranslations("account");
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [halo, setHalo] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const runOpen = useCallback(() => {
    setHalo(true);
    setOpen(true);
    window.setTimeout(() => setHalo(false), DURATION_MS);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const initialsText = initials.slice(0, 2).toUpperCase() || "?";

  const modal =
    open && mounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          >
            <div
              role="presentation"
              className="profile-modal-overlay absolute inset-0 bg-black/40 backdrop-blur-[5px]"
              onClick={close}
            />
            <div
              className="profile-modal-panel relative z-10 max-h-[min(85vh,520px)] w-full max-w-[min(92vw,420px)] rounded-2xl border border-white/20 bg-white/95 p-2 shadow-2xl dark:border-slate-600 dark:bg-slate-900/95"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="absolute -right-1 -top-1 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                aria-label={t("profileAvatarClose")}
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
              <div className="flex flex-col items-center gap-3 pt-6">
                <p id={titleId} className="sr-only">
                  {nameLabel}
                </p>
                {imageSrc ? (
                  <div className="relative aspect-square w-full max-w-[360px] overflow-hidden rounded-xl">
                    {imageSrc.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageSrc}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="360px"
                        priority
                      />
                    )}
                  </div>
                ) : (
                  <div
                    className="flex aspect-square w-full max-w-[360px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#2874f0] to-[#7c3aed] text-7xl font-extrabold text-white shadow-inner"
                    aria-hidden
                  >
                    {initialsText}
                  </div>
                )}
                <p className="text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {nameLabel}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className={cn("relative inline-flex shrink-0", className)}>
        {halo ? (
          <>
            <span
              className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/80 profile-avatar-halo"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-0 rounded-full border border-white/50 profile-avatar-halo"
              style={{ animationDelay: "45ms" }}
              aria-hidden
            />
          </>
        ) : null}
        <button
          type="button"
          onClick={runOpen}
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#2874f0] to-[#7c3aed] text-2xl font-extrabold text-white shadow-lg shadow-[#2874f0]/25 outline-none ring-2 ring-white/30 transition-[box-shadow] duration-300 ease-out focus-visible:ring-4 focus-visible:ring-[#2874f0]/50",
            sizeClassName,
            halo && "profile-avatar-pop"
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={t("profileAvatarOpen")}
        >
          {imageSrc ? (
            imageSrc.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Image
                src={imageSrc}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            )
          ) : (
            <span aria-hidden>{initialsText}</span>
          )}
        </button>
      </div>
      {modal}
    </>
  );
}
