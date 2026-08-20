"use client";

import { useState, useEffect } from "react";
import { Building2, Save, CheckCircle2, RefreshCw, KeyRound, Lock, ShieldCheck } from "lucide-react";

export const THAI_BANKS = [
  { code: "KBANK", name: "ธนาคารกสิกรไทย", nameEn: "Kasikorn Bank", color: "#138f2d", bg: "bg-[#138f2d]", short: "KBANK", logo: "/logobank/kbank.svg" },
  { code: "SCB", name: "ธนาคารไทยพาณิชย์", nameEn: "Siam Commercial Bank", color: "#4e2e80", bg: "bg-[#4e2e80]", short: "SCB", logo: "/logobank/scb.svg" },
  { code: "BBL", name: "ธนาคารกรุงเทพ", nameEn: "Bangkok Bank", color: "#1e3a8a", bg: "bg-[#1e3a8a]", short: "BBL", logo: "/logobank/bbl.svg" },
  { code: "KTB", name: "ธนาคารกรุงไทย", nameEn: "Krungthai Bank", color: "#00a3e0", bg: "bg-[#00a3e0]", short: "KTB", logo: "/logobank/ktb.svg" },
  { code: "BAY", name: "ธนาคารกรุงศรีอยุธยา", nameEn: "Bank of Ayudhya", color: "#7d6310", bg: "bg-[#7d6310]", short: "BAY", logo: "/logobank/bay.svg" },
  { code: "TTB", name: "ธนาคารทหารไทยธนชาต", nameEn: "TMBThanachart Bank", color: "#002d62", bg: "bg-[#002d62]", short: "TTB", logo: "/logobank/ttb.svg" },
  { code: "GSB", name: "ธนาคารออมสิน", nameEn: "Government Savings Bank", color: "#eb1985", bg: "bg-[#eb1985]", short: "GSB", logo: "/logobank/gsb.svg" },
  { code: "CIMB", name: "ธนาคารซีไอเอ็มบี ไทย", nameEn: "CIMB Thai Bank", color: "#7e1518", bg: "bg-[#7e1518]", short: "CIMB", logo: "/logobank/cimb.svg" },
  { code: "UOB", name: "ธนาคารยูโอบี", nameEn: "UOB Thailand", color: "#0b2545", bg: "bg-[#0b2545]", short: "UOB", logo: "/logobank/uob.svg" },
  { code: "KKP", name: "ธนาคารเกียรตินาคินภัทร", nameEn: "Kiatnakin Phatra Bank", color: "#6559a4", bg: "bg-[#6559a4]", short: "KKP", logo: "/logobank/kk.svg" },
  { code: "LHB", name: "ธนาคารแลนด์ แอนด์ เฮ้าส์", nameEn: "LH Bank", color: "#6d6e71", bg: "bg-[#6d6e71]", short: "LHB", logo: "/logobank/lhb.svg" },
  { code: "TISCO", name: "ธนาคารทิสโก้", nameEn: "TISCO Bank", color: "#0054a6", bg: "bg-[#0054a6]", short: "TISCO", logo: "/logobank/tisco.svg" },
  { code: "BAAC", name: "ธนาคาร ธ.ก.ส.", nameEn: "BAAC", color: "#006837", bg: "bg-[#006837]", short: "BAAC", logo: "/logobank/baac.svg" },
  { code: "PROMPTPAY", name: "พร้อมเพย์ (PromptPay QR)", nameEn: "PromptPay QR", color: "#003d6b", bg: "bg-[#003d6b]", short: "PromptPay", logo: "/logobank/sample.png" },
];

export function AdminDepositBankClient() {
  const [bankCode, setBankCode] = useState("KBANK");
  const [bankName, setBankName] = useState("ธนาคารกสิกรไทย (KBank)");
  const [bankNameEn, setBankNameEn] = useState("Kasikorn Bank (KBank)");
  const [accountNumber, setAccountNumber] = useState("098-1-23456-7");
  const [accountName, setAccountName] = useState("บริษัท ลูนา ฟอเร็กซ์ จำกัด (Luna Forex Co., Ltd.)");
  const [promptpayQr, setPromptpayQr] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // PIN Management State
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState("");

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/deposit-bank");
      const data = await res.json();
      if (data.setting) {
        setBankCode(data.setting.bankCode || "KBANK");
        setBankName(data.setting.bankName || "ธนาคารกสิกรไทย (KBank)");
        setBankNameEn(data.setting.bankNameEn || "Kasikorn Bank (KBank)");
        setAccountNumber(data.setting.accountNumber || "");
        setAccountName(data.setting.accountName || "");
        setPromptpayQr(data.setting.promptpayQr || "");
      }
    } catch (err) {
      console.error("Failed to load setting", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBankSelect = (code: string) => {
    setBankCode(code);
    const selected = THAI_BANKS.find((b) => b.code === code);
    if (selected) {
      setBankName(`${selected.name} (${selected.short})`);
      setBankNameEn(`${selected.nameEn} (${selected.short})`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings/deposit-bank", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankCode,
          bankName,
          bankNameEn,
          accountNumber,
          accountName,
          promptpayQr,
        }),
      });

      const data = await res.json();
      if (data.success || data.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPin(true);
    setPinError("");
    setPinSuccess(false);

    try {
      const res = await fetch("/api/admin/settings/pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPin, confirmPin }),
      });

      const data = await res.json();
      if (data.success) {
        setPinSuccess(true);
        setNewPin("");
        setConfirmPin("");
        setTimeout(() => setPinSuccess(false), 3000);
      } else {
        setPinError(data.error || "เกิดข้อผิดพลาดในการอัปเดตรหัส PIN");
      }
    } catch (err) {
      setPinError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSavingPin(false);
    }
  };

  const currentBankObj = THAI_BANKS.find((b) => b.code === bankCode) || THAI_BANKS[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
            <Building2 className="w-3.5 h-3.5" />
            <span>ตั้งค่าระบบหลังบ้าน (Admin System Settings)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            ตั้งค่าบัญชีธนาคาร & รหัส PIN ความปลอดภัย
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดเลขบัญชีธนาคารสำหรับรับเงิน และจัดการรหัส PIN 6 หลักสำหรับเข้าสู่ระบบแอดมิน
          </p>
        </div>

        <button
          onClick={fetchSetting}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* FORM SETTINGS */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดข้อมูล...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5 text-xs font-sans">
              
              {/* Select Thai Bank */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  1. เลือกธนาคารผู้รับฝากเงิน
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {THAI_BANKS.map((b) => {
                    const isSelected = bankCode === b.code;
                    return (
                      <button
                        type="button"
                        key={b.code}
                        onClick={() => handleBankSelect(b.code)}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? "border-slate-900 bg-slate-900 text-white shadow-md"
                            : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className="w-8 h-8 rounded-xl p-1.5 flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: b.color }}
                          >
                            <img src={b.logo} alt={b.name} className="w-full h-full object-contain brightness-0 invert" />
                          </div>
                          <span className="font-mono text-[10px] font-bold opacity-80">{b.short}</span>
                        </div>
                        <span className="font-bold text-[11px] leading-tight block truncate">
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bank Name TH */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">ชื่อธนาคาร (ภาษาไทย)</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">เลขที่บัญชีธนาคาร (Account Number)</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="เช่น 098-1-23456-7"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              {/* Account Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">ชื่อบัญชีผู้รับเงิน (Account Name)</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="เช่น บริษัท ลูนา ฟอเร็กซ์ จำกัด"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              {/* PromptPay QR Code Image URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  รูปภาพ QR Code พร้อมเพย์ (PromptPay QR Image URL - Option)
                </label>
                <input
                  type="text"
                  value={promptpayQr}
                  onChange={(e) => setPromptpayQr(e.target.value)}
                  placeholder="https://example.com/qr-promptpay.png"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกข้อมูลบัญชีธนาคารสำเร็จแล้ว!</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-3.5 rounded-xl text-xs transition-all shadow-md shadow-[#c6a87c]/20 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่าธนาคาร"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW & CHANGE ADMIN PIN CARD */}
        <div className="space-y-6">
          
          {/* LIVE PREVIEW CARD */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-[#e6cda3] font-mono">LIVE PREVIEW</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                หน้าสมาชิก
              </span>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl p-2 flex items-center justify-center shadow-lg shrink-0 ring-2 ring-white/20"
                  style={{ backgroundColor: currentBankObj.color }}
                >
                  <img src={currentBankObj.logo} alt={currentBankObj.name} className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{bankName}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Official Deposit Account</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/60 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">เลขบัญชี:</span>
                  <span className="font-extrabold text-amber-400">{accountNumber || "xxx-x-xxxxx-x"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">ชื่อบัญชี:</span>
                  <span className="font-bold text-white text-[11px] truncate max-w-[140px]">{accountName || "Luna Forex Co., Ltd."}</span>
                </div>
              </div>
            </div>

            {promptpayQr && (
              <div className="bg-white rounded-xl p-3 text-center space-y-2">
                <span className="text-[11px] font-bold text-slate-800 block">QR Code พร้อมเพย์</span>
                <div className="w-32 h-32 mx-auto bg-slate-100 rounded-lg overflow-hidden border border-slate-200 p-1">
                  <img src={promptpayQr} alt="QR Code" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* ADMIN SECURITY PIN CHANGE CARD */}
          <div className="bg-white border border-[#e8d5b7] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-xl bg-[#fdfbf7] border border-[#e8d5b7] flex items-center justify-center text-[#b89766]">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">เปลี่ยนรหัส PIN 6 หลัก</h3>
                <p className="text-[11px] text-slate-400 font-mono">Security 2FA PIN</p>
              </div>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">รหัส PIN ใหม่ (6 หลัก)</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="ตัวเลข 6 หลัก"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-center font-bold text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">ยืนยันรหัส PIN ใหม่</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="ตัวเลข 6 หลัก"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-center font-bold text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-[11px]">
                  {pinError}
                </div>
              )}

              {pinSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บันทึกรหัส PIN ใหม่สำเร็จแล้ว!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingPin}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-2xs"
              >
                {savingPin ? "กำลังบันทึก..." : "อัปเดตรหัส PIN แอดมิน"}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
