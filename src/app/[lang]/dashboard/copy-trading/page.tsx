import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { TrendingUp, Users, Copy, Star } from "lucide-react";

export default async function CopyTradingPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  const masters = [
    { name: "Alpha FX", roi: "+145.2%", copiers: 1240, risk: 3, winRate: "78%" },
    { name: "Gold Scalper", roi: "+89.4%", copiers: 850, risk: 5, winRate: "82%" },
    { name: "Safe Haven", roi: "+45.1%", copiers: 2100, risk: 2, winRate: "91%" },
    { name: "Crypto King", roi: "+210.5%", copiers: 450, risk: 7, winRate: "65%" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isth ? "ก๊อปปี้เทรด" : "Copy Trading"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isth ? "คัดลอกออเดอร์จากนักเทรดมืออาชีพโดยอัตโนมัติและสร้างกำไรไปพร้อมกัน" : "Automatically copy trades from professional traders and earn alongside them."}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">{isth ? "มาสเตอร์ยอดนิยม (Top Master Traders)" : "Top Master Traders"}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-medium">{isth ? "มาสเตอร์" : "Master"}</th>
                <th className="p-4 font-medium">ROI (All Time)</th>
                <th className="p-4 font-medium">{isth ? "อัตราชนะ" : "Win Rate"}</th>
                <th className="p-4 font-medium">{isth ? "ความเสี่ยง" : "Risk Score"}</th>
                <th className="p-4 font-medium">{isth ? "ผู้คัดลอก" : "Copiers"}</th>
                <th className="p-4 font-medium text-right">{isth ? "จัดการ" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {masters.map((master, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center text-white font-bold shadow-sm">
                        {master.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{master.name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> {master.roi}
                    </span>
                  </td>
                  <td className="p-4 text-gray-900 font-semibold">{master.winRate}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-sm ${master.risk > 5 ? 'bg-red-50 text-red-600' : master.risk > 3 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {master.risk}/10
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-500 flex items-center gap-2 mt-2.5">
                    <Users className="w-4 h-4" /> {master.copiers}
                  </td>
                  <td className="p-4 text-right">
                    <button className="bg-[#c6a87c] hover:bg-[#b0936b] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-[#c6a87c]/20 inline-flex items-center gap-2">
                      <Copy className="w-4 h-4" /> {isth ? "คัดลอก" : "Copy"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
