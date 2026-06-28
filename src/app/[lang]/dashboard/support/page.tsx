"use client";

import { use } from "react";
import { Search, MessageCircle, Mail, HelpCircle, ChevronDown } from "lucide-react";
import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";

export default function SupportPage(props: { params: Promise<{ lang: string }> }) {
  const { lang } = use(props.params);
  if (!hasLocale(lang)) notFound();
  const isth = (lang as Locale) === "th";

  const faqs = [
    { 
      q: isth ? "ใช้เวลาในการถอนเงินนานเท่าใด?" : "How long do withdrawals take?", 
      a: isth ? "การถอนเงินผ่านช่องทางธนาคารในประเทศจะใช้เวลา 1-3 วันทำการ ส่วน e-wallet และคริปโตเคอร์เรนซีจะดำเนินการทันที" : "Local bank transfers take 1-3 business days. E-wallet and crypto withdrawals are processed instantly." 
    },
    { 
      q: isth ? "สเปรด (Spread) ของบัญชี Standard เริ่มต้นที่เท่าใด?" : "What is the starting spread for Standard accounts?", 
      a: isth ? "บัญชี Standard ของเรามีสเปรดลอยตัวเริ่มต้นเพียง 1.0 pips และไม่มีค่าคอมมิชชั่นในการเทรด" : "Our Standard accounts feature floating spreads starting from just 1.0 pips with zero trading commission." 
    },
    { 
      q: isth ? "ฉันสามารถเปลี่ยนเลเวอเรจ (Leverage) ได้หรือไม่?" : "Can I change my account leverage?", 
      a: isth ? "คุณสามารถเปลี่ยนเลเวอเรจได้ตลอดเวลาผ่านเมนู 'บัญชีเทรด' สูงสุดถึง 1:1000 ขึ้นอยู่กับเงื่อนไขของแต่ละบัญชี" : "Yes, you can change your leverage anytime via the 'Accounts' menu. Maximum leverage is 1:1000 depending on account type." 
    },
    { 
      q: isth ? "ลืมรหัสผ่าน MT4/MT5 ต้องทำอย่างไร?" : "How do I reset my MT4/MT5 password?", 
      a: isth ? "ไปที่เมนู 'บัญชีเทรด' คลิกที่บัญชีที่ต้องการ จากนั้นเลือก 'รีเซ็ตรหัสผ่าน' รหัสผ่านใหม่จะถูกส่งไปยังอีเมลของคุณ" : "Go to the 'Accounts' menu, select the relevant account, and click 'Reset Password'. A new password will be emailed to you." 
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{isth ? "ศูนย์ช่วยเหลือ" : "Support Center"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isth ? "ค้นหาคำตอบที่คุณต้องการ หรือติดต่อทีมงาน Support ที่พร้อมดูแลคุณ 24/7" : "Find the answers you need or contact our 24/7 Support team."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contact Methods */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[#c6a87c] transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{isth ? "แชทสด (Live Chat)" : "Live Chat"}</h3>
            <p className="text-xs text-gray-500 mb-4">{isth ? "ตอบกลับภายใน 1 นาที" : "Replies under 1 minute"}</p>
            <button className="text-emerald-600 font-semibold text-sm">
              {isth ? "เริ่มแชท" : "Start Chat"} &rarr;
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-[#c6a87c] transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{isth ? "อีเมล (Email)" : "Email"}</h3>
            <p className="text-xs text-gray-500 mb-4">support@lunaforex.com</p>
            <button className="text-blue-600 font-semibold text-sm">
              {isth ? "ส่งอีเมล" : "Send Email"} &rarr;
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{isth ? "คำถามที่พบบ่อย (FAQ)" : "Frequently Asked Questions"}</h2>
            </div>

            <div className="relative mb-6">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder={isth ? "ค้นหาคำถาม (เช่น ถอนเงิน, สเปรด, MT4)..." : "Search FAQs..."} 
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#c6a87c] focus:bg-white focus:ring-1 focus:ring-[#c6a87c] outline-none rounded-xl pl-12 pr-4 py-3 text-sm transition-all"
              />
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
                  <button className="w-full flex items-center justify-between p-4 text-left bg-white">
                    <span className="font-semibold text-gray-800 text-sm">{faq.q}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                  </button>
                  {/* Normally this would expand/collapse, hardcoded open for first item just for UI demo */}
                  {i === 0 && (
                    <div className="px-4 pb-4 bg-white">
                      <p className="text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
