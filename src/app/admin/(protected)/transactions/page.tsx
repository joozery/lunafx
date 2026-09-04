"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown, MoreHorizontal, CheckCircle, XCircle, X,
  ChevronLeft, ChevronRight, RefreshCw, ArrowDownLeft, ArrowUpRight,
  ImageIcon, ExternalLink, Receipt,
} from "lucide-react";

type Txn = {
  _id: string;
  type: string;
  amount: number;
  amountThb?: number;
  method?: string;
  status: string;
  transactionId: string;
  accountNumber?: string;
  slipUrl?: string;
  adminNotes?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
  /* withdrawal fields */
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  /* slip2go verification */
  slip2go?: {
    status: string;
    code: string | null;
    checked: boolean;
    data?: {
      referenceId?: string;
      transRef?: string;
      dateTime?: string;
      amount?: number;
      receiver?: {
        account?: { name?: string; bank?: { account?: string | null } };
        bank?: { id?: string; name?: string | null };
      };
      sender?: {
        account?: { name?: string; bank?: { account?: string } };
        bank?: { id?: string; name?: string | null };
      };
    } | null;
  };
};

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  pending:   { cls: "bg-amber-50 text-amber-700 border border-amber-200",   label: "รอตรวจสอบ" },
  completed: { cls: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "อนุมัติแล้ว" },
  failed:    { cls: "bg-red-50 text-red-700 border border-red-200",         label: "ไม่อนุมัติ" },
};

const SLIP2GO_BADGE: Record<string, { cls: string; label: string }> = {
  verified:          { cls: "bg-emerald-100 text-emerald-700", label: "✓ Slip2Go ผ่าน" },
  duplicate:         { cls: "bg-red-100 text-red-700",         label: "✗ สลิปซ้ำ" },
  fake:              { cls: "bg-red-100 text-red-700",         label: "✗ สลิปปลอม" },
  amount_mismatch:   { cls: "bg-orange-100 text-orange-700",   label: "✗ ยอดไม่ตรง" },
  receiver_mismatch: { cls: "bg-orange-100 text-orange-700",   label: "✗ บัญชีผิด" },
  not_found:         { cls: "bg-yellow-100 text-yellow-700",   label: "⚠ ไม่พบในระบบ" },
  bank_error:        { cls: "bg-gray-100 text-gray-600",       label: "⚠ ธนาคารขัดข้อง" },
  unavailable:       { cls: "bg-gray-100 text-gray-500",       label: "— ยังไม่ตรวจ" },
};

function Slip2GoBadge({ status, code }: { status: string; code: string | null }) {
  const b = SLIP2GO_BADGE[status] ?? { cls: "bg-gray-100 text-gray-500", label: status };
  return (
    <span title={code ?? ""} className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${b.cls}`}>
      {b.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminTransactionsPage() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Txn | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ id: string; status: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTxns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/transactions?${params}`);
    const data = await res.json();
    setTxns(data.transactions ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { fetchTxns(); }, [fetchTxns]);
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter]);

  async function applyAction(id: string, status: string) {
    setActionLoading(true);
    await fetch("/api/admin/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNotes }),
    });
    setActionLoading(false);
    setConfirmAction(null);
    setSelected(null);
    setAdminNotes("");
    fetchTxns();
  }

  const pendingCount = txns.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">ธุรกรรม</h1>
            {statusFilter === "pending" && pendingCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                {pendingCount} รอตรวจสอบ
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">รายการทั้งหมด {total.toLocaleString()} รายการ</p>
        </div>
        <button onClick={fetchTxns} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <RefreshCw className="w-4 h-4" /> รีเฟรช
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {[
          {
            value: typeFilter, onChange: setTypeFilter, placeholder: "ประเภททั้งหมด",
            options: [["", "ประเภททั้งหมด"], ["deposit", "ฝากเงิน"], ["withdrawal", "ถอนเงิน"]],
          },
          {
            value: statusFilter, onChange: setStatusFilter, placeholder: "สถานะทั้งหมด",
            options: [["", "สถานะทั้งหมด"], ["pending", "รอตรวจสอบ"], ["completed", "อนุมัติแล้ว"], ["failed", "ไม่อนุมัติ"]],
          },
        ].map(({ value, onChange, placeholder, options }) => (
          <Select.Root key={placeholder} value={value} onValueChange={onChange}>
            <Select.Trigger className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:border-[#c6a87c] transition-all min-w-[160px]">
              <Select.Value placeholder={placeholder} />
              <Select.Icon><ChevronDown className="w-4 h-4 text-gray-400" /></Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <Select.Viewport className="p-1">
                  {options.map(([v, l]) => (
                    <Select.Item key={v} value={v} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded-md outline-none focus:bg-gray-100">
                      <Select.ItemText>{l}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#faf8f5] border-b border-[#e8d5b7]/50">
              <tr>
                {["ผู้ใช้", "ประเภท", "บัญชีเทรด", "จำนวน (THB)", "จำนวน (USD)", "สลิป", "สถานะ", "วันที่", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : txns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <Receipt className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">ไม่พบรายการ</p>
                  </td>
                </tr>
              ) : txns.map((t) => {
                const s = STATUS_MAP[t.status] ?? { cls: "bg-gray-100 text-gray-600 border border-gray-200", label: t.status };
                return (
                  <tr key={t._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      {t.user ? (
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{t.user.firstName} {t.user.lastName}</p>
                          <p className="text-[11px] text-gray-400">{t.user.email}</p>
                        </div>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${t.type === "deposit" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        {t.type === "deposit" ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {t.type === "deposit" ? "ฝากเงิน" : "ถอนเงิน"}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">{t.accountNumber ?? "-"}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900 text-xs">
                      {t.amountThb ? `฿${Number(t.amountThb).toLocaleString()}` : "-"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900 text-xs">
                      ${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {t.slipUrl ? (
                          <a href={t.slipUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b89766] hover:text-[#997a49] transition-colors">
                            <ImageIcon className="w-3.5 h-3.5" /> ดูสลิป
                          </a>
                        ) : <span className="text-gray-300 text-xs">-</span>}
                        {t.slip2go?.checked && (
                          <Slip2GoBadge status={t.slip2go.status} code={t.slip2go.code} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(t.createdAt)}</td>
                    <td className="px-5 py-4">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content align="end" className="bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 min-w-[160px]">
                            <DropdownMenu.Item
                              onSelect={() => { setSelected(t); setAdminNotes(t.adminNotes ?? ""); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer outline-none"
                            >
                              ดูรายละเอียด
                            </DropdownMenu.Item>
                            {t.status === "pending" && (
                              <>
                                <DropdownMenu.Item
                                  onSelect={() => { setSelected(t); setAdminNotes(t.adminNotes ?? ""); setConfirmAction({ id: t._id, status: "completed" }); }}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer outline-none"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> อนุมัติ
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                  onSelect={() => { setSelected(t); setAdminNotes(t.adminNotes ?? ""); setConfirmAction({ id: t._id, status: "failed" }); }}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> ไม่อนุมัติ
                                </DropdownMenu.Item>
                              </>
                            )}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                );
              })}
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

      {/* ── Detail Dialog ── */}
      <Dialog.Root open={!!selected && !confirmAction} onOpenChange={(o) => { if (!o) { setSelected(null); setAdminNotes(""); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Dialog header */}
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100 z-10">
              <Dialog.Title className="font-bold text-gray-900">รายละเอียดธุรกรรม</Dialog.Title>
              <Dialog.Close asChild>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </Dialog.Close>
            </div>

            {selected && (
              <div className="p-6 space-y-5">
                {/* Slip image */}
                {selected.slipUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">สลิปโอนเงิน</p>
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selected.slipUrl} alt="slip" className="w-full max-h-80 object-contain p-2" />
                      <a
                        href={selected.slipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
                      >
                        <ExternalLink className="w-3 h-3" /> เปิดเต็มจอ
                      </a>
                    </div>
                  </div>
                )}

                {/* Transaction info */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                  {[
                    ["รหัสธุรกรรม", selected.transactionId],
                    ["ผู้ใช้", selected.user ? `${selected.user.firstName} ${selected.user.lastName}` : "-"],
                    ["อีเมล", selected.user?.email ?? "-"],
                    ["บัญชีเทรด", selected.accountNumber ?? "-"],
                    ["จำนวน (THB)", selected.amountThb ? `฿${Number(selected.amountThb).toLocaleString()}` : "-"],
                    ["จำนวน (USD)", `$${Number(selected.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
                    ["วันที่", formatDate(selected.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-900 font-mono">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Withdrawal bank details */}
                {selected.type === "withdrawal" && (selected.bankName || selected.bankAccountNumber) && (
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-2.5">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">ข้อมูลบัญชีปลายทาง</p>
                    {[
                      ["ธนาคาร", selected.bankName ?? "-"],
                      ["เลขบัญชี", selected.bankAccountNumber ?? "-"],
                      ["ชื่อบัญชี", selected.bankAccountName ?? "-"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-rose-600">{label}</span>
                        <span className="font-semibold text-gray-900 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Admin notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">หมายเหตุ Admin</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="เพิ่มหมายเหตุ..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#c6a87c] resize-none transition-all"
                  />
                </div>

                {/* Action buttons */}
                {selected.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setConfirmAction({ id: selected._id, status: "failed" })}
                      className="flex-1 py-2.5 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >ไม่อนุมัติ</button>
                    <button
                      onClick={() => setConfirmAction({ id: selected._id, status: "completed" })}
                      className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#c6a87c] to-[#997a49] rounded-xl hover:brightness-110 transition-all shadow-md"
                    >อนุมัติ — เติมยอดบัญชี</button>
                  </div>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Confirm Dialog ── */}
      <AlertDialog.Root open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 p-6">
            <AlertDialog.Title className="text-base font-bold text-gray-900 mb-2">
              {confirmAction?.status === "completed" ? "ยืนยันการอนุมัติ?" : "ยืนยันการไม่อนุมัติ?"}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gray-500 mb-1">
              {confirmAction?.status === "completed"
                ? selected?.type === "withdrawal"
                  ? "ยืนยันการโอนเงินไปยังบัญชีธนาคารของผู้ใช้"
                  : "ระบบจะเติมยอดเงินเข้าบัญชีเทรดของผู้ใช้ทันที"
                : selected?.type === "withdrawal"
                  ? "ยอดเงินจะถูกคืนเข้าบัญชีเทรดของผู้ใช้โดยอัตโนมัติ"
                  : "ธุรกรรมนี้จะถูกปฏิเสธ ยอดเงินจะไม่เข้าบัญชี"}
            </AlertDialog.Description>
            {selected && confirmAction?.status === "completed" && selected.type === "deposit" && selected.amountThb && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 my-3 text-sm font-bold text-emerald-700">
                +฿{Number(selected.amountThb).toLocaleString()} → บัญชี {selected.accountNumber}
              </div>
            )}
            {selected && confirmAction?.status === "completed" && selected.type === "withdrawal" && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 my-3 text-sm font-bold text-rose-700 space-y-0.5">
                <p>${Number(selected.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} → {selected.bankName}</p>
                <p className="font-mono text-xs">{selected.bankAccountNumber} · {selected.bankAccountName}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end mt-5">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  disabled={actionLoading}
                  onClick={() => confirmAction && applyAction(confirmAction.id, confirmAction.status)}
                  className={`px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-60 transition-all flex items-center gap-2 ${confirmAction?.status === "completed" ? "bg-gradient-to-r from-[#c6a87c] to-[#997a49] hover:brightness-110" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {confirmAction?.status === "completed" ? "อนุมัติและเติมยอด" : "ยืนยันไม่อนุมัติ"}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
