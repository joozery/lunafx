import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex h-screen bg-[#f4f5f7] overflow-hidden">
      <AdminSidebar adminName={`${admin.firstName} ${admin.lastName}`} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white/80 backdrop-blur-sm border-b border-[#e8d4b0]/60 flex items-center px-6 shrink-0">
          <div className="ml-auto flex items-center gap-4">
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
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
