"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDot,
  Image as ImageIcon,
  MessageSquare,
  Package,
  Send,
  Star,
  Video,
  Zap,
} from "lucide-react";
import { appendActivityLog } from "@/lib/admin-security-storage";
import { ordersForCustomer, type AdminOrderRow } from "@/lib/admin-mock-data";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  applyReviewModeration,
  defaultSupportState,
  getLowRatingProducts,
  getLowestRatedProductsFallback,
  getSupportState,
  saveSupportState,
  isTicketSlaBreached,
  sendReviewReward,
  type ReviewModeration,
  type SupportState,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/support-review-storage";

function statusIcon(status: TicketStatus) {
  if (status === "open")
    return <CircleDot className="h-4 w-4 animate-pulse text-rose-600" />;
  if (status === "in_progress")
    return <Zap className="h-4 w-4 text-amber-500" />;
  return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
}

function priorityClass(p: TicketPriority) {
  if (p === "high") return "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200";
  if (p === "medium")
    return "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export function AdminSupport() {
  const t = useTranslations("admin");
  const getAuthHeader = useCallback(async () => {
    const token = await getFirebaseAuth()?.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);
  const [state, setState] = useState<SupportState>(defaultSupportState);
  const [mounted, setMounted] = useState(false);
  const [ticketReply, setTicketReply] = useState<Record<string, string>>({});
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [remoteOrders, setRemoteOrders] = useState<AdminOrderRow[]>([]);
  const [fsReviews, setFsReviews] = useState<
    {
      id: string;
      userId: string;
      productId: string;
      productTitle: string;
      userName: string;
      rating: number;
      text: string;
      profanityFlag: boolean;
      imageUrls: string[];
      createdAt: number;
    }[]
  >([]);
  const [fsThreads, setFsThreads] = useState<
    {
      threadId: string;
      userId: string;
      orderId: string;
      userEmail: string;
      productHint: string;
      messages: { id: string; at: string; from: "user" | "admin"; body: string }[];
      updatedAt: number;
    }[]
  >([]);
  const [threadReply, setThreadReply] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/orders", {
          headers: await getAuthHeader(),
        });
        const j = (await res.json().catch(() => ({}))) as {
          orders?: AdminOrderRow[];
        };
        if (cancelled) return;
        if (res.ok && Array.isArray(j.orders)) setRemoteOrders(j.orders);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAuthHeader]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const headers = await getAuthHeader();
        const [rR, rT] = await Promise.all([
          fetch("/api/admin/reviews", { headers }),
          fetch("/api/admin/support-threads", { headers }),
        ]);
        const jR = (await rR.json().catch(() => ({}))) as {
          reviews?: typeof fsReviews;
        };
        const jT = (await rT.json().catch(() => ({}))) as {
          threads?: typeof fsThreads;
        };
        if (cancelled) return;
        if (rR.ok && Array.isArray(jR.reviews)) setFsReviews(jR.reviews);
        if (rT.ok && Array.isArray(jT.threads)) setFsThreads(jT.threads);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getAuthHeader]);

  useEffect(() => {
    setState(getSupportState());
    setMounted(true);
    const fn = () => setState(getSupportState());
    window.addEventListener("lc-support", fn);
    return () => window.removeEventListener("lc-support", fn);
  }, []);

  const lowStrict = useMemo(() => getLowRatingProducts(3), []);
  const lowFallback = useMemo(() => getLowestRatedProductsFallback(5), []);

  function persist(next: SupportState) {
    setState(next);
    saveSupportState(next);
  }

  function updateReview(id: string, patch: Partial<ReviewModeration>) {
    const next = {
      ...state,
      reviews: state.reviews.map((r) => {
        if (r.id !== id) return r;
        let row = { ...r, ...patch };
        row = applyReviewModeration(row);
        return row;
      }),
    };
    persist(next);
  }

  function updateTicket(id: string, patch: Partial<SupportTicket>) {
    persist({
      ...state,
      tickets: state.tickets.map((tk) =>
        tk.id === id ? { ...tk, ...patch } : tk
      ),
    });
  }

  function sendTicketReply(id: string) {
    const text = ticketReply[id]?.trim();
    if (!text) return;
    const tk = state.tickets.find((x) => x.id === id);
    if (!tk) return;
    const now = new Date().toISOString();
    const staffReplies = [...(tk.staffReplies ?? []), { body: text, at: now }];
    updateTicket(id, {
      lastStaffReplyAt: now,
      status: tk.status === "open" ? "in_progress" : tk.status,
      staffReplies,
    });
    setTicketReply((p) => ({ ...p, [id]: "" }));
    appendActivityLog({
      actor: "admin",
      action: "support.ticket_reply",
      detail: `${tk.id} · ${text.slice(0, 120)}`,
    });
  }

  function applyCanned(ticketId: string, line: string) {
    setTicketReply((p) => ({ ...p, [ticketId]: line }));
  }

  async function patchFsReview(
    userId: string,
    reviewId: string,
    action: "publish" | "block"
  ) {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ userId, reviewId, action }),
      });
      if (!res.ok) return;
      setFsReviews((prev) => prev.filter((r) => !(r.userId === userId && r.id === reviewId)));
      appendActivityLog({
        actor: "admin",
        action: "review.firestore_moderation",
        detail: `${action} · ${reviewId}`,
      });
    } catch {
      /* ignore */
    }
  }

  async function sendFsThreadReply(userId: string, threadId: string) {
    const body = threadReply[threadId]?.trim();
    if (!body) return;
    try {
      const res = await fetch("/api/admin/support-threads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getAuthHeader()),
        },
        body: JSON.stringify({ userId, threadId, body }),
      });
      if (!res.ok) return;
      setThreadReply((p) => ({ ...p, [threadId]: "" }));
      const headers = await getAuthHeader();
      const rT = await fetch("/api/admin/support-threads", { headers });
      const jT = (await rT.json().catch(() => ({}))) as {
        threads?: typeof fsThreads;
      };
      if (rT.ok && Array.isArray(jT.threads)) setFsThreads(jT.threads);
    } catch {
      /* ignore */
    }
  }

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        {t("supportTitle")}…
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("supportTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("supportSubtitle")}</p>
      </div>

      {fsReviews.length > 0 ? (
        <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="font-extrabold text-emerald-900 dark:text-emerald-100">
            {t("supportFirestoreReviews")}
          </p>
          <p className="mt-1 text-xs text-emerald-900/80 dark:text-emerald-200/90">
            {t("supportFirestoreReviewsHint")}
          </p>
          <ul className="mt-4 space-y-3">
            {fsReviews.map((r) => (
              <li
                key={`${r.userId}-${r.id}`}
                className="rounded-xl border border-emerald-200/60 bg-white/90 p-3 dark:border-emerald-900/50 dark:bg-slate-900/80"
              >
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {r.productTitle}{" "}
                  <span className="font-mono text-xs text-slate-500">
                    {r.productId}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {r.userName} · {r.rating}★ · {r.id}
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  {r.text}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void patchFsReview(r.userId, r.id, "publish")}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {t("supportPublishReview")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void patchFsReview(r.userId, r.id, "block")}
                    className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700"
                  >
                    {t("supportBlockReview")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {fsThreads.length > 0 ? (
        <section className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 dark:border-sky-900/40 dark:bg-sky-950/20">
          <p className="font-extrabold text-sky-900 dark:text-sky-100">
            {t("supportFirestoreThreads")}
          </p>
          <p className="mt-1 text-xs text-sky-900/80 dark:text-sky-200/90">
            {t("supportFirestoreThreadsHint")}
          </p>
          <ul className="mt-4 space-y-4">
            {fsThreads.map((th) => (
              <li
                key={`${th.userId}-${th.threadId}`}
                className="rounded-xl border border-sky-200/60 bg-white/90 p-3 dark:border-sky-900/50 dark:bg-slate-900/80"
              >
                <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  {th.orderId} · {th.userEmail}
                </p>
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
                  {th.messages.map((m) => (
                    <p key={m.id}>
                      <span className="font-bold text-[#0066ff]">
                        {m.from}:
                      </span>{" "}
                      {m.body}
                    </p>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={threadReply[th.threadId] ?? ""}
                    onChange={(e) =>
                      setThreadReply((p) => ({
                        ...p,
                        [th.threadId]: e.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-950"
                    placeholder={t("supportThreadReplyPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => void sendFsThreadReply(th.userId, th.threadId)}
                    className="rounded-lg bg-[#0066ff] px-3 py-1 text-xs font-bold text-white"
                  >
                    {t("supportThreadSend")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Reviews */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Star className="h-5 w-5 text-amber-500" />
          {t("reviewModAdvanced")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("reviewModHint")}</p>

        <div className="mt-6 space-y-4">
          {state.reviews.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border p-4 ${
                r.profanityFlag || r.moderationStatus === "pending_review"
                  ? "border-orange-400/80 bg-orange-50/50 dark:border-orange-700 dark:bg-orange-950/20"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {r.productTitle}
                  </p>
                  <p className="text-xs text-slate-500">
                    {r.user} · {r.rating}★ · {r.id}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.mediaUrls.length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800">
                        <ImageIcon className="h-3 w-3" />
                        {t("reviewHasPhoto")}
                      </span>
                    ) : null}
                    {r.videoUrl !== undefined && r.videoUrl !== "" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
                        <Video className="h-3 w-3" />
                        {t("reviewHasVideo")}
                      </span>
                    ) : null}
                    {r.profanityFlag ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-200 px-2 py-0.5 text-[10px] font-bold text-orange-900 dark:bg-orange-900/40 dark:text-orange-100">
                        <AlertTriangle className="h-3 w-3" />
                        {t("reviewPendingAuto")}
                      </span>
                    ) : null}
                    {r.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                        <Star className="h-3 w-3 fill-amber-600" />
                        {t("reviewFeatured")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {r.text}
                  </p>
                  {r.mediaUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.mediaUrls[0]}
                      alt=""
                      className="mt-2 h-24 w-24 rounded-lg object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={r.published}
                      onChange={(e) =>
                        updateReview(r.id, { published: e.target.checked })
                      }
                    />
                    {t("publish")}
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={r.featured}
                      onChange={(e) =>
                        updateReview(r.id, { featured: e.target.checked })
                      }
                      disabled={!r.published || !!r.profanityFlag}
                    />
                    {t("reviewFeaturedHome")}
                  </label>
                  <button
                    type="button"
                    onClick={() => updateReview(r.id, { published: false })}
                    className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-bold text-rose-700"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
              <label className="mt-3 block text-xs font-bold text-slate-500">
                {t("reviewAdminReply")}
                <textarea
                  value={r.adminReply}
                  onChange={(e) =>
                    updateReview(r.id, { adminReply: e.target.value })
                  }
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                  placeholder={t("reviewReplyPlaceholder")}
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!r.mediaUrls.length || r.rewardSent}
                  onClick={() => sendReviewReward(r.id, 8)}
                  className="rounded-lg bg-[#0066ff] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  {r.rewardSent ? t("reviewRewardSent") : t("reviewRewardPoints")}
                </button>
                <button
                  type="button"
                  disabled={!r.mediaUrls.length || r.rewardSent}
                  onClick={() => {
                    const cur = getSupportState();
                    const next = {
                      ...cur,
                      reviews: cur.reviews.map((x) =>
                        x.id === r.id ? { ...x, rewardSent: true } : x
                      ),
                    };
                    saveSupportState(next);
                    setState(next);
                    appendActivityLog({
                      actor: "admin",
                      action: "review.coupon_sent",
                      detail: "REVIEW10",
                    });
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold dark:border-slate-600"
                >
                  {t("reviewRewardCoupon")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
          <p className="text-sm font-extrabold text-rose-900 dark:text-rose-200">
            {t("lowRatingReportTitle")}
          </p>
          <p className="mt-1 text-xs text-rose-800/80 dark:text-rose-300/90">
            {t("lowRatingReportHint")}
          </p>
          {lowStrict.length === 0 ? (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {t("lowRatingEmpty")}
            </p>
          ) : null}
          <ul className="mt-3 space-y-2 text-sm">
            {(lowStrict.length ? lowStrict : lowFallback).map((row) => (
              <li
                key={row.productId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-slate-800 dark:text-slate-200"
              >
                <span>
                  {row.title}{" "}
                  <span className="font-mono text-xs text-rose-800 dark:text-rose-300">
                    {row.avgRating.toFixed(1)}★ ({row.reviewCount})
                  </span>
                </span>
                <Link
                  href={`/product/${row.productId}`}
                  className="text-xs font-bold text-[#0066ff]"
                >
                  {t("buyLink")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tickets */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <MessageSquare className="h-5 w-5 text-[#0066ff]" />
          {t("ticketsTitle")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("ticketsAdvancedHint")}</p>

        <div className="mt-4 space-y-3">
          {state.tickets.map((tk) => {
            const sla = isTicketSlaBreached(tk);
            const orders = ordersForCustomer(tk.customerId, remoteOrders);
            const open = selectedTicket === tk.id;
            return (
              <div
                key={tk.id}
                className={`rounded-2xl border p-4 ${
                  sla
                    ? "border-rose-500 bg-rose-50/50 dark:border-rose-600 dark:bg-rose-950/30"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedTicket(open ? null : tk.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    {statusIcon(tk.status)}
                    <span className="font-bold">{tk.subject}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {sla ? (
                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        {t("slaBreached")}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${priorityClass(tk.priority)}`}
                    >
                      {tk.priority}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold capitalize dark:bg-slate-800">
                      {tk.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </button>
                <p className="mt-2 text-xs text-slate-500">{tk.userEmail}</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {tk.body}
                </p>
                {(tk.staffReplies ?? []).length > 0 ? (
                  <div className="mt-3 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                      {t("ticketStaffReplies")}
                    </p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {(tk.staffReplies ?? []).map((r, i) => (
                        <li
                          key={`${r.at}-${i}`}
                          className="rounded-lg bg-white/90 px-3 py-2 text-slate-800 dark:bg-slate-900/80 dark:text-slate-100"
                        >
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {r.at}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {open ? (
                  <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-700 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        {t("ticketOrderLink")}
                      </p>
                      <ul className="mt-2 space-y-2 text-sm">
                        {orders.slice(0, 4).map((o) => (
                          <li
                            key={o.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 font-mono text-xs dark:bg-slate-800"
                          >
                            <span>
                              {o.id} · ₹{o.amount.toLocaleString("en-IN")} ·{" "}
                              {o.status}
                            </span>
                            {tk.orderId === o.id ? (
                              <span className="text-[10px] font-bold text-[#0066ff]">
                                {t("ticketLinked")}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">
                        {t("ticketInternalNotes")}
                      </p>
                      <textarea
                        value={tk.internalNotes}
                        onChange={(e) =>
                          updateTicket(tk.id, { internalNotes: e.target.value })
                        }
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={tk.status}
                    onChange={(e) =>
                      updateTicket(tk.id, {
                        status: e.target.value as TicketStatus,
                      })
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-950"
                  >
                    <option value="open">{t("ticketStatusOpen")}</option>
                    <option value="in_progress">{t("ticketStatusProgress")}</option>
                    <option value="resolved">{t("ticketStatusResolved")}</option>
                  </select>
                  <select
                    value={tk.priority}
                    onChange={(e) =>
                      updateTicket(tk.id, {
                        priority: e.target.value as TicketPriority,
                      })
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-950"
                  >
                    <option value="high">{t("priorityHigh")}</option>
                    <option value="medium">{t("priorityMedium")}</option>
                    <option value="low">{t("priorityLow")}</option>
                  </select>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-500">
                    {t("cannedReplies")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {state.cannedReplies.map((line, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyCanned(tk.id, line)}
                        className="rounded-lg border border-dashed border-slate-300 px-2 py-1 text-left text-[11px] dark:border-slate-600"
                      >
                        {line.slice(0, 48)}…
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {t("replyTicket")}
                  </p>
                  <textarea
                    value={ticketReply[tk.id] ?? ""}
                    onChange={(e) =>
                      setTicketReply((p) => ({
                        ...p,
                        [tk.id]: e.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={() => sendTicketReply(tk.id)}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#0066ff] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {t("ticketSendReply")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <label className="mt-6 block text-xs font-bold text-slate-500">
          {t("cannedRepliesEdit")}
          <textarea
            value={state.cannedReplies.join("\n---\n")}
            onChange={(e) =>
              persist({
                ...state,
                cannedReplies: e.target.value
                  .split(/\n---\n/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 p-2 font-mono text-xs dark:border-slate-600 dark:bg-slate-950"
          />
        </label>
      </section>

      {/* Chat + WhatsApp + Bot */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100">
          <Bot className="h-5 w-5 text-violet-600" />
          {t("chatSupportTitle")}
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("chatSupportHint")}</p>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <label className="text-xs font-bold text-slate-500">
              {t("whatsappNumberLabel")}
              <input
                value={state.chatConfig.whatsappE164}
                onChange={(e) =>
                  persist({
                    ...state,
                    chatConfig: {
                      ...state.chatConfig,
                      whatsappE164: e.target.value.replace(/\D/g, ""),
                    },
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-950"
                placeholder="919876543210"
              />
            </label>
            <p className="mt-2 text-xs text-slate-500">{t("whatsappLogHint")}</p>
            <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-[11px] font-mono text-slate-600 dark:text-slate-400">
              {state.chatConfig.whatsappLogs.slice(0, 15).map((l, i) => (
                <li key={i}>
                  {l.at} {l.path ? `· ${l.path}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
            <p className="text-xs font-bold uppercase text-violet-800 dark:text-violet-300">
              {t("botHandoverTitle")}
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {t("botHandoverBody")}
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              {state.botScripts.map((b) => (
                <li key={b.id} className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/80">
                  <span className="font-mono text-[#0066ff]">{b.trigger}</span> →{" "}
                  {b.response}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-6 text-xs font-bold uppercase text-slate-500">
          {t("activeChatsTitle")}
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {state.activeChats.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="flex items-end justify-between gap-2">
                <Package className="h-4 w-4 shrink-0 text-slate-400" />
                {c.handover ? (
                  <span className="text-[10px] font-bold text-rose-600">
                    {t("chatHandover")}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600">
                    {t("chatBot")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                {c.customer}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                {c.lastMessage}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
