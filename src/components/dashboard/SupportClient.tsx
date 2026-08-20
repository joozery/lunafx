"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, MessageCircle, Mail, HelpCircle, ChevronDown,
  Send, CheckCircle2, Calendar, X, Headphones,
  ArrowRight, Clock, Zap, Sparkles
} from "lucide-react";

interface FAQItem {
  id: string;
  questionTh: string;
  questionEn: string;
  answerTh: string;
  answerEn: string;
  category: string;
  order?: number;
}

interface SupportClientProps {
  lang: string;
}

const CATEGORIES = [
  { id: "all",        labelTh: "ทั้งหมด",            labelEn: "All",                  icon: HelpCircle },
  { id: "accounts",   labelTh: "บัญชีเทรด & KYC",    labelEn: "Accounts & KYC",       icon: Headphones },
  { id: "deposit",    labelTh: "ฝาก-ถอนเงิน",         labelEn: "Deposits & Withdrawals",icon: Zap },
  { id: "platforms",  labelTh: "แพลตฟอร์ม MT4/MT5",  labelEn: "MT4/MT5 Platforms",    icon: Sparkles },
  { id: "promotions", labelTh: "โบนัส & โปรโมชั่น",  labelEn: "Bonuses & Promotions", icon: Clock },
];

export function SupportClient({ lang }: SupportClientProps) {
  const isth = lang === "th";
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("ทั่วไป");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  useEffect(() => { fetchFaqs(); }, []);

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faqs");
      const data = await res.json();
      if (data.success && data.faqs) {
        setFaqs(data.faqs);
        if (data.faqs.length > 0) setOpenFaqId(data.faqs[0].id);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTicket(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: ticketSubject, category: ticketCategory, message: ticketMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketSuccess(true);
        setTimeout(() => {
          setIsTicketModalOpen(false);
          setTicketSuccess(false);
          setTicketSubject("");
          setTicketMessage("");
        }, 2000);
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการส่งข้อความ");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const filteredFaqs = faqs.filter((item) => {
    const q = isth ? item.questionTh : item.questionEn;
    const a = isth ? item.answerTh : item.answerEn;
    const matchesSearch = !searchQuery ||
      q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12 font-sans text-slate-800">

      {/* ── SLEEK COMPACT HEADER & SEARCH ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isth ? "ซัพพอร์ต 24/5 ออนไลน์" : "24/5 Live Support Active"}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              {isth ? "ศูนย์ช่วยเหลือ & คำถามพบบ่อย (FAQ)" : "Support & Help Center"}
            </h1>
          </div>

          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black px-4 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{isth ? "ส่งตั๋วคำร้องขอซัพพอร์ต" : "Create Support Ticket"}</span>
          </button>
        </div>

        {/* Compact Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isth ? "พิมพ์เพื่อค้นหา เช่น วิธีฝากเงิน, สเปรด, ยืนยันตัวตน..." : "Search help topics (e.g., deposits, KYC, leverage)..."}
            className="w-full bg-slate-50 border border-slate-200 focus:border-[#c6a87c] focus:bg-white outline-none text-slate-900 text-xs rounded-xl pl-10 pr-9 py-2.5 placeholder:text-slate-400 transition-all font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── COMPACT QUICK CONTACT STRIP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Live Chat / Ticket */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-[#c6a87c] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">{isth ? "แชทสดกับเจ้าหน้าที่" : "Live Chat"}</p>
              <p className="text-[10px] text-slate-400">{isth ? "ตอบกลับ < 1 นาที" : "< 1 min response"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors shrink-0"
          >
            {isth ? "เริ่มแชท" : "Chat"}
          </button>
        </div>

        {/* Email Support */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-[#c6a87c] transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#fdfbf7] text-[#b89766] border border-[#e8d5b7] rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">{isth ? "อีเมลฝ่ายบริการ" : "Email Support"}</p>
              <p className="text-[10px] text-slate-400 font-mono">support@lunaforex.com</p>
            </div>
          </div>
          <a
            href="mailto:support@lunaforex.com"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors shrink-0"
          >
            {isth ? "ส่งเมล" : "Email"}
          </a>
        </div>

        {/* VIP Appointment */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c6a87c]/20 text-[#e6cda3] border border-[#c6a87c]/30 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">{isth ? "นัดหมายที่ปรึกษา" : "VIP Consultation"}</p>
              <p className="text-[10px] text-slate-400">{isth ? "คุยส่วนตัว 1-on-1" : "Private 1-on-1"}</p>
            </div>
          </div>
          <Link
            href={`/${lang}/dashboard/appointments`}
            className="bg-[#c6a87c] hover:bg-[#b89766] text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors shrink-0"
          >
            {isth ? "นัดหมาย" : "Book"}
          </Link>
        </div>
      </div>

      {/* ── FAQ SECTION ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-[#fdfbf7] text-[#997a49] border border-[#e8d5b7] shadow-2xs font-extrabold"
                    : "text-slate-600 bg-slate-50 hover:bg-slate-100 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#b89766]" : "text-slate-400"}`} />
                <span>{isth ? cat.labelTh : cat.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2 pt-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">กำลังโหลดคำถามพบบ่อย...</div>
          ) : filteredFaqs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              ไม่พบคำถามที่ค้นหา กรุณาลองค้นหาด้วยคำอื่น หรือกดปุ่ม &quot;ส่งตั๋วคำร้องขอซัพพอร์ต&quot; ด้านบน
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              const question = isth ? faq.questionTh : faq.questionEn;
              const answer = isth ? faq.answerTh : faq.answerEn;

              return (
                <div
                  key={faq.id}
                  className={`border rounded-xl transition-all overflow-hidden ${
                    isOpen ? "border-[#e8d5b7] bg-[#fdfbf7]/40 shadow-2xs" : "border-slate-200/80 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-900"
                  >
                    <span className="flex-1">{question}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#b89766]" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-slate-600 text-xs leading-relaxed border-t border-[#e8d5b7]/40 whitespace-pre-line font-normal">
                      {answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ── CREATE SUPPORT TICKET MODAL ── */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsTicketModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766] flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {isth ? "ส่งตั๋วคำร้องขอซัพพอร์ต" : "Submit Support Ticket"}
                </h3>
                <p className="text-[11px] text-slate-400">{isth ? "เจ้าหน้าที่ภาษาไทยพร้อมช่วยเหลือคุณ" : "Our team will reply shortly"}</p>
              </div>
            </div>

            {ticketSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <p className="font-bold text-emerald-800 text-sm">
                  {isth ? "ส่งคำร้องขอเรียบร้อยแล้ว!" : "Ticket Submitted!"}
                </p>
                <p className="text-xs text-emerald-600">
                  {isth ? "เจ้าหน้าที่จะติดต่อกลับผ่านทางอีเมลโดยเร็วที่สุด" : "We will get back to you via email soon."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="space-y-3 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">หัวข้อเรื่อง (Subject)</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder={isth ? "เช่น สอบถามเรื่องการฝากเงินผ่าน QR Code" : "e.g., Deposit Inquiry"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">หมวดหมู่ (Category)</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  >
                    <option value="ทั่วไป">ทั่วไป (General)</option>
                    <option value="ฝาก-ถอนเงิน">ฝาก-ถอนเงิน (Deposits & Withdrawals)</option>
                    <option value="การยืนยันตัวตน KYC">การยืนยันตัวตน (KYC)</option>
                    <option value="ปัญหา MT4/MT5">ปัญหา MT4/MT5 (Platform Issues)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">รายละเอียดข้อความ (Message)</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder={isth ? "ระบุรายละเอียดคำถามหรือปัญหา..." : "Provide details of your question..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-3 rounded-xl text-xs transition-all shadow-md shadow-[#c6a87c]/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingTicket ? "กำลังส่ง..." : "ส่งข้อความถึงเจ้าหน้าที่"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
