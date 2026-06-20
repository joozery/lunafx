"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { LoginDictionary } from "@/dictionaries";

export function LoginForm({ dict }: { dict: LoginDictionary }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          {dict.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder={dict.emailPlaceholder}
          className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#c6a87c] transition-colors"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            {dict.passwordLabel}
          </label>
          <a href="#" className="text-sm text-[#c6a87c] hover:text-[#d8bc91] transition-colors">
            {dict.forgotPassword}
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder={dict.passwordPlaceholder}
            className="w-full bg-white/5 border border-white/15 rounded-md px-4 py-3 pr-11 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#c6a87c] transition-colors"
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

      <label className="flex items-center gap-2 text-sm text-gray-400">
        <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#c6a87c]" />
        {dict.rememberMe}
      </label>

      <button
        type="submit"
        className="w-full bg-[#c6a87c] text-black font-semibold py-3 rounded-md hover:bg-[#b09265] transition-colors"
      >
        {dict.submit}
      </button>
    </form>
  );
}
