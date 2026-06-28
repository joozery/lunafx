import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { hasLocale, type Locale } from "@/dictionaries";
import { LogoutButton } from "@/components/LogoutButton";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Search, Bell } from "lucide-react";

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
  // pass clean user object to client component
  const cleanUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    accountType: user.accountType,
    _id: user._id.toString(),
    createdAt: user.createdAt,
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden selection:bg-[#c6a87c] selection:text-white">
      <DashboardSidebar lang={lang} user={cleanUser} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Ambient Glows for Light Mode (Subtle) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-[#c6a87c]/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Top Header */}
        <header className="h-20 px-6 sm:px-10 flex items-center justify-between border-b border-gray-200 bg-white/60 backdrop-blur-md z-10">
          <div className="flex items-center bg-gray-100 border border-transparent rounded-full px-4 py-2 w-full max-w-xs focus-within:border-[#c6a87c]/50 focus-within:bg-white transition-all shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={isth ? "ค้นหา..." : "Search..."} 
              className="bg-transparent border-none outline-none text-sm text-gray-800 px-3 w-full placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center text-white font-bold shadow-sm hidden sm:flex">
                {cleanUser.firstName[0]}
              </div>
              <LogoutButton lang={lang} />
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 z-10 scrollbar-hide">
          {props.children}
        </main>
      </div>
    </div>
  );
}
