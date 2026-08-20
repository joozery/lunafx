"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Eye, EyeOff, Settings, Upload, CheckCircle2, Clock, XCircle,
  FileText, Camera, CreditCard, AlertCircle, ChevronRight, X,
} from "lucide-react";

export interface AccountData {
  id: string;
  accountNumber: string;
  platform: "MT4" | "MT5";
  type: "Standard" | "ECN Pro" | "VIP Zero" | "Demo";
  server: string;
  currency: string;
  balance: number;
  equity: number;
  freeMargin: number;
  leverage: string;
  isDemo: boolean;
  status: "active" | "suspended" | "archived";
}

interface KycDoc {
  key: string;
  url: string;
  name: string;
}

interface AccountsClientProps {
  lang: string;
  initialAccounts: AccountData[];
}

const DOC_FIELDS = [
  { id: "id_front", label: "บัตรประชาชน (ด้านหน้า)", labelEn: "ID Card (Front)", icon: CreditCard, required: true },
  { id: "id_back",  label: "บัตรประชาชน (ด้านหลัง)", labelEn: "ID Card (Back)",  icon: CreditCard, required: true },
  { id: "selfie",   label: "รูปถ่ายเซลฟี่พร้อมบัตร",  labelEn: "Selfie with ID",  icon: Camera,     required: true },
  { id: "bank_statement", label: "Statement ธนาคาร (ไม่บังคับ)", labelEn: "Bank Statement (Optional)", icon: FileText, required: false },
] as const;

type DocPurpose = typeof DOC_FIELDS[number]["id"];

export function AccountsClient({ lang, initialAccounts }: AccountsClientProps) {
  const isth = lang === "th";
  const [accounts, setAccounts] = useState<AccountData[]>(initialAccounts);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "demo">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Demo account form state
  const [formPlatform, setFormPlatform] = useState<"MetaTrader 5" | "MetaTrader 4">("MetaTrader 5");
  const [formNickname, setFormNickname] = useState("");
  const [formType, setFormType] = useState<"Standard" | "ECN Pro" | "VIP Zero">("Standard");
  const [formLeverage, setFormLeverage] = useState("1:200");
  const [formCurrency, setFormCurrency] = useState("USD");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enableCopyTrading, setEnableCopyTrading] = useState(false);
  const [formIsDemo, setFormIsDemo] = useState(false);

  // KYC flow state
  const [kycStep, setKycStep] = useState<0 | 1 | 2>(0); // 0=account details, 1=docs, 2=done
  const [kycPlatform, setKycPlatform] = useState<"MT4" | "MT5">("MT5");
  const [kycType, setKycType] = useState<"Standard" | "ECN Pro" | "VIP Zero">("Standard");
  const [kycLeverage, setKycLeverage] = useState("1:200");
  const [kycCurrency, setKycCurrency] = useState("USD");
  const [kycDocs, setKycDocs] = useState<Partial<Record<DocPurpose, KycDoc>>>({});
  const [kycUploading, setKycUploading] = useState<Partial<Record<DocPurpose, boolean>>>({});
  const [kycError, setKycError] = useState("");
  const [kycRequestId, setKycRequestId] = useState("");
  const fileInputRefs = useRef<Partial<Record<DocPurpose, HTMLInputElement | null>>>({});

  const liveAccounts = accounts.filter((a) => !a.isDemo);
  const demoAccounts = accounts.filter((a) => a.isDemo);
  const filteredAccounts =
    activeTab === "live" ? liveAccounts : activeTab === "demo" ? demoAccounts : accounts;
  const totalBalance = liveAccounts.reduce((acc, cur) => acc + cur.balance, 0);
  const totalEquity = liveAccounts.reduce((acc, cur) => acc + cur.equity, 0);

  const openModal = (demo: boolean) => {
    setFormIsDemo(demo);
    setKycStep(0);
    setKycDocs({});
    setKycError("");
    setKycRequestId("");
    setIsModalOpen(true);
  };

  /* ─── Demo account: instant create ─── */
  const handleCreateDemoAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const platformCode = formPlatform.includes("4") ? "MT4" : "MT5";
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformCode,
          type: "Demo",
          leverage: formLeverage,
          currency: formCurrency,
          nickname: formNickname,
          isDemo: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        setAccounts([data.account, ...accounts]);
        setIsModalOpen(false);
        setFormNickname("");
        setFormPassword("");
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการสร้างบัญชี");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  /* ─── KYC: upload a single document through Next.js server → R2 ─── */
  const handleFileUpload = async (purpose: DocPurpose, file: File) => {
    setKycUploading((prev) => ({ ...prev, [purpose]: true }));
    setKycError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { key, publicUrl, error } = await res.json();
      if (error) throw new Error(error);

      setKycDocs((prev) => ({ ...prev, [purpose]: { key, url: publicUrl, name: file.name } }));
    } catch (err: unknown) {
      setKycError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setKycUploading((prev) => ({ ...prev, [purpose]: false }));
    }
  };

  /* ─── KYC: submit request ─── */
  const handleSubmitKyc = async () => {
    setKycError("");
    const required: DocPurpose[] = ["id_front", "id_back", "selfie"];
    for (const p of required) {
      if (!kycDocs[p]) {
        setKycError("กรุณาอัปโหลดเอกสารที่จำเป็นให้ครบ (บัตรประชาชนด้านหน้า/หลัง และรูปเซลฟี่)");
        return;
      }
    }
    setLoading(true);
    try {
      const documents = {
        idFront: kycDocs["id_front"]!,
        idBack: kycDocs["id_back"]!,
        selfie: kycDocs["selfie"]!,
        ...(kycDocs["bank_statement"] ? { bankStatement: kycDocs["bank_statement"] } : {}),
      };
      const res = await fetch("/api/account-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: kycPlatform,
          accountType: kycType,
          leverage: kycLeverage,
          currency: kycCurrency,
          documents,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setKycRequestId(data.requestId);
        setKycStep(2);
      } else {
        setKycError(data.error || "ส่งคำขอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }
    } catch {
      setKycError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  const anyUploading = Object.values(kycUploading).some(Boolean);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-slate-800">

      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#c6a87c]/20 via-[#e6cda3]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle, #c6a87c 1px, transparent 1px)`, backgroundSize: "28px 28px" }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-white/10 text-[#e6cda3] border border-[#c6a87c]/40 backdrop-blur-md uppercase tracking-wider font-mono">
              {isth ? "ศูนย์จัดการบัญชีเทรด MetaTrader" : "MetaTrader Account Hub"}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {isth ? "บัญชีเทรดของคุณ" : "Trading Accounts"}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
              {isth
                ? "จัดการบัญชีจริงและบัญชีทดลอง ฝาก-ถอนเงิน และปรับเปลี่ยนเลเวอเรจได้ทันที"
                : "Manage live and demo accounts, deposit & withdraw funds, and adjust leverage instantly."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => openModal(false)}
              className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-[#c6a87c]/25 border border-[#f0d8b3]/30 text-center active:scale-95"
            >
              {isth ? "+ เปิดบัญชีเทรดจริง" : "+ Open Live Account"}
            </button>
            <button
              onClick={() => openModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-xl text-xs border border-white/20 hover:border-[#c6a87c] backdrop-blur-md transition-all text-center active:scale-95"
            >
              {isth ? "เปิดบัญชี Demo" : "Create Demo Account"}
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e8d5b7]/70 rounded-2xl p-4 shadow-2xs hover:border-[#c6a87c] transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{isth ? "บัญชีจริงทั้งหมด" : "Active Live Accounts"}</span>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">{liveAccounts.length} <span className="text-xs font-normal text-slate-500">Accounts</span></p>
          <p className="text-[11px] text-[#b89766] font-bold mt-1">{demoAccounts.length} {isth ? "บัญชีทดลอง" : "Demo Accounts"}</p>
        </div>
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs hover:border-emerald-300 transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{isth ? "มูลค่าสุทธิรวม" : "Total Combined Equity"}</span>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Balance: ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white border border-[#e8d5b7]/70 rounded-2xl p-4 shadow-2xs hover:border-[#c6a87c] transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{isth ? "เลเวอเรจสูงสุด" : "Max Leverage"}</span>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">1:1000</p>
          <p className="text-[11px] text-[#b89766] font-extrabold mt-1">{isth ? "สเปรดต่ำสุด 0.0 Pips" : "Spreads from 0.0 Pips"}</p>
        </div>
        <div className="bg-white border border-[#e8d5b7]/70 rounded-2xl p-4 shadow-2xs hover:border-[#c6a87c] transition-all">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{isth ? "แพลตฟอร์มรองรับ" : "Supported Platforms"}</span>
          <p className="text-2xl font-black font-mono text-slate-900 mt-1">MT4 & MT5</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Desktop, Mobile & Web</p>
        </div>
      </div>

      {/* ACCOUNTS TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl text-xs font-semibold">
            {(["all", "live", "demo"] as const).map((tab) => {
              const count = tab === "all" ? accounts.length : tab === "live" ? liveAccounts.length : demoAccounts.length;
              const label = tab === "all" ? (isth ? "ทั้งหมด" : "All") : tab === "live" ? (isth ? "บัญชีจริง" : "Live") : (isth ? "ทดลอง" : "Demo");
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === tab ? "bg-white text-slate-900 font-bold shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}>
                  {label} ({count})
                </button>
              );
            })}
          </div>
          <button onClick={() => openModal(false)} className="text-xs font-bold text-[#b89766] hover:text-[#997a49] transition-colors">
            {isth ? "+ เปิดบัญชีใหม่" : "+ Open New Account"}
          </button>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center bg-slate-50/50 my-4">
            <h4 className="font-bold text-slate-800 text-base mb-1">{isth ? "ยังไม่มีบัญชีเทรดตามที่เลือก" : "No Accounts Found"}</h4>
            <p className="text-xs text-slate-400 max-w-md mb-5">{isth ? "คุณสามารถเปิดบัญชีเทรดใหม่เพื่อเริ่มสัมผัสการเทรดระดับโลกกับ Lunaforex ได้ทันที" : "Create a new trading account to access global financial markets."}</p>
            <button onClick={() => openModal(false)} className="bg-gradient-to-r from-[#c6a87c] to-[#997a49] hover:brightness-110 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md">
              {isth ? "เปิดบัญชีเทรดใหม่" : "Open New Trading Account"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAccounts.map((account, idx) => (
              <div key={account.id} className="bg-[#f5f6f8] border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 space-y-3.5 shadow-2xs transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-md">{account.isDemo ? (isth ? "ทดลอง" : "Demo") : (isth ? "ใช้งานจริง" : "Live")}</span>
                    <span className="text-xs font-bold text-slate-700">{account.type}</span>
                  </div>
                  <span className="font-mono text-xs font-extrabold text-slate-800">{account.accountNumber}</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs flex items-center justify-between min-h-[76px]">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Account #{idx + 1}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{account.platform}-01</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <img src={account.platform === "MT4" ? "/MetaTrader_4.png" : "/MetaTrader_5.png"} alt={account.platform} className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-[10px]">🇺🇸</div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block leading-tight">{isth ? "ยอดคงเหลือ" : "Balance"}</span>
                      <span className="font-bold font-mono text-slate-900 text-sm">US${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-slate-400 block leading-tight">{isth ? "เลเวอเรจ" : "Leverage"}</span>
                    <span className="font-bold font-mono text-slate-900 text-sm">{account.leverage}</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <Link href={`/${lang}/dashboard/funds?account=${account.accountNumber}`} className="flex-1 bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-2xs text-center">
                    {isth ? "การฝากเงิน" : "Deposit"}
                  </Link>
                  <Link href={`/${lang}/dashboard/funds/transfer`} className="flex-1 bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors text-center">
                    {isth ? "การถอนเงิน" : "Withdrawal"}
                  </Link>
                  <Link href={`/${lang}/dashboard/platforms`} className="w-9 h-9 bg-slate-200/60 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors flex items-center justify-center shrink-0" title={isth ? "ตั้งค่าบัญชี" : "Account Settings"}>
                    <Settings className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACCOUNT TYPE COMPARISON */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">{isth ? "เปรียบเทียบประเภทบัญชีเทรด Lunaforex" : "Compare Lunaforex Account Types"}</h3>
          <p className="text-xs text-slate-500">{isth ? "เลือกบัญชีที่ตอบโจทย์สไตล์การเทรดของคุณ" : "Select the best account type suited for your trading strategy"}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {[
            { name: "Standard Account", desc: isth ? "เหมาะสำหรับนักเทรดเริ่มต้น สเปรดต่ำ ไม่มีค่าธรรมเนียม" : "Great for beginners. Low spread, zero commission.", spread: "1.2", commission: "$0", min: "$50", gold: false },
            { name: "ECN Pro Account", desc: isth ? "สำหรับนักเทรดมืออาชีพที่ต้องการสเปรดต่ำพิเศษ" : "For professionals. Ultra-low spread, fast execution.", spread: "0.1", commission: "$3.5/Lot", min: "$200", gold: true, badge: "Recommended" },
            { name: "VIP Zero Account", desc: isth ? "สำหรับพอร์ตใหญ่ สเปรดเริ่มต้น 0.0 Pips" : "For large portfolios. Zero spread from 0.0 Pips.", spread: "0.0", commission: "$2.5/Lot", min: "$1,000", gold: false },
          ].map((acc) => (
            <div key={acc.name} className={`rounded-xl p-4 space-y-2 ${acc.gold ? "bg-[#fdfbf7] border border-[#e8d5b7] shadow-2xs" : "bg-slate-50 border border-slate-200"}`}>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">{acc.name}</span>
                {acc.badge && <span className="text-[9px] font-bold bg-[#c6a87c] text-white px-2 py-0.5 rounded uppercase">{acc.badge}</span>}
              </div>
              <p className="text-[11px] text-slate-500 font-sans">{acc.desc}</p>
              <div className={`pt-2 border-t ${acc.gold ? "border-[#e8d5b7]/60" : "border-slate-200"} space-y-1 text-slate-700`}>
                <div className="flex justify-between"><span>Spread:</span><span className={`font-bold ${acc.gold ? "text-[#b89766]" : ""}`}>{acc.spread} Pips</span></div>
                <div className="flex justify-between"><span>Commission:</span><span className="font-bold">{acc.commission}</span></div>
                <div className="flex justify-between"><span>Min Deposit:</span><span className="font-bold">{acc.min}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden font-sans border border-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {formIsDemo
                    ? (isth ? "เปิดบัญชีทดลอง (Demo)" : "Open Demo Account")
                    : kycStep === 0 ? (isth ? "ขอเปิดบัญชีเทรดจริง — ข้อมูลบัญชี" : "Live Account Request — Account Details")
                    : kycStep === 1 ? (isth ? "ขอเปิดบัญชีเทรดจริง — ยืนยันตัวตน KYC" : "Live Account Request — KYC Documents")
                    : (isth ? "ส่งคำขอสำเร็จ" : "Request Submitted")}
                </h3>
                {!formIsDemo && kycStep < 2 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[0, 1].map((s) => (
                      <div key={s} className={`h-1 rounded-full transition-all ${s <= kycStep ? "bg-[#c6a87c] w-8" : "bg-slate-200 w-4"}`} />
                    ))}
                    <span className="text-[10px] text-slate-400 ml-1">{kycStep + 1}/2</span>
                  </div>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* ── DEMO FORM ── */}
              {formIsDemo && (
                <form onSubmit={handleCreateDemoAccount} className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>{isth ? "บัญชีทดลองจะถูกสร้างทันที ด้วยเงินทดลอง $10,000 สำหรับฝึกเทรด" : "Demo account is created instantly with $10,000 virtual funds for practice trading."}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#b89766] block">{isth ? "แพลตฟอร์ม" : "Platform"}</label>
                      <select value={formPlatform} onChange={(e) => setFormPlatform(e.target.value as typeof formPlatform)} className="w-full bg-transparent border-b-2 border-[#c6a87c] py-1.5 font-medium text-slate-900 text-sm focus:outline-none cursor-pointer">
                        <option value="MetaTrader 5">MetaTrader 5</option>
                        <option value="MetaTrader 4">MetaTrader 4</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500 block">{isth ? "เลเวอเรจ" : "Leverage"}</label>
                      <select value={formLeverage} onChange={(e) => setFormLeverage(e.target.value)} className="w-full bg-transparent border-b border-slate-300 py-1.5 font-mono text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c] cursor-pointer">
                        {["1:100", "1:200", "1:500", "1:1000"].map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500 block">{isth ? "สกุลเงิน" : "Currency"}</label>
                      <select value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} className="w-full bg-transparent border-b border-slate-300 py-1.5 font-mono text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c] cursor-pointer">
                        {["USD", "EUR", "THB"].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500 block">{isth ? "ชื่อเล่น (ไม่บังคับ)" : "Nickname (Optional)"}</label>
                      <input type="text" value={formNickname} onChange={(e) => setFormNickname(e.target.value)} className="w-full bg-transparent border-b border-slate-300 py-1.5 text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c]" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button type="submit" disabled={loading} className="bg-gradient-to-r from-[#c6a87c] to-[#997a49] hover:brightness-110 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md disabled:opacity-60">
                      {loading ? (isth ? "กำลังสร้าง..." : "Creating...") : (isth ? "สร้างบัญชีทดลอง" : "Create Demo Account")}
                    </button>
                  </div>
                </form>
              )}

              {/* ── KYC STEP 0: Account Details ── */}
              {!formIsDemo && kycStep === 0 && (
                <div className="space-y-5">
                  <div className="bg-[#fdfbf7] border border-[#e8d5b7] rounded-xl p-3 flex items-start gap-2 text-xs text-[#7a5e35]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#c6a87c]" />
                    <span>{isth ? "การเปิดบัญชีจริงต้องผ่านการยืนยันตัวตน (KYC) เพื่อความปลอดภัย ทีมงานจะตรวจสอบเอกสารภายใน 1-2 วันทำการ" : "Opening a live account requires KYC verification for security. Our team will review your documents within 1-2 business days."}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#b89766] block">{isth ? "แพลตฟอร์ม" : "Platform"}</label>
                      <select value={kycPlatform} onChange={(e) => setKycPlatform(e.target.value as "MT4" | "MT5")} className="w-full bg-transparent border-b-2 border-[#c6a87c] py-1.5 font-medium text-slate-900 text-sm focus:outline-none cursor-pointer">
                        <option value="MT5">MetaTrader 5</option>
                        <option value="MT4">MetaTrader 4</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500 block">{isth ? "ประเภทบัญชี" : "Account Type"}</label>
                      <select value={kycType} onChange={(e) => setKycType(e.target.value as typeof kycType)} className="w-full bg-transparent border-b border-slate-300 py-1.5 text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c] cursor-pointer">
                        <option value="Standard">Standard</option>
                        <option value="ECN Pro">ECN Pro</option>
                        <option value="VIP Zero">VIP Zero</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500 block">{isth ? "เลเวอเรจ" : "Leverage"}</label>
                      <select value={kycLeverage} onChange={(e) => setKycLeverage(e.target.value)} className="w-full bg-transparent border-b border-slate-300 py-1.5 font-mono text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c] cursor-pointer">
                        {["1:100", "1:200", "1:500", "1:1000"].map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-500 block">{isth ? "สกุลเงิน" : "Currency"}</label>
                      <select value={kycCurrency} onChange={(e) => setKycCurrency(e.target.value)} className="w-full bg-transparent border-b border-slate-300 py-1.5 font-mono text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c] cursor-pointer">
                        {["USD", "EUR", "THB"].map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button onClick={() => setKycStep(1)} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c6a87c] to-[#997a49] hover:brightness-110 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md">
                      {isth ? "ถัดไป: อัปโหลดเอกสาร" : "Next: Upload Documents"} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── KYC STEP 1: Document Upload ── */}
              {!formIsDemo && kycStep === 1 && (
                <div className="space-y-4">
                  {kycError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-red-700">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" /> {kycError}
                    </div>
                  )}
                  {DOC_FIELDS.map((field) => {
                    const doc = kycDocs[field.id];
                    const uploading = kycUploading[field.id];
                    const Icon = field.icon;
                    return (
                      <div key={field.id} className={`border rounded-xl p-4 flex items-center gap-4 transition-all ${doc ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 hover:border-[#c6a87c]"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${doc ? "bg-emerald-100" : "bg-white border border-slate-200"}`}>
                          {doc ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Icon className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{isth ? field.label : field.labelEn}</span>
                            {field.required && <span className="text-[10px] text-red-500 font-bold">*</span>}
                          </div>
                          {doc ? (
                            <p className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">{doc.name}</p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-0.5">{isth ? "รองรับ JPG, PNG, PDF (ขนาดสูงสุด 10MB)" : "JPG, PNG, PDF accepted (max 10MB)"}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                            className="hidden"
                            ref={(el) => { fileInputRefs.current[field.id] = el; }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(field.id, file);
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => fileInputRefs.current[field.id]?.click()}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${doc ? "bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "bg-[#c6a87c] hover:brightness-110 text-white"} disabled:opacity-60`}
                          >
                            {uploading ? (
                              <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />{isth ? "กำลังอัป..." : "Uploading..."}</span>
                            ) : (
                              <><Upload className="w-3 h-3" />{doc ? (isth ? "เปลี่ยน" : "Change") : (isth ? "อัปโหลด" : "Upload")}</>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <button onClick={() => setKycStep(0)} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
                      ← {isth ? "ย้อนกลับ" : "Back"}
                    </button>
                    <button
                      onClick={handleSubmitKyc}
                      disabled={loading || anyUploading}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#c6a87c] to-[#997a49] hover:brightness-110 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md disabled:opacity-60"
                    >
                      {loading ? (isth ? "กำลังส่ง..." : "Submitting...") : (isth ? "ส่งคำขอ" : "Submit Request")}
                    </button>
                  </div>
                </div>
              )}

              {/* ── KYC STEP 2: Success ── */}
              {!formIsDemo && kycStep === 2 && (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-slate-900">{isth ? "ส่งคำขอสำเร็จ!" : "Request Submitted!"}</h4>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                      {isth
                        ? "ทีมงานของเราจะตรวจสอบเอกสารและแจ้งผลภายใน 1-2 วันทำการ"
                        : "Our team will review your documents and notify you within 1-2 business days."}
                    </p>
                    {kycRequestId && <p className="text-[11px] text-slate-400 font-mono">Request ID: {kycRequestId}</p>}
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {isth ? "รอการอนุมัติ" : "Pending Approval"}
                  </div>
                  <div className="pt-2">
                    <button onClick={() => setIsModalOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
                      {isth ? "ปิดหน้าต่างนี้" : "Close"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
