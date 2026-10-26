"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

interface Item {
  id: string;
  tone: "success" | "warning" | "danger" | "info";
  title: string;
  detail: string;
  href: string;
  at: string;
}

const POLL_MS = 60_000;

const TONE = {
  success: { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600" },
  warning: { icon: AlertTriangle, cls: "bg-amber-50 text-amber-600" },
  danger:  { icon: XCircle,       cls: "bg-rose-50 text-rose-600" },
  info:    { icon: Info,          cls: "bg-blue-50 text-blue-600" },
} as const;

function timeAgo(iso: string, isth: boolean) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return isth ? "เมื่อสักครู่" : "just now";
  if (s < 3600) return isth ? `${Math.floor(s / 60)} นาทีที่แล้ว` : `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return isth ? `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว` : `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(isth ? "th-TH" : "en-GB", { day: "numeric", month: "short" });
}

/** Customer notification bell: money in/out, bonuses, system-closed trades, account and copy updates. */
export function NotificationBell({ lang }: { lang: string }) {
  const isth = lang === "th";
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ items: Item[]; unread: number; seenAt: number | null } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = () =>
    fetch(`/api/notifications?lang=${lang}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST" }).catch(() => {});
    load();
  };

  const href = (h: string) => (h === "webtrader" ? `/${lang}/webtrader` : `/${lang}/dashboard/${h}`);
  const unread = data?.unread ?? 0;
  const seenAt = data?.seenAt ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        aria-label={isth ? `การแจ้งเตือน${unread ? ` (${unread} ใหม่)` : ""}` : `Notifications${unread ? ` (${unread} new)` : ""}`}
        aria-expanded={open}
        className="relative p-2.5 text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 rounded-xl"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        // Phones: full-width sheet under the header. Larger screens: dropdown under the bell.
        <div className="fixed inset-x-3 top-[5.25rem] max-h-[calc(100dvh-7rem)] flex flex-col sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[380px] sm:max-h-none bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="font-bold text-sm text-slate-900">{isth ? "การแจ้งเตือน" : "Notifications"}</p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-bold text-[#b89766] hover:text-[#997a49]">
                <CheckCheck className="w-3.5 h-3.5" /> {isth ? "อ่านทั้งหมด" : "Mark all read"}
              </button>
            )}
          </div>
          <ul className="flex-1 min-h-0 sm:max-h-[60vh] overflow-y-auto overscroll-contain divide-y divide-slate-50">
            {!data ? (
              <li className="p-6 text-center text-xs text-slate-400">{isth ? "กำลังโหลด..." : "Loading..."}</li>
            ) : data.items.length === 0 ? (
              <li className="p-8 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                {isth ? "ยังไม่มีการแจ้งเตือน" : "No notifications yet"}
              </li>
            ) : (
              data.items.map((n) => {
                const { icon: Icon, cls } = TONE[n.tone];
                const isNew = new Date(n.at).getTime() > seenAt;
                return (
                  <li key={n.id}>
                    <Link href={href(n.href)} onClick={() => setOpen(false)} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 ${isNew ? "bg-[#fdfbf7]" : ""}`}>
                      <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${cls}`}><Icon className="w-4 h-4" /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 break-words">{n.detail}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.at, isth)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
