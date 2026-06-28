import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { Gift, Zap, Sparkles } from "lucide-react";

export default async function PromotionsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isth ? "โปรโมชั่น" : "Promotions"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isth ? "รับโบนัสและสิทธิพิเศษมากมายเพื่อเพิ่มโอกาสในการทำกำไรของคุณ" : "Claim bonuses and exclusive offers to maximize your trading potential."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Promotion 1 */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Gift className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <span className="bg-[#c6a87c] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
              {isth ? "ยอดฮิต" : "Popular"}
            </span>
            <h2 className="text-2xl font-bold text-white mb-2">100% Deposit Bonus</h2>
            <p className="text-gray-400 text-sm mb-8 max-w-sm">
              {isth 
                ? "รับโบนัสเงินฝาก 100% สูงสุดถึง $500 เพื่อเพิ่มมาร์จิ้นและให้คุณเทรดได้อย่างมั่นใจมากยิ่งขึ้น" 
                : "Get a 100% deposit bonus up to $500 to double your margin and trade with more confidence."}
            </p>
            <button className="bg-[#c6a87c] hover:bg-[#b0936b] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg">
              {isth ? "ฝากเงินเพื่อรับโบนัส" : "Deposit & Claim"}
            </button>
          </div>
        </div>

        {/* Promotion 2 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative overflow-hidden group hover:border-[#c6a87c]/50 transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Zap className="w-32 h-32 text-[#c6a87c]" />
          </div>
          <div className="relative z-10">
            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
              {isth ? "สำหรับสมาชิกใหม่" : "New Members"}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">$30 Welcome Bonus</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm">
              {isth 
                ? "เปิดบัญชีและยืนยันตัวตนวันนี้ รับทันที $30 โบนัสต้อนรับ โดยไม่ต้องฝากเงิน ถอนกำไรได้จริง" 
                : "Open an account and verify your identity today to get a $30 No Deposit Bonus. Profits are withdrawable."}
            </p>
            <button className="bg-white border-2 border-[#c6a87c] text-[#c6a87c] hover:bg-[#fef9f2] font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
              {isth ? "ยืนยันตัวตน" : "Verify Profile"}
            </button>
          </div>
        </div>

        {/* Promotion 3 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm relative overflow-hidden group hover:border-[#c6a87c]/50 transition-colors md:col-span-2">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Sparkles className="w-32 h-32 text-amber-500" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                Loyalty Program
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lunaforex VIP Rewards</h2>
              <p className="text-gray-500 text-sm max-w-md">
                {isth 
                  ? "สะสมแต้มจากการเทรดเพื่อแลกรับรางวัลพิเศษ ไม่ว่าจะเป็นเงินสด, แกดเจ็ต หรือตั๋วเครื่องบินสุดหรู" 
                  : "Earn points from your trades to redeem exclusive rewards including cash, gadgets, or luxury trips."}
              </p>
            </div>
            <button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shrink-0">
              {isth ? "ดูแคตตาล็อกของรางวัล" : "View Rewards"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
