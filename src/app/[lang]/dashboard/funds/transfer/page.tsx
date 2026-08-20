"use client";

import { use, useState, useEffect } from "react";
import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, ChevronDown, CheckCircle2, Clock, AlertCircle,
  ArrowUpFromLine, Search, X, ShieldCheck, History,
} from "lucide-react";

/* ── ธนาคารไทยและนานาชาติที่รองรับ ── */
const BANKS = [
  { code: "kbank", name: "กสิกรไทย",           nameEn: "KBank",         logo: "/logobank/kbank.svg", bg: "#138F2D" },
  { code: "scb",   name: "ไทยพาณิชย์",          nameEn: "SCB",           logo: "/logobank/scb.svg",   bg: "#4E2A84" },
  { code: "bbl",   name: "กรุงเทพ",             nameEn: "Bangkok Bank",  logo: "/logobank/bbl.svg",   bg: "#1D4F8D" },
  { code: "ktb",   name: "กรุงไทย",             nameEn: "Krungthai",     logo: "/logobank/ktb.svg",   bg: "#009A44" },
  { code: "bay",   name: "กรุงศรีอยุธยา",       nameEn: "Krungsri",      logo: "/logobank/bay.svg",   bg: "#C8A400" },
  { code: "ttb",   name: "ทหารไทยธนชาต",        nameEn: "TTB Bank",      logo: "/logobank/ttb.svg",   bg: "#003087" },
  { code: "gsb",   name: "ออมสิน",              nameEn: "GSB",           logo: "/logobank/gsb.svg",   bg: "#C2004A" },
  { code: "ghb",   name: "อาคารสงเคราะห์",      nameEn: "GHB",           logo: "/logobank/ghb.svg",   bg: "#F37021" },
  { code: "baac",  name: "เพื่อการเกษตร",       nameEn: "BAAC",          logo: "/logobank/baac.svg",  bg: "#007A3D" },
  { code: "kk",    name: "เกียรตินาคินภัทร",    nameEn: "KKP",           logo: "/logobank/kk.svg",    bg: "#003982" },
  { code: "tisco", name: "ทิสโก้",              nameEn: "TISCO",         logo: "/logobank/tisco.svg", bg: "#005FAD" },
  { code: "lhb",   name: "แลนด์ แอนด์ เฮ้าส์", nameEn: "LH Bank",       logo: "/logobank/lhb.svg",   bg: "#003087" },
  { code: "uob",   name: "ยูโอบี",              nameEn: "UOB",           logo: "/logobank/uob.svg",   bg: "#EE2B30" },
  { code: "cimb",  name: "ซีไอเอ็มบี",          nameEn: "CIMB",          logo: "/logobank/cimb.svg",  bg: "#E32726" },
  { code: "citi",  name: "ซิตี้แบงค์",          nameEn: "Citibank",      logo: "/logobank/citi.svg",  bg: "#003EA5" },
  { code: "icbc",  name: "ไอซีบีซี",            nameEn: "ICBC (Thai)",   logo: "/logobank/icbc.svg",  bg: "#E30613" },
  { code: "tmb",   name: "ทหารไทย (เดิม)",      nameEn: "TMB",           logo: "/logobank/tmb.svg",   bg: "#003087" },
  { code: "tbank", name: "ธนชาต (เดิม)",        nameEn: "Thanachart",    logo: "/logobank/tbank.svg", bg: "#F7941D" },
];

interface TradingAccount {
  id: string;
  accountNumber: string;
  type: string;
  platform: string;
  balance: number;
  isDemo: boolean;
}

const THB_RATE = 35;

export default function WithdrawPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = use(props.params);
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
  const [showAccountDrop, setShowAccountDrop] = useState(false);
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[0] | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankAccNumber, setBankAccNumber] = useState("");
  const [bankAccName, setBankAccName] = useState("");
  const [amountUsd, setAmountUsd] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");

  const amountThb = amountUsd ? (parseFloat(amountUsd) * THB_RATE).toLocaleString() : "0";

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const live = (d.accounts ?? []).filter((a: TradingAccount) => !a.isDemo);
        setAccounts(live);
        if (live.length === 1) setSelectedAccount(live[0]);
      })
      .finally(() => setLoadingAccounts(false));
  }, []);

  const filteredBanks = BANKS.filter(
    (b) =>
      b.name.includes(bankSearch) ||
      b.nameEn.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedAccount) { setError("กรุณาเลือกบัญชีเทรดที่ต้องการถอน"); return; }
    if (!selectedBank) { setError("กรุณาเลือกธนาคารปลายทาง"); return; }
    if (!bankAccNumber.trim()) { setError("กรุณากรอกเลขบัญชีธนาคาร"); return; }
    if (!bankAccName.trim()) { setError("กรุณากรอกชื่อบัญชีธนาคาร"); return; }
    if (!amountUsd || parseFloat(amountUsd) < 10) { setError("ยอดถอนขั้นต่ำ $10 USD"); return; }
    if (parseFloat(amountUsd) > selectedAccount.balance) { setError(`ยอดคงเหลือไม่เพียงพอ (มีอยู่ $${selectedAccount.balance.toLocaleString()})`); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: selectedAccount.accountNumber,
          bankCode: selectedBank.code,
          bankName: isth ? selectedBank.name : selectedBank.nameEn,
          bankAccountNumber: bankAccNumber,
          bankAccountName: bankAccName,
          amountUsd: parseFloat(amountUsd),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(data.transactionId);
      } else {
        setError(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── SUCCESS ── */
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-5">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{isth ? "ส่งคำขอถอนเงินแล้ว!" : "Withdrawal Requested!"}</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
            {isth ? "ทีมงานจะตรวจสอบและโอนเงินเข้าบัญชีธนาคารของคุณภายใน 1 วันทำการ" : "Our team will process your withdrawal within 1 business day."}
          </p>
          <p className="text-xs text-slate-400 font-mono mt-3">Ref: {success}</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
          <Clock className="w-3.5 h-3.5" /> {isth ? "รอดำเนินการ" : "Pending Processing"}
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={() => { setSuccess(null); setAmountUsd(""); }} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            {isth ? "ถอนเงินอีกครั้ง" : "Withdraw Again"}
          </button>
          <Link href={`/${lang}/dashboard/history`} className="px-5 py-2.5 bg-gradient-to-r from-[#c6a87c] to-[#997a49] text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all">
            {isth ? "ดูประวัติ" : "View History"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-slate-800">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle, #c6a87c 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Link href={`/${lang}/dashboard/funds`} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/20 uppercase tracking-widest font-mono">
                <ArrowUpFromLine className="w-3 h-3" />
                {isth ? "ถอนเงินไปยังธนาคาร" : "Bank Withdrawal"}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{isth ? "ถอนเงินจากบัญชีเทรด" : "Withdraw to Bank Account"}</h1>
              <p className="text-slate-400 text-sm">{isth ? "โอนกำไรจากการเทรดไปยังบัญชีธนาคารของคุณ" : "Transfer your trading profits to your bank account."}</p>
            </div>
          </div>
          <Link href={`/${lang}/dashboard/history`} className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all self-start sm:self-auto">
            <History className="w-3.5 h-3.5" /> {isth ? "ประวัติธุรกรรม" : "History"}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* ── LEFT: FORM ── */}
        <div className="xl:col-span-3">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Step 1: Select account */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg text-white text-[11px] font-black flex items-center justify-center">1</span>
                <span className="font-bold text-slate-800 text-sm">{isth ? "เลือกบัญชีเทรดที่ต้องการถอน" : "Select Trading Account"}</span>
              </div>
              {loadingAccounts ? (
                <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ) : accounts.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>{isth ? "ยังไม่มีบัญชีเทรดจริง" : "No live trading accounts found."}</span>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAccountDrop((v) => !v)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-[#c6a87c] rounded-xl px-4 py-3 flex items-center justify-between text-sm transition-all"
                  >
                    {selectedAccount ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg flex items-center justify-center text-white text-[10px] font-black">{selectedAccount.platform}</div>
                        <div className="text-left">
                          <p className="font-bold text-slate-900">{selectedAccount.accountNumber}</p>
                          <p className="text-xs text-slate-400">{selectedAccount.type} · {isth ? "ยอดคงเหลือ" : "Balance"}: <span className="font-bold text-emerald-600">${selectedAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></p>
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
                        <button key={acc.id} type="button"
                          onClick={() => { setSelectedAccount(acc); setShowAccountDrop(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0">{acc.platform}</div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{acc.accountNumber}</p>
                            <p className="text-xs text-slate-400">{acc.type} · ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          </div>
                          {selectedAccount?.id === acc.id && <CheckCircle2 className="w-4 h-4 text-[#c6a87c] ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Select bank */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg text-white text-[11px] font-black flex items-center justify-center">2</span>
                <span className="font-bold text-slate-800 text-sm">{isth ? "เลือกธนาคารปลายทาง" : "Select Destination Bank"}</span>
              </div>

              {/* Bank grid */}
              {!showBankPicker ? (
                <div>
                  {/* Popular banks quick-select */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                    {BANKS.slice(0, 12).map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                          selectedBank?.code === bank.code
                            ? "border-[#c6a87c] shadow-sm ring-2 ring-[#c6a87c]/40 bg-white"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5 shrink-0" style={{ backgroundColor: bank.bg }}>
                          <div className="w-full h-full relative">
                            <Image src={bank.logo} alt={bank.nameEn} fill className="object-contain brightness-0 invert" />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                          {bank.code.toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBankPicker(true)}
                    className="w-full text-xs font-bold text-[#b89766] hover:text-[#997a49] transition-colors flex items-center justify-center gap-1.5 py-2"
                  >
                    <Search className="w-3.5 h-3.5" /> {isth ? "ค้นหาธนาคารอื่น..." : "Search more banks..."}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      autoFocus
                      type="text"
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder={isth ? "ค้นหาธนาคาร..." : "Search bank..."}
                      className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#c6a87c] transition-all"
                    />
                    <button type="button" onClick={() => { setShowBankPicker(false); setBankSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => { setSelectedBank(bank); setShowBankPicker(false); setBankSearch(""); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          selectedBank?.code === bank.code
                            ? "border-[#c6a87c] bg-white ring-2 ring-[#c6a87c]/40"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5 shrink-0" style={{ backgroundColor: bank.bg }}>
                          <div className="w-full h-full relative">
                            <Image src={bank.logo} alt={bank.nameEn} fill className="object-contain brightness-0 invert" />
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">{isth ? bank.name : bank.nameEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected bank confirmation */}
              {selectedBank && (
                <div className="flex items-center gap-3 bg-[#fdfbf7] border border-[#e8d5b7] rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5 shrink-0" style={{ backgroundColor: selectedBank.bg }}>
                    <div className="w-full h-full relative">
                      <Image src={selectedBank.logo} alt={selectedBank.nameEn} fill className="object-contain brightness-0 invert" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{isth ? selectedBank.name : selectedBank.nameEn}</p>
                    <p className="text-[11px] text-slate-400">{isth ? "ธนาคารที่เลือก" : "Selected bank"}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedBank(null)} className="ml-auto text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Bank account fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isth ? "เลขบัญชีธนาคาร" : "Bank Account Number"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankAccNumber}
                    onChange={(e) => setBankAccNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="0000000000"
                    maxLength={15}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#c6a87c] focus:ring-2 focus:ring-[#c6a87c]/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {isth ? "ชื่อบัญชีธนาคาร" : "Account Holder Name"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankAccName}
                    onChange={(e) => setBankAccName(e.target.value)}
                    placeholder={isth ? "ชื่อ นามสกุล" : "Full name"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#c6a87c] focus:ring-2 focus:ring-[#c6a87c]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Amount */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-gradient-to-br from-[#c6a87c] to-[#997a49] rounded-lg text-white text-[11px] font-black flex items-center justify-center">3</span>
                <span className="font-bold text-slate-800 text-sm">{isth ? "ระบุจำนวนที่ต้องการถอน" : "Enter Withdrawal Amount"}</span>
              </div>

              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#c6a87c] focus-within:ring-2 focus-within:ring-[#c6a87c]/15 transition-all bg-white">
                <div className="px-4 py-3 bg-slate-50 border-r border-slate-200 text-sm font-black text-slate-700 shrink-0">$ USD</div>
                <input
                  type="number"
                  min="10"
                  step="1"
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 outline-none text-slate-900 text-base font-bold placeholder:font-normal placeholder:text-slate-300"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 500, 1000].map((v) => (
                  <button key={v} type="button" onClick={() => setAmountUsd(String(v))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${amountUsd === String(v) ? "bg-[#c6a87c] text-white border-[#c6a87c]" : "bg-white text-slate-600 border-slate-200 hover:border-[#c6a87c]"}`}>
                    ${v.toLocaleString()}
                  </button>
                ))}
                {selectedAccount && (
                  <button type="button" onClick={() => setAmountUsd(String(Math.floor(selectedAccount.balance)))}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-[#c6a87c] transition-all">
                    {isth ? "ถอนทั้งหมด" : "Withdraw All"}
                  </button>
                )}
              </div>

              {amountUsd && parseFloat(amountUsd) > 0 && (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 text-xs">
                  <span className="text-slate-500">{isth ? "จะได้รับประมาณ" : "You'll receive approx."}</span>
                  <span className="font-black text-slate-900">฿{(parseFloat(amountUsd) * THB_RATE).toLocaleString()} THB</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedAccount || !selectedBank || !bankAccNumber || !bankAccName || !amountUsd}
              className="w-full bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 hover:brightness-125 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#c6a87c]/20 active:scale-[0.99]"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{isth ? "กำลังส่งคำขอ..." : "Submitting..."}</>
              ) : (
                <><ArrowUpFromLine className="w-4 h-4" />{isth ? "ยืนยันถอนเงิน" : "Confirm Withdrawal"}</>
              )}
            </button>
          </form>
        </div>

        {/* ── RIGHT: INFO ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Process */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">{isth ? "ขั้นตอนการถอนเงิน" : "Withdrawal Process"}</h3>
            <div className="space-y-4">
              {[
                { step: "1", title: isth ? "ส่งคำขอถอนเงิน" : "Submit Request",       desc: isth ? "ระบุธนาคารและจำนวนที่ต้องการถอน" : "Enter bank details and amount" },
                { step: "2", title: isth ? "ทีมงานตรวจสอบ" : "Team Review",          desc: isth ? "แอดมินตรวจสอบข้อมูลภายใน 1-3 ชั่วโมง" : "Admin reviews within 1-3 hours" },
                { step: "3", title: isth ? "โอนเงินเข้าธนาคาร" : "Bank Transfer",    desc: isth ? "ยอดเงินโอนเข้าบัญชีภายใน 1 วันทำการ" : "Funds arrive within 1 business day" },
              ].map(({ step, title, desc }, i, arr) => (
                <div key={step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 border border-[#c6a87c]/30">{step}</div>
                    {i < arr.length - 1 && <div className="w-px h-full bg-gradient-to-b from-slate-300 to-transparent mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-bold text-slate-800 text-sm">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div className="bg-[#fdfbf7] border border-[#e8d5b7] rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">{isth ? "เงื่อนไขการถอน" : "Withdrawal Terms"}</h3>
            {[
              { label: isth ? "ถอนขั้นต่ำ" : "Min Withdrawal",   value: "$10 USD" },
              { label: isth ? "ค่าธรรมเนียม" : "Withdrawal Fee",  value: isth ? "ไม่มี" : "None" },
              { label: isth ? "เวลาดำเนินการ" : "Processing",     value: isth ? "จ-ศ ภายใน 24 ชม." : "Mon-Fri within 24h" },
              { label: isth ? "อัตราแลกเปลี่ยน" : "FX Rate",     value: `฿${THB_RATE} / 1 USD` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="font-bold text-slate-800">{value}</span>
              </div>
            ))}
          </div>

          {/* Security note */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex gap-3">
            <ShieldCheck className="w-5 h-5 text-[#c6a87c] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              {isth
                ? "ยอดเงินจะถูกหักออกจากบัญชีเทรดทันที และคืนให้อัตโนมัติหากคำขอไม่ได้รับการอนุมัติ"
                : "Funds are deducted immediately and automatically refunded if the withdrawal is not approved."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
