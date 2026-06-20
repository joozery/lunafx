import { ArrowRight, Globe, Monitor, Smartphone } from "lucide-react";
import Image from "next/image";
import type { Dictionary } from "@/dictionaries";

const PLATFORM_ICONS = [Globe, Monitor, Smartphone];

export function PlatformsSection({ dict }: { dict: Dictionary }) {
  return (
    <section className="py-32 bg-[#f9f9f9] text-black">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Column: Platform Image */}
        <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
          <Image
            src="/tap.png"
            alt="Platform Mockups"
            width={800}
            height={600}
            className="w-full h-auto object-contain drop-shadow-2xl"
            quality={100}
          />
        </div>

        {/* Right Column: Text Content */}
        <div className="space-y-8">
          <div>
            <div className="text-[11px] font-bold text-[#c6a87c] tracking-widest uppercase mb-4">{dict.platforms.label}</div>
            <h2 className="text-4xl lg:text-[2.5rem] font-bold mb-6 text-[#111827] tracking-tight leading-tight">{dict.platforms.title}</h2>
            <p className="text-gray-600 text-[15px] leading-relaxed max-w-xl">
              {dict.platforms.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 pb-4">
            {dict.platforms.items.map((item, i) => {
              const Icon = PLATFORM_ICONS[i];
              return (
                <div key={item.title} className="flex sm:flex-col lg:flex-row gap-4 items-start">
                  <Icon className="w-8 h-8 text-[#c6a87c] shrink-0 stroke-[1]" />
                  <div>
                    <h4 className="font-bold text-[15px] text-[#111827] mb-1">{item.title}</h4>
                    <p className="text-gray-500 text-[13px] leading-snug">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="bg-[#0f172a] text-white px-7 py-3.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-black transition-colors shadow-lg shadow-black/10">
            {dict.platforms.cta} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
