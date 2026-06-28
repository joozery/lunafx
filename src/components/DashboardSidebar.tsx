"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
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
  ChevronUp
} from "lucide-react";

export function DashboardSidebar({ lang, user }: { lang: string; user: any }) {
  const pathname = usePathname();
  const isth = lang === "th";

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    funds: pathname.includes('/funds') || pathname.includes('/history'),
  });

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuItems = [
    { href: `/${lang}/dashboard`, label: isth ? "แดชบอร์ด" : "Dashboard", icon: Home },
    { href: `/${lang}/dashboard/accounts`, label: isth ? "บัญชีเทรด" : "Accounts", icon: IdCard },
    { 
      id: "funds",
      label: isth ? "การเงิน" : "Funds", 
      icon: Wallet,
      subItems: [
        { href: `/${lang}/dashboard/funds`, label: isth ? "ฝาก / ถอนเงิน" : "Deposit / Withdrawal" },
        { href: `#`, label: isth ? "โอนเงินระหว่างบัญชี" : "Transfer Between Accounts" },
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
    { href: `/${lang}/dashboard/copy-trading`, label: isth ? "ก๊อปปี้เทรด" : "Copy Trading", icon: Users },
    { 
      id: "analytics",
      label: isth ? "วิเคราะห์" : "Analytics", 
      icon: BarChart2,
      subItems: [
        { href: `/${lang}/dashboard/analytics`, label: isth ? "ปฏิทินเศรษฐกิจ" : "Economic Calendar" }
      ]
    },
    { href: `/${lang}/dashboard/promotions`, label: isth ? "โปรโมชั่น" : "Promotions", icon: Gift },
    { 
      id: "support",
      label: isth ? "ช่วยเหลือ" : "Support", 
      icon: HeadphonesIcon,
      subItems: [
        { href: `/${lang}/dashboard/support`, label: isth ? "คำถามที่พบบ่อย" : "FAQ" }
      ]
    },
    { 
      id: "settings",
      label: isth ? "การตั้งค่า" : "Settings", 
      icon: Settings,
      subItems: [
        { href: `/${lang}/dashboard/settings`, label: isth ? "ข้อมูลส่วนตัว" : "Profile" }
      ]
    },
  ];

  return (
    <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-200 h-full relative z-20 overflow-y-auto scrollbar-hide pb-6">
      
      {/* Logo Area */}
      <div className="pt-8 pb-4 flex flex-col items-center justify-center">
        <Image
          src="/logo/logoluna.svg"
          alt="Lunaforex"
          width={140}
          height={48}
          className="h-10 w-auto object-contain"
        />
      </div>

      {/* Top Navigation */}
      <nav className="flex-1 px-4 mt-4 space-y-1">
        {menuItems.map((item) => {
          // If it's a dropdown
          if (item.subItems) {
            const isOpen = openDropdowns[item.id];
            const isActiveParent = item.subItems.some(sub => pathname === sub.href);
            
            return (
              <div key={item.id} className="mb-1">
                <button
                  onClick={() => toggleDropdown(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    isActiveParent
                      ? "bg-[#fef9f2] text-[#c6a87c]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <item.icon className="w-5 h-5 stroke-[1.5]" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {/* Submenu */}
                {isOpen && (
                  <div className="ml-6 mt-1 mb-2 pl-4 border-l border-gray-200 flex flex-col space-y-1">
                    {item.subItems.map(sub => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={`${sub.href}-${sub.label}`}
                          href={sub.href}
                          className={`relative py-2 px-3 text-sm rounded-lg transition-colors ${
                            isSubActive 
                              ? "bg-[#fef9f2] text-[#c6a87c] font-medium" 
                              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          {/* Active Dot indicator */}
                          {isSubActive && (
                            <span className="absolute left-[-21px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#c6a87c] ring-4 ring-white" />
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

          // Regular Link
          const isActive = pathname === item.href;
          return (
            <Link 
              key={`${item.href}-${item.label}`}
              href={item.href} 
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors mb-1 ${
                isActive 
                  ? "bg-[#fef9f2] text-[#c6a87c]" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5 stroke-[1.5]" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 mt-6">
        {/* Refer a Friend Card */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 mb-8 relative overflow-hidden">
          <h4 className="font-bold text-gray-900 text-sm mb-1">{isth ? "แนะนำเพื่อน" : "Refer a Friend"}</h4>
          <p className="text-sm font-semibold text-gray-700 mb-2">{isth ? "รับรางวัล" : "Earn Rewards"}</p>
          <p className="text-xs text-gray-500 mb-6 w-3/4">
            {isth ? "ชวนเพื่อนมาเทรดและรับโบนัสสูงสุด $500" : "Invite friends and earn up to $500"}
          </p>
          
          {/* Decorative Gift Box Icon */}
          <div className="absolute right-0 bottom-12 opacity-80 pointer-events-none">
            {/* We'll use a lucide icon as placeholder for the 3D gift box if no image exists */}
            <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center -rotate-12 mr-2">
              <Gift className="w-6 h-6 text-[#c6a87c]" />
            </div>
          </div>

          <button className="w-full bg-gradient-to-r from-[#c6a87c] to-[#a38458] hover:opacity-90 text-white font-semibold py-2.5 rounded-xl text-sm transition-opacity shadow-md">
            {isth ? "เชิญเพื่อนเลย" : "Invite Now"}
          </button>
        </div>

        {/* Empty spacing if needed instead of logo */}
        <div className="h-4"></div>
      </div>
    </aside>
  );
}
