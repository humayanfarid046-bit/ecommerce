"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  appendMessage,
  getThreads,
  openOrGetThread,
  type SupportThread,
} from "@/lib/support-chat-sync";
import { useTranslations } from "next-intl";
import { MessageCircle, X } from "lucide-react";

type Props = { orderId: string; productHint?: string };

export function OrderNeedHelpChat({ orderId, productHint }: Props) {
  const { user } = useAuth();
  const t = useTranslations("account");
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open || !user?.email) return;
    const th = openOrGetThread(orderId, user.email, productHint);
    setThread(th);
  }, [open, orderId, user?.email, productHint]);

  useEffect(() => {
    if (!open || !thread?.id) return;
    const tid = thread.id;
    function sync() {
      const list = getThreads();
      const next = list.find((x) => x.id === tid);
      if (next) setThread(next);
    }
    window.addEventListener("lc-support-threads", sync);
    return () => window.removeEventListener("lc-support-threads", sync);
  }, [open, thread?.id]);

  function send() {
    if (!thread || !msg.trim()) return;
    appendMessage(thread.id, "user", msg.trim());
    setMsg("");
    setThread(getThreads().find((x) => x.id === thread.id) ?? thread);
  }

  if (!user?.email) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-[#0066ff]/35 bg-[#0066ff]/10 px-4 py-2 text-xs font-bold text-[#0066ff] transition hover:bg-[#0066ff]/15"
      >
        <MessageCircle className="h-4 w-4" />
        {t("needHelp")}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-label={t("needHelpTitle")}
        >
          <div className="flex max-h-[min(90vh,520px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t("needHelpTitle")}
                </p>
                <p className="font-mono text-[11px] text-slate-500">{orderId}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={t("cancel")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {(thread?.messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === "user"
                        ? "bg-[#0066ff] text-white"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-3 dark:border-slate-800">
              <div className="flex gap-2">
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={t("needHelpPlaceholder")}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={send}
                  className="rounded-xl bg-[#0066ff] px-4 py-2 text-xs font-bold text-white hover:bg-[#0052cc]"
                >
                  {t("needHelpSend")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
