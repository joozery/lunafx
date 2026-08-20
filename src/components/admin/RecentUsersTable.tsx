import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { StatusPill } from "./StatusPill";

export type RecentUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
  createdAt?: string | Date;
};

function formatDate(d?: Date | string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentUsersTable({ users }: { users: RecentUser[] }) {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">ผู้ใช้ล่าสุด</h3>
        </div>
        <Link
          href="/admin/users"
          className="text-xs font-semibold text-[#c6a87c] hover:text-[#a38458] transition-colors"
        >
          ดูทั้งหมด →
        </Link>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-gray-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
        </div>
      ) : (
        <div>
          {users.map((u) => (
            <div
              key={u._id}
              className="flex items-center gap-3.5 px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {u.firstName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusPill status={u.status} />
                <span className="text-[10px] text-gray-400">{formatDate(u.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
