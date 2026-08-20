"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  Home, 
  IdCard, 
  Wallet, 
  TrendingUp,
  Users,
  BarChart2,
  Gift,
  HeadphonesIcon,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

interface MenuItem {
  id?: string;
  href?: string;
  label: string;
  icon: any;
  badge?: string;
  subItems?: { href: string; label: string }[];
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export function DashboardSidebar({ lang, user }: { lang: string; user: any }) {
  const pathname = usePathname();
  const isth = lang === "th";

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    funds: pathname.includes("/funds") || pathname.includes("/history"),
    trading: pathname.includes("/platforms"),
    analytics: pathname.includes("/analytics"),
    support: pathname.includes("/support"),
    settings: pathname.includes("/settings"),
  });

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sections: MenuSection[] = [
    {
      title: isth ? "เมนูหลัก" : "MAIN MENU",
      items: [
        { href: `/${lang}/dashboard`, label: isth ? "แดชบอร์ด" : "Dashboard", icon: Home },
        { href: `/${lang}/dashboard/accounts`, label: isth ? "บัญชีเทรด" : "Accounts", icon: IdCard, badge: "MT4/MT5" },
      ],
    },
    {
      title: isth ? "การเงินและการเทรด" : "FINANCE & TRADING",
      items: [
        { 
          id: "funds",
          label: isth ? "การเงิน" : "Funds", 
          icon: Wallet,
          subItems: [
            { href: `/${lang}/dashboard/funds`, label: isth ? "ฝาก / ถอนเงิน" : "Deposit / Withdrawal" },
            { href: `/${lang}/dashboard/funds/transfer`, label: isth ? "โอนเงินระหว่างบัญชี" : "Internal Transfer" },
            { href: `/${lang}/dashboard/history`, label: isth ? "ประวัติธุรกรรม" : "Transaction History" },
          ]
        },
        { 
          id: "trading",
          label: isth ? "การเทรด" : "Trading", 
          icon: TrendingUp,
          subItems: [
            { href: `/${lang}/dashboard/platforms`, label: isth ? "แพลตฟอร์มเทรด" : "Trading Platforms" }
          ]
        },
        { href: `/${lang}/dashboard/copy-trading`, label: isth ? "ก๊อปปี้เทรด" : "Copy Trading", icon: Users, badge: "HOT" },
      ],
    },
    {
      title: isth ? "บทวิเคราะห์และโปรโมชั่น" : "ANALYTICS & REWARDS",
      items: [
        { 
          id: "analytics",
          label: isth ? "วิเคราะห์" : "Analytics", 
          icon: BarChart2,
          subItems: [
            { href: `/${lang}/dashboard/analytics`, label: isth ? "ปฏิทินเศรษฐกิจ" : "Economic Calendar" }
          ]
        },
        { href: `/${lang}/dashboard/promotions`, label: isth ? "โปรโมชั่น" : "Promotions", icon: Gift, badge: "100%" },
      ],
    },
    {
      title: isth ? "ระบบและบัญชี" : "ACCOUNT & SUPPORT",
      items: [
        { 
          id: "support",
          label: isth ? "ช่วยเหลือ" : "Support", 
          icon: HeadphonesIcon,
          subItems: [
            { href: `/${lang}/dashboard/support`, label: isth ? "คำถามที่พบบ่อย (FAQ)" : "FAQ" }
          ]
        },
        { 
          id: "settings",
          label: isth ? "การตั้งค่า" : "Settings", 
          icon: Settings,
          subItems: [
            { href: `/${lang}/dashboard/settings`, label: isth ? "ข้อมูลส่วนตัว" : "Profile Settings" }
          ]
        },
      ],
    },
  ];

  return (
    <aside className="w-64 hidden md:flex flex-col bg-white border-r border-slate-200/80 h-screen max-h-screen sticky top-0 z-20 shadow-2xs">
      
      {/* Brand Header */}
      <div className="pt-6 pb-4 px-6 flex flex-col items-center justify-center border-b border-slate-100 shrink-0">
        <Link href={`/${lang}/dashboard`} className="transition-opacity hover:opacity-90">
          <Image
            src="/logo/logoluna.svg"
            alt="Lunaforex"
            width={140}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Mini User Status Card */}
      <div className="mx-4 my-3 p-3 rounded-xl bg-slate-950 text-white shadow-sm border border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-2xs">
            {user?.firstName?.[0] || "T"}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold truncate text-slate-100">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>KYC Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Sections (Hidden Scrollbar) */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-4 scrollbar-hide [::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                {section.title}
              </p>
            )}

            {section.items.map((item) => {
              // Submenu Item Dropdown
              if (item.subItems) {
                const isOpen = openDropdowns[item.id!];
                const isActiveParent = item.subItems.some((sub) => pathname === sub.href);

                return (
                  <div key={item.id} className="mb-0.5">
                    <button
                      onClick={() => toggleDropdown(item.id!)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                        isActiveParent
                          ? "bg-[#fef9f2] text-[#c6a87c] font-bold shadow-2xs border-l-3 border-[#c6a87c]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className={`w-4 h-4 stroke-[1.8] ${isActiveParent ? "text-[#c6a87c]" : "text-slate-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {/* Submenu Dropdown List */}
                    {isOpen && (
                      <div className="ml-4 mt-1 mb-1.5 pl-3 border-l border-slate-200 flex flex-col space-y-0.5">
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={`${sub.href}-${sub.label}`}
                              href={sub.href}
                              className={`relative py-1.5 px-2.5 text-xs rounded-lg transition-all ${
                                isSubActive
                                  ? "bg-[#fef9f2] text-[#c6a87c] font-bold"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
                              }`}
                            >
                              {isSubActive && (
                                <span className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#c6a87c] ring-2 ring-white" />
                              )}
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Standard Link Item
              const isActive = pathname === item.href;
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href!}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all mb-0.5 ${
                    isActive
                      ? "bg-[#fef9f2] text-[#c6a87c] font-bold shadow-2xs border-l-3 border-[#c6a87c]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`w-4 h-4 stroke-[1.8] ${isActive ? "text-[#c6a87c]" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        item.badge === "HOT"
                          ? "bg-rose-100 text-rose-600"
                          : item.badge === "100%"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Promo / Referral Banner With promotion.png Background */}
      <div className="p-3.5 m-3 rounded-2xl border border-amber-500/40 text-white space-y-2.5 relative overflow-hidden shadow-md bg-amber-950 shrink-0">
        {/* Background Image */}
        <Image
          src="/promotion.png"
          alt="Referral Promo Background"
          fill
          className="object-cover object-center pointer-events-none"
        />
        {/* Dark Warm Gradient Overlay for sharp contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-950/85 via-amber-900/70 to-slate-950/80 pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{isth ? "ชวนเพื่อนรับรางวัล" : "Refer & Earn"}</span>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-500/30">+$500</span>
        </div>

        <p className="text-[11px] text-amber-100/90 leading-snug relative z-10 font-medium">
          {isth
            ? "ชวนเพื่อนมาเทรดและรับโบนัสค่าคอมมิชชั่นสูงสุด $500"
            : "Earn up to $500 commission for each invited trader."}
        </p>

        <Link
          href={`/${lang}/dashboard/partnership`}
          className="w-full bg-white hover:bg-amber-50 text-amber-950 font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm relative z-10"
        >
          <span>{isth ? "เชิญเพื่อนเลย" : "Invite Friends"}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-950" />
        </Link>
      </div>

    </aside>
  );
}
