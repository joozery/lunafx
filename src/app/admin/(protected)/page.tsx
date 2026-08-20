import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ArrowLeftRight,
  FileText,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { RecentUsersTable, type RecentUser } from "@/components/admin/RecentUsersTable";
import { RecentTransactionsTable, type RecentTransaction } from "@/components/admin/RecentTransactionsTable";

type Stats = {
  totalUsers: number;
  pendingTransactions: number;
  pendingAccountRequests: number;
  todayAppointments: number;
  totalDepositVolume: number;
  pendingWithdrawalVolume: number;
  recentUsers: RecentUser[];
  recentTransactions: RecentTransaction[];
};

async function getStats(): Promise<Stats> {
  const db = await getDb();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    pendingTransactions,
    pendingAccountRequests,
    todayAppointments,
    recentUsers,
    recentTransactions,
    volumeResult,
    withdrawalResult,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("transactions").countDocuments({ status: "pending" }),
    db.collection("accountRequests").countDocuments({ status: "pending" }),
    db.collection("appointments").countDocuments({
      date: { $gte: startOfDay },
      status: { $ne: "cancelled" },
    }),
    db.collection("users")
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray(),
    db.collection("transactions").find().sort({ createdAt: -1 }).limit(6).toArray(),
    db.collection("transactions")
      .aggregate([
        { $match: { status: "completed", type: "deposit" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
    db.collection("transactions")
      .aggregate([
        { $match: { status: "pending", type: "withdrawal" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray(),
  ]);

  return {
    totalUsers,
    pendingTransactions,
    pendingAccountRequests,
    todayAppointments,
    totalDepositVolume: volumeResult[0]?.total ?? 0,
    pendingWithdrawalVolume: withdrawalResult[0]?.total ?? 0,
    recentUsers: recentUsers.map((u: any) => ({ ...u, _id: u._id.toString() })),
    recentTransactions: recentTransactions.map((t: any) => ({
      ...t,
      _id: t._id.toString(),
      userId: t.userId?.toString(),
    })),
  };
}

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const stats = await getStats();

  const STAT_CARDS = [
    {
      label: "ผู้ใช้งานทั้งหมด",
      sub: "บัญชีที่ลงทะเบียนในระบบ",
      value: stats.totalUsers,
      icon: Users,
      iconBg: "bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]",
      link: "/admin/users",
    },
    {
      label: "ธุรกรรมรอดำเนินการ",
      sub: "ฝาก / ถอน รอตรวจสอบ",
      value: stats.pendingTransactions,
      icon: ArrowLeftRight,
      iconBg: "bg-amber-50 border border-amber-200 text-amber-600",
      link: "/admin/transactions",
      badge: stats.pendingTransactions > 0 ? "ต้องดำเนินการ" : undefined,
    },
    {
      label: "คำขอเปิดบัญชีใหม่",
      sub: "รอตรวจสอบอนุมัติ KYC",
      value: stats.pendingAccountRequests,
      icon: FileText,
      iconBg: "bg-violet-50 border border-violet-200 text-violet-600",
      link: "/admin/account-requests",
    },
    {
      label: "นัดหมายวันนี้",
      sub: "กำหนดการเข้าปรึกษา",
      value: stats.todayAppointments,
      icon: CalendarCheck,
      iconBg: "bg-emerald-50 border border-emerald-200 text-emerald-600",
      link: "/admin/appointments",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      {/* 1. PAGE HEADER & QUICK ACTION BUTTONS */}
      <div className="bg-gradient-to-r from-white via-[#faf8f5] to-[#f5efe4] border border-[#e8d5b7]/70 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ภาพรวมระบบผู้ดูแล (Admin Overview)</h1>
              <span className="text-[10px] font-extrabold text-[#b89766] bg-[#f7f1e5] border border-[#e6cda3]/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ยินดีต้อนรับ, <span className="font-bold text-slate-800">{admin.firstName} {admin.lastName}</span> —{" "}
              {new Date().toLocaleDateString("th-TH", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin/account-requests"
              className="bg-white border border-[#e8d5b7] hover:border-[#c6a87c] text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs hover:bg-[#fdfbf7]"
            >
              <FileText className="w-3.5 h-3.5 text-[#b89766]" />
              <span>อนุมัติ KYC ({stats.pendingAccountRequests})</span>
            </Link>
            <Link
              href="/admin/transactions"
              className="bg-[#c6a87c] hover:bg-[#b5966a] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>จัดการธุรกรรม ({stats.pendingTransactions})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, idx) => (
          <Link
            key={idx}
            href={card.link}
            className="group bg-white border border-slate-200/90 hover:border-[#c6a87c] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                {card.badge && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs font-bold text-slate-800 mt-1">{card.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#b89766] group-hover:text-[#997a49]">
              <span>จัดการข้อมูล</span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* 3. TOTAL FINANCIAL VOLUME BANNER */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-[#c6a87c]/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, #c6a87c 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#c6a87c]" />
              <span className="text-[11px] font-extrabold text-[#c6a87c] uppercase tracking-wider">
                ยอดเงินฝากสะสมรวม (Completed Deposits)
              </span>
            </div>
            <p className="text-4xl font-black font-mono text-white tracking-tight">
              ${stats.totalDepositVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400">ปริมาณเงินฝากที่อนุมัติสำเร็จทั้งระบบ</p>
          </div>

          <div className="space-y-1 md:border-l md:border-slate-800 md:pl-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
                ยอดถอนรอดำเนินการ (Pending Withdrawals)
              </span>
            </div>
            <p className="text-3xl font-black font-mono text-amber-300 tracking-tight">
              ${stats.pendingWithdrawalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400">คำขอถอนเงินที่รอเจ้าหน้าที่ตรวจสอบ</p>
          </div>

          <div className="flex md:justify-end">
            <Link
              href="/admin/transactions"
              className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all shadow-lg shadow-[#c6a87c]/20 flex items-center gap-2"
            >
              <span>อนุมัติรายการเงิน</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. RECENT DATA TABLES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RecentUsersTable users={stats.recentUsers} />
        <RecentTransactionsTable transactions={stats.recentTransactions} />
      </div>
    </div>
  );
}
