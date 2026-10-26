"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, ArrowLeftRight, Users, FileText, LogOut } from "lucide-react";
import { NAV_GROUPS } from "./AdminSidebar";
import { AdminNotificationBell } from "./AdminNotificationBell";

const PENDING_POLL_MS = 60_000;

/** Phone layout for the admin: top bar, slide-in menu and an app-style bottom tab bar (hidden from md up). */
export function AdminMobileShell({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, setPending] = useState({ deposits: 0, withdrawals: 0, accountRequests: 0 });

  const isActive = (href: string, exact = false) => (exact ? pathname === href : pathname.startsWith(href));

  // close the menu after navigating
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // lock page scroll while the menu is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  useEffect(() => {
    const load = () =>
      fetch("/api/admin/notifications", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.pending && setPending(d.pending))
        .catch(() => {});
    load();
    const t = setInterval(load, PENDING_POLL_MS);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, exact: true, badge: 0 },
    { href: "/admin/transactions", label: "ฝาก-ถอน", icon: ArrowLeftRight, badge: pending.deposits + pending.withdrawals },
    { href: "/admin/users", label: "สมาชิก", icon: Users, badge: 0 },
    { href: "/admin/account-requests", label: "เปิดบัญชี", icon: FileText, badge: pending.accountRequests },
  ];

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#e8d4b0]/60 pt-[env(safe-area-inset-top)]">
        <div className="h-14 flex items-center gap-2 px-3">
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="เปิดเมนู"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100">
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-1.5 min-w-0">
            <Image src="/logo/logoluna.svg" alt="Lunaforex Admin" width={100} height={28} className="h-6 w-auto" priority />
            <span className="text-[9px] font-black text-[#b89766] bg-[#fdfbf7] border border-[#e8d5b7] px-1.5 py-0.5 rounded font-mono">ADMIN</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <AdminNotificationBell />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center text-white text-xs font-bold">
              {adminName[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-in menu with every admin page */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="เมนูหลังบ้าน">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawerOpen(false)} />
          <nav className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-white shadow-2xl flex flex-col pt-[env(safe-area-inset-top)] animate-[slideIn_.18s_ease-out]">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
              <span className="font-black text-slate-900">เมนูหลังบ้าน</span>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="ปิดเมนู" className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.categoryKey} className="space-y-1">
                  <p className="px-2 text-[10px] font-black uppercase tracking-wider text-[#b89766] font-mono">{group.title}</p>
                  {group.items.map((item) => {
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link key={item.href} href={item.href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl ${active ? "bg-[#fdfbf7] border border-[#e6cda3] text-slate-900" : "text-slate-700 active:bg-slate-100"}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-gradient-to-br from-[#c6a87c] to-[#997a49] text-white" : "bg-slate-100 text-slate-500"}`}>
                          <item.icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold leading-tight">{item.label}</span>
                          <span className="block text-[11px] text-slate-400 truncate">{item.sub}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
            <form action="/api/auth/logout" method="POST" className="p-3 border-t border-slate-100 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-rose-600 bg-rose-50">
                <LogOut className="w-4 h-4" /> ออกจากระบบ
              </button>
            </form>
          </nav>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]" aria-label="เมนูหลัก">
        <div className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = isActive(t.href, t.exact);
            return (
              <Link key={t.href} href={t.href} className={`relative flex flex-col items-center justify-center gap-0.5 h-16 text-[10px] font-bold ${active ? "text-[#997a49]" : "text-slate-400"}`}>
                <span className="relative">
                  <t.icon className="w-5 h-5" />
                  {t.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                      {t.badge > 9 ? "9+" : t.badge}
                    </span>
                  )}
                </span>
                {t.label}
                {active && <span className="absolute top-0 inset-x-5 h-0.5 rounded-full bg-[#c6a87c]" />}
              </Link>
            );
          })}
          <button type="button" onClick={() => setDrawerOpen(true)} className="flex flex-col items-center justify-center gap-0.5 h-16 text-[10px] font-bold text-slate-400">
            <Menu className="w-5 h-5" />
            เมนูทั้งหมด
          </button>
        </div>
      </nav>
    </>
  );
}
