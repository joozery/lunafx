import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minimize, CircleSlash, ArrowRightLeft, ShieldAlert } from "lucide-react";
import type { Dictionary, Locale } from "@/dictionaries";

const socialIcons = [
  {
    name: "Facebook",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    )
  },
  {
    name: "Twitter",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
      </svg>
    )
  },
  {
    name: "LinkedIn",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    )
  },
  {
    name: "Instagram",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  },
  {
    name: "YouTube",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    )
  }
];

export function Footer({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  const { footer } = dict;

  return (
    <footer className="bg-[#0a0f1a] text-gray-400">

      {/* Advantages Section */}
      <div className="border-t border-white/5 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            <div className="relative">
              <div className="text-[10px] font-bold text-[#c6a87c] tracking-widest uppercase mb-4 absolute -top-8 left-0 whitespace-nowrap">
                {footer.advantagesLabel}
              </div>
              <div className="flex gap-4 items-start pt-2">
                <Minimize className="w-10 h-10 text-[#c6a87c] shrink-0 stroke-[1]" />
                <div>
                  <h4 className="text-white font-semibold text-base mb-1">{footer.advantages[0].title}</h4>
                  <p className="text-sm">{footer.advantages[0].desc}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-start pt-2">
              <CircleSlash className="w-10 h-10 text-[#c6a87c] shrink-0 stroke-[1]" />
              <div>
                <h4 className="text-white font-semibold text-base mb-1">{footer.advantages[1].title}</h4>
                <p className="text-sm">{footer.advantages[1].desc}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start pt-2">
              <ArrowRightLeft className="w-10 h-10 text-[#c6a87c] shrink-0 stroke-[1]" />
              <div>
                <h4 className="text-white font-semibold text-base mb-1">{footer.advantages[2].title}</h4>
                <p className="text-sm">{footer.advantages[2].desc}</p>
              </div>
            </div>

            <div className="flex gap-4 items-start pt-2">
              <ShieldAlert className="w-10 h-10 text-[#c6a87c] shrink-0 stroke-[1]" />
              <div>
                <h4 className="text-white font-semibold text-base mb-1">{footer.advantages[3].title}</h4>
                <p className="text-sm">{footer.advantages[3].desc}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-x-8 gap-y-12 mb-16">

          {/* Logo & About */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 space-y-6">
            <Link href={`/${lang}`}>
              <Image
                src="/logo/logow.png"
                alt="Lunaforex Logo"
                width={200}
                height={60}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              {footer.about}
            </p>
            <div className="flex items-center gap-3">
              {socialIcons.map((social) => (
                <a key={social.name} href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-[#c6a87c] hover:text-[#c6a87c] transition-colors">
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="col-span-1">
            <h4 className="text-white font-semibold text-sm mb-6 uppercase tracking-wider">{footer.columns.markets.heading}</h4>
            <ul className="space-y-4 text-sm">
              {footer.columns.markets.links.map((link) => (
                <li key={link}><Link href="#" className="hover:text-[#c6a87c] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold text-sm mb-6 uppercase tracking-wider">{footer.columns.trading.heading}</h4>
            <ul className="space-y-4 text-sm">
              {footer.columns.trading.links.map((link) => (
                <li key={link}><Link href="#" className="hover:text-[#c6a87c] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold text-sm mb-6 uppercase tracking-wider">{footer.columns.company.heading}</h4>
            <ul className="space-y-4 text-sm">
              {footer.columns.company.links.map((link) => (
                <li key={link}><Link href="#" className="hover:text-[#c6a87c] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-semibold text-sm mb-6 uppercase tracking-wider">{footer.columns.resources.heading}</h4>
            <ul className="space-y-4 text-sm">
              {footer.columns.resources.links.map((link) => (
                <li key={link}><Link href="#" className="hover:text-[#c6a87c] transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 lg:pl-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0">
             <h4 className="text-white font-semibold text-sm mb-6 uppercase tracking-wider">{footer.newsletter.heading}</h4>
             <p className="text-sm mb-6">{footer.newsletter.description}</p>
             <div className="flex">
               <input
                 type="email"
                 placeholder={footer.newsletter.placeholder}
                 className="bg-transparent border border-white/20 rounded-l-md px-4 py-2.5 text-sm w-full focus:outline-none focus:border-[#c6a87c] text-white"
               />
               <button className="bg-[#c6a87c] hover:bg-[#b0936b] transition-colors px-4 py-2.5 rounded-r-md flex items-center justify-center text-white">
                 <ArrowRight className="w-5 h-5" />
               </button>
             </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>{footer.copyright}</p>
          <div className="flex items-center gap-6">
            <Link href={`/${lang}/privacy-policy`} className="hover:text-white transition-colors">{footer.legalLinks.privacy}</Link>
            <Link href={`/${lang}/terms-and-conditions`} className="hover:text-white transition-colors">{footer.legalLinks.terms}</Link>
            <Link href={`/${lang}/aml-policy`} className="hover:text-white transition-colors">{footer.legalLinks.aml}</Link>
          </div>
        </div>
        </div>
      </div>
    </footer>
  );
}
