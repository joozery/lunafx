"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import type { ForgotPasswordDictionary } from "@/dictionaries";

type Step = "email" | "otp" | "done";

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#c6a87c] transition-colors";

export function ForgotPasswordForm({
  dict,
  lang,
}: {
  dict: ForgotPasswordDictionary;
  lang: string;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), lang }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Error sending OTP");
        return;
      }
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(dict.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Error resetting password");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle2 className="w-14 h-14 text-[#c6a87c]" />
        </div>
        <h2 className="text-xl font-bold text-white">{dict.successMessage}</h2>
        <p className="text-sm text-gray-400">{dict.successSubMessage}</p>
        <Link
          href={`/${lang}/login`}
          className="inline-block mt-4 w-full bg-[#c6a87c] text-black font-semibold py-3 rounded-md hover:bg-[#b09265] transition-colors text-center text-sm"
        >
          {dict.backToLogin}
        </Link>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <form className="space-y-5" onSubmit={handleReset}>
        <div className="rounded-lg bg-[#c6a87c]/10 border border-[#c6a87c]/30 px-4 py-3">
          <p className="text-sm text-[#c6a87c]">{dict.otpSentMessage}</p>
          <p className="text-xs text-gray-400 mt-1">{email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {dict.otpLabel}
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={dict.otpPlaceholder}
            className={`${inputClass} tracking-widest text-center text-lg font-mono`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {dict.newPasswordLabel}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={dict.newPasswordPlaceholder}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c6a87c] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {dict.confirmPasswordLabel}
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={dict.confirmPasswordPlaceholder}
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c6a87c] transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-[#c6a87c] text-black font-semibold py-3 rounded-md hover:bg-[#b09265] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? dict.submitting : dict.submit}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("email");
            setOtp("");
            setNewPassword("");
            setConfirmPassword("");
            setError("");
          }}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[#c6a87c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {dict.resendOtp}
        </button>
      </form>
    );
  }

  // Step: email
  return (
    <form className="space-y-5" onSubmit={handleSendOtp}>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {dict.emailLabel}
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={dict.emailPlaceholder}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#c6a87c] text-black font-semibold py-3 rounded-md hover:bg-[#b09265] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? dict.sending : dict.sendOtp}
      </button>

      <Link
        href={`/${lang}/login`}
        className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-[#c6a87c] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {dict.backToLogin}
      </Link>
    </form>
  );
}
