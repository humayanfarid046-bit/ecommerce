"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  mockUsers,
  mockBlockedIPsSeed,
  ordersForCustomer,
  type AdminUserRow,
  type UserSegment,
} from "@/lib/admin-mock-data";
import { cn } from "@/lib/utils";
import {
  Shield,
  Ban,
  CheckCircle,
  BadgeCheck,
  AlertTriangle,
  Eye,
  X,
  Search,
  Wallet,
  LogIn,
  Users,
  Globe,
} from "lucide-react";

type Tab = "users" | "security";

function segmentBadgeClass(seg: UserSegment) {
  switch (seg) {
    case "premium":
      return "bg-violet-100 text-violet-900 dark:bg-violet-950/60 dark:text-violet-200";
    case "new":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200";
    default:
      return "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200";
  }
}

function UserStatusIcons({ u }: { u: AdminUserRow }) {
  const t = useTranslations("admin");
  return (
    <span className="inline-flex items-center gap-1">
      {u.verified ? (
        <span title={t("statusVerified")} className="text-sky-600 dark:text-sky-400">
          <BadgeCheck className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
      {u.suspicious ? (
        <span title={t("statusSuspicious")} className="text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
      {u.blocked ? (
        <span title={t("statusBanned")} className="text-rose-600 dark:text-rose-400">
          <Ban className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
    </span>
  );
}

export function AdminUsers() {
  const t = useTranslations("admin");
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUserRow[]>(mockUsers);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([...mockBlockedIPsSeed]);
  const [newIp, setNewIp] = useState("");

  const [segF, setSegF] = useState<"all" | UserSegment>("all");
  const [statusF, setStatusF] = useState<"all" | "verified" | "suspicious" | "banned">(
    "all"
  );
  const [q, setQ] = useState("");

  const [quickId, setQuickId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [blockModal, setBlockModal] = useState<{ id: string; reason: string } | null>(
    null
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (segF !== "all" && u.segment !== segF) return false;
      if (statusF === "verified" && !u.verified) return false;
      if (statusF === "suspicious" && !u.suspicious) return false;
      if (statusF === "banned" && !u.blocked) return false;
      const s = q.trim().toLowerCase();
      if (s) {
        const hit =
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.phone.replace(/\s/g, "").includes(s.replace(/\s/g, ""));
        if (!hit) return false;
      }
      return true;
    });
  }, [users, segF, statusF, q]);

  const quickUser = quickId ? users.find((x) => x.id === quickId) : null;
  const detailUser = detailId ? users.find((x) => x.id === detailId) : null;

  function setShadowBan(id: string, v: boolean) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, shadowBanned: v } : u))
    );
  }

  function applyWalletAdjust(id: string) {
    const n = Number(walletInput);
    if (!Number.isFinite(n) || n === 0) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, walletBalance: Math.max(0, u.walletBalance + Math.round(n)) }
          : u
      )
    );
    setWalletInput("");
    window.alert(t("walletAdjustDemo", { amount: Math.round(n).toLocaleString("en-IN") }));
  }

  function confirmBlock() {
    if (!blockModal?.id) return;
    const reason = blockModal.reason.trim();
    if (!reason) {
      window.alert(t("banReasonRequired"));
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === blockModal.id
          ? { ...u, blocked: true, banReason: reason, suspicious: true }
          : u
      )
    );
    setBlockModal(null);
  }

  function toggleBlock(id: string, currentlyBlocked: boolean) {
    if (!currentlyBlocked) {
      setBlockModal({ id, reason: "" });
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, blocked: false, banReason: undefined } : u
      )
    );
  }

  function addBlockedIp() {
    const ip = newIp.trim();
    if (!ip || blockedIPs.includes(ip)) return;
    setBlockedIPs((prev) => [...prev, ip]);
    setNewIp("");
  }

  const tabBtn = (id: Tab, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition",
        tab === id
          ? "bg-[#0066ff] text-white shadow"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
          {t("usersTitle")}
        </h2>
        <p className="text-sm text-slate-500">{t("usersSubtitleExtended")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabBtn("users", t("usersTabCustomers"), <Users className="h-4 w-4" />)}
        {tabBtn("security", t("usersTabSecurity"), <Shield className="h-4 w-4" />)}
      </div>

      {tab === "users" ? (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500">
              {t("userFiltersTitle")}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("userSearchPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </div>
              <select
                value={segF}
                onChange={(e) => setSegF(e.target.value as typeof segF)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              >
                <option value="all">{t("filterSegmentAll")}</option>
                <option value="premium">{t("segment_premium")}</option>
                <option value="new">{t("segment_new")}</option>
                <option value="inactive">{t("segment_inactive")}</option>
              </select>
              <select
                value={statusF}
                onChange={(e) => setStatusF(e.target.value as typeof statusF)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              >
                <option value="all">{t("filterUserStatusAll")}</option>
                <option value="verified">{t("filterUserStatusVerified")}</option>
                <option value="suspicious">{t("filterUserStatusSuspicious")}</option>
                <option value="banned">{t("filterUserStatusBanned")}</option>
              </select>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800/95">
                <tr>
                  <th className="p-3 font-bold">{t("colName")}</th>
                  <th className="p-3 font-bold">{t("colEmail")}</th>
                  <th className="p-3 font-bold">{t("userColCLV")}</th>
                  <th className="p-3 font-bold">{t("userColSegment")}</th>
                  <th className="p-3 font-bold">{t("colOrders")}</th>
                  <th className="p-3 font-bold">{t("colLastActive")}</th>
                  <th className="p-3 font-bold">{t("userColStatus")}</th>
                  <th className="p-3 font-bold">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-b border-slate-100 dark:border-slate-800",
                      u.blocked && "bg-rose-50/80 dark:bg-rose-950/20",
                      u.suspicious && !u.blocked && "bg-amber-50/60 dark:bg-amber-950/15"
                    )}
                  >
                    <td className="p-3 font-medium">{u.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td className="p-3 tabular-nums font-semibold">
                      ₹{u.totalSpent.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "rounded-lg px-2 py-0.5 text-[11px] font-bold",
                          segmentBadgeClass(u.segment)
                        )}
                      >
                        {u.segment === "premium"
                          ? t("segment_premium")
                          : u.segment === "new"
                            ? t("segment_new")
                            : t("segment_inactive")}
                      </span>
                    </td>
                    <td className="p-3">{u.orders}</td>
                    <td className="p-3 text-xs text-slate-500">{u.lastActive}</td>
                    <td className="p-3">
                      <UserStatusIcons u={u} />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setQuickId(u.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold dark:border-slate-600"
                          title={t("quickView")}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailId(u.id);
                            setWalletInput("");
                          }}
                          className="rounded-lg border border-[#0066ff]/40 bg-[#0066ff]/10 px-2 py-1 text-[11px] font-bold text-[#0066ff]"
                        >
                          {t("userProfileDetail")}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBlock(u.id, u.blocked)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
                            u.blocked
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                              : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                          }`}
                        >
                          {u.blocked ? (
                            <>
                              <CheckCircle className="h-3.5 w-3.5" /> {t("unblock")}
                            </>
                          ) : (
                            <>
                              <Ban className="h-3.5 w-3.5" /> {t("block")}
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === "security" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
            <p className="flex items-center gap-2 font-extrabold text-rose-900 dark:text-rose-200">
              <AlertTriangle className="h-5 w-5" />
              {t("fraudRulesTitle")}
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-rose-900/90 dark:text-rose-200/90">
              <li>{t("fraudRuleCancels")}</li>
              <li>{t("fraudRuleOtp")}</li>
              <li>{t("fraudRuleShadow")}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="flex items-center gap-2 font-extrabold">
              <Globe className="h-5 w-5 text-[#0066ff]" />
              {t("ipBlockTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-500">{t("ipBlockHint")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder={t("ipBlockPlaceholder")}
                className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={addBlockedIp}
                className="rounded-xl bg-[#0066ff] px-4 py-2 text-sm font-bold text-white"
              >
                {t("ipBlockAdd")}
              </button>
            </div>
            <ul className="mt-3 space-y-1 font-mono text-sm">
              {blockedIPs.map((ip) => (
                <li
                  key={ip}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/80"
                >
                  {ip}
                  <button
                    type="button"
                    onClick={() => setBlockedIPs((prev) => prev.filter((x) => x !== ip))}
                    className="text-xs font-bold text-rose-600"
                  >
                    {t("delete")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {quickUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">{t("quickView")}</h3>
              <button
                type="button"
                onClick={() => setQuickId(null)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-bold">{quickUser.name}</p>
              <p className="text-slate-600">{quickUser.email}</p>
              <p className="tabular-nums font-semibold text-[#0066ff]">
                {t("userColCLV")}: ₹{quickUser.totalSpent.toLocaleString("en-IN")}
              </p>
              <p>
                {t("segmentLabel")}:{" "}
                <span className="font-bold">
                  {quickUser.segment === "premium"
                    ? t("segment_premium")
                    : quickUser.segment === "new"
                      ? t("segment_new")
                      : t("segment_inactive")}
                </span>
              </p>
              <p className="text-xs text-slate-500">
                {t("lastLogin")}: {quickUser.lastLogin}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuickId(null);
                setDetailId(quickUser.id);
              }}
              className="mt-4 w-full rounded-xl bg-[#0066ff] py-2 text-sm font-bold text-white"
            >
              {t("userProfileDetail")}
            </button>
          </div>
        </div>
      ) : null}

      {detailUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{detailUser.name}</h3>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">{detailUser.email}</p>
            <p className="mt-2 text-sm">
              {t("userColCLV")}:{" "}
              <strong>₹{detailUser.totalSpent.toLocaleString("en-IN")}</strong> ·{" "}
              {t("walletBalance")}: ₹{detailUser.walletBalance.toLocaleString("en-IN")}
            </p>
            {detailUser.referredByUserId ? (
              <p className="mt-1 text-xs text-slate-500">
                {t("referredBy")}: {detailUser.referredByUserId} · {t("referralInvites")}:{" "}
                {detailUser.referralInvites}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                {t("referralInvites")}: {detailUser.referralInvites}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/account?impersonate=${detailUser.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-xl border border-[#0066ff]/40 bg-[#0066ff]/10 px-4 py-2 text-xs font-bold text-[#0066ff]"
              >
                <LogIn className="h-4 w-4" />
                {t("loginAsUser")}
              </Link>
              <span className="self-center text-[11px] text-slate-400">
                {t("loginAsUserDemo")}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <p className="text-xs font-bold uppercase text-slate-500">{t("walletAdjust")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="number"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  placeholder={t("walletAdjustPlaceholder")}
                  className="w-36 rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={() => applyWalletAdjust(detailUser.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {t("walletApply")}
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="text-xs font-bold uppercase text-slate-500">
                  {t("wishlistActivity")}
                </p>
                <ul className="mt-2 list-inside list-disc text-slate-600 dark:text-slate-400">
                  {detailUser.wishlistItems.length ? (
                    detailUser.wishlistItems.map((w) => <li key={w}>{w}</li>)
                  ) : (
                    <li>{t("wishlistEmpty")}</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="text-xs font-bold uppercase text-slate-500">
                  {t("recentSearches")}
                </p>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {detailUser.lastSearches.join(" · ")}
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {t("lastLogin")}: {detailUser.lastLogin}
            </p>

            <div className="mt-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                {t("orderHistoryTable")}
              </p>
              <div className="mt-2 max-h-48 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="p-2">{t("colOrderId")}</th>
                      <th className="p-2">{t("colAmount")}</th>
                      <th className="p-2">{t("colStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersForCustomer(detailUser.id).length ? (
                      ordersForCustomer(detailUser.id).map((o) => (
                        <tr key={o.id} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="p-2 font-mono">{o.id}</td>
                          <td className="p-2">₹{o.amount.toLocaleString("en-IN")}</td>
                          <td className="p-2 capitalize">{o.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-3 text-slate-500">
                          {t("noOrdersUser")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {detailUser.banReason ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
                <strong>{t("banReasonLabel")}:</strong> {detailUser.banReason}
              </p>
            ) : null}

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={detailUser.shadowBanned}
                onChange={(e) => setShadowBan(detailUser.id, e.target.checked)}
              />
              {t("shadowBan")} — {t("shadowBanHint")}
            </label>
          </div>
        </div>
      ) : null}

      {blockModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-slate-900">
            <p className="font-extrabold">{t("blockUserReason")}</p>
            <textarea
              value={blockModal.reason}
              onChange={(e) => setBlockModal({ ...blockModal, reason: e.target.value })}
              rows={3}
              placeholder={t("banReasonPlaceholder")}
              className="mt-3 w-full rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-600 dark:bg-slate-950"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockModal(null)}
                className="rounded-lg px-3 py-2 text-sm font-bold"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmBlock}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white"
              >
                {t("confirmBlock")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
