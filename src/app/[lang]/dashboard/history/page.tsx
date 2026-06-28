import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { History, Download, Filter } from "lucide-react";

export default async function HistoryPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isth ? "ประวัติธุรกรรม" : "History"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isth ? "ดูประวัติการทำธุรกรรม ฝาก ถอน และประวัติการเทรดของคุณ" : "View your transaction, deposit, withdrawal, and trading history."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-lg text-sm border border-gray-300 transition-colors flex items-center gap-2 shadow-sm">
            <Filter className="w-4 h-4 text-gray-500" />
            {isth ? "ตัวกรอง" : "Filter"}
          </button>
          <button className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2.5 rounded-lg text-sm border border-gray-300 transition-colors flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4 text-gray-500" />
            {isth ? "ส่งออก" : "Export"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button className="px-6 py-4 text-sm font-medium border-b-2 border-[#c6a87c] text-[#a38458] whitespace-nowrap">
            {isth ? "การฝาก/ถอน" : "Funds"}
          </button>
          <button className="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-900 whitespace-nowrap">
            {isth ? "ประวัติการเทรด" : "Trades"}
          </button>
          <button className="px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-900 whitespace-nowrap">
            {isth ? "โบนัส" : "Bonuses"}
          </button>
        </div>
        
        <div className="p-10 flex flex-col items-center justify-center text-center py-24">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
            <History className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isth ? "ไม่พบประวัติ" : "No Records Found"}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            {isth
              ? "คุณยังไม่มีประวัติการทำธุรกรรมในหมวดหมู่นี้ หรือประวัติอาจอยู่นอกเหนือจากวันที่ที่คุณเลือก"
              : "You do not have any transaction records in this category, or they are outside the selected date range."}
          </p>
        </div>
      </div>
    </div>
  );
}
