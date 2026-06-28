"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import type { OpenAccountDictionary, Locale } from "@/dictionaries";

export function OpenAccountForm({ dict, lang }: { dict: OpenAccountDictionary; lang: Locale }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(dict.passwordMismatch);
      return;
    }

    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      password,
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push(`/${lang}/dashboard`);
        return;
      }

      const json = await res.json();
      setError(json.error ?? "Something went wrong");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#c6a87c] transition-colors";

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
            {dict.firstNameLabel}
          </label>
          <input id="firstName" name="firstName" type="text" required placeholder={dict.firstNamePlaceholder} className={inputClass} />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
            {dict.lastNameLabel}
          </label>
          <input id="lastName" name="lastName" type="text" required placeholder={dict.lastNamePlaceholder} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          {dict.emailLabel}
        </label>
        <input id="email" name="email" type="email" required placeholder={dict.emailPlaceholder} className={inputClass} />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
          {dict.phoneLabel}
        </label>
        <input id="phone" name="phone" type="tel" required placeholder={dict.phonePlaceholder} className={inputClass} />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          {dict.passwordLabel}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={dict.passwordPlaceholder}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c6a87c] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
          {dict.confirmPasswordLabel}
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
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
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#c6a87c] transition-colors"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <label className="flex items-start gap-2 text-sm text-gray-400">
        <input
          type="checkbox"
          required
          className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-[#c6a87c]"
        />
        <span>
          {dict.termsBefore}
          <Link href={`/${lang}/terms-and-conditions`} className="text-[#c6a87c] hover:text-[#d8bc91] transition-colors">
            {dict.termsLabel}
          </Link>
          {dict.termsBetween}
          <Link href={`/${lang}/privacy-policy`} className="text-[#c6a87c] hover:text-[#d8bc91] transition-colors">
            {dict.privacyLabel}
          </Link>
          {dict.termsAfter}
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#c6a87c] text-black font-semibold py-3 rounded-md hover:bg-[#b09265] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {dict.submit}
      </button>
    </form>
  );
}
