"use client";

import { useState, useEffect, Fragment } from "react";
import { Users, Save, CheckCircle2, RefreshCw, ChevronDown, Check, X } from "lucide-react";

interface Referrer {
  id: string;
  name: string;
  email: string;
  code: string | null;
  percent: number | null; // null = uses the default
  paidUsd: number;
  pendingUsd: number;
  referred: { id: string; name: string; email: string; joinedAt: string; depositsUsd: number }[];
}

interface PendingCommission {
  id: string;
  referrer: { name: string; email: string } | null;
  referred: { name: string; email: string } | null;
  depositUsd: number;
  percent: number;
  amountUsd: number;
  createdAt: string;
}

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c]";
const fmtDate = (d: string) => new Date(d).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });

export function AdminReferralsClient() {
  const [enabled, setEnabled] = useState(false);
  const [defaultPercent, setDefaultPercent] = useState("5");
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [pending, setPending] = useState<PendingCommission[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // per-user override form
  const [overrideEmail, setOverrideEmail] = useState("");
  const [overridePercent, setOverridePercent] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const flash = (ok: boolean, text: string) => {
    setMessage({ ok, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        fetch("/api/admin/settings/referral").then((x) => x.json()),
        fetch("/api/admin/referrals").then((x) => x.json()),
      ]);
      if (s.setting) {
        setEnabled(Boolean(s.setting.enabled));
        setDefaultPercent(String(s.setting.defaultPercent));
      }
      setReferrers(r.referrers ?? []);
      setPending(r.pending ?? []);
    } catch (err) {
      console.error("Failed to load referrals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const patch = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  };

  const saveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const d = await patch("/api/admin/settings/referral", { enabled, defaultPercent: parseFloat(defaultPercent) }).catch(() => null);
    setSaving(false);
    if (d?.success) flash(true, "บันทึกการตั้งค่าสำเร็จ");
    else flash(false, d?.error ?? "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  };

  const setPercent = async (email: string, percent: string | null) => {
    const d = await patch("/api/admin/referrals", { action: "setPercent", email, percent }).catch(() => null);
    if (d?.success) {
      flash(true, percent === null ? `${email} กลับไปใช้ค่ากลาง` : `ตั้ง ${email} = ${percent}% แล้ว`);
      setOverrideEmail("");
      setOverridePercent("");
      load();
    } else flash(false, d?.error ?? "บันทึกไม่สำเร็จ");
  };

  const decide = async (commissionId: string, action: "approve" | "reject") => {
    setBusyId(commissionId);
    const d = await patch("/api/admin/referrals", { action, commissionId }).catch(() => null);
    setBusyId(null);
    if (d?.success) {
      flash(true, action === "approve" ? "จ่ายค่าคอมเข้าบัญชีผู้แนะนำแล้ว" : "ปฏิเสธรายการแล้ว");
      load();
    } else flash(false, d?.error ?? "ทำรายการไม่สำเร็จ");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
            <Users className="w-3.5 h-3.5" />
            <span>ระบบแนะนำเพื่อน (Referral)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">ผู้แนะนำ & ค่าคอมมิชชั่น</h1>
          <p className="text-xs text-slate-500 mt-1">ผู้แนะนำได้ % ของยอดฝากที่อนุมัติแล้วของเพื่อนที่สมัครผ่านลิงก์ ค่าคอมต้องให้แอดมินอนุมัติก่อนจ่าย</p>
        </div>
        <button onClick={load} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
          {message.ok && <CheckCircle2 className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global setting */}
        <form onSubmit={saveSetting} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">ค่ากลาง (ใช้กับทุกคน)</h3>
          <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <span className="font-bold text-slate-900">เปิดใช้ระบบแนะนำเพื่อน</span>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-5 h-5 accent-[#b89766]" />
          </label>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">ผู้แนะนำได้กี่ % ของยอดฝากเพื่อน</label>
            <input type="number" step="0.01" min="0" max="100" required value={defaultPercent} onChange={(e) => setDefaultPercent(e.target.value)} className={inputCls} />
            {parseFloat(defaultPercent) > 0 && (
              <p className="text-[11px] text-slate-500">เพื่อนฝาก $100 → ผู้แนะนำได้ <span className="font-bold text-emerald-600">${(parseFloat(defaultPercent)).toFixed(2)}</span></p>
            )}
          </div>
          <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </form>

        {/* Per-user override */}
        <form onSubmit={(e) => { e.preventDefault(); setPercent(overrideEmail, overridePercent); }} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">ตั้ง % เฉพาะคน (เช่น พาร์ทเนอร์ / IB)</h3>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">อีเมลผู้ใช้</label>
            <input type="email" required value={overrideEmail} onChange={(e) => setOverrideEmail(e.target.value)} placeholder="partner@example.com" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">เปอร์เซ็นต์ของคนนี้</label>
            <input type="number" step="0.01" min="0" max="100" required value={overridePercent} onChange={(e) => setOverridePercent(e.target.value)} placeholder="เช่น 10" className={inputCls} />
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl">บันทึก % เฉพาะคน</button>
          <p className="text-[11px] text-slate-400">ตั้งแล้วแก้/ยกเลิกได้จากตารางผู้แนะนำด้านล่าง</p>
        </form>
      </div>

      {/* Pending commissions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">ค่าคอมรออนุมัติ ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">ไม่มีรายการรออนุมัติ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  {["ผู้แนะนำ", "เพื่อนที่ฝาก", "ยอดฝาก", "%", "ค่าคอม", "วันที่", ""].map((h, i) => <th key={i} className="py-2 pr-4 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pending.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4"><p className="font-bold">{c.referrer?.name}</p><p className="text-slate-400">{c.referrer?.email}</p></td>
                    <td className="py-2 pr-4"><p className="font-bold">{c.referred?.name}</p><p className="text-slate-400">{c.referred?.email}</p></td>
                    <td className="py-2 pr-4 font-mono">${c.depositUsd}</td>
                    <td className="py-2 pr-4 font-mono">{c.percent}%</td>
                    <td className="py-2 pr-4 font-mono font-bold text-emerald-600">${c.amountUsd}</td>
                    <td className="py-2 pr-4 text-slate-400">{fmtDate(c.createdAt)}</td>
                    <td className="py-2 whitespace-nowrap">
                      <button disabled={busyId === c.id} onClick={() => decide(c.id, "approve")} className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg mr-1.5 disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" /> อนุมัติจ่าย
                      </button>
                      <button disabled={busyId === c.id} onClick={() => decide(c.id, "reject")} className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                        <X className="w-3.5 h-3.5" /> ปฏิเสธ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Referrers and who they referred */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">ผู้แนะนำทั้งหมด ({referrers.length})</h3>
        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">กำลังโหลดข้อมูล...</p>
        ) : referrers.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีใครสมัครผ่านลิงก์แนะนำ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  {["ผู้แนะนำ", "รหัส", "%", "แนะนำได้", "ค่าคอมจ่ายแล้ว", "รออนุมัติ", ""].map((h, i) => <th key={i} className="py-2 pr-4 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {referrers.map((r) => (
                  <Fragment key={r.id}>
                    <tr className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                      <td className="py-2 pr-4"><p className="font-bold">{r.name}</p><p className="text-slate-400">{r.email}</p></td>
                      <td className="py-2 pr-4 font-mono">{r.code ?? "—"}</td>
                      <td className="py-2 pr-4 font-mono">
                        {r.percent === null ? <span className="text-slate-400">{defaultPercent}% (ค่ากลาง)</span> : <span className="font-bold text-[#997a49]">{r.percent}%</span>}
                      </td>
                      <td className="py-2 pr-4 font-bold">{r.referred.length} คน</td>
                      <td className="py-2 pr-4 font-mono text-emerald-600">${r.paidUsd.toFixed(2)}</td>
                      <td className="py-2 pr-4 font-mono text-amber-600">${r.pendingUsd.toFixed(2)}</td>
                      <td className="py-2"><ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded === r.id ? "rotate-180" : ""}`} /></td>
                    </tr>
                    {expanded === r.id && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="font-bold text-slate-700">% ของคนนี้:</span>
                            <button onClick={() => { setOverrideEmail(r.email); setOverridePercent(r.percent === null ? "" : String(r.percent)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                              className="px-3 py-1 rounded-lg bg-white border border-slate-200 font-bold hover:border-[#c6a87c]">แก้ไข %</button>
                            {r.percent !== null && (
                              <button onClick={() => setPercent(r.email, null)} className="px-3 py-1 rounded-lg bg-white border border-slate-200 font-bold hover:border-rose-300 text-rose-600">กลับไปใช้ค่ากลาง</button>
                            )}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-slate-400">
                                {["ผู้ที่ถูกแนะนำ", "อีเมล", "สมัครเมื่อ", "ยอดฝากรวม"].map((h) => <th key={h} className="py-1.5 pr-4 font-semibold">{h}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {r.referred.map((u) => (
                                <tr key={u.id} className="border-t border-slate-200/60">
                                  <td className="py-1.5 pr-4 font-bold">{u.name}</td>
                                  <td className="py-1.5 pr-4 text-slate-500">{u.email}</td>
                                  <td className="py-1.5 pr-4 text-slate-500">{fmtDate(u.joinedAt)}</td>
                                  <td className="py-1.5 pr-4 font-mono">${u.depositsUsd.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
