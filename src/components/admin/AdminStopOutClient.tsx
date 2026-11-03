"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";

const OPTIONS = Array.from({ length: 11 }, (_, i) => i * 10);

type Info = { level: number; liveAccounts: number; customAccounts: number };

export function AdminStopOutClient() {
  const [info, setInfo] = useState<Info | null>(null);
  const [level, setLevel] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/stop-out")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error);
        setInfo(d);
        setLevel(d.level);
      })
      .catch(() => setMessage({ ok: false, text: "โหลดการตั้งค่าไม่สำเร็จ" }));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const d = await fetch("/api/admin/settings/stop-out", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      }).then((r) => r.json());
      if (!d.success) throw new Error(d.error ?? "บันทึกไม่สำเร็จ");
      setInfo((i) => i && { ...i, level });
      setMessage({ ok: true, text: `บันทึกแล้ว: ค่าเริ่มต้น Stop Out = ${level}% (มีผลภายในไม่กี่วินาที)` });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  };

  const usingDefault = info ? info.liveAccounts - info.customAccounts : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Risk</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-2">ตั้งค่า Stop Out เริ่มต้น</h1>
        <p className="text-xs text-slate-500 mt-1">
          ระบบปิดออเดอร์อัตโนมัติเมื่อ Margin Level (ทุน ÷ มาร์จิ้นที่ใช้ × 100) ต่ำกว่าค่านี้
          ใช้กับทุกบัญชีที่ลูกค้าหรือแอดมินยังไม่ได้ตั้งค่าเอง
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
          {message.ok && <CheckCircle2 className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="stop-out-default" className="font-bold text-slate-900 text-sm">ค่าเริ่มต้น</label>
          <select
            id="stop-out-default"
            value={level}
            disabled={!info || saving}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-mono text-sm focus:outline-none focus:border-[#c6a87c] disabled:opacity-40"
          >
            {OPTIONS.map((v) => <option key={v} value={v}>{v}%</option>)}
          </select>
          <button
            onClick={save}
            disabled={!info || saving || level === info.level}
            className="bg-[#b89766] hover:bg-[#a6875a] text-white font-bold px-4 py-2 rounded-xl disabled:opacity-40"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>

        {level < 50 && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed">
            ต่ำกว่า 50%: ออเดอร์จะถูกปล่อยจนทุนเหลือน้อยมาก{level === 0 ? " (0% = ปิดเมื่อทุนหมด)" : ""}
            ถ้าราคากระชาก ยอดอาจติดลบ ระบบจะรีเซ็ตเป็น 0 และโบรกเกอร์รับส่วนที่ขาดทุนเกินเอง
          </p>
        )}

        {info && (
          <ul className="text-slate-600 space-y-1 border-t border-slate-100 pt-4">
            <li>บัญชีจริงทั้งหมด: <b className="font-mono">{info.liveAccounts}</b></li>
            <li>ใช้ค่าเริ่มต้นนี้: <b className="font-mono">{usingDefault}</b> บัญชี</li>
            <li>ตั้งค่าของตัวเองไว้ (ไม่ถูกเปลี่ยน): <b className="font-mono">{info.customAccounts}</b> บัญชี — แก้รายบัญชีได้ที่หน้าสมาชิก</li>
          </ul>
        )}
      </div>
    </div>
  );
}
