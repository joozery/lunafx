import Link from "next/link";
import { ArrowRight, Coins, BarChart3, Droplet, Apple, Box } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

const MARKET_ICONS = [Coins, Box, BarChart3, Droplet, Apple];

export function MarketsSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="py-32 bg-[#05080f] text-white relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#c6a87c]/5 via-[#05080f] to-[#05080f]"></div>

      {/* Decorative Wave/Lines Placeholder - CSS Gradients to simulate the lines */}
      <div className="absolute bottom-0 left-0 w-full h-[500px] opacity-20"
           style={{ background: 'repeating-radial-gradient(circle at 0% 100%, transparent, transparent 40px, rgba(198, 168, 124, 0.1) 41px, transparent 42px)' }}>
      </div>
      <div className="absolute bottom-0 right-0 w-full h-[500px] opacity-20"
           style={{ background: 'repeating-radial-gradient(circle at 100% 100%, transparent, transparent 40px, rgba(198, 168, 124, 0.1) 41px, transparent 42px)' }}>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="text-[#c6a87c] text-[11px] font-bold tracking-widest uppercase mb-4">{dict.markets.label}</div>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-white">{dict.markets.title}</h2>
          </div>
          <Link href="#" className="text-sm font-medium text-gray-300 hover:text-[#c6a87c] flex items-center gap-2 transition-colors pb-1">
            {dict.markets.viewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {dict.markets.items.map((market, i) => {
            const Icon = MARKET_ICONS[i];
            return (
              <div
                key={market.title}
                className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl hover:bg-white/[0.04] hover:border-[#c6a87c]/40 transition-all duration-300 group cursor-pointer backdrop-blur-sm"
              >
                <div className="flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    <Icon className="w-10 h-10 text-[#c6a87c] stroke-[1]" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold mb-2 text-white/90 group-hover:text-white transition-colors">{market.title}</h3>
                    <p className="text-[13px] text-gray-400 mb-6 leading-relaxed min-h-[60px] group-hover:text-gray-300 transition-colors">
                      {market.desc}
                    </p>
                    <div className="text-[#c6a87c] text-[13px] font-medium flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      {dict.markets.viewMore} <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
