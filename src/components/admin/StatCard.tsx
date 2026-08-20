import Link from "next/link";
import type { ElementType } from "react";

type Props = {
  label: string;
  sub: string;
  value: number;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  link: string;
};

export function StatCard({ label, sub, value, icon: Icon, iconBg, iconColor, link }: Props) {
  return (
    <Link
      href={link}
      className="group bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#c6a87c]/30 transition-all"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-3xl font-bold text-gray-900 tracking-tight">{value.toLocaleString()}</p>
      <p className="text-sm font-semibold text-gray-700 mt-1 leading-tight">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </Link>
  );
}
