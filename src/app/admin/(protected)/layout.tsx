import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { AdminMobileShell } from "@/components/admin/AdminMobileShell";
import { AdminTableLabeler } from "@/components/admin/AdminTableLabeler";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex h-screen bg-[#f4f5f7] overflow-hidden">
      <AdminSidebar adminName={`${admin.firstName} ${admin.lastName}`} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AdminMobileShell adminName={`${admin.firstName} ${admin.lastName}`} />
        {/* Top bar */}
        {/* relative z-40: backdrop-blur creates a stacking context, so without it the page content paints over the bell dropdown */}
        <header className="hidden md:flex relative z-40 h-14 bg-white/80 backdrop-blur-sm border-b border-[#e8d4b0]/60 items-center px-6 shrink-0">
          <div className="ml-auto flex items-center gap-4">
            <AdminNotificationBell />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-[#c6a87c]/20">
                {admin.firstName?.[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-none">{admin.firstName} {admin.lastName}</p>
                <p className="text-[10px] text-[#c6a87c] mt-0.5 font-medium">Administrator</p>
              </div>
            </div>
          </div>
        </header>
        {/* bottom padding on phones keeps content clear of the fixed tab bar */}
        <main className="admin-main flex-1 overflow-y-auto overflow-x-hidden p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6 lg:p-8">
          {children}
          <AdminTableLabeler />
        </main>
      </div>
    </div>
  );
}
