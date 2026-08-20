"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Upload, CheckCircle2, Clock, AlertCircle, Copy, Building2,
  ChevronDown, X, ImageIcon, History, ArrowDownToLine, RefreshCw, QrCode,
} from "lucide-react";

interface TradingAccount {
  id: string;
  accountNumber: string;
  type: string;
  platform: string;
  currency: string;
  balance: number;
  isDemo: boolean;
}

interface RecentTxn {
  _id: string;
  transactionId: string;
  amountThb: number;
  amount: number;
  status: string;
  createdAt: string;
  accountNumber: string;
}

interface BankSetting {
  bankCode: string;
  bankName: string;
  bankNameEn: string;
  accountNumber: string;
  accountName: string;
  promptpayQr?: string;
}

const THAI_BANKS: Record<string, { name: string; nameEn: string; color: string; short: string; logo: string }> = {
  KBANK: { name: "ธนาคารกสิกรไทย", nameEn: "Kasikorn Bank", color: "#138f2d", short: "KBANK", logo: "/logobank/kbank.svg" },
  SCB: { name: "ธนาคารไทยพาณิชย์", nameEn: "Siam Commercial Bank", color: "#4e2e80", short: "SCB", logo: "/logobank/scb.svg" },
  BBL: { name: "ธนาคารกรุงเทพ", nameEn: "Bangkok Bank", color: "#1e3a8a", short: "BBL", logo: "/logobank/bbl.svg" },
  KTB: { name: "ธนาคารกรุงไทย", nameEn: "Krungthai Bank", color: "#00a3e0", short: "KTB", logo: "/logobank/ktb.svg" },
  BAY: { name: "ธนาคารกรุงศรีอยุธยา", nameEn: "Bank of Ayudhya", color: "#7d6310", short: "BAY", logo: "/logobank/bay.svg" },
  TTB: { name: "ธนาคารทหารไทยธนชาต", nameEn: "TMBThanachart Bank", color: "#002d62", short: "TTB", logo: "/logobank/ttb.svg" },
  GSB: { name: "ธนาคารออมสิน", nameEn: "Government Savings Bank", color: "#eb1985", short: "GSB", logo: "/logobank/gsb.svg" },
  CIMB: { name: "ธนาคารซีไอเอ็มบี ไทย", nameEn: "CIMB Thai Bank", color: "#7e1518", short: "CIMB", logo: "/logobank/cimb.svg" },
  UOB: { name: "ธนาคารยูโอบี", nameEn: "UOB Thailand", color: "#0b2545", short: "UOB", logo: "/logobank/uob.svg" },
  KKP: { name: "ธนาคารเกียรตินาคินภัทร", nameEn: "Kiatnakin Phatra Bank", color: "#6559a4", short: "KKP", logo: "/logobank/kk.svg" },
  LHB: { name: "ธนาคารแลนด์ แอนด์ เฮ้าส์", nameEn: "LH Bank", color: "#6d6e71", short: "LHB", logo: "/logobank/lhb.svg" },
  TISCO: { name: "ธนาคารทิสโก้", nameEn: "TISCO Bank", color: "#0054a6", short: "TISCO", logo: "/logobank/tisco.svg" },
  BAAC: { name: "ธนาคาร ธ.ก.ส.", nameEn: "BAAC", color: "#006837", short: "BAAC", logo: "/logobank/baac.svg" },
  PROMPTPAY: { name: "พร้อมเพย์ QR", nameEn: "PromptPay QR", color: "#003d6b", short: "PromptPay", logo: "/logobank/sample.png" },
};

const DEFAULT_BANK: BankSetting = {
  bankCode: "KBANK",
  bankName: "ธนาคารกสิกรไทย (KBank)",
  bankNameEn: "Kasikorn Bank (KBank)",
  accountNumber: "098-1-23456-7",
  accountName: "บริษัท ลูนา ฟอเร็กซ์ จำกัด (Luna Forex Co., Ltd.)",
  promptpayQr: "",
};

const THB_RATE = 35; // 1 USD = 35 THB

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    pending:   { cls: "bg-amber-50 text-amber-700 border border-amber-200",   label: "รอตรวจสอบ" },
    completed: { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "อนุมัติแล้ว" },
    failed:    { cls: "bg-red-50 text-red-700 border border-red-200",         label: "ไม่อนุมัติ" },
  };
  const s = map[status] ?? { cls: "bg-slate-100 text-slate-600 border border-slate-200", label: status };
  return <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

export function FundsClient({ lang }: { lang: string }) {
  const isth = lang === "th";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [recentTxns, setRecentTxns] = useState<RecentTxn[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [bankSetting, setBankSetting] = useState<BankSetting>(DEFAULT_BANK);

  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [showAccountDrop, setShowAccountDrop] = useState(false);
  const [amountThb, setAmountThb] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const amountUsd = amountThb ? (parseFloat(amountThb) / THB_RATE).toFixed(2) : "0.00";

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const live = (d.accounts ?? []).filter((a: TradingAccount) => !a.isDemo);
        setAccounts(live);
        if (live.length === 1) setSelectedAccount(live[0]);
      })
      .finally(() => setLoadingAccounts(false));

    fetch("/api/transactions")
      .then((r) => r.json())
      .then((d) => setRecentTxns((d.transactions ?? []).slice(0, 5)))
      .catch(() => {});

    fetch("/api/settings/deposit-bank")
      .then((r) => r.json())
      .then((d) => {
        if (d.setting) setBankSetting(d.setting);
      })
      .catch(() => {});
  }, []);

  const handleSlipChange = (file: File) => {
    setSlip(file);
    const url = URL.createObjectURL(file);
    setSlipPreview(url);
  };

  const copyAccount = async () => {
    await navigator.clipboard.writeText(bankSetting.accountNumber.replace(/-/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedAccount) { setError("กรุณาเลือกบัญชีเทรดที่ต้องการฝากเงิน"); return; }
    if (!amountThb || parseFloat(amountThb) < 500) { setError("ยอดฝากขั้นต่ำ 500 บาท"); return; }
    if (!slip) { setError("กรุณาแนบสลิปโอนเงิน"); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("slip", slip);
      fd.append("amountThb", amountThb);
      fd.append("amountUsd", amountUsd);
      fd.append("accountNumber", selectedAccount.accountNumber);

      const res = await fetch("/api/deposit", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) {
        setSuccess(data.transactionId);
        setAmountThb("");
        setSlip(null);
        setSlipPreview(null);
      } else {
        setError(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  const currentBankObj = THAI_BANKS[bankSetting.bankCode] || {
    name: bankSetting.bankName,
    nameEn: bankSetting.bankNameEn,
    color: "#138f2d",
    short: bankSetting.bankCode,
  };

  /* ── SUCCESS STATE ── */
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-5">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{isth ? "ส่งสลิปสำเร็จ!" : "Slip Submitted!"}</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            {isth
              ? "ระบบได้รับหลักฐานการโอนเงินเรียบร้อยแล้ว ทีมงานจะอนุมัติยอดเข้าบัญชีเทรดโดยเร็วที่สุด"
              : "Payment proof received. Funds will be credited to your trading account after verification."}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono font-bold text-slate-700">
          Ref ID: {success}
        </div>
        <button
          onClick={() => setSuccess(null)}
          className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all"
        >
          {isth ? "ทอดทำรายการใหม่" : "Make Another Deposit"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      
      {/* PAGE HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#c6a87c]/20 via-[#e6cda3]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-[#e6cda3] border border-[#c6a87c]/40 backdrop-blur-md uppercase tracking-wider font-mono">
              <ArrowDownToLine className="w-3.5 h-3.5 text-[#e6cda3]" />
              <span>{isth ? "ระบบฝากเงินผ่านธนาคารไทยอัตโนมัติ" : "Automatic Thai Bank Deposit"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isth ? "ฝากเงินเข้าบัญชีเทรด" : "Deposit Funds"}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              {isth
                ? "โอนเงินผ่านระบบ Mobile Banking ของทุกธนาคารไทย แนบสลิป อนุมัติรวดเร็วใน 5-15 นาที"
                : "Transfer funds via any Thai Mobile Banking app. Submit slip for fast verification in 5-15 mins."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[140px]">
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">{isth ? "อัตราแลกเปลี่ยน" : "Exchange Rate"}</span>
              <span className="text-lg font-black font-mono text-[#e6cda3] mt-0.5 block">1 USD = ฿{THB_RATE}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: DEPOSIT FORM */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Select Trading Account */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg text-white text-[11px] font-black flex items-center justify-center">1</span>
              <span className="font-bold text-slate-800 text-sm">{isth ? "เลือกบัญชีเทรดปลายทาง" : "Select Target Trading Account"}</span>
            </div>

            {loadingAccounts ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">กำลังโหลดบัญชี...</div>
            ) : accounts.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                {isth ? "ยังไม่มีบัญชีเทรดจริง กรุณาเปิดบัญชีเทรดก่อน" : "No live trading accounts found. Please open a live account first."}
              </div>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAccountDrop((v) => !v)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-[#c6a87c] rounded-xl px-4 py-3 flex items-center justify-between text-sm transition-all focus:outline-none focus:border-[#c6a87c]"
                >
                  {selectedAccount ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                        {selectedAccount.platform}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">#{selectedAccount.accountNumber}</p>
                        <p className="text-xs text-slate-400">{selectedAccount.type} Account · Balance: ${selectedAccount.balance.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400">{isth ? "เลือกบัญชีเทรด..." : "Choose trading account..."}</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showAccountDrop ? "rotate-180" : ""}`} />
                </button>

                {showAccountDrop && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => { setSelectedAccount(acc); setShowAccountDrop(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${selectedAccount?.id === acc.id ? "bg-[#fdfbf7]" : ""}`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0">
                          {acc.platform}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">#{acc.accountNumber}</p>
                          <p className="text-xs text-slate-400">{acc.type} · ${acc.balance.toLocaleString()}</p>
                        </div>
                        {selectedAccount?.id === acc.id && <CheckCircle2 className="w-4 h-4 text-[#c6a87c] ml-auto" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Company Bank Account Details (THAI BANK ICON BADGE) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg text-white text-[11px] font-black flex items-center justify-center">2</span>
                <span className="font-bold text-slate-800 text-sm">{isth ? "โอนเงินเข้าบัญชีบริษัท" : "Transfer to Company Account"}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 font-mono">
                Official Account
              </span>
            </div>

            {/* BANK DETAILS CARD WITH THAI BANK BADGE */}
            <div className="bg-gradient-to-br from-[#fdfbf7] via-[#f9f5ee] to-[#f4ebe0] border border-[#e8d5b7] rounded-xl p-5 space-y-4 relative overflow-hidden shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {/* Official Thai Bank Logo Badge with Brand Color */}
                  <div
                    className="w-12 h-12 rounded-2xl p-2.5 flex items-center justify-center shrink-0 shadow-md ring-2 ring-white/60"
                    style={{ backgroundColor: currentBankObj.color }}
                  >
                    {currentBankObj.logo ? (
                      <img src={currentBankObj.logo} alt={currentBankObj.name} className="w-full h-full object-contain brightness-0 invert" />
                    ) : (
                      <span className="font-mono font-black text-xs text-white">{currentBankObj.short}</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {isth ? bankSetting.bankName : bankSetting.bankNameEn}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {isth ? bankSetting.accountName : bankSetting.accountName}
                    </p>
                  </div>
                </div>

                {bankSetting.promptpayQr && (
                  <div className="bg-white p-2 rounded-xl border border-[#e8d5b7] shrink-0 text-center shadow-2xs">
                    <img src={bankSetting.promptpayQr} alt="PromptPay QR" className="w-20 h-20 object-contain mx-auto" />
                    <span className="text-[9px] font-bold text-slate-500 font-mono block mt-1">PromptPay QR</span>
                  </div>
                )}
              </div>

              {/* Account Number Box */}
              <div className="flex items-center justify-between bg-white rounded-xl border border-[#e8d5b7] px-4 py-3 shadow-2xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{isth ? "เลขที่บัญชีธนาคาร" : "Account Number"}</p>
                  <p className="text-xl font-black font-mono text-slate-900 tracking-wider mt-0.5">
                    {bankSetting.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyAccount}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    copied
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {copied ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> {isth ? "คัดลอกแล้ว" : "Copied!"}</>
                  ) : (
                    <><Copy className="w-4 h-4" /> {isth ? "คัดลอกเลขบัญชี" : "Copy Account"}</>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-[#997a49] font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {isth ? "โอนเงินตรงตามจำนวนที่ระบุ และแนบสลิปเพื่ออนุมัติเงินเข้าบัญชีทันที" : "Please transfer the exact amount and upload your slip for instant verification."}
              </p>
            </div>

            {/* Transfer Amount Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isth ? "จำนวนเงินที่โอน (บาท)" : "Transfer Amount (THB)"}
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#c6a87c] focus-within:ring-2 focus-within:ring-[#c6a87c]/15 transition-all bg-white">
                <div className="px-4 py-3 bg-slate-50 border-r border-slate-200 text-sm font-black text-slate-700 shrink-0">฿ THB</div>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={amountThb}
                  onChange={(e) => setAmountThb(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 outline-none text-slate-900 text-base font-bold placeholder:font-normal placeholder:text-slate-300"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[500, 1000, 2000, 5000, 10000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmountThb(String(v))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      amountThb === String(v)
                        ? "bg-[#c6a87c] text-white border-[#c6a87c]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#c6a87c]"
                    }`}
                  >
                    ฿{v.toLocaleString()}
                  </button>
                ))}
              </div>

              {amountThb && parseFloat(amountThb) > 0 && (
                <p className="text-xs text-[#997a49] font-medium">
                  ≈ ${amountUsd} USD <span className="text-slate-400">(อัตราแลกเปลี่ยน ฿{THB_RATE}/USD)</span>
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Attach Payment Slip */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg text-white text-[11px] font-black flex items-center justify-center">3</span>
              <span className="font-bold text-slate-800 text-sm">{isth ? "แนบสลิปโอนเงิน" : "Upload Payment Slip"}</span>
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleSlipChange(e.target.files[0]);
              }}
            />

            {slipPreview ? (
              <div className="relative border border-slate-200 rounded-xl overflow-hidden p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={slipPreview} alt="Slip Preview" className="w-12 h-12 object-cover rounded-lg border" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{slip?.name}</p>
                    <p className="text-[10px] text-slate-400">{(slip!.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSlip(null); setSlipPreview(null); }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 hover:border-[#c6a87c] rounded-xl p-6 text-center transition-all bg-slate-50/50 hover:bg-white space-y-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform shadow-2xs">
                  <Upload className="w-5 h-5 text-[#c6a87c]" />
                </div>
                <p className="text-xs font-bold text-slate-700">{isth ? "คลิกเพื่อแนบสลิป หรือลากไฟล์มาวาง" : "Click or drag payment slip here"}</p>
                <p className="text-[10px] text-slate-400">รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 10MB</p>
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-lg shadow-[#c6a87c]/25 border border-[#f0d8b3]/30 active:scale-98"
          >
            {submitting ? (isth ? "กำลังส่งข้อมูล..." : "Submitting...") : (isth ? "ยืนยันการฝากเงิน" : "Confirm Deposit")}
          </button>
        </form>

        {/* RIGHT COL: RECENT TRANSACTIONS */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-[#c6a87c]" />
                <span>{isth ? "ประวัติการฝากเงินล่าสุด" : "Recent Deposits"}</span>
              </h3>
              <Link href={`/${lang}/dashboard/history`} className="text-[11px] font-bold text-[#b89766] hover:text-[#997a49]">
                {isth ? "ดูทั้งหมด" : "View All"}
              </Link>
            </div>

            {recentTxns.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">{isth ? "ยังไม่มีรายการฝากเงิน" : "No recent deposits"}</p>
            ) : (
              <div className="space-y-3">
                {recentTxns.map((tx) => (
                  <div key={tx._id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-800">#{tx.accountNumber}</span>
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="font-mono font-black text-slate-900 text-sm">฿{tx.amountThb.toLocaleString()}</span>
                      <span className="font-mono text-xs font-bold text-emerald-600">${tx.amount} USD</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
