import { ShieldCheck, BarChart2, Cuboid, Headphones, Clock } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

const STAT_ICONS = [ShieldCheck, BarChart2, Cuboid, Headphones, Clock];

export function StatsBar({ dict }: { dict: Dictionary }) {
  return (
    <div className="max-w-7xl mx-auto px-6 relative z-20 -mt-20 -mb-20">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-gray-100">
        {dict.statsBar.stats.map((stat, i) => {
          const Icon = STAT_ICONS[i];
          return (
            <div key={stat.sub} className="flex-1 flex gap-5 items-start p-6 lg:p-8 hover:bg-gray-50/50 transition-colors group">
              <div className="shrink-0 pt-1 group-hover:scale-110 transition-transform duration-500 ease-out">
                <Icon className="w-8 h-8 text-[#c6a87c] stroke-[1.2]" />
              </div>
              <div className="flex flex-col text-left">
                <div className="text-3xl font-bold text-[#111827] tracking-tight leading-none mb-2">
                  {stat.title}
                </div>
                <div className="text-[11px] uppercase tracking-widest text-[#c6a87c] font-bold mb-1.5">
                  {stat.sub}
                </div>
                <div className="text-[12px] text-gray-500 whitespace-pre-line leading-relaxed font-medium">
                  {stat.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
