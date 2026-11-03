"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, RefreshCw, X } from "lucide-react";

type ActiveBonus = {
  bonusUsd: number;
  requiredLots: number; tradedLots: number; remainingLots: number;
  requiredPips: number; tradedPips: number; remainingPips: number;
  pipMode: "distance" | "lot_weighted";
};

type Account = {
  id: string;
  accountNumber: string;
  type: string;
  isDemo: boolean;
  leverage: string;
  stopOutLevel: number;
  stopOutIsDefault: boolean;
  status: string;
  balance: number;
  equity: number;
  freeMargin: number;
  closedLots: number;
  openLots: number;
  closedTrades: number;
  openTrades: number;
  realizedPnl: number;
  wins: number;
  pips: number;
  lotPips: number;
  bonus: ActiveBonus | null;
  withdrawLimitUsd: number | null;
};

type Bonus = {
  id: string;
  accountId: string;
  accountNumber: string;
  depositUsd: number;
  bonusUsd: number;
  maxWithdrawUsd: number;
  status: "active" | "completed" | "forfeited" | "replaced";
  countFrom: string | null;
  restarts: number;
  createdAt: string;
  endedAt: string | null;
  requiredLots: number;
  requiredPips: number;
  pipMode: "distance" | "lot_weighted";
  countedLots: number;
  countedPips: number;
  tradeCount: number;
  lotsMet: boolean;
  pipsMet: boolean;
};

type WithdrawCheck = {
  accountId: string;
  accountNumber: string;
  canWithdraw: boolean;
  active: ActiveBonus | null;
  bonusHeldUsd: number;
  withdrawableUsd: number;
  withdrawLimitUsd: number | null;
};

type Trade = {
  id: string;
  accountNumber: string;
  symbol: string;
  type: "buy" | "sell";
  volume: number;
  openPrice: number;
  closePrice: number | null;
  pips: number | null;
  lotPips: number | null;
  pnl: number | null;
  status: "open" | "closed";
  closeReason: string | null;
  openTime: string;
  closeTime: string | null;
  isCopy: boolean;
  bonusIds: string[];
};

type Detail = {
  accounts: Account[];
  bonuses: Bonus[];
  withdrawCheck: WithdrawCheck[];
  funding: { deposits: number; depositCount: number; withdrawals: number; withdrawalCount: number };
  trades: Trade[];
  totalTrades: number;
  pages: number;
  page: number;
};

const REASON_TH: Record<string, string> = {
  manual: "ปิดเอง",
  sl: "SL",
  tp: "TP",
  stop_out: "Stop out",
  master_close: "Master ปิด",
  copy_stop: "หยุด Copy",
};

const BONUS_STATUS: Record<string, { label: string; cls: string }> = {
  active:    { label: "กำลังทำเทิร์น", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "ทำครบแล้ว",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  forfeited: { label: "ถูกริบ (พอร์ตหมด)", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  replaced:  { label: "แทนที่ด้วยโบนัสรอบใหม่", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const PIP_MODE_TH = { distance: "นับระยะราคา", lot_weighted: "ระยะ × lot" } as const;

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (n: number, d = 2) => n.toLocaleString("en-US", { maximumFractionDigits: d });
const dt = (d: string) =>
  new Date(d).toLocaleString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const pnlColor = (n: number) => (n > 0 ? "text-emerald-600" : n < 0 ? "text-red-600" : "text-slate-500");

function Progress({ done, need, unit }: { done: number; need: number; unit: string }) {
  const met = done >= need;
  const pct = need > 0 ? Math.min(100, (done / need) * 100) : 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className={`font-bold ${met ? "text-emerald-700" : "text-amber-700"}`}>{met ? "✅ ผ่าน" : "❌ ยังไม่ครบ"}</span>
        <span className="font-mono">
          <b>{num(done, unit === "pips" ? 1 : 2)}</b> / {num(need, unit === "pips" ? 1 : 2)} {unit}
          {!met && <span className="text-slate-400"> (ขาด {num(need - done, unit === "pips" ? 1 : 2)})</span>}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${met ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={`font-mono ${ok ? "text-emerald-700" : "text-red-600"}`}>{ok ? "✅" : "❌"} {children}</span>;
}

export default function AdminUserTrading({ userId }: { userId: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accountId, setAccountId] = useState("");
  const [status, setStatus] = useState("");
  const [bonusId, setBonusId] = useState("");
  const [page, setPage] = useState(1);

  const query = useCallback((extra: Record<string, string> = {}) => {
    const qs = new URLSearchParams({ page: String(page), ...extra });
    if (accountId) qs.set("accountId", accountId);
    if (status) qs.set("status", status);
    if (bonusId) qs.set("bonusId", bonusId);
    return qs.toString();
  }, [page, accountId, status, bonusId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}?${query()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "โหลดข้อมูลไม่สำเร็จ");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [userId, query]);

  useEffect(() => { load(); }, [load]);

  const [savingStopOut, setSavingStopOut] = useState("");
  const saveStopOut = async (acc: string, level: number) => {
    setSavingStopOut(acc);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: acc, stopOutLevel: level }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "บันทึกไม่สำเร็จ");
      setData((d) => d && { ...d, accounts: d.accounts.map((a) => (a.id === acc ? { ...a, stopOutLevel: level, stopOutIsDefault: false } : a)) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSavingStopOut("");
    }
  };

  if (!data && loading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}</div>;
  }
  if (!data) return <p className="text-sm text-red-600">{error}</p>;

  const live = data.accounts.filter((a) => !a.isDemo);
  const sum = (k: keyof Account) => live.reduce((s, a) => s + (a[k] as number), 0);
  const selectedBonus = data.bonuses.find((b) => b.id === bonusId);

  const showBonusTrades = (id: string) => {
    setBonusId(id);
    setAccountId("");
    setStatus("");
    setPage(1);
    document.getElementById("admin-user-trades")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      {/* ── Summary (live accounts only) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "ยอดคงเหลือ (Live)", value: usd(sum("balance")) },
          { label: "Equity (Live)", value: usd(sum("equity")) },
          { label: "Lot ที่ปิดแล้ว", value: `${num(sum("closedLots"))} lots`, sub: sum("openLots") ? `เปิดอยู่ ${num(sum("openLots"))} lots` : undefined },
          { label: "Pip ที่ปิดแล้ว", value: `${num(sum("pips"), 1)}`, sub: `ระยะ × lot: ${num(sum("lotPips"), 1)}` },
          { label: "กำไร/ขาดทุนสะสม", value: usd(sum("realizedPnl")), color: pnlColor(sum("realizedPnl")) },
          { label: "ฝากสำเร็จ", value: usd(data.funding.deposits), sub: `${data.funding.depositCount} ครั้ง` },
          { label: "ถอนสำเร็จ", value: usd(data.funding.withdrawals), sub: `${data.funding.withdrawalCount} ครั้ง` },
          { label: "ออเดอร์ทั้งหมด", value: `${sum("closedTrades") + sum("openTrades")}`, sub: `ชนะ ${sum("wins")}/${sum("closedTrades")}` },
          { label: "โบนัสที่ได้รับ", value: usd(data.bonuses.reduce((s, b) => s + b.bonusUsd, 0)), sub: `${data.bonuses.length} ครั้ง` },
          { label: "บัญชีเทรด", value: `${live.length} Live`, sub: `${data.accounts.length - live.length} Demo` },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-[#faf8f5] px-3 py-2.5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{c.label}</p>
            <p className={`text-sm font-bold font-mono mt-0.5 ${c.color ?? "text-slate-900"}`}>{c.value}</p>
            {c.sub && <p className="text-[10px] text-slate-400">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Bonus / withdrawal check ── */}
      <section className="rounded-2xl border border-[#e8d4b0] bg-[#fdfbf7] p-4 space-y-4">
        <h3 className="text-sm font-black text-slate-900">🎁 ตรวจเงื่อนไขโบนัสก่อนอนุมัติถอน</h3>

        {data.bonuses.length === 0 ? (
          <p className="text-xs text-slate-500">ผู้ใช้นี้ไม่เคยได้รับโบนัส: ไม่มีเงื่อนไข lot/pip สำหรับการถอน</p>
        ) : (
          <>
            {/* Current verdict per account (what the withdrawal check uses right now) */}
            <div className="grid sm:grid-cols-2 gap-3">
              {data.withdrawCheck.map((w) => (
                <div key={w.accountId} className={`rounded-xl border p-3 bg-white space-y-2 ${w.canWithdraw ? "border-emerald-200" : "border-red-200"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm">#{w.accountNumber}</span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${w.canWithdraw ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {w.canWithdraw ? `✅ ถอนได้ ${usd(w.withdrawableUsd)}` : "⛔ ยังถอนไม่ได้"}
                    </span>
                  </div>
                  {w.active ? (
                    <>
                      <p className="text-[11px] text-amber-700 font-bold">หักโบนัสคงไว้ในบัญชี {usd(w.bonusHeldUsd)}</p>
                      <p className="text-[11px] text-slate-500">
                        โบนัสที่ยังทำไม่ครบรวม {usd(w.active.bonusUsd)} · นับ pip แบบ{PIP_MODE_TH[w.active.pipMode]}
                      </p>
                      <Progress done={w.active.tradedLots} need={w.active.requiredLots} unit="lots" />
                      {w.active.requiredPips > 0
                        ? <Progress done={w.active.tradedPips} need={w.active.requiredPips} unit="pips" />
                        : <p className="text-[11px] text-slate-400">ไม่มีเงื่อนไข pip สำหรับโบนัสนี้</p>}
                    </>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      ทำเงื่อนไขครบแล้ว{w.withdrawLimitUsd != null ? ` · ถอนได้อีกสูงสุด ${usd(w.withdrawLimitUsd)}` : " · ไม่จำกัดยอดถอน"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Every bonus with its own window */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
              <table className="w-full text-xs">
                <thead className="bg-[#faf8f5] text-slate-500">
                  <tr>
                    {["วันที่ได้รับ", "บัญชี", "ยอดฝาก", "โบนัส", "Lot นับได้ / ต้องทำ", "Pip นับได้ / ต้องทำ", "ออเดอร์", "สถานะ", ""].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.bonuses.map((b) => (
                    <tr key={b.id} className={`border-t border-slate-100 ${bonusId === b.id ? "bg-amber-50/60" : ""}`}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {dt(b.createdAt)}
                        {b.endedAt && <p className="text-[10px] text-slate-400">{b.status === "forfeited" ? "ริบ" : b.status === "replaced" ? "แทนที่" : "ครบ"} {dt(b.endedAt)}</p>}
                        {b.status === "active" && b.countFrom && <p className="text-[10px] text-amber-600">เริ่มนับใหม่ {dt(b.countFrom)} (ถอน {b.restarts} ครั้ง)</p>}
                      </td>
                      <td className="px-3 py-2 font-mono font-bold">#{b.accountNumber}</td>
                      <td className="px-3 py-2 font-mono">{usd(b.depositUsd)}</td>
                      <td className="px-3 py-2 font-mono font-bold text-emerald-600">
                        +{usd(b.bonusUsd)}
                        {b.maxWithdrawUsd > 0 && <p className="text-[10px] font-normal text-slate-400">ถอนสูงสุด {usd(b.maxWithdrawUsd)}</p>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Check ok={b.lotsMet}>{num(b.countedLots)} / {num(b.requiredLots)}</Check>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {b.requiredPips > 0 ? (
                          <>
                            <Check ok={b.pipsMet}>{num(b.countedPips, 1)} / {num(b.requiredPips, 1)}</Check>
                            <p className="text-[10px] text-slate-400">{PIP_MODE_TH[b.pipMode]}</p>
                          </>
                        ) : <span className="text-slate-300">ไม่มีเงื่อนไข</span>}
                      </td>
                      <td className="px-3 py-2 font-mono">{b.tradeCount}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${BONUS_STATUS[b.status]?.cls ?? ""}`}>
                          {BONUS_STATUS[b.status]?.label ?? b.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button type="button" onClick={() => showBonusTrades(b.id)} className="text-[11px] font-bold text-[#b89766] hover:underline">
                          ดูออเดอร์ที่นับ →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              นับเฉพาะออเดอร์ที่ <b>เปิดหลังได้รับโบนัส</b> และ <b>ปิดแล้ว</b> (ออเดอร์ที่ยังเปิดอยู่ไม่นับ) ·
              Pip นับระยะที่ราคาวิ่งทั้งออเดอร์กำไรและขาดทุน · ถ้ามีโบนัสค้างหลายก้อนในบัญชีเดียว ระบบถอนจะรวมเงื่อนไขทุกก้อน
              นับจากโบนัสก้อนแรก (ดูที่การ์ดด้านบน)
            </p>
          </>
        )}
      </section>

      {/* ── Per-account ── */}
      <section>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">บัญชีเทรด</h3>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
        {data.accounts.length === 0 ? (
          <p className="text-sm text-slate-400">ยังไม่มีบัญชีเทรด</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-[#faf8f5] text-slate-500">
                <tr>
                  {["บัญชี", "Stop Out", "Balance", "Equity", "Free margin", "Lot ปิดแล้ว", "Lot เปิดอยู่", "Pip (ระยะ)", "Pip × lot", "P&L สะสม"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((a) => (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900">{a.accountNumber}</span>
                      <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${a.isDemo ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
                        {a.isDemo ? "DEMO" : "LIVE"}
                      </span>
                      <p className="text-[10px] text-slate-400">{a.type} · {a.leverage}</p>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <select
                        value={a.stopOutLevel}
                        disabled={savingStopOut === a.id}
                        onChange={(e) => saveStopOut(a.id, Number(e.target.value))}
                        className={`text-xs border rounded-lg px-1.5 py-1 bg-white disabled:opacity-40 ${a.stopOutLevel < 50 ? "border-amber-300 text-amber-700" : "border-slate-200"}`}
                      >
                        {Array.from({ length: 11 }, (_, i) => i * 10).map((v) => (
                          <option key={v} value={v}>{v}%</option>
                        ))}
                      </select>
                      {a.stopOutIsDefault && <p className="text-[9px] text-slate-400 mt-0.5">ค่าเริ่มต้นระบบ</p>}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold">{usd(a.balance)}</td>
                    <td className="px-3 py-2 font-mono">{usd(a.equity)}</td>
                    <td className="px-3 py-2 font-mono">{usd(a.freeMargin)}</td>
                    <td className="px-3 py-2 font-mono">{num(a.closedLots)} <span className="text-slate-400">({a.closedTrades})</span></td>
                    <td className="px-3 py-2 font-mono">{num(a.openLots)} <span className="text-slate-400">({a.openTrades})</span></td>
                    <td className="px-3 py-2 font-mono">{num(a.pips, 1)}</td>
                    <td className="px-3 py-2 font-mono">{num(a.lotPips, 1)}</td>
                    <td className={`px-3 py-2 font-mono font-bold ${pnlColor(a.realizedPnl)}`}>{usd(a.realizedPnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Trade history ── */}
      <section id="admin-user-trades" className="scroll-mt-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-auto">
            ประวัติการเทรด <span className="text-slate-400 normal-case">({data.totalTrades} รายการ)</span>
          </h3>
          <select
            value={accountId}
            disabled={!!bonusId}
            onChange={(e) => { setAccountId(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white disabled:opacity-40"
          >
            <option value="">ทุกบัญชี</option>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.accountNumber}{a.isDemo ? " (Demo)" : ""}</option>
            ))}
          </select>
          <select
            value={status}
            disabled={!!bonusId}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white disabled:opacity-40"
          >
            <option value="">ทุกสถานะ</option>
            <option value="open">เปิดอยู่</option>
            <option value="closed">ปิดแล้ว</option>
          </select>
          <a
            href={`/api/admin/users/${userId}?${query({ format: "csv" })}`}
            className="flex items-center gap-1 text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </a>
          <button type="button" onClick={load} className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50" aria-label="รีเฟรช">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {selectedBonus && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
            <span>
              แสดงเฉพาะออเดอร์ที่นับเข้าโบนัส <b>+{usd(selectedBonus.bonusUsd)}</b> บัญชี #{selectedBonus.accountNumber} (ได้รับ {dt(selectedBonus.createdAt)}) ·
              รวม <b>{num(selectedBonus.countedLots)} lots</b> / <b>{num(selectedBonus.countedPips, 1)} pips</b>
            </span>
            <button type="button" onClick={() => { setBonusId(""); setPage(1); }} className="flex items-center gap-1 font-bold shrink-0">
              <X className="w-3.5 h-3.5" /> ล้าง
            </button>
          </div>
        )}

        <div className={`overflow-x-auto border border-slate-200 rounded-xl ${loading ? "opacity-60" : ""}`}>
          <table className="w-full text-xs">
            <thead className="bg-[#faf8f5] text-slate-500">
              <tr>
                {["เวลาเปิด / ปิด", "บัญชี", "สัญลักษณ์", "ประเภท", "Lot", "ราคาเปิด", "ราคาปิด", "Pips", "Pip × lot", "P&L", "สถานะ", "นับโบนัส"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.trades.length === 0 ? (
                <tr><td colSpan={12} className="px-3 py-8 text-center text-slate-400">ไม่มีรายการเทรด</td></tr>
              ) : data.trades.map((t) => (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">
                    {dt(t.openTime)}
                    {t.closeTime && <p className="text-[10px] text-slate-400">ปิด {dt(t.closeTime)}</p>}
                  </td>
                  <td className="px-3 py-2 font-mono">{t.accountNumber}</td>
                  <td className="px-3 py-2 font-bold whitespace-nowrap">
                    {t.symbol}
                    {t.isCopy && <span className="ml-1 text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-50 text-indigo-600">COPY</span>}
                  </td>
                  <td className={`px-3 py-2 font-bold uppercase ${t.type === "buy" ? "text-emerald-600" : "text-red-600"}`}>{t.type}</td>
                  <td className="px-3 py-2 font-mono font-bold">{t.volume}</td>
                  <td className="px-3 py-2 font-mono">{t.openPrice}</td>
                  <td className="px-3 py-2 font-mono">{t.closePrice ?? "—"}</td>
                  <td className="px-3 py-2 font-mono">{t.pips == null ? "—" : num(t.pips, 1)}</td>
                  <td className="px-3 py-2 font-mono">{t.lotPips == null ? "—" : num(t.lotPips, 1)}</td>
                  <td className={`px-3 py-2 font-mono font-bold ${t.pnl == null ? "text-slate-300" : pnlColor(t.pnl)}`}>
                    {t.pnl == null ? "—" : usd(t.pnl)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {t.status === "open" ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">เปิดอยู่</span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {REASON_TH[t.closeReason ?? ""] ?? "ปิดแล้ว"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {t.bonusIds.length > 0
                      ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">นับ</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.pages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-2 text-xs text-slate-500">
            หน้า {data.page}/{data.pages}
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1 rounded border border-slate-200 disabled:opacity-30">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="p-1 rounded border border-slate-200 disabled:opacity-30">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
