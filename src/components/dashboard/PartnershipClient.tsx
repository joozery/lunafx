"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Copy, CheckCircle2, Gift, ArrowUpFromLine } from "lucide-react";

interface ReferralInfo {
  enabled: boolean;
  code?: string;
  percent?: number;
  bustPercent?: number;
  withdrawableUsd?: number;
  hasLiveAccount?: boolean;
  friends?: Friend[];
  commissions?: { id: string; kind?: "deposit" | "bust"; depositUsd: number; percent: number; amountUsd: number; status: "pending" | "paid" | "rejected"; createdAt: string }[];
}

interface Friend {
  name: string;
  joinedAt: string;
  depositsUsd?: number;
  withdrawalsUsd?: number;
  balanceUsd?: number;
  lostUsd?: number;
  profitUsd?: number;
  commissionPaidUsd?: number;
  commissionPendingUsd?: number;
}

const money = (n: number | undefined) => `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS: Record<string, { th: string; en: string; cls: string }> = {
  pending:  { th: "รออนุมัติ", en: "Pending",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paid:     { th: "จ่ายแล้ว",  en: "Paid",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { th: "ไม่อนุมัติ", en: "Rejected", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

export function PartnershipClient({ lang }: { lang: string }) {
  const isth = lang === "th";
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/referral").then((r) => r.json()).then(setInfo).catch(() => setInfo({ enabled: false }));
  }, []);

  if (!info) return <div className="max-w-5xl mx-auto py-16 text-center text-xs text-slate-400">{isth ? "กำลังโหลด..." : "Loading..."}</div>;

  if (!info.enabled) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <Gift className="w-10 h-10 text-[#c6a87c] mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">{isth ? "ระบบแนะนำเพื่อนยังไม่เปิดให้บริการ" : "The referral program is not available yet"}</h2>
      </div>
    );
  }

  const link = `${origin}/${lang}/open-account?ref=${info.code}`;
  const paid = (info.commissions ?? []).filter((c) => c.status === "paid").reduce((s, c) => s + c.amountUsd, 0);
  const pending = (info.commissions ?? []).filter((c) => c.status === "pending").reduce((s, c) => s + c.amountUsd, 0);
  const friends = info.friends ?? [];
  const totalLost = friends.reduce((s, f) => s + (f.lostUsd ?? 0), 0);
  const totalDeposits = friends.reduce((s, f) => s + (f.depositsUsd ?? 0), 0);
  const earnings = [
    (info.percent ?? 0) > 0 ? (isth ? `${info.percent}% ของทุกยอดฝากของเพื่อน` : `${info.percent}% of every friend's deposit`) : "",
    (info.bustPercent ?? 0) > 0 ? (isth ? `${info.bustPercent}% ของยอดฝากสุทธิเมื่อพอร์ตเพื่อนแตก` : `${info.bustPercent}% of net deposits when a friend's account is wiped out`) : "",
  ].filter(Boolean);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-[#e6cda3] border border-[#c6a87c]/40">
          <Users className="w-3.5 h-3.5" />
          <span>{isth ? "แนะนำเพื่อน" : "Refer a Friend"}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mt-3">
          {earnings.length > 0 ? `${isth ? "รับ" : "Earn"} ${earnings.join(isth ? " และ " : " and ")}` : (isth ? "แนะนำเพื่อนมาเทรดกับเรา" : "Invite friends to trade with us")}
        </h1>
        <p className="text-slate-300 text-sm mt-2">
          {isth ? "ส่งลิงก์ด้านล่างให้เพื่อน เมื่อเพื่อนสมัครและฝากเงิน คุณจะได้ค่าแนะนำเข้าบัญชีเทรดหลังทีมงานตรวจสอบ" : "Share your link. When friends sign up and deposit, you earn a commission once our team approves it."}
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{isth ? "ลิงก์แนะนำของคุณ" : "Your referral link"}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm text-slate-900 break-all">{link}</div>
          <button onClick={copy} className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold ${copied ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
            {copied ? <><CheckCircle2 className="w-4 h-4" /> {isth ? "คัดลอกแล้ว" : "Copied"}</> : <><Copy className="w-4 h-4" /> {isth ? "คัดลอกลิงก์" : "Copy link"}</>}
          </button>
        </div>
        <p className="text-xs text-slate-500">{isth ? "รหัสผู้แนะนำ:" : "Referral code:"} <span className="font-mono font-black text-slate-900">{info.code}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: isth ? "เพื่อนที่แนะนำ" : "Friends referred", value: `${friends.length}`, sub: isth ? `ฝากรวม ${money(totalDeposits)}` : `Deposited ${money(totalDeposits)}` },
          { label: isth ? "เพื่อนเสียรวม" : "Friends' total loss", value: money(totalLost), cls: totalLost > 0 ? "text-rose-600" : "" },
          { label: isth ? "ค่าแนะนำที่ได้รับ" : "Commission paid", value: money(paid), cls: "text-emerald-600" },
          { label: isth ? "รออนุมัติ" : "Pending", value: money(pending), cls: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-black font-mono mt-1 ${s.cls || "text-slate-900"}`}>{s.value}</p>
            {s.sub && <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* What can be withdrawn now */}
      <div className="bg-[#fdfbf7] border border-[#e8d5b7] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] font-bold text-[#997a49] uppercase tracking-wider">{isth ? "ถอนได้ตอนนี้" : "Available to withdraw"}</p>
          <p className="text-2xl font-black font-mono text-slate-900">{money(info.withdrawableUsd)}</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {info.hasLiveAccount
              ? (isth
                  ? "ค่าแนะนำที่อนุมัติแล้วเข้าบัญชีเทรดจริงของคุณเป็นเงินปกติ ถอนได้ทุกเมื่อ (ยอดนี้รวมเงินทั้งหมดในบัญชีจริง ยกเว้นโบนัสที่ยังทำเงื่อนไขไม่ครบ)"
                  : "Approved commission is paid into your live account as ordinary balance and can be withdrawn any time (this is your whole live balance, minus any bonus still owing turnover)")
              : (isth ? "เปิดบัญชีเทรดจริงก่อน เพื่อรับค่าแนะนำเข้าบัญชีและถอนได้" : "Open a live trading account to receive and withdraw commission")}
          </p>
        </div>
        {info.hasLiveAccount && (
          <Link href={`/${lang}/dashboard/funds/transfer`} className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shrink-0">
            <ArrowUpFromLine className="w-4 h-4" /> {isth ? "ถอนเงิน" : "Withdraw"}
          </Link>
        )}
      </div>

      {/* Per-friend breakdown */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">{isth ? "รายละเอียดเพื่อนแต่ละคน" : "Friends in detail"}</h3>
        {friends.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">{isth ? "ยังไม่มีเพื่อนสมัคร" : "No friends yet"}</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  {(isth
                    ? ["เพื่อน", "ฝากรวม", "ถอนรวม", "ยอดคงเหลือ", "เสียไป / กำไร", "ค่าคอมที่ได้"]
                    : ["Friend", "Deposits", "Withdrawals", "Balance", "Loss / profit", "Commission"]
                  ).map((h, i) => <th key={h} className={`py-2 pr-3 font-semibold ${i > 0 ? "text-right" : ""}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {friends.map((f, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 pr-3">
                      <p className="font-bold text-slate-800">{f.name}</p>
                      <p className="text-[10px] text-slate-400">{isth ? "สมัคร" : "Joined"} {new Date(f.joinedAt).toLocaleDateString(isth ? "th-TH" : "en-GB")}</p>
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">{money(f.depositsUsd)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{money(f.withdrawalsUsd)}</td>
                    <td className="py-2 pr-3 text-right font-mono">{money(f.balanceUsd)}</td>
                    <td className={`py-2 pr-3 text-right font-mono font-bold ${(f.lostUsd ?? 0) > 0 ? "text-rose-600" : (f.profitUsd ?? 0) > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {(f.lostUsd ?? 0) > 0 ? `−${money(f.lostUsd)}` : (f.profitUsd ?? 0) > 0 ? `+${money(f.profitUsd)}` : money(0)}
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <p className="font-mono font-black text-emerald-600">{money(f.commissionPaidUsd)}</p>
                      {(f.commissionPendingUsd ?? 0) > 0 && <p className="text-[10px] text-amber-600">{isth ? "รอ" : "pending"} {money(f.commissionPendingUsd)}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {isth
            ? "เสียไป = ยอดฝาก − ยอดถอน − ยอดคงเหลือในบัญชีจริงของเพื่อน (ยอดคงเหลือรวมโบนัสที่เพื่อนได้รับ)"
            : "Loss = deposits − withdrawals − current live balance (the balance includes any bonus the friend received)"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">{isth ? "ประวัติค่าแนะนำ" : "Commission history"}</h3>
          {(info.commissions ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">{isth ? "ยังไม่มีค่าแนะนำ" : "No commissions yet"}</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {info.commissions!.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 gap-2">
                  <span className="text-slate-500">{c.kind === "bust" ? (isth ? "พอร์ตเพื่อนแตก · ยอดฝาก" : "Friend wiped out · deposits") : (isth ? "เพื่อนฝาก" : "Deposit")} ${c.depositUsd} × {c.percent}%</span>
                  <span className="font-mono font-black text-emerald-600">+${c.amountUsd}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS[c.status]?.cls}`}>{isth ? STATUS[c.status]?.th : STATUS[c.status]?.en}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
