"use client";

import { useState, useEffect } from "react";
import { Gift, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { calcBonus, requiredLots, DEFAULT_BONUS_SETTING, type BonusSetting } from "@/lib/bonusRules";

interface BonusRow {
  id: string;
  accountNumber: string;
  depositUsd: number;
  bonusUsd: number;
  requiredLots: number;
  tradedLots: number | null; // only for active bonuses
  maxWithdrawUsd: number;
  status: "active" | "completed" | "forfeited";
  createdAt: string;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:    { label: "กำลังทำเทิร์น", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  completed: { label: "ทำเทิร์นครบ",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  forfeited: { label: "ยกเลิก (พอร์ตหมด)", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c]";

export function AdminBonusClient() {
  const [form, setForm] = useState<Record<keyof BonusSetting, string | boolean>>(() => toForm(DEFAULT_BONUS_SETTING));
  const [rows, setRows] = useState<BonusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([
        fetch("/api/admin/settings/bonus").then((r) => r.json()),
        fetch("/api/admin/bonuses").then((r) => r.json()),
      ]);
      if (s.setting) setForm(toForm(s.setting));
      setRows(b.bonuses ?? []);
    } catch (err) {
      console.error("Failed to load bonus setting", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k: keyof BonusSetting, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const preview: BonusSetting = {
    enabled: true,
    minDepositUsd: Number(form.minDepositUsd) || 0,
    bonusType: form.bonusType === "percent" ? "percent" : "fixed",
    bonusValue: Number(form.bonusValue) || 0,
    maxBonusUsd: Number(form.maxBonusUsd) || 0,
    lotsPerBonusUsd: Number(form.lotsPerBonusUsd) || 0,
    maxWithdrawUsd: Number(form.maxWithdrawUsd) || 0,
    firstDepositOnly: Boolean(form.firstDepositOnly),
  };
  const examples = [preview.minDepositUsd, 50, 100, 500].filter((v, i, a) => v > 0 && a.indexOf(v) === i).sort((a, b) => a - b);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/settings/bonus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preview, enabled: Boolean(form.enabled) }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
            <Gift className="w-3.5 h-3.5" />
            <span>ตั้งค่าระบบหลังบ้าน (Admin System Settings)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">โบนัสเงินฝาก & เงื่อนไขการถอน</h1>
          <p className="text-xs text-slate-500 mt-1">
            โบนัสเข้า Balance อัตโนมัติเมื่อยอดฝากได้รับอนุมัติ ลูกค้าถอนไม่ได้จนกว่าจะเทรดครบตามเงื่อนไข
          </p>
        </div>
        <button onClick={load} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดข้อมูล...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5 text-xs">
              <label className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">เปิดใช้โบนัสเงินฝาก</span>
                  <span className="text-slate-500">ปิดไว้ = ไม่มีลูกค้าคนไหนได้โบนัส (โบนัสที่ให้ไปแล้วยังมีเงื่อนไขเหมือนเดิม)</span>
                </div>
                <input type="checkbox" checked={Boolean(form.enabled)} onChange={(e) => set("enabled", e.target.checked)} className="w-5 h-5 accent-[#b89766]" />
              </label>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">1. ยอดฝากขั้นต่ำที่ได้โบนัส (USD)</label>
                <input type="number" step="0.01" min="0" required value={String(form.minDepositUsd)} onChange={(e) => set("minDepositUsd", e.target.value)} className={inputCls} />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">2. จำนวนโบนัส</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["fixed", "percent"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => set("bonusType", t)}
                      className={`p-2.5 rounded-xl border font-bold ${form.bonusType === t ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                      {t === "fixed" ? "จำนวนคงที่ (USD)" : "เปอร์เซ็นต์ของยอดฝาก (%)"}
                    </button>
                  ))}
                </div>
                <input type="number" step="0.01" min="0" required value={String(form.bonusValue)} onChange={(e) => set("bonusValue", e.target.value)} className={inputCls}
                  placeholder={form.bonusType === "percent" ? "เช่น 100 = โบนัส 100%" : "เช่น 30 = โบนัส $30"} />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">3. โบนัสสูงสุดต่อการฝาก (USD) — ใส่ 0 = ไม่จำกัด</label>
                <input type="number" step="0.01" min="0" required value={String(form.maxBonusUsd)} onChange={(e) => set("maxBonusUsd", e.target.value)} className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">4. เงื่อนไขทำยอด: ต้องเทรดกี่ lots ต่อโบนัส $1</label>
                <input type="number" step="0.001" min="0" required value={String(form.lotsPerBonusUsd)} onChange={(e) => set("lotsPerBonusUsd", e.target.value)} className={inputCls} />
                <p className="text-[11px] text-slate-400">นับจากออเดอร์ที่ปิดแล้วหลังได้รับโบนัส ระหว่างนี้ลูกค้าถอนเงินไม่ได้เลย</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">5. ถอนได้สูงสุดหลังทำยอดครบ (USD) — ใส่ 0 = ไม่จำกัด</label>
                <input type="number" step="0.01" min="0" required value={String(form.maxWithdrawUsd)} onChange={(e) => set("maxWithdrawUsd", e.target.value)} className={inputCls} />
                <p className="text-[11px] text-slate-400">ยอดที่ลูกค้าฝากเพิ่มภายหลังจะถอนได้เพิ่มตามจำนวนนั้น</p>
              </div>

              <label className="flex items-center gap-2 font-bold text-slate-700">
                <input type="checkbox" checked={Boolean(form.firstDepositOnly)} onChange={(e) => set("firstDepositOnly", e.target.checked)} className="w-4 h-4 accent-[#b89766]" />
                ให้โบนัสเฉพาะการฝากครั้งแรกของแต่ละบัญชี
              </label>

              {error && <div className="p-3 rounded-xl bg-rose-50 text-rose-600 font-bold">{error}</div>}
              {success && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกการตั้งค่าโบนัสสำเร็จแล้ว!</span>
                </div>
              )}

              <button type="submit" disabled={saving}
                className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                <span>{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่าโบนัส"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Live preview of what customers get */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl space-y-4 self-start">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-[#e6cda3] font-mono">ตัวอย่างที่ลูกค้าได้</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${form.enabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-700 text-slate-300 border-slate-600"}`}>
              {form.enabled ? "เปิดใช้งาน" : "ปิดอยู่"}
            </span>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {examples.map((dep) => {
              const bonus = calcBonus(preview, dep);
              return (
                <div key={dep} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">ฝาก</span><span className="font-bold">${dep}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">โบนัส</span><span className="font-bold text-emerald-400">+${bonus}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">ยอดเทรดได้</span><span className="font-bold text-amber-400">${(dep + bonus).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">ต้องเทรดก่อนถอน</span><span className="font-bold">{requiredLots(preview, bonus)} lots</span></div>
                </div>
              );
            })}
            {preview.maxWithdrawUsd > 0 && <p className="text-[11px] text-slate-400">ทำยอดครบแล้วถอนได้สูงสุด ${preview.maxWithdrawUsd}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">โบนัสที่ให้ไปแล้ว (ล่าสุด 100 รายการ)</h3>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีลูกค้าได้รับโบนัส</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  {["บัญชี", "ยอดฝาก", "โบนัส", "เทรดแล้ว / ต้องเทรด", "ถอนสูงสุด", "สถานะ", "วันที่"].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4 font-mono font-bold">#{r.accountNumber}</td>
                    <td className="py-2 pr-4 font-mono">${r.depositUsd}</td>
                    <td className="py-2 pr-4 font-mono text-emerald-600 font-bold">+${r.bonusUsd}</td>
                    <td className="py-2 pr-4 font-mono">
                      {r.tradedLots !== null ? <><span className="font-bold text-amber-600">{r.tradedLots}</span> / {r.requiredLots} lots</> : `${r.requiredLots} lots`}
                    </td>
                    <td className="py-2 pr-4 font-mono">{r.maxWithdrawUsd > 0 ? `$${r.maxWithdrawUsd}` : "ไม่จำกัด"}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_LABEL[r.status]?.cls ?? ""}`}>{STATUS_LABEL[r.status]?.label ?? r.status}</span>
                    </td>
                    <td className="py-2 pr-4 text-slate-400">{new Date(r.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function toForm(s: BonusSetting): Record<keyof BonusSetting, string | boolean> {
  return {
    enabled: s.enabled,
    minDepositUsd: String(s.minDepositUsd),
    bonusType: s.bonusType,
    bonusValue: String(s.bonusValue),
    maxBonusUsd: String(s.maxBonusUsd),
    lotsPerBonusUsd: String(s.lotsPerBonusUsd),
    maxWithdrawUsd: String(s.maxWithdrawUsd),
    firstDepositOnly: s.firstDepositOnly,
  };
}
