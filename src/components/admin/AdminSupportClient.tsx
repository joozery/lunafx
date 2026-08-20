"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  Search,
} from "lucide-react";

interface FAQItem {
  id: string;
  questionTh: string;
  questionEn: string;
  answerTh: string;
  answerEn: string;
  category: string;
  order: number;
}

interface TicketItem {
  id: string;
  ticketNo: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  message: string;
  status: "pending" | "in_progress" | "resolved";
  reply: string;
  createdAt: string;
}

export function AdminSupportClient() {
  const [activeTab, setActiveTab] = useState<"faqs" | "tickets">("faqs");
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // FAQ Modal state
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqQuestionTh, setFaqQuestionTh] = useState("");
  const [faqQuestionEn, setFaqQuestionEn] = useState("");
  const [faqAnswerTh, setFaqAnswerTh] = useState("");
  const [faqAnswerEn, setFaqAnswerEn] = useState("");
  const [faqCategory, setFaqCategory] = useState("accounts");
  const [faqOrder, setFaqOrder] = useState(1);
  const [savingFaq, setSavingFaq] = useState(false);

  // Ticket Reply Modal state
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [ticketStatusText, setTicketStatusText] = useState<"pending" | "in_progress" | "resolved">("resolved");
  const [savingTicket, setSavingTicket] = useState(false);

  useEffect(() => {
    fetchFaqs();
    fetchTickets();
  }, []);

  const fetchFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const res = await fetch("/api/faqs");
      const data = await res.json();
      if (data.success && data.faqs) {
        setFaqs(data.faqs);
      }
    } catch (err) {
      console.error("Failed to fetch FAQs", err);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error("Failed to fetch Tickets", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleOpenNewFaqModal = () => {
    setEditingFaqId(null);
    setFaqQuestionTh("");
    setFaqQuestionEn("");
    setFaqAnswerTh("");
    setFaqAnswerEn("");
    setFaqCategory("accounts");
    setFaqOrder(faqs.length + 1);
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaqModal = (faq: FAQItem) => {
    setEditingFaqId(faq.id);
    setFaqQuestionTh(faq.questionTh);
    setFaqQuestionEn(faq.questionEn || "");
    setFaqAnswerTh(faq.answerTh);
    setFaqAnswerEn(faq.answerEn || "");
    setFaqCategory(faq.category || "accounts");
    setFaqOrder(faq.order || 1);
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFaq(true);

    try {
      const method = editingFaqId ? "PUT" : "POST";
      const res = await fetch("/api/faqs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFaqId,
          questionTh: faqQuestionTh,
          questionEn: faqQuestionEn,
          answerTh: faqAnswerTh,
          answerEn: faqAnswerEn,
          category: faqCategory,
          order: faqOrder,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsFaqModalOpen(false);
        fetchFaqs();
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึก FAQ");
      }
    } catch (err) {
      alert("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบคำถาม FAQ นี้?")) return;

    try {
      const res = await fetch(`/api/faqs?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchFaqs();
      } else {
        alert(data.error || "ไม่สามารถลบ FAQ ได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบ FAQ");
    }
  };

  const handleSaveTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSavingTicket(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTicket.id,
          status: ticketStatusText,
          reply: ticketReplyText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSelectedTicket(null);
        fetchTickets();
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการอัปเดตคำร้อง");
      }
    } catch (err) {
      alert("ไม่สามารถอัปเดตข้อมูลได้");
    } finally {
      setSavingTicket(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      
      {/* 1. ADMIN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>ระบบหลังบ้านแอดมิน (Admin Support System)</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">
            ศูนย์จัดการคำถาม FAQ & คำร้องจากสมาชิก
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ตั้งค่าเพิ่ม/แก้ไข/ลบคำถาม FAQ และตอบกลับตั๋วคำร้องจากลูกค้า Lunaforex
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "faqs" ? (
            <button
              onClick={handleOpenNewFaqModal}
              className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มคำถาม FAQ ใหม่</span>
            </button>
          ) : (
            <button
              onClick={fetchTickets}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>รีเฟรชข้อมูล</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TABS NAV */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab("faqs")}
          className={`px-5 py-2 rounded-xl transition-all ${
            activeTab === "faqs"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          จัดการคำถาม FAQ ({faqs.length})
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-5 py-2 rounded-xl transition-all ${
            activeTab === "tickets"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          รายการคำร้องจากสมาชิก ({tickets.length})
        </button>
      </div>

      {/* 3. TAB 1: FAQ MANAGEMENT TABLE */}
      {activeTab === "faqs" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          {loadingFaqs ? (
            <div className="p-12 text-center text-xs text-slate-400">กำลังโหลดคำถาม FAQ...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 text-center">ลำดับ</th>
                    <th className="py-3.5 px-4">หมวดหมู่</th>
                    <th className="py-3.5 px-4">คำถาม (ไทย / อังกฤษ)</th>
                    <th className="py-3.5 px-4">คำตอบย่อ</th>
                    <th className="py-3.5 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {faqs.map((faq, idx) => (
                    <tr key={faq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        #{faq.order || idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-amber-50 text-[#b89766] border border-amber-200/80 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                          {faq.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900">{faq.questionTh}</p>
                        {faq.questionEn && (
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{faq.questionEn}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm text-slate-500 truncate">
                        {faq.answerTh}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditFaqModal(faq)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="แก้ไข FAQ"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            title="ลบ FAQ"
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
      )}

      {/* 4. TAB 2: SUPPORT TICKETS TABLE */}
      {activeTab === "tickets" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
          {loadingTickets ? (
            <div className="p-12 text-center text-xs text-slate-400">กำลังโหลดคำร้อง...</div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">ยังไม่มีรายการคำร้องจากสมาชิก</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">เลขตั๋วคำร้อง</th>
                    <th className="py-3.5 px-4">ผู้ส่ง / อีเมล</th>
                    <th className="py-3.5 px-4">หมวดหมู่ & หัวข้อ</th>
                    <th className="py-3.5 px-4">สถานะ</th>
                    <th className="py-3.5 px-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {t.ticketNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{t.userName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{t.userEmail}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mr-2">
                          {t.category}
                        </span>
                        <span className="font-bold text-slate-900">{t.subject}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {t.status === "resolved" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            ตอบกลับแล้ว
                          </span>
                        ) : t.status === "in_progress" ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            กำลังดำเนินการ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            รอดำเนินการ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setTicketReplyText(t.reply || "");
                            setTicketStatusText(t.status || "resolved");
                          }}
                          className="bg-[#fdfbf7] hover:bg-[#f5efe4] text-[#b89766] border border-[#e8d5b7] font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-2xs"
                        >
                          ตอบกลับ / ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. ADD / EDIT FAQ MODAL */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden font-sans border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {editingFaqId ? "แก้ไขคำถาม FAQ" : "เพิ่มคำถาม FAQ ใหม่"}
              </h3>
              <button
                onClick={() => setIsFaqModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">หมวดหมู่</label>
                  <select
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                  >
                    <option value="accounts">บัญชีเทรด & KYC</option>
                    <option value="deposit">ฝาก-ถอนเงิน</option>
                    <option value="platforms">แพลตฟอร์ม MT4/MT5</option>
                    <option value="promotions">โบนัส & โปรโมชั่น</option>
                    <option value="general">ทั่วไป</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">ลำดับการแสดงผล</label>
                  <input
                    type="number"
                    value={faqOrder}
                    onChange={(e) => setFaqOrder(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">คำถาม (ภาษาไทย)</label>
                <input
                  type="text"
                  required
                  value={faqQuestionTh}
                  onChange={(e) => setFaqQuestionTh(e.target.value)}
                  placeholder="ระบุคำถามภาษาไทย..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">คำถาม (ภาษาอังกฤษ - Option)</label>
                <input
                  type="text"
                  value={faqQuestionEn}
                  onChange={(e) => setFaqQuestionEn(e.target.value)}
                  placeholder="Enter English Question..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">คำตอบ (ภาษาไทย)</label>
                <textarea
                  required
                  rows={3}
                  value={faqAnswerTh}
                  onChange={(e) => setFaqAnswerTh(e.target.value)}
                  placeholder="ระบุคำตอบอย่างละเอียดภาษาไทย..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">คำตอบ (ภาษาอังกฤษ - Option)</label>
                <textarea
                  rows={3}
                  value={faqAnswerEn}
                  onChange={(e) => setFaqAnswerEn(e.target.value)}
                  placeholder="Enter English Answer..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:border-[#c6a87c] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingFaq}
                  className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
                >
                  {savingFaq ? "กำลังบันทึก..." : "บันทึกคำถาม FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. REPLY TICKET MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden font-sans border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  ตั๋วคำร้อง #{selectedTicket.ticketNo}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  จาก: {selectedTicket.userName} ({selectedTicket.userEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTicketReply} className="p-6 space-y-4 text-xs">
              {/* User Message Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700 block">
                  หัวข้อ: {selectedTicket.subject}
                </span>
                <p className="text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60">
                  {selectedTicket.message}
                </p>
              </div>

              {/* Select Status */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">อัปเดตสถานะตั๋วคำร้อง</label>
                <select
                  value={ticketStatusText}
                  onChange={(e) => setTicketStatusText(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#c6a87c]"
                >
                  <option value="pending">รอดำเนินการ (Pending)</option>
                  <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
                  <option value="resolved">ตอบกลับเรียบร้อย (Resolved)</option>
                </select>
              </div>

              {/* Admin Reply */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">ข้อความตอบกลับจากแอดมิน</label>
                <textarea
                  rows={4}
                  value={ticketReplyText}
                  onChange={(e) => setTicketReplyText(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับถึงสมาชิก..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#c6a87c] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  type="submit"
                  disabled={savingTicket}
                  className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md"
                >
                  {savingTicket ? "กำลังบันทึก..." : "บันทึกการตอบกลับ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
