"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ShieldCheck, TrendingUp, Users, ArrowLeftRight, Lock, KeyRound, ArrowLeft } from "lucide-react";

const STATS = [
  { icon: Users, label: "Active Clients", value: "2,840+" },
  { icon: TrendingUp, label: "Total Volume", value: "$4.2M" },
  { icon: ArrowLeftRight, label: "Daily Trades", value: "1,200+" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // 6-Digit PIN State
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...pinDigits];
    newDigits[index] = value.slice(-1);
    setPinDigits(newDigits);

    // Auto focus next input
    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pinDigits[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  async function handleSubmitStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.requiresPin) {
        setStep(2);
        setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const pin = pinDigits.join("");
    if (pin.length < 6) {
      setError("กรุณากรอกรหัส PIN ให้ครบทั้ง 6 หลัก");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, pin }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "รหัส PIN ไม่ถูกต้อง");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาดในการตรวจสอบรหัส PIN");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex font-sans bg-white text-slate-800">

      {/* ─── Left Panel (Pure White Theme) ─── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 lg:p-16 overflow-hidden bg-white border-r border-slate-200/80">
        
        {/* Soft grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#c6a87c 1px, transparent 1px), linear-gradient(90deg, #c6a87c 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="absolute top-[-100px] left-[-80px] w-[500px] h-[500px] rounded-full bg-[#c6a87c]/10 blur-[120px] pointer-events-none" />

        {/* LARGE LOGO */}
        <div className="relative z-10">
          <div className="inline-block transition-transform hover:scale-105 duration-200">
            <Image
              src="/logo/logoluna.svg"
              alt="Lunaforex Logo"
              width={240}
              height={75}
              className="h-14 sm:h-16 w-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 space-y-8 max-w-xl">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#fdfbf7] border border-[#e8d5b7] rounded-full px-3.5 py-1 mb-6 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#b89766]" />
              <span className="text-xs font-extrabold text-[#b89766] tracking-widest uppercase font-mono">
                Admin Security Portal
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Lunaforex<br />
              <span className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] bg-clip-text text-transparent">
                Management System
              </span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
              ศูนย์กลางจัดการระบบ Lunaforex — ยืนยันตัวตน 2 ขั้นตอนด้วยรหัส PIN ความปลอดภัย 6 หลัก มาตรฐานสถาบัน
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs hover:border-[#c6a87c] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-[#fdfbf7] border border-[#e8d5b7] flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-[#b89766]" />
                </div>
                <p className="text-slate-900 font-black text-xl font-mono leading-none mb-1">{value}</p>
                <p className="text-slate-500 text-xs font-semibold">{label}</p>
              </div>
            ))}
          </div>

          {/* Ticker */}
          <div className="flex items-center gap-4 overflow-hidden pt-2 border-t border-slate-100">
            {["EUR/USD 1.0842 ▲", "XAU/USD 2,318 ▲", "BTC/USD 67,420 ▼", "GBP/USD 1.2701 ▲"].map((t) => (
              <span key={t} className="text-xs text-slate-400 whitespace-nowrap font-mono font-semibold">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs text-slate-400 font-medium">
            © 2026 Lunaforex. 2FA PIN Security Protected — authorized personnel only.
          </p>
        </div>
      </div>

      {/* ─── Right Panel (Form) ─── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50/40">
        <div className="w-full max-w-[420px]">

          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Image
              src="/logo/logoluna.svg"
              alt="Lunaforex Logo"
              width={200}
              height={60}
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* Login Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 space-y-6">
            
            {/* STEP 1: EMAIL & PASSWORD */}
            {step === 1 ? (
              <>
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-2xl bg-[#fdfbf7] border border-[#e8d5b7] flex items-center justify-center text-[#b89766] mb-3">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">เข้าสู่ระบบแอดมิน</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    ขั้นตอนที่ 1: กรอกอีเมลและรหัสผ่านผู้ดูแลระบบ
                  </p>
                </div>

                <form onSubmit={handleSubmitStep1} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      อีเมลผู้ใช้งาน (Email)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="admin@lunaforex.com"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#c6a87c] focus:bg-white transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      รหัสผ่าน (Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 pr-11 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#c6a87c] focus:bg-white transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-3.5 rounded-xl text-xs transition-all shadow-md shadow-[#c6a87c]/20 active:scale-98"
                  >
                    {loading ? "กำลังตรวจสอบสิทธิ์..." : "ถัดไป / ยืนยันรหัสผ่าน"}
                  </button>
                </form>
              </>
            ) : (
              /* STEP 2: 6-DIGIT SECURITY PIN CODE */
              <>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#b89766] hover:text-[#997a49] transition-colors mb-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>ย้อนกลับไปแก้ไขรหัสผ่าน</span>
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-[#fdfbf7] border border-[#e8d5b7] flex items-center justify-center text-[#b89766] mb-3">
                    <KeyRound className="w-5 h-5" />
                  </div>

                  <h2 className="text-2xl font-black text-slate-900">รหัส PIN ความปลอดภัย 6 หลัก</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    กรอกรหัส PIN 6 หลักสำหรับเข้าใช้งานระบบแอดมิน
                  </p>
                </div>

                <form onSubmit={handleSubmitStep2} className="space-y-5 text-xs font-sans">
                  {/* 6 PIN Digit Input Boxes */}
                  <div className="flex justify-between items-center gap-2">
                    {pinDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { pinInputRefs.current[idx] = el; }}
                        type="password"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinChange(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        className="w-12 h-14 bg-slate-50 border-2 border-slate-200 focus:border-[#c6a87c] focus:bg-white text-center font-mono font-black text-xl text-slate-900 rounded-xl outline-none transition-all shadow-2xs"
                      />
                    ))}
                  </div>



                  {error && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-3.5 rounded-xl text-xs transition-all shadow-md shadow-[#c6a87c]/20 active:scale-98"
                  >
                    {loading ? "กำลังยืนยันรหัส PIN..." : "ยืนยันรหัส PIN เข้าสู่ระบบ"}
                  </button>
                </form>
              </>
            )}

            {/* Security Note */}
            <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-slate-400 text-[11px] font-medium leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#b89766] shrink-0 mt-0.5" />
              <p>ระบบรักษาความปลอดภัย 2FA ด้วยรหัส PIN 6 หลัก ห้ามเข้าสู่ระบบโดยไม่ได้รับอนุญาต</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
