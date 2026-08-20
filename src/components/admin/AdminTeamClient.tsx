"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck, UserPlus, Search, RefreshCw, KeyRound, Lock,
  Edit2, UserX, UserCheck, X, CheckCircle2, AlertCircle, Eye, EyeOff
} from "lucide-react";

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  hasPin: boolean;
  adminPin: string;
  createdAt: string;
}

export function AdminTeamClient() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newAdminPin, setNewAdminPin] = useState("123456");
  const [showPw, setShowPw] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // Edit Admin Modal State
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      if (data.admins) {
        setAdmins(data.admins);
      }
    } catch (err) {
      console.error("Failed to load admins", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess(false);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName,
          lastName: newLastName,
          email: newEmail,
          phone: newPhone,
          password: newPassword,
          adminPin: newAdminPin,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setCreateSuccess(true);
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateSuccess(false);
          setNewFirstName("");
          setNewLastName("");
          setNewEmail("");
          setNewPhone("");
          setNewPassword("");
          setNewAdminPin("123456");
          fetchAdmins();
        }, 1200);
      } else {
        setCreateError(data.error || "เกิดข้อผิดพลาดในการสร้างแอดมิน");
      }
    } catch {
      setCreateError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditFirstName(admin.firstName);
    setEditLastName(admin.lastName);
    setEditPhone(admin.phone);
    setEditPin(admin.adminPin || "123456");
    setEditPassword("");
    setEditError("");
    setEditSuccess(false);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setUpdating(true);
    setEditError("");
    setEditSuccess(false);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAdmin._id,
          firstName: editFirstName,
          lastName: editLastName,
          phone: editPhone,
          adminPin: editPin,
          newPassword: editPassword || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditSuccess(true);
        setTimeout(() => {
          setEditingAdmin(null);
          setEditSuccess(false);
          fetchAdmins();
        }, 1200);
      } else {
        setEditError(data.error || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
      }
    } catch {
      setEditError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    const newStatus = admin.status === "active" ? "suspended" : "active";
    try {
      await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin._id, status: newStatus }),
      });
      fetchAdmins();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.firstName.toLowerCase().includes(search.toLowerCase()) ||
      a.lastName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Security & Staff Management</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            จัดการผู้ดูแลระบบ (Admin Team)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            เพิ่มบัญชีแอดมิน กำหนดสิทธิ์ และจัดการรหัส PIN ความปลอดภัย 6 หลักของทีมผู้ดูแลระบบ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchAdmins}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-[#c6a87c]/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มแอดมินใหม่</span>
          </button>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ หรืออีเมลแอดมิน..."
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#c6a87c] font-medium"
        />
      </div>

      {/* ADMINS TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">ผู้ดูแลระบบ (Admin)</th>
                <th className="p-4">อีเมล / เบอร์โทร</th>
                <th className="p-4">รหัส PIN 6 หลัก</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4">วันที่สร้าง</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    กำลังโหลดข้อมูลทีมแอดมิน...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    ไม่พบบัญชีแอดมินในระบบ
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c6a87c] to-[#997a49] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                          {a.firstName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">
                            {a.firstName} {a.lastName}
                          </p>
                          <span className="text-[10px] font-bold text-[#b89766] bg-[#fdfbf7] border border-[#e8d5b7] px-1.5 py-0.5 rounded font-mono">
                            SUPER ADMIN
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{a.email}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{a.phone || "—"}</p>
                    </td>

                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono font-bold text-slate-700">
                        <KeyRound className="w-3.5 h-3.5 text-[#b89766]" />
                        <span>••••••</span>
                        <span className="text-[10px] text-slate-400 font-normal">({a.adminPin})</span>
                      </div>
                    </td>

                    <td className="p-4">
                      {a.status === "active" ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ใช้งานปกติ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          ถูกระงับ
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-mono text-slate-500">
                      {new Date(a.createdAt).toLocaleDateString("th-TH")}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                          title="แก้ไขข้อมูล & PIN"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(a)}
                          className={`p-2 rounded-lg transition-colors ${
                            a.status === "active"
                              ? "hover:bg-rose-50 text-rose-500"
                              : "hover:bg-emerald-50 text-emerald-600"
                          }`}
                          title={a.status === "active" ? "ระงับสิทธิ์แอดมิน" : "เปิดใช้งานสิทธิ์"}
                        >
                          {a.status === "active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fdfbf7] border border-[#e8d5b7] flex items-center justify-center text-[#b89766]">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">เพิ่มผู้ดูแลระบบใหม่ (Create Admin)</h3>
                <p className="text-xs text-slate-500">สร้างบัญชีผู้ดูแลระบบพร้อมกำหนดรหัส PIN 6 หลัก</p>
              </div>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ชื่อจริง (First Name)</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="เช่น สมชาย"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">นามสกุล (Last Name)</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="เช่น ใจดี"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">อีเมลผู้ใช้งาน (Admin Email)</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@lunaforex.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">เบอร์โทรศัพท์ (Phone Number)</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="081-234-5678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">รหัสผ่าน (Password)</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 font-mono focus:outline-none focus:border-[#c6a87c]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">รหัส PIN 6 หลัก</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-center font-bold text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
                  {createError}
                </div>
              )}

              {createSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>สร้างผู้ดูแลระบบใหม่สำเร็จแล้ว!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-3 rounded-xl text-xs transition-all shadow-md shadow-[#c6a87c]/20"
              >
                {creating ? "กำลังสร้างแอดมิน..." : "ยืนยันสร้างแอดมินใหม่"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMIN MODAL */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setEditingAdmin(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#fdfbf7] border border-[#e8d5b7] flex items-center justify-center text-[#b89766]">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">แก้ไขข้อมูลแอดมิน</h3>
                <p className="text-xs text-slate-500">{editingAdmin.email}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ชื่อจริง</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">รหัส PIN ความปลอดภัย 6 หลัก</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-center font-bold text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">รหัสผ่านใหม่ (ระบุเมื่อต้องการเปลี่ยน)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="กรอกหากต้องการเปลี่ยนรหัสผ่านใหม่"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกการแก้ไขข้อมูลสำเร็จแล้ว!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={updating}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-2xs"
              >
                {updating ? "กำลังบันทึก..." : "บันทึกการแก้ไขข้อมูลแอดมิน"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
