import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { hasLocale, type Locale } from "@/dictionaries";
import { 
  LayoutDashboard, 
  TrendingUp, 
  ArrowUpRight, 
  ShieldCheck,
  CreditCard,
  User,
  Settings
} from "lucide-react";

export default async function DashboardOverviewPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const session = await getSession();
  if (!session) redirect(`/${lang}/login`);

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.userId) },
    { projection: { passwordHash: 0 } }
  );
  if (!user) redirect(`/${lang}/login`);

  const fullName = `${user.firstName} ${user.lastName}`;
  const joinDate = new Date(user.createdAt).toLocaleDateString(
    lang === "th" ? "th-TH" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
  const isth = (lang as Locale) === "th";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome & Portfolio Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Welcome Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#c6a87c]/20 to-transparent rounded-full blur-[60px]" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isth ? `สวัสดี, ${fullName}` : `Hello, ${fullName}`}
            </h1>
            <p className="text-gray-600 text-sm max-w-md">
              {isth 
                ? "ยินดีต้อนรับสู่แดชบอร์ด Lunaforex ของคุณ จัดการบัญชีเทรด ดูรายงาน และทำธุรกรรมได้จากที่นี่"
                : "Welcome to your Lunaforex dashboard. Manage your trading accounts, view reports, and perform transactions."}
            </p>
            
            <div className="mt-8 flex gap-4">
              <Link href={`/${lang}/dashboard/funds`} className="bg-[#c6a87c] hover:bg-[#b0936b] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all shadow-md hover:shadow-lg shadow-[#c6a87c]/30 text-center">
                {isth ? "ฝากเงิน" : "Deposit Funds"}
              </Link>
              <Link href={`/${lang}/dashboard/accounts`} className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-2.5 rounded-lg text-sm border border-gray-300 transition-colors shadow-sm text-center">
                {isth ? "เปิดบัญชีใหม่" : "Open New Account"}
              </Link>
            </div>
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <p className="text-gray-500 text-sm font-medium mb-2">{isth ? "ยอดเงินคงเหลือรวม (USD)" : "Total Balance (USD)"}</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">$0.00</h2>
          
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 w-fit px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-100">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>0.00%</span>
            <span className="text-emerald-600/70 ml-1">{isth ? "เดือนนี้" : "this month"}</span>
          </div>
        </div>
      </div>

      {/* Account Quick Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: ShieldCheck, title: isth ? "สถานะบัญชี" : "Status", value: isth ? "ใช้งานได้" : user.status, valueColor: "text-emerald-600" },
          { icon: CreditCard, title: isth ? "ประเภท" : "Type", value: user.accountType, valueColor: "text-gray-900 capitalize" },
          { icon: User, title: isth ? "รหัสลูกค้า" : "Client ID", value: user._id.toString().slice(-8).toUpperCase(), valueColor: "text-gray-900 font-mono uppercase" },
          { icon: Settings, title: isth ? "เข้าร่วมเมื่อ" : "Joined", value: joinDate, valueColor: "text-gray-900 text-sm" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#c6a87c]/50 transition-colors shadow-sm hover:shadow-md">
            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
              <stat.icon className="w-4 h-4 text-[#c6a87c]" />
            </div>
            <p className="text-xs text-gray-500 mb-1">{stat.title}</p>
            <p className={`font-semibold ${stat.valueColor}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Trading Accounts Overview */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900">{isth ? "บัญชีเทรดที่เปิดใช้งาน" : "Active Trading Accounts"}</h3>
          <Link href={`/${lang}/dashboard/accounts`} className="text-[#c6a87c] text-sm hover:text-[#b0936b] transition-colors font-medium">
            {isth ? "ดูทั้งหมด" : "View All"}
          </Link>
        </div>
        <div className="p-10 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
            <LayoutDashboard className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold mb-2">
            {isth ? "ยังไม่มีบัญชีเทรด" : "No Trading Accounts"}
          </p>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            {isth
              ? "คุณยังไม่ได้เปิดบัญชีเทรดจริง กรุณาเปิดบัญชีเพื่อเริ่มต้นการเทรดในตลาดโลก"
              : "You haven't opened a live trading account yet. Open one to start trading in global markets."}
          </p>
          <Link href={`/${lang}/dashboard/accounts`} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm border border-gray-300 transition-colors flex items-center gap-2 shadow-sm">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            {isth ? "เปิดบัญชีเทรดเลย" : "Open Trading Account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
