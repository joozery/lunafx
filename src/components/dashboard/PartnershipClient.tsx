"use client";

import { useState, useEffect } from "react";
import { Users, Copy, CheckCircle2, Gift } from "lucide-react";

interface ReferralInfo {
  enabled: boolean;
  code?: string;
  percent?: number;
  friends?: { name: string; joinedAt: string }[];
  commissions?: { id: string; kind?: "deposit" | "bust"; depositUsd: number; percent: number; amountUsd: number; status: "pending" | "paid" | "rejected"; createdAt: string }[];
}

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
          {isth ? `รับ ${info.percent}% ของทุกยอดฝากของเพื่อน` : `Earn ${info.percent}% of every friend's deposit`}
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: isth ? "เพื่อนที่แนะนำ" : "Friends referred", value: `${info.friends?.length ?? 0}` },
          { label: isth ? "ค่าแนะนำที่ได้รับ" : "Commission paid", value: `$${paid.toFixed(2)}` },
          { label: isth ? "รออนุมัติ" : "Pending", value: `$${pending.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-black font-mono text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">{isth ? "เพื่อนที่สมัครผ่านลิงก์ของคุณ" : "Friends who joined"}</h3>
          {(info.friends ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">{isth ? "ยังไม่มีเพื่อนสมัคร" : "No friends yet"}</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-xs">
              {info.friends!.map((f, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span className="font-bold text-slate-800">{f.name}</span>
                  <span className="text-slate-400">{new Date(f.joinedAt).toLocaleDateString(isth ? "th-TH" : "en-GB")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

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
