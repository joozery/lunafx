import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { hasLocale, type Locale } from "@/dictionaries";
import { LogoutButton } from "@/components/LogoutButton";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Search, Bell, ArrowDownToLine, Server, Globe } from "lucide-react";

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/${lang}/login`);
  }

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.userId) },
    { projection: { passwordHash: 0 } }
  );

  if (!user) {
    redirect(`/${lang}/login`);
  }

  const isth = (lang as Locale) === "th";
  const otherLang = lang === "th" ? "en" : "th";
  
  const cleanUser = {
    firstName: user.firstName || "Trader",
    lastName: user.lastName || "",
    status: user.status || "active",
    accountType: user.accountType || "Standard",
    _id: user._id.toString(),
    createdAt: user.createdAt,
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden selection:bg-[#c6a87c] selection:text-white">
      <DashboardSidebar lang={lang} user={cleanUser} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Ambient Glow background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-[#c6a87c]/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
        
        {/* Top Header */}
        <header className="h-20 px-6 sm:px-10 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-xl z-20 sticky top-0 shadow-2xs">
          
          {/* Left: Search input */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 border border-slate-200/60 rounded-xl px-3.5 py-2 w-64 sm:w-80 focus-within:border-[#c6a87c] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c6a87c]/20 transition-all shadow-2xs">
              <Search className="w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder={isth ? "ค้นหา บัญชีเทรด, ตลาด, ธุรกรรม... (⌘K)" : "Search accounts, pairs, activity... (⌘K)"} 
                className="bg-transparent border-none outline-none text-xs text-slate-800 px-2.5 w-full placeholder:text-slate-400"
              />
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/70 rounded">⌘K</kbd>
            </div>

            {/* Server Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/60 text-xs text-slate-600 font-mono">
              <Server className="w-3.5 h-3.5 text-emerald-500" />
              <span>Luna-Real01</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* Right: Actions, Notifications & Profile */}
          <div className="flex items-center gap-3.5">
            {/* Quick Deposit Header CTA */}
            <Link
              href={`/${lang}/dashboard/funds`}
              className="hidden sm:flex items-center gap-1.5 bg-[#c6a87c] hover:bg-[#b0936b] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs hover:shadow-md shadow-[#c6a87c]/20"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{isth ? "ฝากเงิน" : "Deposit"}</span>
            </Link>

            {/* Language Switcher Link */}
            <Link
              href={`/${otherLang}/dashboard`}
              className="p-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1 uppercase"
              title={isth ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{otherLang}</span>
            </Link>

            {/* Notification Bell */}
            <button className="relative p-2.5 text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 rounded-xl">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center text-white font-extrabold text-sm shadow-xs hidden sm:flex">
                {cleanUser.firstName[0]}
              </div>
              <LogoutButton lang={lang} />
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 z-10 scrollbar-hide">
          {props.children}
        </main>
      </div>
    </div>
  );
}
