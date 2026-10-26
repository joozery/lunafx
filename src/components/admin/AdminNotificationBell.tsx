"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, UserPlus, ArrowDownLeft, ArrowUpRight, FileCheck2, CheckCheck } from "lucide-react";

interface Item {
  id: string;
  kind: "signup" | "deposit" | "withdrawal" | "account_request";
  title: string;
  detail: string;
  status: string | null;
  href: string;
  at: string;
}

interface Data {
  items: Item[];
  unread: number;
  seenAt: number | null;
  pending: { deposits: number; withdrawals: number; accountRequests: number };
}

const POLL_MS = 30_000;

const KIND_STYLE: Record<Item["kind"], { icon: typeof Bell; cls: string }> = {
  signup:          { icon: UserPlus,      cls: "bg-blue-50 text-blue-600" },
  deposit:         { icon: ArrowDownLeft, cls: "bg-emerald-50 text-emerald-600" },
  withdrawal:      { icon: ArrowUpRight,  cls: "bg-rose-50 text-rose-600" },
  account_request: { icon: FileCheck2,    cls: "bg-amber-50 text-amber-600" },
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: "รอดำเนินการ", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "สำเร็จ",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  approved:  { label: "อนุมัติแล้ว",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  failed:    { label: "ไม่อนุมัติ",   cls: "bg-slate-100 text-slate-500 border-slate-200" },
  rejected:  { label: "ไม่อนุมัติ",   cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "เมื่อสักครู่";
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`;
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const load = () =>
    fetch("/api/admin/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, []);

  // close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/admin/notifications", { method: "POST" }).catch(() => {});
    load();
  };

  const unread = data?.unread ?? 0;
  const pending = data?.pending;
  const pendingTotal = pending ? pending.deposits + pending.withdrawals + pending.accountRequests : 0;
  const seenAt = data?.seenAt ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        aria-label={`การแจ้งเตือน${unread ? ` (${unread} ใหม่)` : ""}`}
        aria-expanded={open}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-[min(380px,calc(100vw-2rem))] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="font-bold text-sm text-slate-900">การแจ้งเตือน</p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-bold text-[#b89766] hover:text-[#997a49]">
                <CheckCheck className="w-3.5 h-3.5" /> อ่านทั้งหมด
              </button>
            )}
          </div>

          {pendingTotal > 0 && pending && (
            <div className="grid grid-cols-3 gap-1.5 p-3 bg-amber-50/60 border-b border-amber-100 text-center">
              {[
                { label: "ฝากรอตรวจ", n: pending.deposits, href: "/admin/transactions" },
                { label: "ถอนรอโอน", n: pending.withdrawals, href: "/admin/transactions" },
                { label: "ขอเปิดบัญชี", n: pending.accountRequests, href: "/admin/account-requests" },
              ].map((p) => (
                <Link key={p.label} href={p.href} onClick={() => setOpen(false)} className="rounded-lg bg-white border border-amber-100 py-1.5 hover:border-amber-300">
                  <p className={`text-base font-black ${p.n ? "text-amber-600" : "text-slate-300"}`}>{p.n}</p>
                  <p className="text-[10px] font-bold text-slate-500">{p.label}</p>
                </Link>
              ))}
            </div>
          )}

          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50">
            {!data ? (
              <li className="p-6 text-center text-xs text-slate-400">กำลังโหลด...</li>
            ) : data.items.length === 0 ? (
              <li className="p-6 text-center text-xs text-slate-400">ยังไม่มีการแจ้งเตือน</li>
            ) : (
              data.items.map((n) => {
                const { icon: Icon, cls } = KIND_STYLE[n.kind];
                const isNew = new Date(n.at).getTime() > seenAt;
                return (
                  <li key={n.id}>
                    <Link href={n.href} onClick={() => setOpen(false)} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 ${isNew ? "bg-[#fdfbf7]" : ""}`}>
                      <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${cls}`}><Icon className="w-4 h-4" /></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          {isNew && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{n.detail}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-slate-400">{timeAgo(n.at)}</span>
                          {n.status && STATUS[n.status] && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS[n.status].cls}`}>{STATUS[n.status].label}</span>
                          )}
                        </div>
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
