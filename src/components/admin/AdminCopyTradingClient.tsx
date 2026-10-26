"use client";

import { useState, useEffect } from "react";
import { Copy, RefreshCw, CheckCircle2, XCircle, PauseCircle, PlayCircle, Crown } from "lucide-react";

interface AdminMaster {
  id: string;
  displayName: string;
  description: string;
  accountNumber: string;
  owner: { name: string; email: string } | null;
  status: "pending" | "active" | "suspended" | "rejected";
  featured: boolean;
  feePercent: number;
  minAllocation: number;
  trades: number;
  winRate: number;
  totalPnl: number;
  roiTotal: number;
  roi30d: number;
  maxDrawdown: number;
  riskScore: number;
  copiers: number;
  aum: number;
  createdAt: string;
}

const STATUS: Record<AdminMaster["status"], { label: string; cls: string }> = {
  pending:   { label: "รออนุมัติ",     cls: "bg-amber-50 text-amber-700 border-amber-200" },
  active:    { label: "เปิดให้คัดลอก", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  suspended: { label: "ระงับ",        cls: "bg-rose-50 text-rose-700 border-rose-200" },
  rejected:  { label: "ไม่อนุมัติ",     cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;

export function AdminCopyTradingClient() {
  const [masters, setMasters] = useState<AdminMaster[] | null>(null);
  const [filter, setFilter] = useState<"all" | AdminMaster["status"]>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () => fetch("/api/admin/copy-trading").then((r) => r.json()).then((d) => setMasters(d.masters ?? [])).catch(() => setMasters([]));
  useEffect(() => { load(); }, []);

  const act = async (m: AdminMaster, body: Record<string, unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(m.id);
    const d = await fetch("/api/admin/copy-trading", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id, ...body }) }).then((r) => r.json()).catch(() => null);
    setBusy(null);
    setMessage(d?.success ? { ok: true, text: `อัปเดต ${m.displayName} แล้ว` } : { ok: false, text: d?.error ?? "ไม่สำเร็จ" });
    setTimeout(() => setMessage(null), 4000);
    load();
  };

  const list = (masters ?? []).filter((m) => filter === "all" || m.status === filter)
    .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  const count = (s: AdminMaster["status"]) => (masters ?? []).filter((m) => m.status === s).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
            <Copy className="w-3.5 h-3.5" /> <span>Copy Trading</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">จัดการ Master Trader</h1>
          <p className="text-xs text-slate-500 mt-1">ลูกค้าสมัครเป็น Master จากหน้าก๊อปปี้เทรด → อนุมัติที่นี่ · สถิติทั้งหมดคำนวณจากผลเทรดจริง</p>
        </div>
        <button onClick={load} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" /> รีเฟรช
        </button>
      </div>

      {message && <div className={`p-3 rounded-xl text-xs font-bold ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>{message.text}</div>}

      <div className="flex flex-wrap gap-2">
        {([["all", `ทั้งหมด (${masters?.length ?? 0})`], ["pending", `รออนุมัติ (${count("pending")})`], ["active", `เปิดอยู่ (${count("active")})`], ["suspended", `ระงับ (${count("suspended")})`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${filter === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200"}`}>{l}</button>
        ))}
      </div>

      {masters === null ? (
        <p className="text-center text-xs text-slate-400 py-10">กำลังโหลด...</p>
      ) : list.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-400">
          ยังไม่มีใบสมัคร Master — ลูกค้าสมัครได้ที่เมนู “ก๊อปปี้เทรด” → แท็บ “เป็น Master”
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {list.map((m) => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 text-base flex items-center gap-1.5">{m.displayName}{m.featured && <Crown className="w-4 h-4 text-amber-500" />}</p>
                  <p className="text-slate-400 truncate">{m.owner?.name} · {m.owner?.email} · บัญชี #{m.accountNumber}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS[m.status].cls}`}>{STATUS[m.status].label}</span>
              </div>
              {m.description && <p className="text-slate-500">{m.description}</p>}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                {[
                  ["ออเดอร์", `${m.trades}`],
                  ["Win", `${m.winRate}%`],
                  ["ROI 30d", pct(m.roi30d)],
                  ["Max DD", `${m.maxDrawdown}%`],
                  ["ผู้คัดลอก", `${m.copiers}`],
                  ["AUM", money(m.aum)],
                ].map(([l, v]) => (
                  <div key={l} className="bg-slate-50 rounded-lg py-1.5"><p className="font-black font-mono text-slate-900">{v}</p><p className="text-[10px] text-slate-500 font-bold">{l}</p></div>
                ))}
              </div>
              <p className="text-slate-500">กำไรรวม <b className={m.totalPnl >= 0 ? "text-emerald-600" : "text-rose-600"}>{money(m.totalPnl)}</b> ({pct(m.roiTotal)}) · ส่วนแบ่ง {m.feePercent}% · ขั้นต่ำ {money(m.minAllocation)} · ความเสี่ยง {m.riskScore}/10</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {m.status === "pending" && (
                  <>
                    <button disabled={busy === m.id} onClick={() => act(m, { action: "approve" })} className="flex-1 inline-flex items-center justify-center gap-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> อนุมัติ</button>
                    <button disabled={busy === m.id} onClick={() => act(m, { action: "reject" }, `ไม่อนุมัติ ${m.displayName}?`)} className="flex-1 inline-flex items-center justify-center gap-1 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold disabled:opacity-50"><XCircle className="w-4 h-4" /> ไม่อนุมัติ</button>
                  </>
                )}
                {m.status === "active" && (
                  <>
                    <button disabled={busy === m.id} onClick={() => act(m, { featured: !m.featured })} className="flex-1 inline-flex items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-200 font-bold disabled:opacity-50"><Crown className="w-4 h-4 text-amber-500" /> {m.featured ? "เลิกปักหมุด" : "ปักหมุดแนะนำ"}</button>
                    <button disabled={busy === m.id} onClick={() => act(m, { action: "suspend" }, `ระงับ ${m.displayName}?\nผู้คัดลอก ${m.copiers} คนจะหยุดคัดลอก และออเดอร์ที่คัดลอกอยู่จะถูกปิดที่ราคาตลาด`)} className="flex-1 inline-flex items-center justify-center gap-1 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold disabled:opacity-50"><PauseCircle className="w-4 h-4" /> ระงับ</button>
                  </>
                )}
                {(m.status === "suspended" || m.status === "rejected") && (
                  <button disabled={busy === m.id} onClick={() => act(m, { action: "activate" })} className="flex-1 inline-flex items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-200 font-bold disabled:opacity-50"><PlayCircle className="w-4 h-4" /> เปิดให้คัดลอกอีกครั้ง</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
