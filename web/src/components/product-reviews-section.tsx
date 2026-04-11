"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product, Review } from "@/lib/product-model";
import { useAuth } from "@/context/auth-context";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

type RemoteReview = {
  id: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
  images: string[];
  verifiedPurchase: boolean;
  adminReply: string;
};

function mapRemote(r: RemoteReview): Review {
  return {
    id: `fs_${r.id}`,
    user: r.userName,
    rating: r.rating,
    text: r.text,
    date: r.date,
    images: r.images?.length ? r.images : undefined,
    verifiedPurchase: r.verifiedPurchase,
  };
}

export function ProductReviewsSection({ product }: { product: Product }) {
  const t = useTranslations("product");
  const tt = useTranslations("product.trust");
  const { user } = useAuth();
  const [remote, setRemote] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingPick, setRatingPick] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState<string | null>(null);

  const load = useCallback(() => {
    void (async () => {
      try {
        const res = await fetch(
          `/api/reviews?productId=${encodeURIComponent(product.id)}`
        );
        const j = (await res.json()) as { reviews?: RemoteReview[] };
        const rows = Array.isArray(j.reviews) ? j.reviews.map(mapRemote) : [];
        setRemote(rows);
      } catch {
        setRemote([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [product.id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const merged = useMemo(() => {
    const ids = new Set(remote.map((r) => r.id));
    const seed = product.reviews.filter((r) => !ids.has(r.id));
    return [...remote, ...seed];
  }, [product.reviews, remote]);

  async function submitReview() {
    setSubmitNote(null);
    const auth = getFirebaseAuth();
    const token = await auth?.currentUser?.getIdToken();
    if (!token) {
      setSubmitNote(t("reviewsForm.loginRequired"));
      return;
    }
    const body = text.trim();
    if (body.length < 3) {
      setSubmitNote(t("reviewsForm.textTooShort"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          rating: ratingPick,
          text: body,
          imageUrls: [],
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSubmitNote(j.error ?? t("reviewsForm.submitFailed"));
        return;
      }
      setText("");
      setSubmitNote(t("reviewsForm.submitOk"));
      load();
    } catch {
      setSubmitNote(t("reviewsForm.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-14 md:mt-20">
      <h2 className="text-lg font-semibold text-text-primary dark:text-slate-100">
        {t("reviewsTitle")}
      </h2>

      {user ? (
        <div className="mt-4 rounded-2xl border border-[#0066ff]/20 bg-[#0066ff]/5 p-4 dark:border-[#0066ff]/30 dark:bg-[#0066ff]/10">
          <p className="text-sm font-semibold text-text-primary dark:text-slate-100">
            {t("reviewsForm.writeTitle")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRatingPick(n)}
                className={cn(
                  "rounded-lg p-1 transition",
                  n <= ratingPick
                    ? "text-amber-500"
                    : "text-text-secondary/70 dark:text-slate-600"
                )}
                aria-label={t("reviewsForm.starLabel", { n })}
              >
                <Star className="h-5 w-5 fill-current" />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder={t("reviewsForm.placeholder")}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitReview()}
              className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {t("reviewsForm.submit")}
            </button>
            {submitNote ? (
              <span className="text-xs font-medium text-text-secondary dark:text-slate-400">
                {submitNote}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm font-medium text-text-secondary dark:text-neutral-400">
          {t("reviewsForm.loginToReview")}
        </p>
      )}

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm font-medium text-text-secondary">{t("reviewsForm.loading")}</p>
        ) : null}
        {!loading && merged.length === 0 ? (
          <p className="font-medium text-text-secondary dark:text-neutral-400">
            {t("noReviews")}
          </p>
        ) : null}
        {merged.map((r) => (
          <article
            key={r.id}
            className="glass rounded-2xl border border-neutral-200/80 p-4 dark:border-slate-700/80"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-text-primary dark:text-slate-100">
                {r.user}
              </span>
              {r.verifiedPurchase ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {tt("verifiedBuyer")}
                </span>
              ) : null}
              <span className="text-amber-600">★ {r.rating}</span>
              <span className="text-xs font-medium text-text-secondary">{r.date}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-text-secondary dark:text-neutral-300">
              {r.text}
            </p>
            {r.images?.length ? (
              <div className="mt-3 flex gap-2">
                {r.images.map((im) => (
                  <div
                    key={im}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200 dark:border-slate-600"
                  >
                    <Image
                      src={im}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
