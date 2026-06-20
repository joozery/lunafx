"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { locales, type Locale } from "@/dictionaries";

const LOCALE_LABELS: Record<Locale, string> = { en: "EN", th: "TH" };
const LOCALE_COOKIE = "NEXT_LOCALE";

function persistLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000`;
}

export function LanguageSwitcher({ lang }: { lang: Locale }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(locale: Locale) {
    setOpen(false);
    if (locale === lang) return;
    persistLocaleCookie(locale);
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/") || "/");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium flex items-center gap-1 text-gray-700 hover:text-[#c6a87c] ml-2"
      >
        {LOCALE_LABELS[lang]} <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-24 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-50">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => switchTo(locale)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-[#c6a87c]/10 transition-colors ${
                locale === lang ? "text-[#c6a87c] font-semibold" : "text-gray-700"
              }`}
            >
              {LOCALE_LABELS[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
