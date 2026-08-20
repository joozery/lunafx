"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, MoreHorizontal, CheckCircle, XCircle, X, ChevronLeft, ChevronRight, RefreshCw, FileText, ExternalLink, ImageIcon } from "lucide-react";

type KycDoc = { key: string; url: string; name?: string };

type AccountRequest = {
  _id: string;
  userId?: string;
  user?: { firstName: string; lastName: string; email: string } | null;
  accountType: string;
  leverage: string;
  currency: string;
  platform: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  documents?: {
    idFront?: KycDoc;
    idBack?: KycDoc;
    selfie?: KycDoc;
    bankStatement?: KycDoc;
  };
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  approved: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  rejected: "bg-red-50 text-red-700 border border-red-100",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminAccountRequestsPage() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AccountRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ id: string; status: string; label: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/account-requests?${params}`);
    const data = await res.json();
    setRequests(data.requests ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function applyAction(id: string, status: string) {
    setActionLoading(true);
    await fetch("/api/admin/account-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, notes }),
    });
    setActionLoading(false);
    setConfirmAction(null);
    setSelected(null);
    setNotes("");
    fetchRequests();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">คำขอเปิดบัญชีเทรด</h1>
          <p className="text-sm text-gray-500 mt-1">ทั้งหมด {total.toLocaleString()} รายการ</p>
        </div>
        <button onClick={fetchRequests} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <RefreshCw className="w-4 h-4" />รีเฟรช
        </button>
      </div>

      <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
        <Select.Trigger className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:border-[#c6a87c] transition-all min-w-[180px]">
          <Select.Value placeholder="สถานะทั้งหมด" />
          <Select.Icon><ChevronDown className="w-4 h-4 text-gray-400" /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <Select.Viewport className="p-1">
              {[["", "สถานะทั้งหมด"], ["pending", "รอพิจารณา"], ["approved", "อนุมัติแล้ว"], ["rejected", "ปฏิเสธ"]].map(([v, l]) => (
                <Select.Item key={v} value={v} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded-md outline-none focus:bg-gray-100">
                  <Select.ItemText>{l}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["ผู้ใช้", "ประเภทบัญชี", "แพลตฟอร์ม", "Leverage", "สกุลเงิน", "สถานะ", "วันที่", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((__, j) => (<td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>))}</tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">ไม่พบคำขอ</p>
                  </td>
                </tr>
              ) : requests.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    {r.user ? (
                      <div>
                        <p className="font-medium text-gray-900">{r.user.firstName} {r.user.lastName}</p>
                        <p className="text-xs text-gray-400">{r.user.email}</p>
                      </div>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-5 py-4 capitalize font-medium text-gray-700">{r.accountType}</td>
                  <td className="px-5 py-4 text-gray-600">{r.platform}</td>
                  <td className="px-5 py-4 text-gray-600">{r.leverage}</td>
                  <td className="px-5 py-4 text-gray-600">{r.currency}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status === "pending" ? "รอพิจารณา" : r.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="px-5 py-4">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 min-w-[160px]">
                          <DropdownMenu.Item
                            onSelect={() => { setSelected(r); setNotes(r.adminNotes ?? ""); }}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer outline-none"
                          >
                            ดูรายละเอียด
                          </DropdownMenu.Item>
                          {r.status === "pending" && (<>
                            <DropdownMenu.Item
                              onSelect={() => setConfirmAction({ id: r._id, status: "approved", label: "อนุมัติคำขอนี้?" })}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer outline-none"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />อนุมัติ
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onSelect={() => setConfirmAction({ id: r._id, status: "rejected", label: "ปฏิเสธคำขอนี้?" })}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none"
                            >
                              <XCircle className="w-3.5 h-3.5" />ปฏิเสธ
                            </DropdownMenu.Item>
                          </>)}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">หน้า {page} จาก {pages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog.Root open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-semibold text-gray-900">รายละเอียดคำขอ</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
              </Dialog.Close>
            </div>
            {selected && (
              <div className="space-y-4 text-sm">
                {/* Account Details */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                  {[
                    ["ผู้ใช้", selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : "-"],
                    ["อีเมล", selected.user?.email ?? "-"],
                    ["ประเภทบัญชี", selected.accountType],
                    ["แพลตฟอร์ม", selected.platform],
                    ["Leverage", selected.leverage],
                    ["สกุลเงิน", selected.currency],
                    ["วันที่ขอ", formatDate(selected.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>

                {/* KYC Documents */}
                {selected.documents && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">เอกสาร KYC</p>
                    {[
                      { key: "idFront", label: "บัตรประชาชน (หน้า)", doc: selected.documents.idFront },
                      { key: "idBack", label: "บัตรประชาชน (หลัง)", doc: selected.documents.idBack },
                      { key: "selfie", label: "เซลฟี่พร้อมบัตร", doc: selected.documents.selfie },
                      { key: "bankStatement", label: "Statement ธนาคาร", doc: selected.documents.bankStatement },
                    ].filter((item) => item.doc).map(({ key, label, doc }) => (
                      <div key={key} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-lg bg-[#fdfbf7] border border-[#e8d5b7] flex items-center justify-center shrink-0">
                          {doc!.url.match(/\.(jpg|jpeg|png|webp|heic)$/i) ? (
                            <ImageIcon className="w-4 h-4 text-[#c6a87c]" />
                          ) : (
                            <FileText className="w-4 h-4 text-[#c6a87c]" />
                          )}
                        </div>
                        <span className="flex-1 text-xs font-medium text-gray-700 truncate">{label}</span>
                        <a
                          href={doc!.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-[#b89766] hover:text-[#997a49] transition-colors"
                        >
                          ดู <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin Notes */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">หมายเหตุ Admin</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] resize-none transition-all"
                    placeholder="เพิ่มหมายเหตุ..."
                  />
                </div>
                {selected.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => applyAction(selected._id, "rejected")}
                      className="flex-1 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >ปฏิเสธ</button>
                    <button
                      onClick={() => applyAction(selected._id, "approved")}
                      className="flex-1 py-2 text-sm font-medium text-white bg-[#c6a87c] hover:bg-[#b89766] rounded-lg transition-colors"
                    >อนุมัติ</button>
                  </div>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 p-6">
            <AlertDialog.Title className="text-base font-semibold text-gray-900 mb-2">ยืนยัน</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gray-500 mb-6">{confirmAction?.label}</AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  disabled={actionLoading}
                  onClick={() => confirmAction && applyAction(confirmAction.id, confirmAction.status)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-colors flex items-center gap-2 ${confirmAction?.status === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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
