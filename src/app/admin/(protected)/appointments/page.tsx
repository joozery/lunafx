"use client";

import { useEffect, useState, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, MoreHorizontal, Plus, X, CalendarCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

type Appointment = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  date: string;
  time: string;
  notes: string;
  status: string;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  confirmed: "bg-blue-50 text-blue-700 border border-blue-100",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  cancelled: "bg-gray-100 text-gray-500",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "รอยืนยัน", confirmed: "ยืนยันแล้ว", completed: "เสร็จสิ้น", cancelled: "ยกเลิก",
};
const TOPIC_LABEL: Record<string, string> = {
  general: "ทั่วไป", deposit: "ฝากเงิน", withdrawal: "ถอนเงิน", account: "เปิดบัญชี", trading: "การเทรด",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const EMPTY_FORM = { name: "", email: "", phone: "", topic: "general", date: "", time: "", notes: "" };

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.appointments ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setCreateOpen(false);
    setForm(EMPTY_FORM);
    fetchAppointments();
  }

  async function handleUpdate(id: string, payload: Partial<Appointment>) {
    setSaving(true);
    await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    setSaving(false);
    setEditTarget(null);
    setConfirmCancel(null);
    fetchAppointments();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การนัดหมาย</h1>
          <p className="text-sm text-gray-500 mt-1">ทั้งหมด {total.toLocaleString()} รายการ</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchAppointments} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <RefreshCw className="w-4 h-4" />รีเฟรช
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-[#c6a87c] hover:bg-[#b0936b] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />เพิ่มนัดหมาย
          </button>
        </div>
      </div>

      <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
        <Select.Trigger className="flex items-center gap-2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:border-[#c6a87c] transition-all min-w-[180px]">
          <Select.Value placeholder="สถานะทั้งหมด" />
          <Select.Icon><ChevronDown className="w-4 h-4 text-gray-400" /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <Select.Viewport className="p-1">
              {[["", "สถานะทั้งหมด"], ["pending", "รอยืนยัน"], ["confirmed", "ยืนยันแล้ว"], ["completed", "เสร็จสิ้น"], ["cancelled", "ยกเลิก"]].map(([v, l]) => (
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
                {["ผู้ติดต่อ", "หัวข้อ", "วันที่นัด", "เวลา", "หมายเหตุ", "สถานะ", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (<td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>))}</tr>
                ))
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <CalendarCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">ไม่พบนัดหมาย</p>
                    <button onClick={() => setCreateOpen(true)} className="mt-3 text-sm text-[#c6a87c] hover:text-[#a38458] font-medium">+ เพิ่มนัดหมายใหม่</button>
                  </td>
                </tr>
              ) : appointments.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.email}</p>
                    {a.phone && <p className="text-xs text-gray-400">{a.phone}</p>}
                  </td>
                  <td className="px-5 py-4 text-gray-700">{TOPIC_LABEL[a.topic] ?? a.topic}</td>
                  <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{formatDate(a.date)}</td>
                  <td className="px-5 py-4 text-gray-600">{a.time}</td>
                  <td className="px-5 py-4 text-gray-500 max-w-[160px] truncate">{a.notes || "-"}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-1 min-w-[180px]">
                          <DropdownMenu.Item
                            onSelect={() => setEditTarget(a)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer outline-none"
                          >
                            แก้ไข / ดูรายละเอียด
                          </DropdownMenu.Item>
                          {a.status !== "completed" && a.status !== "cancelled" && (
                            <DropdownMenu.Item
                              onSelect={() => handleUpdate(a._id, { status: "completed" })}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer outline-none"
                            >
                              ทำเครื่องหมายว่าเสร็จสิ้น
                            </DropdownMenu.Item>
                          )}
                          {a.status !== "cancelled" && (
                            <DropdownMenu.Item
                              onSelect={() => setConfirmCancel(a._id)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer outline-none"
                            >
                              ยกเลิกนัดหมาย
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

      {/* Create Appointment Dialog */}
      <Dialog.Root open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setForm(EMPTY_FORM); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-semibold text-gray-900">เพิ่มนัดหมายใหม่</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
              </Dialog.Close>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {[
                { id: "name", label: "ชื่อ-นามสกุล *", type: "text", required: true },
                { id: "email", label: "อีเมล *", type: "email", required: true },
                { id: "phone", label: "เบอร์โทร", type: "tel", required: false },
              ].map(({ id, label, type, required }) => (
                <div key={id}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                  <input
                    type={type}
                    required={required}
                    value={(form as Record<string, string>)[id]}
                    onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">หัวข้อ</label>
                <select
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all"
                >
                  {Object.entries(TOPIC_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">วันที่ *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">เวลา *</label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">หมายเหตุ</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#c6a87c] focus:ring-1 focus:ring-[#c6a87c] transition-all resize-none"
                  placeholder="รายละเอียดเพิ่มเติม..."
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#c6a87c] hover:bg-[#b0936b] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                บันทึกนัดหมาย
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Dialog */}
      <Dialog.Root open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-base font-semibold text-gray-900">แก้ไขนัดหมาย</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
              </Dialog.Close>
            </div>
            {editTarget && (
              <div className="space-y-4 text-sm">
                {[
                  ["ชื่อ", editTarget.name],
                  ["อีเมล", editTarget.email],
                  ["เบอร์โทร", editTarget.phone || "-"],
                  ["หัวข้อ", TOPIC_LABEL[editTarget.topic] ?? editTarget.topic],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">วันที่</label>
                    <input
                      type="date"
                      defaultValue={editTarget.date?.split("T")[0]}
                      id="edit-date"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c6a87c] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">เวลา</label>
                    <input
                      type="time"
                      defaultValue={editTarget.time}
                      id="edit-time"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c6a87c] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">หมายเหตุ</label>
                  <textarea
                    rows={3}
                    defaultValue={editTarget.notes}
                    id="edit-notes"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c6a87c] transition-all resize-none"
                  />
                </div>
                <button
                  onClick={() => {
                    const date = (document.getElementById("edit-date") as HTMLInputElement).value;
                    const time = (document.getElementById("edit-time") as HTMLInputElement).value;
                    const notes = (document.getElementById("edit-notes") as HTMLTextAreaElement).value;
                    handleUpdate(editTarget._id, { date, time, notes });
                  }}
                  disabled={saving}
                  className="w-full bg-[#c6a87c] hover:bg-[#b0936b] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={!!confirmCancel} onOpenChange={(o) => !o && setConfirmCancel(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl z-50 p-6">
            <AlertDialog.Title className="text-base font-semibold text-gray-900 mb-2">ยกเลิกนัดหมาย</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gray-500 mb-6">คุณแน่ใจหรือไม่ว่าต้องการยกเลิกนัดหมายนี้?</AlertDialog.Description>
            <div className="flex gap-3 justify-end">
              <AlertDialog.Cancel asChild>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">ไม่ยกเลิก</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  disabled={saving}
                  onClick={() => confirmCancel && handleUpdate(confirmCancel, { status: "cancelled" })}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  ยืนยันยกเลิก
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
