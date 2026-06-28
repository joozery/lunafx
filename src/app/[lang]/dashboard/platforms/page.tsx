import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { Download, Monitor, Smartphone, Globe } from "lucide-react";

export default async function PlatformsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isth ? "แพลตฟอร์มเทรด" : "Trading Platforms"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isth ? "ดาวน์โหลดและเข้าใช้งานแพลตฟอร์มการเทรดระดับโลกสำหรับทุกอุปกรณ์" : "Download and access world-class trading platforms for all devices."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-[#c6a87c]/10 text-[#c6a87c] rounded-xl flex items-center justify-center mb-6">
            <Monitor className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">MetaTrader 4 (Desktop)</h2>
          <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
            {isth ? "แพลตฟอร์มยอดนิยมที่มีเครื่องมือวิเคราะห์กราฟครบครันที่สุด" : "The most popular platform with comprehensive charting tools."}
          </p>
          <button className="w-full bg-[#c6a87c] hover:bg-[#b0936b] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> {isth ? "ดาวน์โหลดสำหรับ Windows" : "Download for Windows"}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-[#c6a87c]/10 text-[#c6a87c] rounded-xl flex items-center justify-center mb-6">
            <Smartphone className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">MT4 Mobile (iOS/Android)</h2>
          <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
            {isth ? "เทรดได้ทุกที่ทุกเวลา ผ่านแอปพลิเคชันบนมือถือที่เสถียรที่สุด" : "Trade anywhere, anytime via the most stable mobile app."}
          </p>
          <div className="flex gap-2">
            <button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
               iOS
            </button>
            <button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
               Android
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-[#c6a87c]/10 text-[#c6a87c] rounded-xl flex items-center justify-center mb-6">
            <Globe className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">WebTrader</h2>
          <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
            {isth ? "เข้าเทรดผ่านเว็บเบราว์เซอร์ได้ทันทีโดยไม่ต้องติดตั้งโปรแกรม" : "Access trading instantly via web browser without installation."}
          </p>
          <button className="w-full bg-white border-2 border-[#c6a87c] text-[#c6a87c] hover:bg-[#fef9f2] font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
            <Globe className="w-4 h-4" /> {isth ? "เปิด WebTrader" : "Launch WebTrader"}
          </button>
        </div>

      </div>
    </div>
  );
}
