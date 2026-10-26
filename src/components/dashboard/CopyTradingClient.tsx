"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, TrendingUp, ShieldAlert, X, CheckCircle2, Copy, StopCircle, Clock, Crown, AlertTriangle, Wallet } from "lucide-react";
import { type Locale } from "@/dictionaries";

interface Master {
  id: string;
  displayName: string;
  description: string;
  feePercent: number;
  minAllocation: number;
  featured: boolean;
  status: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  roiTotal: number;
  roi30d: number;
  maxDrawdown: number;
  riskScore: number;
  copiers: number;
  aum: number;
  daysActive: number;
  accountNumber?: string;
}

interface Subscription {
  id: string;
  masterName: string;
  accountNumber: string;
  allocation: number;
  mode: "ratio" | "fixed" | "multiplier";
  fixedLot: number | null;
  multiplier: number | null;
  maxLossPercent: number;
  status: "active" | "stopped";
  stopReason: string | null;
  openPositions: number;
  realizedPnl: number;
  floatingPnl: number;
  roi: number;
  copiedTrades: number;
  skippedTrades: number;
  lastSkip: { at: string; symbol: string; reason: string } | null;
  startedAt: string;
  feePercent: number | null;
  feesPaid: number;
}

interface Earnings {
  id: string;
  displayName: string;
  status: string;
  feePercent: number;
  feesTotal: number;
  fees30d: number;
  pendingFees: number;
  followers: { id: string; name: string; allocation: number; realizedPnl: number; feesPaid: number; feePercent: number; status: string; startedAt: string }[];
  payouts: { ref: string; fee: number; feePercent: number; profit: number; at: string; follower: string }[];
}

interface Account { id: string; accountNumber: string; balance: number; isDemo: boolean; type: string }

const STOP_REASON: Record<string, string> = {
  user: "หยุดเอง",
  max_loss: "ถึงจุดหยุดขาดทุน",
  master_suspended: "Master ถูกระงับ",
};

const money = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
const riskLabel = (r: number) => (r <= 3 ? { th: "ต่ำ", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" } : r <= 6 ? { th: "กลาง", cls: "bg-amber-50 text-amber-700 border-amber-200" } : { th: "สูง", cls: "bg-rose-50 text-rose-700 border-rose-200" });

export function CopyTradingClient({ lang }: { lang: string }) {
  const isth = (lang as Locale) === "th";
  const [tab, setTab] = useState<"explore" | "mine" | "master">("explore");
  const [masters, setMasters] = useState<Master[] | null>(null);
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [myMasters, setMyMasters] = useState<Master[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [earnings, setEarnings] = useState<Earnings[]>([]);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  const say = (ok: boolean, text: string) => { setFlash({ ok, text }); setTimeout(() => setFlash(null), 5000); };

  const loadAll = useCallback(() => {
    fetch("/api/copy-trading/masters").then((r) => r.json()).then((d) => setMasters(d.masters ?? [])).catch(() => setMasters([]));
    fetch("/api/copy-trading/subscriptions").then((r) => r.json()).then((d) => setSubs(d.subscriptions ?? [])).catch(() => setSubs([]));
    fetch("/api/copy-trading/apply").then((r) => r.json()).then((d) => setMyMasters(d.masters ?? [])).catch(() => {});
    fetch("/api/accounts").then((r) => r.json()).then((d) => setAccounts(d.accounts ?? [])).catch(() => {});
    fetch("/api/copy-trading/earnings").then((r) => r.json()).then((d) => setEarnings(d.masters ?? [])).catch(() => {});
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  // keep copy results fresh while the "my copies" tab is open
  useEffect(() => {
    if (tab !== "mine") return;
    const t = setInterval(() => fetch("/api/copy-trading/subscriptions").then((r) => r.json()).then((d) => setSubs(d.subscriptions ?? [])).catch(() => {}), 15_000);
    return () => clearInterval(t);
  }, [tab]);

  /* ── copy modal ── */
  const [selected, setSelected] = useState<Master | null>(null);
  const [form, setForm] = useState({ accountId: "", allocation: "", mode: "ratio" as Subscription["mode"], fixedLot: "0.01", multiplier: "1", maxLossPercent: "30" });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const myMasterAccountIds = new Set(myMasters.filter((m) => m.status === "pending" || m.status === "active").map((m) => m.accountNumber));
  const followAccounts = accounts.filter((a) => !myMasterAccountIds.has(a.accountNumber));

  const openCopy = (m: Master) => {
    setSelected(m);
    setFormError("");
    const first = followAccounts[0];
    setForm((f) => ({ ...f, accountId: first?.id ?? "", allocation: String(Math.max(m.minAllocation, Math.min(first?.balance ?? 0, 500)) || "") }));
  };

  const confirmCopy = async () => {
    if (!selected) return;
    setBusy(true);
    setFormError("");
    try {
      const d = await fetch("/api/copy-trading/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterId: selected.id,
          accountId: form.accountId,
          allocation: parseFloat(form.allocation),
          mode: form.mode,
          fixedLot: parseFloat(form.fixedLot),
          multiplier: parseFloat(form.multiplier),
          maxLossPercent: parseFloat(form.maxLossPercent) || 0,
        }),
      }).then((r) => r.json());
      if (d.success) {
        setSelected(null);
        say(true, isth ? `เริ่มคัดลอก ${selected.displayName} แล้ว — ออเดอร์ถัดไปของ Master จะถูกคัดลอกเข้าบัญชีคุณ` : `Now copying ${selected.displayName}`);
        setTab("mine");
        loadAll();
      } else setFormError(d.error ?? "เกิดข้อผิดพลาด");
    } catch {
      setFormError(isth ? "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้" : "Network error");
    } finally {
      setBusy(false);
    }
  };

  const stop = async (s: Subscription) => {
    const msg = isth
      ? `หยุดคัดลอก ${s.masterName}?${s.openPositions ? `\nออเดอร์ที่คัดลอกอยู่ ${s.openPositions} รายการจะถูกปิดที่ราคาตลาด` : ""}`
      : `Stop copying ${s.masterName}?`;
    if (!window.confirm(msg)) return;
    const d = await fetch("/api/copy-trading/subscriptions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) }).then((r) => r.json()).catch(() => null);
    if (d?.success) { say(true, isth ? "หยุดคัดลอกแล้ว" : "Stopped"); loadAll(); } else say(false, d?.error ?? "ไม่สำเร็จ");
  };

  /* ── apply as master ── */
  const [apply, setApply] = useState({ accountId: "", displayName: "", description: "", feePercent: "20", minAllocation: "100" });
  const liveAccounts = accounts.filter((a) => !a.isDemo);
  const submitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await fetch("/api/copy-trading/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...apply, accountId: apply.accountId || liveAccounts[0]?.id, feePercent: parseFloat(apply.feePercent), minAllocation: parseFloat(apply.minAllocation) }),
      }).then((r) => r.json());
      if (d.success) { say(true, isth ? "ส่งใบสมัครแล้ว รอแอดมินอนุมัติ" : "Application sent"); loadAll(); } else say(false, d.error ?? "ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const activeSubs = (subs ?? []).filter((s) => s.status === "active");
  const totalAllocated = activeSubs.reduce((s, x) => s + x.allocation, 0);
  const totalPnl = activeSubs.reduce((s, x) => s + x.realizedPnl + x.floatingPnl, 0);

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#c6a87c]";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      {/* header + summary */}
      <div className="bg-gradient-to-r from-white via-[#faf8f5] to-[#f5efe4] border border-[#e8d5b7]/70 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2"><Copy className="w-6 h-6 text-[#b89766]" /> {isth ? "ก๊อปปี้เทรด" : "Copy Trading"}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isth ? "เลือก Master Trader แล้วระบบจะเปิด/ปิดออเดอร์ตามเขาในบัญชีของคุณโดยอัตโนมัติ ตามสัดส่วนเงินที่คุณกำหนด" : "Pick a master trader and their orders are mirrored into your account automatically."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: isth ? "กำลังคัดลอก" : "Copying", value: `${activeSubs.length}` },
            { label: isth ? "เงินที่ใช้คัดลอก" : "Allocated", value: money(totalAllocated) },
            { label: isth ? "กำไร/ขาดทุนรวม" : "Total P&L", value: money(totalPnl), cls: totalPnl >= 0 ? "text-emerald-600" : "text-rose-600" },
          ].map((x) => (
            <div key={x.label} className="bg-white/80 border border-[#e8d5b7]/60 rounded-xl py-2.5 px-2">
              <p className={`text-base sm:text-lg font-black font-mono ${x.cls ?? "text-slate-900"}`}>{x.value}</p>
              <p className="text-[10px] font-bold text-slate-500">{x.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
          {([["explore", isth ? "เลือก Master" : "Masters"], ["mine", isth ? "การคัดลอกของฉัน" : "My copies"], ["master", isth ? "เป็น Master" : "Become a master"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === k ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"}`}>{l}</button>
          ))}
        </div>
      </div>

      {flash && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${flash.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
          {flash.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {flash.text}
        </div>
      )}

      {/* ── explore ── */}
      {tab === "explore" && (
        masters === null ? <p className="text-center text-xs text-slate-400 py-10">{isth ? "กำลังโหลด..." : "Loading..."}</p>
        : masters.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">{isth ? "ยังไม่มี Master Trader ที่เปิดให้คัดลอก" : "No master traders yet"}</p>
            <p className="text-xs text-slate-400">{isth ? "สนใจให้คนอื่นคัดลอกการเทรดของคุณ? สมัครได้ที่แท็บ \"เป็น Master\"" : "Want others to copy you? Apply in the \"Become a master\" tab."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {masters.map((m) => {
              const risk = riskLabel(m.riskScore);
              return (
                <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#c6a87c] to-[#997a49] text-white font-black flex items-center justify-center shrink-0">{m.displayName[0]?.toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-900 truncate flex items-center gap-1.5">{m.displayName}{m.featured && <Crown className="w-4 h-4 text-amber-500" />}</p>
                      <p className="text-[11px] text-slate-400">{isth ? `เทรดมา ${m.daysActive} วัน · ${m.trades} ออเดอร์` : `${m.daysActive} days · ${m.trades} trades`}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${risk.cls}`}>{isth ? `เสี่ยง${risk.th}` : `Risk ${m.riskScore}/10`}</span>
                  </div>
                  {m.description && <p className="text-xs text-slate-500 line-clamp-2">{m.description}</p>}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl py-2"><p className={`font-black font-mono ${m.roi30d >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{pct(m.roi30d)}</p><p className="text-[10px] text-slate-500 font-bold">ROI 30 {isth ? "วัน" : "d"}</p></div>
                    <div className="bg-slate-50 rounded-xl py-2"><p className="font-black font-mono text-slate-900">{m.winRate}%</p><p className="text-[10px] text-slate-500 font-bold">Win rate</p></div>
                    <div className="bg-slate-50 rounded-xl py-2"><p className="font-black font-mono text-slate-900">{m.maxDrawdown}%</p><p className="text-[10px] text-slate-500 font-bold">Max DD</p></div>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1 flex-1">
                    <p className="flex justify-between"><span>ROI {isth ? "ทั้งหมด" : "total"}</span><span className="font-bold text-slate-800">{pct(m.roiTotal)}</span></p>
                    <p className="flex justify-between"><span>{isth ? "ผู้คัดลอก / เงินที่คัดลอก" : "Copiers / AUM"}</span><span className="font-bold text-slate-800">{m.copiers} · {money(m.aum)}</span></p>
                    <p className="flex justify-between"><span>{isth ? "ส่วนแบ่งกำไรให้ Master" : "Performance fee"}</span><span className="font-bold text-slate-800">{m.feePercent}%</span></p>
                    <p className="flex justify-between"><span>{isth ? "เงินขั้นต่ำ" : "Minimum"}</span><span className="font-bold text-slate-800">{money(m.minAllocation)}</span></p>
                  </div>
                  <button onClick={() => openCopy(m)} className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] text-white font-black py-3 rounded-xl text-sm">{isth ? "คัดลอก" : "Copy"}</button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── my copies ── */}
      {tab === "mine" && (
        subs === null ? <p className="text-center text-xs text-slate-400 py-10">{isth ? "กำลังโหลด..." : "Loading..."}</p>
        : subs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">{isth ? "คุณยังไม่ได้คัดลอก Master คนไหน" : "You are not copying anyone yet"}</p>
            <button onClick={() => setTab("explore")} className="text-xs font-bold text-[#b89766]">{isth ? "ไปเลือก Master →" : "Browse masters →"}</button>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map((s) => {
              const total = s.realizedPnl + s.floatingPnl;
              return (
                <div key={s.id} className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3 ${s.status === "active" ? "border-slate-200" : "border-slate-100 opacity-75"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{s.masterName}</p>
                      <p className="text-[11px] text-slate-400">
                        {isth ? "บัญชี" : "Account"} #{s.accountNumber} · {s.mode === "ratio" ? (isth ? "ตามสัดส่วนเงิน" : "Proportional") : s.mode === "fixed" ? `${s.fixedLot} lot ${isth ? "คงที่" : "fixed"}` : `x${s.multiplier}`}
                        {s.maxLossPercent > 0 && ` · ${isth ? "หยุดเมื่อขาดทุน" : "stop at"} ${s.maxLossPercent}%`}
                      </p>
                    </div>
                    {s.status === "active"
                      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">{isth ? "กำลังคัดลอก" : "Active"}</span>
                      : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-500 border-slate-200">{isth ? `หยุดแล้ว · ${STOP_REASON[s.stopReason ?? ""] ?? ""}` : "Stopped"}</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl py-2"><p className="font-black font-mono text-slate-900 text-sm">{money(s.allocation)}</p><p className="text-[10px] text-slate-500 font-bold">{isth ? "เงินที่ใช้คัดลอก" : "Allocated"}</p></div>
                    <div className="bg-slate-50 rounded-xl py-2"><p className={`font-black font-mono text-sm ${total >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{money(total)}</p><p className="text-[10px] text-slate-500 font-bold">{isth ? "กำไร/ขาดทุน" : "P&L"} ({pct(s.roi)})</p></div>
                    <div className="bg-slate-50 rounded-xl py-2"><p className="font-black font-mono text-slate-900 text-sm">{s.openPositions}</p><p className="text-[10px] text-slate-500 font-bold">{isth ? "ออเดอร์เปิดอยู่" : "Open"}</p></div>
                    <div className="bg-slate-50 rounded-xl py-2"><p className="font-black font-mono text-slate-900 text-sm">{s.copiedTrades}</p><p className="text-[10px] text-slate-500 font-bold">{isth ? "คัดลอกแล้ว" : "Copied"}</p></div>
                  </div>
                  {(s.feePercent ?? 0) > 0 && (
                    <p className="text-[11px] text-slate-500">
                      {isth
                        ? `ส่วนแบ่งกำไรให้ Master ${s.feePercent}% (คิดทุก 7 วันจากกำไรที่ปิดแล้ว เฉพาะส่วนที่เกินจุดสูงสุดเดิม) · จ่ายไปแล้ว ${money(s.feesPaid)}`
                        : `Performance fee ${s.feePercent}% (weekly, high-water mark) · paid ${money(s.feesPaid)}`}
                    </p>
                  )}
                  {s.status === "active" && s.lastSkip && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
                      <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {isth ? `ข้ามออเดอร์ ${s.lastSkip.symbol} ล่าสุด: ${s.lastSkip.reason}` : `Last skipped ${s.lastSkip.symbol}: ${s.lastSkip.reason}`}
                    </p>
                  )}
                  {s.status === "active" && (
                    <button onClick={() => stop(s)} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold">
                      <StopCircle className="w-4 h-4" /> {isth ? "หยุดคัดลอก" : "Stop copying"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── become a master ── */}
      {tab === "master" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={submitApply} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4 text-xs">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> {isth ? "สมัครเป็น Master Trader" : "Apply as a master trader"}</h3>
            {liveAccounts.length === 0 ? (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{isth ? "ต้องมีบัญชีเทรดจริงก่อน จึงจะสมัครเป็น Master ได้" : "You need a live trading account first."}</p>
            ) : (
              <>
                <label className="block space-y-1"><span className="font-bold text-slate-700">{isth ? "บัญชีที่ให้คนอื่นคัดลอก" : "Account to be copied"}</span>
                  <select value={apply.accountId || liveAccounts[0]?.id} onChange={(e) => setApply({ ...apply, accountId: e.target.value })} className={inputCls}>
                    {liveAccounts.map((a) => <option key={a.id} value={a.id}>#{a.accountNumber} · {money(a.balance)}</option>)}
                  </select>
                </label>
                <label className="block space-y-1"><span className="font-bold text-slate-700">{isth ? "ชื่อที่แสดง" : "Display name"}</span>
                  <input required minLength={3} maxLength={30} value={apply.displayName} onChange={(e) => setApply({ ...apply, displayName: e.target.value })} className={inputCls} placeholder="เช่น Gold_Scalper" />
                </label>
                <label className="block space-y-1"><span className="font-bold text-slate-700">{isth ? "แนะนำสไตล์การเทรด" : "Strategy"}</span>
                  <textarea maxLength={500} rows={3} value={apply.description} onChange={(e) => setApply({ ...apply, description: e.target.value })} className={inputCls} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1"><span className="font-bold text-slate-700">{isth ? "ส่วนแบ่งกำไร (%)" : "Fee (%)"}</span>
                    <input type="number" min="0" max="50" step="1" value={apply.feePercent} onChange={(e) => setApply({ ...apply, feePercent: e.target.value })} className={inputCls} />
                  </label>
                  <label className="block space-y-1"><span className="font-bold text-slate-700">{isth ? "เงินขั้นต่ำผู้คัดลอก ($)" : "Min. allocation ($)"}</span>
                    <input type="number" min="0" step="1" value={apply.minAllocation} onChange={(e) => setApply({ ...apply, minAllocation: e.target.value })} className={inputCls} />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">{isth ? "ส่วนแบ่งกำไรคิดจากกำไรของผู้คัดลอก ตัดเข้าบัญชีนี้อัตโนมัติทุก 7 วัน (เฉพาะกำไรที่เกินจุดสูงสุดเดิม) · บัญชีนี้จะใช้คัดลอก Master คนอื่นไม่ได้" : "Fees are settled weekly with a high-water mark."}</p>
                <button disabled={busy} className="w-full bg-slate-900 text-white font-black py-3 rounded-xl disabled:opacity-50">{isth ? "ส่งใบสมัคร" : "Submit"}</button>
              </>
            )}
          </form>

          <div className="space-y-3">
            <h3 className="font-black text-slate-900">{isth ? "สถานะ Master ของฉัน" : "My master profiles"}</h3>
            {myMasters.length === 0 ? (
              <p className="text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl p-6 text-center">{isth ? "ยังไม่ได้สมัคร" : "None yet"}</p>
            ) : myMasters.map((m) => (
              <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-black text-slate-900 text-sm">{m.displayName} <span className="font-mono text-slate-400">#{m.accountNumber}</span></p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : m.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {{ active: "เปิดให้คัดลอก", pending: "รออนุมัติ", suspended: "ถูกระงับ", rejected: "ไม่อนุมัติ" }[m.status] ?? m.status}
                  </span>
                </div>
                <p className="text-slate-500">{isth ? "ผู้คัดลอก" : "Copiers"} <b className="text-slate-800">{m.copiers}</b> · {isth ? "เงินที่คัดลอก" : "AUM"} <b className="text-slate-800">{money(m.aum)}</b> · ROI <b className="text-slate-800">{pct(m.roiTotal)}</b></p>
              </div>
            ))}
            {earnings.filter((e) => e.status !== "rejected").map((e) => (
              <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                <p className="font-black text-slate-900 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-[#b89766]" /> {isth ? "รายได้ของ" : "Earnings —"} {e.displayName}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50 rounded-xl py-2"><p className="font-black font-mono text-emerald-700">{money(e.feesTotal)}</p><p className="text-[10px] text-slate-500 font-bold">{isth ? "ได้รับทั้งหมด" : "Total"}</p></div>
                  <div className="bg-slate-50 rounded-xl py-2"><p className="font-black font-mono text-slate-900">{money(e.fees30d)}</p><p className="text-[10px] text-slate-500 font-bold">30 {isth ? "วันล่าสุด" : "days"}</p></div>
                  <div className="bg-amber-50 rounded-xl py-2"><p className="font-black font-mono text-amber-700">{money(e.pendingFees)}</p><p className="text-[10px] text-slate-500 font-bold">{isth ? "รอตัดรอบนี้" : "Accruing"}</p></div>
                </div>
                <p className="text-[11px] text-slate-400">{isth ? `ส่วนแบ่ง ${e.feePercent}% ของกำไรผู้คัดลอก ตัดเข้าบัญชีนี้ทุก 7 วัน และตอนผู้คัดลอกหยุดคัดลอก` : `${e.feePercent}% of copier profit, settled weekly and when a copy stops`}</p>
                {e.followers.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">{isth ? "ผู้คัดลอก" : "Copiers"} ({e.followers.filter((f) => f.status === "active").length} {isth ? "คนที่ยังคัดลอกอยู่" : "active"})</p>
                    {e.followers.slice(0, 10).map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
                        <span className="truncate">{f.name} <span className="text-slate-400">· {money(f.allocation)}{f.status !== "active" ? (isth ? " · หยุดแล้ว" : " · stopped") : ""}</span></span>
                        <span className="shrink-0 font-mono"><span className={f.realizedPnl >= 0 ? "text-emerald-600" : "text-rose-600"}>{money(f.realizedPnl)}</span> · <b>{money(f.feesPaid)}</b></span>
                      </div>
                    ))}
                  </div>
                )}
                {e.payouts.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">{isth ? "ประวัติการรับส่วนแบ่ง" : "Payouts"}</p>
                    {e.payouts.slice(0, 10).map((p) => (
                      <div key={p.ref} className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
                        <span className="truncate text-slate-500">{new Date(p.at).toLocaleDateString(isth ? "th-TH" : "en-GB")} · {p.follower} · {isth ? "กำไร" : "profit"} {money(p.profit)} × {p.feePercent}%</span>
                        <b className="shrink-0 font-mono text-emerald-600">+{money(p.fee)}</b>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="bg-[#fdfbf7] border border-[#e8d5b7] rounded-2xl p-4 text-[11px] text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-800 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-[#b89766]" /> {isth ? "การคัดลอกทำงานอย่างไร" : "How copying works"}</p>
              <p>• {isth ? "เทรดในบัญชีนี้ตามปกติผ่าน WebTrader — ทุกออเดอร์จะถูกคัดลอกให้ผู้ติดตามทันที" : "Trade normally; each order is mirrored instantly."}</p>
              <p>• {isth ? "ปิดออเดอร์เมื่อไร ออเดอร์ของผู้ติดตามก็ปิดตาม" : "Closing an order closes the copies too."}</p>
              <p>• {isth ? "สถิติ ROI / Win rate / Drawdown คำนวณจากผลเทรดจริงของบัญชีนี้" : "Stats come from this account's real results."}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── copy setup modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelected(null)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="font-black text-slate-900">{isth ? "ตั้งค่าการคัดลอก" : "Copy setup"}: <span className="text-[#b89766]">{selected.displayName}</span></p>
              <button onClick={() => setSelected(null)} aria-label="close" className="text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              {followAccounts.length === 0 ? (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{isth ? "ต้องมีบัญชีเทรดก่อน (บัญชีที่เป็น Master ใช้คัดลอกไม่ได้)" : "You need a trading account first."}</p>
              ) : (
                <>
                  <label className="block space-y-1"><span className="font-bold text-slate-700">{isth ? "คัดลอกเข้าบัญชี" : "Copy into account"}</span>
                    <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className={inputCls}>
                      {followAccounts.map((a) => <option key={a.id} value={a.id}>#{a.accountNumber} {a.isDemo ? "(Demo)" : ""} · {money(a.balance)}</option>)}
                    </select>
                  </label>
                  <label className="block space-y-1"><span className="font-bold text-slate-700">{isth ? "เงินที่ใช้คัดลอก (USD)" : "Amount to allocate (USD)"}</span>
                    <input type="number" min={selected.minAllocation} step="1" value={form.allocation} onChange={(e) => setForm({ ...form, allocation: e.target.value })} className={inputCls} />
                    <span className="text-[11px] text-slate-400">{isth ? `ขั้นต่ำ ${money(selected.minAllocation)} · เงินยังอยู่ในบัญชีคุณ ไม่ได้โอนให้ Master` : "The money stays in your account."}</span>
                  </label>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-700">{isth ? "ขนาดออเดอร์" : "Order size"}</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([["ratio", isth ? "ตามสัดส่วน" : "Proportional"], ["fixed", isth ? "lot คงที่" : "Fixed lot"], ["multiplier", isth ? "ตัวคูณ" : "Multiplier"]] as const).map(([k, l]) => (
                        <button key={k} type="button" onClick={() => setForm({ ...form, mode: k })} className={`py-2 rounded-lg border font-bold ${form.mode === k ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{l}</button>
                      ))}
                    </div>
                    {form.mode === "ratio" && <p className="text-[11px] text-slate-400">{isth ? "เช่น Master มีทุน $10,000 เปิด 1 lot และคุณใช้ $1,000 → คุณได้ 0.1 lot" : "e.g. master $10,000 opens 1 lot, you allocate $1,000 → 0.1 lot"}</p>}
                    {form.mode === "fixed" && <input type="number" min="0.01" step="0.01" value={form.fixedLot} onChange={(e) => setForm({ ...form, fixedLot: e.target.value })} className={inputCls} />}
                    {form.mode === "multiplier" && <input type="number" min="0.1" max="10" step="0.1" value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} className={inputCls} />}
                  </div>
                  <label className="block space-y-1"><span className="font-bold text-slate-700">{isth ? "หยุดคัดลอกเมื่อขาดทุน (% ของเงินที่ใช้คัดลอก)" : "Stop when loss reaches (% of allocation)"}</span>
                    <input type="number" min="0" max="100" step="1" value={form.maxLossPercent} onChange={(e) => setForm({ ...form, maxLossPercent: e.target.value })} className={inputCls} />
                    <span className="text-[11px] text-slate-400">{isth ? "ถึงจุดนี้ระบบจะปิดออเดอร์ที่คัดลอกทั้งหมดและหยุดคัดลอก · ใส่ 0 = ไม่จำกัด" : "0 = no limit"}</span>
                  </label>
                  <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg p-3">
                    {isth ? `ระบบจะคัดลอกเฉพาะออเดอร์ใหม่ของ Master หลังจากนี้ · ส่วนแบ่งกำไรให้ Master ${selected.feePercent}% · ผลงานในอดีตไม่รับประกันผลในอนาคต` : `Only new orders are copied. Past performance does not guarantee future results.`}
                  </p>
                  {formError && <p className="p-2.5 rounded-lg bg-rose-50 text-rose-600 font-bold">{formError}</p>}
                  <button onClick={confirmCopy} disabled={busy} className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] text-white font-black py-3.5 rounded-xl text-sm disabled:opacity-50">
                    {busy ? (isth ? "กำลังบันทึก..." : "Saving...") : (isth ? "ยืนยันเริ่มคัดลอก" : "Start copying")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
