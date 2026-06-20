import Link from "next/link";
import Image from "next/image";
import type { Dictionary, Locale } from "@/dictionaries";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Navbar({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo Section */}
        <div className="flex items-center">
          <Link href={`/${lang}`}>
            <Image
              src="/logo/logoluna.svg"
              alt="Lunaforex Logo"
              width={200}
              height={60}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
          {dict.nav.links.map((link) => (
            <Link key={link.href} href={`/${lang}${link.href}`} className="hover:text-[#c6a87c] transition-colors">{link.label}</Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <Link href={`/${lang}/login`} className="text-sm font-medium text-gray-700 px-5 py-2 rounded-md border border-[#c6a87c] hover:bg-[#c6a87c]/5 transition-colors">
            {dict.nav.login}
          </Link>
          <Link href={`/${lang}/open-account`} className="bg-[#c6a87c] text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-[#b09265] transition-colors shadow-sm">
            {dict.nav.openAccount}
          </Link>
          <LanguageSwitcher lang={lang} />
        </div>

      </div>
    </nav>
  );
}
