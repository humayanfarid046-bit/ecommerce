"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImg, type PixelCrop } from "@/lib/crop-image-helpers";
import { Upload, X, ImageIcon } from "lucide-react";

export type GalleryItem = { id: string; src: string; name: string; alt?: string };

type Props = {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  maxFiles?: number;
};

export function ImageDropCrop({ items, onChange, maxFiles = 8 }: Props) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<PixelCrop | null>(null);

  const onCropComplete = useCallback(
    (_: Area, croppedAreaPixels: PixelCrop) => {
      setAreaPx(croppedAreaPixels);
    },
    []
  );

  const applyCrop = useCallback(async () => {
    if (!cropSrc || !areaPx) {
      setCropSrc(null);
      return;
    }
    try {
      const out = await getCroppedImg(cropSrc, areaPx, 800);
      const id = `img-${Date.now()}`;
      onChange([
        ...items,
        { id, src: out, name: "cropped.jpg", alt: "" },
      ].slice(0, maxFiles));
    } finally {
      setCropSrc(null);
      setAreaPx(null);
    }
  }, [cropSrc, areaPx, items, onChange, maxFiles]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f?.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        setCropSrc(url);
      }
    },
    []
  );

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setCropSrc(url);
    }
    e.target.value = "";
  }, []);

  const remove = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#0066ff]/40 bg-[#0066ff]/5 px-4 py-8 text-center transition hover:bg-[#0066ff]/10"
      >
        <Upload className="h-8 w-8 text-[#0066ff]" />
        <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
          Drag & drop images here, or pick a file to crop (800×800)
        </p>
        <label className="mt-3 cursor-pointer rounded-lg bg-[#0066ff] px-4 py-2 text-xs font-bold text-white">
          Choose file
          <input type="file" accept="image/*" className="sr-only" onChange={onPick} />
        </label>
      </div>

      {cropSrc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white p-4 dark:bg-slate-900">
            <p className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              Crop & resize
            </p>
            <div className="relative h-64 w-full">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold dark:border-slate-600"
                onClick={() => {
                  URL.revokeObjectURL(cropSrc);
                  setCropSrc(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#0066ff] px-3 py-1.5 text-sm font-bold text-white"
                onClick={applyCrop}
              >
                Add to gallery
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-600"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.src}
                  alt={it.alt || ""}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
                  onClick={() => remove(it.id)}
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label className="min-w-[200px] flex-1 text-[11px] font-bold text-slate-500">
                Alt text (SEO)
                <input
                  value={it.alt ?? ""}
                  onChange={(e) =>
                    onChange(
                      items.map((x) =>
                        x.id === it.id ? { ...x, alt: e.target.value } : x
                      )
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-normal dark:border-slate-600 dark:bg-slate-950"
                  placeholder="Describe the image for Google & accessibility"
                />
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-1 text-xs text-slate-400">
          <ImageIcon className="h-4 w-4" />
          No images yet — demo only, not uploaded to a server.
        </p>
      )}
    </div>
  );
}
