"use client";

import { useState, useEffect } from "react";
import {
  Gift,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface PromotionItem {
  id: string;
  badge: string;
  badgeType: "hot" | "free" | "vip" | "cashback" | "referral";
  title: string;
  subtitle: string;
  descriptionTh: string;
  valueDisplay: string;
  valueLabelTh: string;
  bgImage: string;
  endsIn: string;
  conditionsTh: string[];
  active: boolean;
}

export function AdminPromotionsClient() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBadge, setFormBadge] = useState("ยอดนิยมสูงสุด");
  const [formBadgeType, setFormBadgeType] = useState<"hot" | "free" | "vip" | "cashback" | "referral">("hot");
  const [formValueDisplay, setFormValueDisplay] = useState("100%");
  const [formValueLabel, setFormValueLabel] = useState("โบนัสสมทบ");
  const [formBgImage, setFormBgImage] = useState("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80");
  const [formEndsIn, setFormEndsIn] = useState("08d 14h 30m");
  const [formConditionsText, setFormConditionsText] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promotions");
      const data = await res.json();
      if (data.success && data.promotions) {
        setPromotions(data.promotions);
      }
    } catch (err) {
      console.error("Failed to fetch promotions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    setFormTitle("");
    setFormSubtitle("");
    setFormDescription("");
    setFormBadge("โปรโมชั่นพิเศษ");
    setFormBadgeType("hot");
    setFormValueDisplay("100%");
    setFormValueLabel("โบนัสสมทบ");
    setFormBgImage("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80");
    setFormEndsIn("ระยะเวลาจำกัด");
    setFormConditionsText("ฝากเงินขั้นต่ำ $100\nเครดิตโบนัสทน Drawdown ได้\nถอนกำไรได้เมื่อทำ Volume ครบ");
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: PromotionItem) => {
    setEditingId(p.id);
    setFormTitle(p.title);
    setFormSubtitle(p.subtitle || "");
    setFormDescription(p.descriptionTh || "");
    setFormBadge(p.badge || "โปรโมชั่น");
    setFormBadgeType(p.badgeType || "hot");
    setFormValueDisplay(p.valueDisplay || "");
    setFormValueLabel(p.valueLabelTh || "");
    setFormBgImage(p.bgImage || "");
    setFormEndsIn(p.endsIn || "");
    setFormConditionsText((p.conditionsTh || []).join("\n"));
    setFormActive(p.active !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const conditionsArray = formConditionsText
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    try {
      const method = editingId ? "PUT" : "POST";
      const res = await fetch("/api/promotions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: formTitle,
          subtitle: formSubtitle,
          descriptionTh: formDescription,
          badge: formBadge,
          badgeType: formBadgeType,
          valueDisplay: formValueDisplay,
          valueLabelTh: formValueLabel,
          bgImage: formBgImage,
          endsIn: formEndsIn,
          conditionsTh: conditionsArray,
          active: formActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchPromotions();
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึกโปรโมชั่น");
      }
    } catch (err) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโปรโมชั่นนี้?")) return;

    try {
      const res = await fetch(`/api/promotions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchPromotions();
      } else {
        alert(data.error || "ไม่สามารถลบโปรโมชั่นได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบโปรโมชั่น");
    }
  };

  const handleToggleActive = async (p: PromotionItem) => {
    try {
      const res = await fetch("/api/promotions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          descriptionTh: p.descriptionTh,
          badge: p.badge,
          badgeType: p.badgeType,
          valueDisplay: p.valueDisplay,
          valueLabelTh: p.valueLabelTh,
          bgImage: p.bgImage,
          endsIn: p.endsIn,
          conditionsTh: p.conditionsTh,
          active: !p.active,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchPromotions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      
      {/* 1. ADMIN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
            <Gift className="w-3.5 h-3.5" />
            <span>ระบบหลังบ้านแอดมิน (Admin Promotions System)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            ศูนย์จัดการโบนัส & โปรโมชั่น
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            เพิ่ม แก้ไข ปิดการใช้งาน หรือลบการ์ดโปรโมชั่นที่แสดงในหน้าลูกค้า
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPromotions}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>รีเฟรชข้อมูล</span>
          </button>

          <button
            onClick={handleOpenNewModal}
            className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มโปรโมชั่นใหม่</span>
          </button>
        </div>
      </div>

      {/* 2. PROMOTIONS TABLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">กำลังโหลดโปรโมชั่น...</div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">ยังไม่มีโปรโมชั่นในระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">รูป & ชื่อโปรโมชั่น</th>
                  <th className="py-3.5 px-4">ป้ายกำกับ (Badge)</th>
                  <th className="py-3.5 px-4">มูลค่าที่แสดง</th>
                  <th className="py-3.5 px-4">ระยะเวลา</th>
                  <th className="py-3.5 px-4">สถานะใช้งาน</th>
                  <th className="py-3.5 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Title & Image */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img src={p.bgImage} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.title}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{p.subtitle}</p>
                        </div>
                      </div>
                    </td>

                    {/* Badge */}
                    <td className="py-3.5 px-4">
                      <span className="bg-amber-50 text-[#b89766] border border-amber-200/80 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                        {p.badge}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      {p.valueDisplay} <span className="text-[10px] font-normal text-slate-400 font-sans">({p.valueLabelTh})</span>
                    </td>

                    {/* Ends In */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {p.endsIn}
                    </td>

                    {/* Active Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                          p.active
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {p.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{p.active ? "เปิดใช้งาน" : "ปิดการใช้งาน"}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="แก้ไขโปรโมชั่น"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                          title="ลบโปรโมชั่น"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. ADD / EDIT PROMOTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden font-sans border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? "แก้ไขการ์ดโปรโมชั่น" : "สร้างโปรโมชั่นใหม่"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ชื่อโปรโมชั่น (Title)</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="เช่น 100% Instant Deposit Bonus"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">คำอธิบายสั้น (Subtitle)</label>
                  <input
                    type="text"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="เช่น เพิ่มมาร์จิ้นเป็น 2 เท่าทันทีที่ฝากเงิน"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ข้อความป้าย Badge</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="เช่น ยอดนิยมสูงสุด"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">มูลค่าที่แสดง (Value)</label>
                  <input
                    type="text"
                    value={formValueDisplay}
                    onChange={(e) => setFormValueDisplay(e.target.value)}
                    placeholder="เช่น 100% หรือ $30"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ป้ายอธิบายมูลค่า</label>
                  <input
                    type="text"
                    value={formValueLabel}
                    onChange={(e) => setFormValueLabel(e.target.value)}
                    placeholder="เช่น โบนัสสมทบ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">รูปภาพพื้นหลัง (Image URL)</label>
                  <input
                    type="text"
                    value={formBgImage}
                    onChange={(e) => setFormBgImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ระยะเวลาสิ้นสุด (Ends In)</label>
                  <input
                    type="text"
                    value={formEndsIn}
                    onChange={(e) => setFormEndsIn(e.target.value)}
                    placeholder="เช่น 08d 14h 30m หรือ สิทธิ์จำนวนจำกัด"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">รายละเอียดโปรโมชั่นเต็ม (Description)</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="อธิบายรายละเอียดสิทธิประโยชน์..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">เงื่อนไขข้อตกลง (แยกด้วยการขึ้นบรรทัดใหม่)</label>
                <textarea
                  rows={4}
                  value={formConditionsText}
                  onChange={(e) => setFormConditionsText(e.target.value)}
                  placeholder="เงินฝากขั้นต่ำ $100&#10;โบนัสสูงสุด $500&#10;เครดิตทน Drawdown ได้"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c] resize-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="font-bold text-slate-700">สถานะเปิดแสดงผลโปรโมชั่น</span>
                <button
                  type="button"
                  onClick={() => setFormActive(!formActive)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                    formActive ? "bg-[#c6a87c]" : "bg-slate-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                      formActive ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกโปรโมชั่น"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
