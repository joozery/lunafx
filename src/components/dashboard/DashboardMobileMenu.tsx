"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";

/** Phone navigation: a hamburger in the header that opens the full dashboard menu (including the referral invite box). */
export function DashboardMobileMenu({ lang, user }: { lang: string; user: any }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isth = lang === "th";

  // close the menu after navigating
  useEffect(() => { setOpen(false); }, [pathname]);

  // lock page scroll while the menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-label={isth ? "เปิดเมนู" : "Open menu"}
        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100">
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={isth ? "เมนู" : "Menu"}>
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-white shadow-2xl pt-[env(safe-area-inset-top)]">
            <button type="button" onClick={() => setOpen(false)} aria-label={isth ? "ปิดเมนู" : "Close menu"}
              className="absolute right-2 top-2 z-10 w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            <DashboardSidebar lang={lang} user={user} variant="drawer" />
          </div>
        </div>
      )}
    </div>
  );
}
