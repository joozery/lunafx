"use client";

import { useState, useEffect } from "react";
import {
  FileText, Save, CheckCircle2, RefreshCw, Plus, Trash2, Shield, Eye, Lock
} from "lucide-react";

interface LegalSection {
  heading: string;
  intro?: string;
  paragraphs?: string[];
  items?: string[];
}

interface LegalDoc {
  slug: string;
  title: string;
  lastUpdated: string;
  email: string;
  sections: LegalSection[];
}

const LEGAL_DOC_TABS = [
  { slug: "privacy-policy", label: "นโยบายความเป็นส่วนตัว", sub: "Privacy Policy", defaultEmail: "privacy@lunaforex.com" },
  { slug: "terms-and-conditions", label: "ข้อกำหนดและเงื่อนไข", sub: "Terms & Conditions", defaultEmail: "legal@lunaforex.com" },
  { slug: "aml-policy", label: "นโยบาย AML ป้องกันการฟอกเงิน", sub: "Anti-Money Laundering Policy", defaultEmail: "compliance@lunaforex.com" },
];

export function AdminLegalClient() {
  const [activeSlug, setActiveSlug] = useState("privacy-policy");

  const [title, setTitle] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [email, setEmail] = useState("");
  const [sections, setSections] = useState<LegalSection[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDoc(activeSlug);
  }, [activeSlug]);

  const fetchDoc = async (slug: string) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/legal?slug=${slug}`);
      const data = await res.json();
      const currentTabObj = LEGAL_DOC_TABS.find((t) => t.slug === slug);

      if (data.document) {
        setTitle(data.document.title || currentTabObj?.label || "");
        setLastUpdated(data.document.lastUpdated || new Date().toISOString().split("T")[0]);
        setEmail(data.document.email || currentTabObj?.defaultEmail || "");
        setSections(data.document.sections || []);
      } else {
        // Fallback initial structure
        setTitle(currentTabObj?.label || "");
        setLastUpdated(new Date().toISOString().split("T")[0]);
        setEmail(currentTabObj?.defaultEmail || "");
        setSections([
          {
            heading: "1. ภาพรวมและขอบเขต",
            paragraphs: ["บริษัท Lunaforex ยึดถือการรักษาความปลอดภัยของข้อมูลส่วนบุคคลของผู้ใช้บริการเป็นสำคัญ"],
            items: ["ข้อมูลส่วนบุคคลของผู้ใช้บริการ", "การบันทึกการทำธุรกรรมและข้อมูลบัญชีเทรด"],
          },
          {
            heading: "2. การนำข้อมูลไปใช้งาน",
            paragraphs: ["ข้อมูลถูกนำไปใช้เพื่อการยืนยันตัวตน (KYC) และเพื่อเพิ่มความปลอดภัยในการทำธุรกรรม"],
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load legal document", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        heading: `${sections.length + 1}. หัวข้อใหม่`,
        paragraphs: [""],
        items: [],
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof LegalSection, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/legal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: activeSlug,
          title,
          lastUpdated,
          email,
          sections,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการบันทึกเอกสาร");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  };

  const currentTabObj = LEGAL_DOC_TABS.find((t) => t.slug === activeSlug)!;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
            <FileText className="w-3.5 h-3.5" />
            <span>จัดการเอกสารกฎหมาย (Legal Documents Manager)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            จัดการเนื้อหาข้อตกลง & นโยบายความเป็นส่วนตัว
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            แก้ไขเนื้อหา นโยบายความเป็นส่วนตัว, ข้อกำหนดและเงื่อนไข, และ นโยบาย AML สำหรับหน้าเว็บ
          </p>
        </div>

        <button
          onClick={() => fetchDoc(activeSlug)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* DOCUMENT SELECTION TABS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LEGAL_DOC_TABS.map((tab) => {
          const isSelected = activeSlug === tab.slug;
          return (
            <button
              key={tab.slug}
              type="button"
              onClick={() => setActiveSlug(tab.slug)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden space-y-1 ${
                isSelected
                  ? "border-[#c6a87c] bg-gradient-to-r from-[#fdfbf7] to-[#f7f1e5] shadow-sm ring-1 ring-[#c6a87c]"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span className="font-bold text-sm text-slate-900 block">{tab.label}</span>
              <span className="text-[11px] font-mono font-semibold text-[#b89766] block">{tab.sub}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN EDITOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: EDITOR FORM */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดเอกสาร...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6 text-xs font-sans">
              
              {/* Document Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-slate-100">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-800 block">ชื่อเอกสาร (Document Title)</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 text-sm focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">วันที่อัปเดต (Last Updated)</label>
                  <input
                    type="text"
                    value={lastUpdated}
                    onChange={(e) => setLastUpdated(e.target.value)}
                    placeholder="2026-08-20"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="font-bold text-slate-800 block">อีเมลสำหรับสอบถาม (Contact Email)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="privacy@lunaforex.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
              </div>

              {/* SECTIONS LIST */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                    หัวข้อย่อยและเนื้อหา (Document Sections: {sections.length})
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766] hover:bg-[#f7f1e5] font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มหัวข้อใหม่</span>
                  </button>
                </div>

                {sections.map((sec, idx) => (
                  <div key={idx} className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-3 relative group">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        Section #{idx + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="ลบหัวข้อนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Section Heading */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block text-[11px]">ชื่อหัวข้อ (Heading)</label>
                      <input
                        type="text"
                        required
                        value={sec.heading}
                        onChange={(e) => handleSectionChange(idx, "heading", e.target.value)}
                        placeholder="เช่น 1. ข้อมูลส่วนบุคคลที่เราจัดเก็บ"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                      />
                    </div>

                    {/* Section Paragraphs */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block text-[11px]">
                        เนื้อหาย่อหน้า (Paragraphs - พิมพ์ย่อหน้าละ 1 บรรทัด)
                      </label>
                      <textarea
                        rows={3}
                        value={(sec.paragraphs || []).join("\n")}
                        onChange={(e) =>
                          handleSectionChange(
                            idx,
                            "paragraphs",
                            e.target.value.split("\n").filter((p) => p.trim() !== "")
                          )
                        }
                        placeholder="พิมพ์เนื้อหาข้อตกลง..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-normal text-slate-800 leading-relaxed focus:outline-none focus:border-[#c6a87c]"
                      />
                    </div>

                    {/* Section Bullet Items */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block text-[11px]">
                        รายการ Bullet Points (ถ้ามี - พิมพ์ข้อละ 1 บรรทัด)
                      </label>
                      <textarea
                        rows={2}
                        value={(sec.items || []).join("\n")}
                        onChange={(e) =>
                          handleSectionChange(
                            idx,
                            "items",
                            e.target.value.split("\n").filter((it) => it.trim() !== "")
                          )
                        }
                        placeholder="• ข้อที่ 1..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-normal text-slate-700 focus:outline-none focus:border-[#c6a87c]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>บันทึกเอกสารทางกฎหมายเรียบร้อยแล้ว!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-3.5 rounded-xl text-xs transition-all shadow-md shadow-[#c6a87c]/20 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไขเอกสารนี้"}</span>
              </button>
            </form>
          )}
        </div>

        {/* RIGHT COL: LIVE PREVIEW */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#e6cda3]" />
                <span className="text-xs font-bold text-[#e6cda3] font-mono">LIVE PREVIEW</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                ตัวอย่างหน้าเว็บจริง
              </span>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-bold text-[#c6a87c] uppercase tracking-wider block">LEGAL DOCUMENT</span>
                <h3 className="text-base font-extrabold text-white mt-1">{title || "ชื่อเอกสาร"}</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">อัปเดตล่าสุด: {lastUpdated}</p>
              </div>

              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                {sections.map((sec, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="font-bold text-white text-xs text-[#e6cda3]">{sec.heading}</h4>
                    {sec.paragraphs?.map((p, j) => (
                      <p key={j} className="text-slate-300 text-[11px] leading-relaxed">{p}</p>
                    ))}
                    {sec.items && sec.items.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                        {sec.items.map((it, k) => (
                          <li key={k}>{it}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
