"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Search, ChevronDown, MoreHorizontal, X,
  ChevronLeft, ChevronRight, UserX, UserCheck,
  Shield, RefreshCw, Users, Eye,
} from "lucide-react";

type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  accountType: string;
  role?: string;
  createdAt: string;
};

type ConfirmAction = {
  userId: string;
  action: string;
  label: string;
  desc: string;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ใช้งาน
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      ระงับ
    </span>
  );
}

function AccountTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    standard: "bg-slate-100 text-slate-600",
    vip:      "bg-[#fdf6ed] text-[#b89766] border border-[#e8d4b0]",
    pro:      "bg-slate-900 text-[#c6a87c]",
  };
  const labels: Record<string, string> = {
    standard: "Standard",
    vip: "VIP",
    pro: "Pro",
  };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${styles[type] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[type] ?? type}
    </span>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers]               = useState<User[]>([]);
  const [total, setTotal]               = useState(0);
  const [pages, setPages]               = useState(1);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading]           = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search)       params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res  = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function handleAction(userId: string, payload: Record<string, string>) {
    setActionLoading(true);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...payload }),
    });
    setActionLoading(false);
    setConfirmAction(null);
    setSelectedUser(null);
    fetchUsers();
  }

  /* icon/color for confirm dialog based on action type */
  const confirmMeta = (() => {
    const a = confirmAction?.action ?? "";
    if (a === "status:suspended") return { Icon: UserX,    bg: "bg-red-50",        border: "border-red-200",        text: "text-red-600" };
    if (a === "status:active")    return { Icon: UserCheck, bg: "bg-emerald-50",    border: "border-emerald-200",    text: "text-emerald-600" };
    return                               { Icon: Shield,    bg: "bg-[#fdf6ed]",     border: "border-[#e8d4b0]",      text: "text-[#c6a87c]" };
  })();

  return (
    <div className="space-y-5 max-w-7xl mx-auto">

      {/* ─── Page header ─── */}
      <div className="bg-white border border-[#e8d4b0]/60 rounded-2xl px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#fdf6ed] border border-[#e0c898] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#c6a87c]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">จัดการผู้ใช้งาน</h1>
              <p className="text-sm text-slate-500 mt-1">
                พบ <span className="font-bold text-slate-800">{total.toLocaleString()}</span> บัญชีในระบบ
              </p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-[#e8d4b0] rounded-xl hover:bg-[#fdfbf7] hover:border-[#c6a87c]/50 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ อีเมล..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-[#c6a87c] focus:ring-2 focus:ring-[#c6a87c]/15 transition-all placeholder:text-slate-400"
          />
        </div>

        <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
          <Select.Trigger className="flex items-center gap-2 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 hover:border-[#c6a87c]/50 focus:outline-none focus:border-[#c6a87c] transition-all min-w-[160px]">
            <Select.Value placeholder="สถานะทั้งหมด" />
            <Select.Icon className="ml-auto">
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden p-1">
              <Select.Viewport>
                {[
                  ["", "สถานะทั้งหมด"],
                  ["active", "ใช้งาน"],
                  ["suspended", "ระงับ"],
                ].map(([v, l]) => (
                  <Select.Item
                    key={v}
                    value={v}
                    className="px-3 py-2 text-sm text-slate-700 rounded-lg cursor-pointer outline-none data-[highlighted]:bg-[#fdf6ed] data-[highlighted]:text-[#b89766]"
                  >
                    <Select.ItemText>{l}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* ─── Table ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-[#faf8f5]">
                {["ผู้ใช้", "อีเมล", "ประเภท", "สถานะ", "สมัครเมื่อ", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-slate-100 rounded-md animate-pulse" />
                          <div className="h-3 w-20 bg-slate-100 rounded-md animate-pulse" />
                        </div>
                      </div>
                    </td>
                    {[140, 70, 70, 90].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-slate-100 rounded-lg animate-pulse" style={{ width: w }} />
                      </td>
                    ))}
                    <td className="px-3 py-4">
                      <div className="h-8 w-8 bg-slate-100 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium">ไม่พบผู้ใช้</p>
                    </div>
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u._id} className="border-b border-slate-50 last:border-0 hover:bg-[#fdfbf7] transition-colors group">
                  {/* User */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center text-white text-xs font-bold">
                          {u.firstName[0]?.toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${u.status === "active" ? "bg-emerald-500" : "bg-red-400"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
                          {u.firstName} {u.lastName}
                          {u.role === "admin" && (
                            <span className="text-[9px] font-bold text-[#b89766] bg-[#fdf6ed] border border-[#e8d4b0] px-1.5 py-0.5 rounded uppercase tracking-wide">
                              Admin
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{u.phone || "—"}</p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-600">{u.email}</span>
                  </td>

                  {/* Account type */}
                  <td className="px-5 py-3.5">
                    <AccountTypeBadge type={u.accountType} />
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={u.status} />
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-500 whitespace-nowrap">{formatDate(u.createdAt)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3.5">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          sideOffset={4}
                          className="bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 min-w-[200px]"
                        >
                          <DropdownMenu.Item
                            onSelect={() => setSelectedUser(u)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#fdf6ed] hover:text-[#b89766] rounded-lg cursor-pointer outline-none"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            ดูรายละเอียด
                          </DropdownMenu.Item>

                          <DropdownMenu.Separator className="my-1.5 h-px bg-slate-100" />

                          {u.status === "active" ? (
                            <DropdownMenu.Item
                              onSelect={() => setConfirmAction({
                                userId: u._id,
                                action: "status:suspended",
                                label: `ระงับบัญชี ${u.firstName} ${u.lastName}`,
                                desc: "บัญชีจะไม่สามารถเข้าสู่ระบบได้จนกว่าจะเปิดใช้งาน",
                              })}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              ระงับบัญชี
                            </DropdownMenu.Item>
                          ) : (
                            <DropdownMenu.Item
                              onSelect={() => setConfirmAction({
                                userId: u._id,
                                action: "status:active",
                                label: `เปิดใช้งานบัญชี ${u.firstName} ${u.lastName}`,
                                desc: "ผู้ใช้จะสามารถเข้าสู่ระบบและใช้งานได้ตามปกติ",
                              })}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer outline-none"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              เปิดใช้งาน
                            </DropdownMenu.Item>
                          )}

                          {u.role !== "admin" && (
                            <DropdownMenu.Item
                              onSelect={() => setConfirmAction({
                                userId: u._id,
                                action: "role:admin",
                                label: `ให้สิทธิ์ Admin แก่ ${u.firstName}`,
                                desc: "ผู้ใช้จะสามารถเข้าถึงและจัดการระบบ Admin ได้ทั้งหมด",
                              })}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#b89766] hover:bg-[#fdf6ed] rounded-lg cursor-pointer outline-none"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              ให้สิทธิ์ Admin
                            </DropdownMenu.Item>
                          )}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 bg-[#faf8f5] flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              หน้า <span className="font-bold text-slate-700">{page}</span> จาก{" "}
              <span className="font-bold text-slate-700">{pages}</span> · ทั้งหมด {total.toLocaleString()} คน
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── User detail dialog ─── */}
      <Dialog.Root open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden">
            {selectedUser && (
              <>
                {/* Header */}
                <div className="relative bg-gradient-to-r from-[#fdfbf7] to-[#f8f1e6] px-6 pt-6 pb-5 border-b border-[#e8d4b0]/60">
                  <Dialog.Close asChild>
                    <button className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/6 text-slate-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c6a87c] to-[#9b8058] flex items-center justify-center text-white font-bold text-xl shadow-md shadow-[#c6a87c]/20">
                        {selectedUser.firstName[0]?.toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${selectedUser.status === "active" ? "bg-emerald-500" : "bg-red-400"}`} />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-bold text-slate-900 leading-tight">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </Dialog.Title>
                      <p className="text-sm text-slate-500 mt-0.5">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <StatusBadge status={selectedUser.status} />
                        <AccountTypeBadge type={selectedUser.accountType} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="px-6 py-5 space-y-0">
                  {[
                    { label: "รหัสผู้ใช้", value: selectedUser._id, mono: true },
                    { label: "เบอร์โทรศัพท์", value: selectedUser.phone || "—" },
                    { label: "บทบาทในระบบ", value: selectedUser.role ?? "user" },
                    { label: "สมัครเมื่อ", value: formatDate(selectedUser.createdAt) },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className={`text-sm font-semibold text-slate-900 text-right max-w-[58%] break-all ${mono ? "font-mono text-xs text-slate-600" : ""}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ─── Confirm action dialog ─── */}
      <AlertDialog.Root open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl z-50 p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${confirmMeta.bg} ${confirmMeta.border}`}>
                <confirmMeta.Icon className={`w-5 h-5 ${confirmMeta.text}`} />
              </div>
              <div className="flex-1">
                <AlertDialog.Title className="text-[15px] font-bold text-slate-900 leading-snug">
                  {confirmAction?.label}
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-slate-500 mt-1 leading-relaxed">
                  {confirmAction?.desc}
                </AlertDialog.Description>
              </div>
            </div>
            <div className="flex gap-2.5 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  ยกเลิก
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  disabled={actionLoading}
                  onClick={() => {
                    if (!confirmAction) return;
                    const [field, value] = confirmAction.action.split(":");
                    handleAction(confirmAction.userId, { [field]: value });
                  }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#c6a87c] hover:bg-[#b5966a] disabled:opacity-60 rounded-xl transition-colors flex items-center gap-2"
                >
                  {actionLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  )}
                  ยืนยัน
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
