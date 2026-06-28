"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ lang }: { lang: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${lang}/login`);
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      {lang === "th" ? "ออกจากระบบ" : "Logout"}
    </button>
  );
}
