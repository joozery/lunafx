import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { Calendar, AlertCircle } from "lucide-react";

export default async function AnalyticsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  const events = [
    { time: "19:30", currency: "USD", event: "Non Farm Payrolls (NFP)", impact: "High", actual: "272K", forecast: "185K", previous: "165K" },
    { time: "19:30", currency: "USD", event: "Unemployment Rate", impact: "High", actual: "4.0%", forecast: "3.9%", previous: "3.9%" },
    { time: "15:00", currency: "EUR", event: "ECB Interest Rate Decision", impact: "High", actual: "4.25%", forecast: "4.25%", previous: "4.50%" },
    { time: "13:00", currency: "GBP", event: "GDP (MoM)", impact: "Medium", actual: "0.0%", forecast: "0.0%", previous: "0.4%" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isth ? "ปฏิทินเศรษฐกิจ (Economic Calendar)" : "Economic Calendar"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isth ? "ติดตามข่าวสารและตัวเลขเศรษฐกิจที่มีผลกระทบต่อตลาด Forex" : "Track economic news and data releases impacting the Forex market."}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">{isth ? "วันนี้" : "Today"}</h3>
          </div>
          <select className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-1.5 outline-none focus:border-[#c6a87c]">
            <option>{isth ? "สัปดาห์นี้" : "This Week"}</option>
            <option>{isth ? "สัปดาห์หน้า" : "Next Week"}</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-medium">{isth ? "เวลา" : "Time"}</th>
                <th className="p-4 font-medium">{isth ? "สกุลเงิน" : "Currency"}</th>
                <th className="p-4 font-medium">{isth ? "เหตุการณ์" : "Event"}</th>
                <th className="p-4 font-medium">{isth ? "ผลกระทบ" : "Impact"}</th>
                <th className="p-4 font-medium">{isth ? "ตัวเลขจริง" : "Actual"}</th>
                <th className="p-4 font-medium">{isth ? "คาดการณ์" : "Forecast"}</th>
                <th className="p-4 font-medium">{isth ? "ครั้งก่อน" : "Previous"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events.map((ev, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm font-semibold text-gray-700">{ev.time}</td>
                  <td className="p-4">
                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                      {ev.currency}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900">{ev.event}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className={`w-2 h-2 rounded-full ${idx < (ev.impact === 'High' ? 3 : 2) ? (ev.impact === 'High' ? 'bg-red-500' : 'bg-amber-500') : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-bold text-gray-900">{ev.actual}</td>
                  <td className="p-4 text-sm text-gray-500">{ev.forecast}</td>
                  <td className="p-4 text-sm text-gray-500">{ev.previous}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-amber-50/50 border-t border-amber-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            {isth 
              ? "โปรดระมัดระวังในการเทรดช่วงเวลาที่มีข่าวสำคัญ (High Impact) เนื่องจากตลาดอาจมีความผันผวนรุนแรง และสเปรดอาจกว้างกว่าปกติ" 
              : "Please trade with caution during High Impact news releases. The market can be highly volatile, and spreads may widen."}
          </p>
        </div>
      </div>
    </div>
  );
}
