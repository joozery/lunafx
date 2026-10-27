"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  CalendarCheck,
  FileText,
  LogOut,
  Gift,
  Building2,
  ShieldCheck,
  FolderLock,
  Headphones,
  TrendingUp,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import type { ElementType } from "react";

export type NavItem = {
  href: string;
  label: string;
  sub: string;
  icon: ElementType;
  badge?: string;
  exact?: boolean;
};

export const NAV_GROUPS: { title: string; categoryKey: string; items: NavItem[] }[] = [
  {
    title: "ภาพรวมระบบ (OVERVIEW)",
    categoryKey: "overview",
    items: [
      {
        href: "/admin",
        label: "แดชบอร์ดระบบ",
        sub: "ภาพรวมสถิติระบบทั้งหมด",
        icon: LayoutDashboard,
        exact: true,
      },
      { href: "/admin/guide", label: "คู่มือหลังบ้าน", sub: "ระบบทำงานอย่างไร & งานประจำวัน", icon: BookOpen },
    ],
  },
  {
    title: "ผู้ใช้ & สิทธิ์ (USERS & SECURITY)",
    categoryKey: "users",
    items: [
      { href: "/admin/admins", label: "ทีมผู้ดูแลระบบ", sub: "จัดการแอดมินและรหัส PIN", icon: ShieldCheck, badge: "Admin" },
      { href: "/admin/users", label: "สมาชิกทั้งหมด", sub: "จัดการสมาชิกและระงับสิทธิ์", icon: Users, badge: "Live" },
      { href: "/admin/account-requests", label: "คำขอเปิดบัญชีเทรด", sub: "อนุมัติ KYC & เปิดพอร์ต", icon: FileText, badge: "Pending" },
    ],
  },
  {
    title: "การเงิน & ธุรกรรม (FINANCE)",
    categoryKey: "finance",
    items: [
      { href: "/admin/transactions", label: "ธุรกรรม ฝาก-ถอน", sub: "อนุมัติสลิปและโอนเงิน", icon: ArrowLeftRight, badge: "Money" },
      { href: "/admin/copy-trading", label: "จัดการ Copy Trading", sub: "บริหาร Master Traders & ROI", icon: TrendingUp, badge: "Master" },
      { href: "/admin/settings/deposit-bank", label: "ตั้งค่าธนาคารรับฝาก", sub: "เลขบัญชีบริษัท & QR", icon: Building2 },
      { href: "/admin/settings/bonus", label: "ตั้งค่าโบนัสเงินฝาก", sub: "โบนัส & เงื่อนไขถอน", icon: Gift },
      { href: "/admin/settings/line", label: "แจ้งเตือน LINE", sub: "สมัคร / ฝาก / ถอน", icon: MessageCircle },
    ],
  },
  {
    title: "การตลาด & สนับสนุน (SUPPORT)",
    categoryKey: "support",
    items: [
      { href: "/admin/promotions", label: "โบนัส & โปรโมชั่น", sub: "เพิ่มและแก้ไขโบนัสเงินฝาก", icon: Gift },
      { href: "/admin/referrals", label: "ระบบแนะนำเพื่อน", sub: "% ค่าแนะนำ & ใครแนะนำใคร", icon: Users },
      { href: "/admin/appointments", label: "นัดหมายปรึกษา", sub: "ตารางนัดคุยกับเจ้าหน้าที่", icon: CalendarCheck },
      { href: "/admin/support", label: "ศูนย์ช่วยเหลือ & FAQ", sub: "ตั๋วคำร้องและคำถามพบบ่อย", icon: Headphones },
    ],
  },
  {
    title: "กฎหมาย & นโยบาย (LEGAL)",
    categoryKey: "legal",
    items: [
      { href: "/admin/legal", label: "จัดการเอกสารกฎหมาย", sub: "Privacy / Terms / AML", icon: FolderLock },
    ],
  },
];

const COLLAPSE_KEY = "admin-sidebar-collapsed";

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Collapsed = icon-only rail; remembered per browser
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch {}
  }, []);
  const toggle = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch {}
      return !c;
    });
  };

  return (
    <aside className={`${collapsed ? "w-[68px]" : "w-[235px]"} shrink-0 hidden md:flex flex-col bg-white border-r border-slate-200/80 h-full shadow-2xs transition-[width] duration-200`}>

      {/* Compact Brand Header */}
      <div className={`py-3.5 border-b border-slate-100 bg-white flex items-center gap-2 ${collapsed ? "px-2 flex-col" : "px-4"}`}>
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2 group flex-1 min-w-0">
            <Image
              src="/logo/logoluna.svg"
              alt="Lunaforex Admin"
              width={120}
              height={34}
              className="h-7 w-auto object-contain transition-transform group-hover:scale-102"
              priority
            />
            <span className="text-[9px] font-black text-[#b89766] bg-[#fdfbf7] border border-[#e8d5b7] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
              ADMIN
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? "ขยายเมนู" : "พับเมนู"}
          aria-label={collapsed ? "ขยายเมนู" : "พับเมนู"}
          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#b89766] hover:bg-[#fdfbf7] transition-colors"
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Compact Categorized Navigation List */}
      <nav className={`flex-1 overflow-y-auto py-3 [scrollbar-width:none] [::-webkit-scrollbar]:hidden ${collapsed ? "px-2 space-y-2" : "px-2.5 space-y-4"}`}>
        {NAV_GROUPS.map((group) => (
          <div key={group.categoryKey} className="space-y-1">
            {/* Category Header */}
            {collapsed ? (
              <div className="mx-2 border-t border-slate-100" />
            ) : (
              <div className="px-2 py-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#b89766] font-mono">
                  {group.title}
                </span>
              </div>
            )}

            {/* Compact Menu Items */}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-2.5 py-1.5 rounded-xl transition-all duration-150 ${collapsed ? "justify-center px-0" : "px-2.5"} ${
                        active
                          ? "bg-gradient-to-r from-[#fdfbf7] via-[#f8f1e5] to-white border border-[#e6cda3] text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-[#c6a87c] to-[#997a49]" />
                      )}

                      {/* Compact Icon */}
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          active
                            ? "bg-gradient-to-br from-[#c6a87c] to-[#997a49] text-white shadow-2xs"
                            : "bg-slate-100 text-slate-500 group-hover:bg-[#fdfbf7] group-hover:text-[#b89766]"
                        }`}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                      </span>

                      {/* Compact Labels */}
                      <div className={`flex-1 min-w-0 ${collapsed ? "hidden" : ""}`}>
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-[11px] font-bold leading-tight ${
                              active ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900"
                            }`}
                          >
                            {item.label}
                          </p>
                          {item.badge && (
                            <span
                              className={`text-[8px] font-extrabold px-1 py-0.2 rounded font-mono ${
                                active
                                  ? "bg-[#c6a87c]/20 text-[#b89766] border border-[#e6cda3]"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 truncate font-normal leading-none mt-0.5">
                          {item.sub}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Compact User Footer */}
      <div className="p-2.5 border-t border-slate-200/80 space-y-1.5 bg-slate-50/50">
        <div title={collapsed ? adminName : undefined} className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#e8d5b7]/80 shadow-2xs ${collapsed ? "justify-center" : ""}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c6a87c] via-[#b89766] to-[#997a49] text-white text-[11px] font-black flex items-center justify-center shadow-xs shrink-0">
            {adminName[0]?.toUpperCase() || "A"}
          </div>
          <div className={`flex-1 min-w-0 ${collapsed ? "hidden" : ""}`}>
            <p className="text-[11px] font-extrabold text-slate-900 truncate leading-tight">{adminName}</p>
            <p className="text-[9px] font-bold text-[#b89766] font-mono leading-none">Super Administrator</p>
          </div>
        </div>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            title={collapsed ? "ออกจากระบบ" : undefined}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-3 h-3" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
