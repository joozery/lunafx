import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { Plus, TrendingUp, MonitorPlay } from "lucide-react";

export default async function AccountsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isth ? "บัญชีเทรด" : "Trading Accounts"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isth ? "จัดการบัญชีเทรดจริงและบัญชีทดลองของคุณ" : "Manage your live and demo trading accounts."}
          </p>
        </div>
        <button className="bg-[#c6a87c] hover:bg-[#b0936b] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-md shadow-[#c6a87c]/20 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {isth ? "เปิดบัญชีใหม่" : "Open New Account"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center py-20 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
          <TrendingUp className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isth ? "ยังไม่มีบัญชีเทรด" : "No Trading Accounts Found"}
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          {isth
            ? "คลิกปุ่มเปิดบัญชีใหม่เพื่อสร้างบัญชีเทรดและเข้าถึงตลาดระดับโลกกับ Lunaforex"
            : "Click the open new account button to create your first trading account and access global markets."}
        </p>
        <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm border border-gray-300 transition-colors flex items-center gap-2 shadow-sm">
          <MonitorPlay className="w-4 h-4 text-gray-500" />
          {isth ? "ทดลองเปิดบัญชี Demo" : "Try Demo Account"}
        </button>
      </div>
    </div>
  );
}
