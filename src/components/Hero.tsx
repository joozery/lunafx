import Link from "next/link";
import { ShieldCheck, Zap, Headphones, Coins } from "lucide-react";
import type { Dictionary, Locale } from "@/dictionaries";

const TRUST_ICONS = [ShieldCheck, Zap, Headphones, Coins];

export function Hero({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <section className="relative pt-28 pb-32 overflow-hidden min-h-[70vh] flex items-center">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/cover/cover.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay to ensure text is readable if the video is too bright */}
        <div className="absolute inset-0 bg-[#0a0f1a]/60"></div>
        {/* Gradient fade to bottom to blend with the next section */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0f1a] to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 text-[#c6a87c] text-sm font-bold tracking-widest uppercase">
              {dict.hero.badge}
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white">
              {dict.hero.titleLines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </h1>
            <p className="text-gray-400 text-lg max-w-md">
              {dict.hero.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href={`/${lang}/open-account`} className="bg-[#c6a87c] text-black px-8 py-3.5 rounded-md font-semibold hover:bg-[#b09265] transition-all">
                {dict.hero.openAccount}
              </Link>
              <button className="border border-white/20 text-white px-8 py-3.5 rounded-md font-semibold hover:bg-white/5 transition-all backdrop-blur-sm">
                {dict.hero.tryDemo}
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-8 text-sm text-gray-400">
              {dict.hero.trust.map((item, i) => {
                const Icon = TRUST_ICONS[i];
                return (
                  <div key={item.title} className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[#c6a87c]" />
                    <div className="leading-tight">{item.title}<br />{item.subtitle}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content / Floating Price Cards */}
          <div className="relative h-full flex flex-col justify-end min-h-[400px]">
            {/* The video itself acts as the main graphic, so we removed the placeholder icon */}

            {/* Floating Price Cards */}
            <div className="absolute bottom-0 right-0 w-full lg:w-auto flex justify-between gap-6 bg-[#0a0f1a]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
              {[
                { pair: "EURUSD", price: "1.08234", change: "+0.43%" },
                { pair: "XAUUSD", price: "2,345.12", change: "+0.65%" },
                { pair: "GBPUSD", price: "1.26564", change: "-0.21%", down: true },
                { pair: "US30", price: "39,129.0", change: "+0.31%" },
              ].map((item) => (
                <div key={item.pair} className="text-center text-white">
                  <div className="text-sm text-gray-400 mb-2">{item.pair}</div>
                  <div className="font-mono font-bold text-xl mb-1">{item.price}</div>
                  <div className={`text-sm ${item.down ? 'text-red-400' : 'text-emerald-400'}`}>{item.change}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
