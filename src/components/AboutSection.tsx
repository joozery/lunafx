import { ChevronRight } from "lucide-react";
import type { Dictionary } from "@/dictionaries";

export function AboutSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="py-32 bg-white text-black">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="text-sm font-bold text-[#c6a87c] tracking-widest uppercase">{dict.about.label}</div>
          <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
            {dict.about.titleLines.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {dict.about.description}
          </p>
          <button className="bg-[#111827] text-white px-6 py-3 rounded-md font-medium flex items-center gap-2 hover:bg-black transition-colors">
            {dict.about.learnMore} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#0a0f1a] rounded-3xl p-10 text-white relative overflow-hidden h-[400px] flex flex-col justify-center">
          {/* Background Earth Image */}
          <div className="absolute inset-0 bg-[url('/10.png')] bg-cover bg-right"></div>

          <div className="relative z-10 space-y-10">
            {dict.about.stats.map((stat, i) => (
              <div key={stat.label}>
                <div className={i === 0 ? "text-5xl font-bold text-[#c6a87c] mb-2" : i === 1 ? "text-4xl font-bold mb-2" : "text-3xl font-bold mb-2"}>
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
