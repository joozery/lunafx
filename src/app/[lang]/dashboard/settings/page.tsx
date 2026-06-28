import { getSession } from "@/lib/session";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { hasLocale, type Locale } from "@/dictionaries";
import { redirect, notFound } from "next/navigation";
import { User, ShieldCheck, KeyRound, Bell } from "lucide-react";

export default async function SettingsPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = await props.params;
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  const session = await getSession();
  if (!session) redirect(`/${lang}/login`);

  const db = await getDb();
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.userId) },
    { projection: { passwordHash: 0 } }
  );
  if (!user) redirect(`/${lang}/login`);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isth ? "การตั้งค่า" : "Settings"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isth ? "จัดการข้อมูลส่วนตัว ความปลอดภัย และการตั้งค่าบัญชีของคุณ" : "Manage your personal information, security, and account settings."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#c6a87c]/10 text-[#a38458] rounded-xl font-medium transition-colors text-left">
            <User className="w-5 h-5" />
            <span className="text-sm">{isth ? "ข้อมูลส่วนตัว" : "Profile"}</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-medium transition-colors text-left">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm">{isth ? "การยืนยันตัวตน" : "Verification"}</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-medium transition-colors text-left">
            <KeyRound className="w-5 h-5" />
            <span className="text-sm">{isth ? "ความปลอดภัย" : "Security"}</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-medium transition-colors text-left">
            <Bell className="w-5 h-5" />
            <span className="text-sm">{isth ? "การแจ้งเตือน" : "Notifications"}</span>
          </button>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{isth ? "ข้อมูลส่วนตัว" : "Personal Information"}</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isth ? "ชื่อ" : "First Name"}</label>
                  <input 
                    type="text" 
                    defaultValue={user.firstName}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-2">{isth ? "ชื่อตามบัตรประชาชน ไม่สามารถเปลี่ยนได้ด้วยตัวเอง" : "Name as per ID, cannot be changed manually."}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isth ? "นามสกุล" : "Last Name"}</label>
                  <input 
                    type="text" 
                    defaultValue={user.lastName}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isth ? "อีเมล" : "Email Address"}</label>
                  <input 
                    type="email" 
                    defaultValue={user.email}
                    disabled
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isth ? "เบอร์โทรศัพท์" : "Phone Number"}</label>
                  <input 
                    type="tel" 
                    defaultValue={user.phone}
                    className="w-full bg-white border border-gray-300 focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] rounded-lg px-4 py-3 text-sm text-gray-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="button" className="bg-[#c6a87c] hover:bg-[#b0936b] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all shadow-md shadow-[#c6a87c]/30">
                  {isth ? "บันทึกการเปลี่ยนแปลง" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
