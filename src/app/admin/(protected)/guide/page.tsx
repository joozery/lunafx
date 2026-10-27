import Link from "next/link";
import {
  BookOpen, FileText, ArrowLeftRight, Users, Gift, TrendingUp, Bell, ShieldAlert,
  Building2, MessageCircle, Headphones, ArrowRight, type LucideIcon,
} from "lucide-react";

export const metadata = {
  title: "คู่มือหลังบ้าน | Lunaforex Admin",
};

type Section = {
  id: string;
  icon: LucideIcon;
  title: string;
  href?: string;
  intro: string;
  steps?: string[];
  notes?: string[];
};

/* Keep in sync with the real flows: src/app/api/** and src/lib/{referral,bonus,risk,copyTrading}.ts */
const SECTIONS: Section[] = [
  {
    id: "kyc",
    icon: FileText,
    title: "คำขอเปิดบัญชีเทรด (KYC)",
    href: "/admin/account-requests",
    intro: "ลูกค้าเปิดบัญชีเดโมได้เองทันที แต่บัญชีจริงต้องส่งเอกสารให้แอดมินตรวจก่อน",
    steps: [
      "ลูกค้าเลือกแพลตฟอร์ม / ประเภทบัญชี / เลเวอเรจ แล้วอัปโหลดบัตรประชาชนหน้า-หลัง และเซลฟี่คู่บัตร (Statement ธนาคารไม่บังคับ)",
      "คำขอขึ้นสถานะ \"รอดำเนินการ\" และแจ้งที่กระดิ่ง",
      "แอดมินเปิดดูเอกสาร แล้วกดอนุมัติหรือไม่อนุมัติ (ใส่หมายเหตุถึงลูกค้าได้)",
      "อนุมัติ → ระบบสร้างบัญชีเทรดจริงเลขขึ้นต้น 88xxxxx ให้ลูกค้าทันที ยอดเริ่มต้น $0",
    ],
    notes: ["ลูกค้า 1 คนมีคำขอที่รออนุมัติได้ครั้งละ 1 รายการ"],
  },
  {
    id: "deposit",
    icon: ArrowLeftRight,
    title: "ฝากเงิน",
    href: "/admin/transactions",
    intro: "ลูกค้าโอนเงินบาทเข้าบัญชีบริษัท แล้วแนบสลิป ระบบแปลงเป็น USD ตามเรตที่ตั้งไว้",
    steps: [
      "ลูกค้าสแกน QR พร้อมเพย์ (ยอดถูกใส่ให้อัตโนมัติ) หรือโอนเข้าเลขบัญชี แล้วแนบสลิป",
      "Slip2Go ตรวจสลิป: ถ้าผ่าน (ยอดตรง บัญชีผู้รับตรง ไม่ซ้ำ) → อนุมัติอัตโนมัติ เงินเข้าบัญชีเทรดทันที",
      "ถ้าตรวจไม่ได้หรือไม่ชัวร์ → สถานะ \"รอดำเนินการ\" แอดมินต้องเปิดดูสลิปแล้วกด อนุมัติ / ปฏิเสธ เอง",
      "เมื่ออนุมัติ: เงินเข้าบัญชี + ให้โบนัสเงินฝาก (ถ้าเข้าเงื่อนไข) + สร้างค่าแนะนำให้ผู้แนะนำ (ถ้ามี)",
    ],
    notes: [
      "สลิปซ้ำ / สลิปปลอม / ยอดไม่ตรง / บัญชีผู้รับไม่ตรง ระบบปฏิเสธให้ตั้งแต่ตอนส่ง",
      "เลขบัญชีบริษัท, PromptPay และเรตแลกเปลี่ยน ตั้งที่ \"ตั้งค่าธนาคารรับฝาก\"",
    ],
  },
  {
    id: "withdraw",
    icon: ArrowLeftRight,
    title: "ถอนเงิน",
    href: "/admin/transactions",
    intro: "ยอดถอนถูกหักจากบัญชีเทรดทันทีที่ลูกค้าส่งคำขอ เพื่อกันถอนซ้ำ",
    steps: [
      "ลูกค้าส่งคำขอถอน → ยอดถูกล็อก (หักออกจากบัญชี) และสถานะ \"รอดำเนินการ\"",
      "แอดมินโอนเงินบาทให้ลูกค้าตามบัญชีที่ลูกค้าระบุ แล้วกด \"สำเร็จ\"",
      "ถ้าปฏิเสธ → ระบบคืนยอดเข้าบัญชีเทรดของลูกค้าให้อัตโนมัติ",
    ],
    notes: ["บัญชีที่รับโบนัสต้องเทรดครบ Lot ตามเงื่อนไขก่อนถึงจะถอนได้ และอาจมีเพดานถอน"],
  },
  {
    id: "bonus",
    icon: Gift,
    title: "โบนัสเงินฝาก & โปรโมชั่น",
    href: "/admin/settings/bonus",
    intro: "\"ตั้งค่าโบนัสเงินฝาก\" คือกติกาที่ระบบใช้จ่ายจริง ส่วน \"โบนัส & โปรโมชั่น\" คือการ์ดประชาสัมพันธ์ที่ลูกค้าเห็นเท่านั้น",
    steps: [
      "ตั้งยอดฝากขั้นต่ำ, โบนัสแบบจำนวนคงที่ ($) หรือเป็น % ของยอดฝาก และเพดานโบนัสต่อครั้ง",
      "ตั้งเงื่อนไขเทิร์น: ต้องเทรดกี่ Lot ต่อโบนัส $1 ก่อนถอนได้",
      "ตั้งเพดานถอนหลังผ่านเทิร์น (0 = ไม่จำกัด) และเลือกให้เฉพาะยอดฝากแรกได้",
    ],
    notes: ["แก้การ์ดโปรโมชั่นไม่มีผลกับเงินที่จ่ายจริง ต้องแก้ที่ตั้งค่าโบนัสด้วยให้ตรงกัน"],
  },
  {
    id: "referral",
    icon: Users,
    title: "ระบบแนะนำเพื่อน",
    href: "/admin/referrals",
    intro: "ผู้แนะนำได้ % ของยอดฝากจริงของเพื่อนที่สมัครผ่านลิงก์ ทุกรายการต้องให้แอดมินอนุมัติก่อนจ่าย",
    steps: [
      "เปิดระบบและตั้ง % เริ่มต้นที่หน้า \"ระบบแนะนำเพื่อน\" (ตั้ง % รายคนผ่านอีเมลได้)",
      "ลูกค้าคัดลอกลิงก์ของตัวเองจากเมนู Partnership แล้วส่งให้เพื่อน (หรือให้เพื่อนกรอกรหัสตอนสมัคร)",
      "เพื่อนสมัคร → LINE แจ้งสมาชิกใหม่พร้อมชื่อผู้แนะนำ",
      "เพื่อนฝากเงินจริงและได้รับอนุมัติ → เกิดค่าคอม \"รออนุมัติ\" แจ้งที่กระดิ่งและ LINE",
      "แอดมินกดอนุมัติ → เงินเข้าบัญชีเทรดจริงบัญชีแรกของผู้แนะนำ หรือกดปฏิเสธ",
    ],
    notes: [
      "ลิงก์จำรหัสไว้ 30 วัน ถ้าเพื่อนกรอกรหัสเองตอนสมัคร จะใช้รหัสที่กรอก",
      "ยอดฝากในบัญชีเดโมไม่นับ / ผู้แนะนำต้องมีบัญชีจริงก่อนถึงจะจ่ายได้",
    ],
  },
  {
    id: "copy",
    icon: TrendingUp,
    title: "Copy Trading",
    href: "/admin/copy-trading",
    intro: "ลูกค้าสมัครเป็น Master ให้คนอื่นคัดลอกได้ ออเดอร์ของ Master ถูกคัดลอกไปยังผู้ติดตามอัตโนมัติ",
    steps: [
      "ลูกค้าสมัครเป็น Master → แอดมินอนุมัติ / ระงับ และตั้งส่วนแบ่งกำไร (0–50%)",
      "ผู้ติดตามเลือกขนาดออเดอร์ (ตามสัดส่วนเงิน, Lot คงที่ หรือคูณ) และตั้งขาดทุนสูงสุดได้",
      "ส่วนแบ่งกำไรเก็บเฉพาะกำไรที่ทำนิวไฮใหม่ (High-water mark) ไม่เก็บซ้ำ",
    ],
    notes: ["ระบบตัดส่วนแบ่งกำไรอัตโนมัติทุก 7 วัน ปุ่ม \"ตัดค่าส่วนแบ่งตอนนี้\" ใช้ตัดรอบทันที"],
  },
  {
    id: "risk",
    icon: ShieldAlert,
    title: "ระบบความเสี่ยงอัตโนมัติ",
    intro: "เซิร์ฟเวอร์เฝ้าทุกออเดอร์ตลอดเวลา แอดมินไม่ต้องทำอะไร",
    steps: [
      "ราคาแตะ SL / TP → ปิดออเดอร์ให้อัตโนมัติ",
      "Margin Level ต่ำกว่า 50% → Stop Out ปิดออเดอร์ที่ขาดทุนมากที่สุดก่อน",
      "ยอดติดลบหลังปิดออเดอร์ → ปรับยอดกลับเป็น 0 (ลูกค้าไม่ติดหนี้)",
    ],
  },
  {
    id: "notify",
    icon: Bell,
    title: "การแจ้งเตือน",
    href: "/admin/settings/line",
    intro: "งานที่รอแอดมินจะเด้งที่กระดิ่งมุมขวาบน (มือถือ: แถบเมนูด้านล่าง) และส่งเข้า LINE ได้",
    steps: [
      "กระดิ่ง: สมาชิกใหม่, ฝาก, ถอน, คำขอเปิดบัญชี, ค่าแนะนำ พร้อมตัวเลขงานค้าง กดแล้วไปหน้าที่ต้องจัดการ",
      "LINE: ใส่ Channel Access Token และกลุ่ม/ผู้รับ ที่หน้า \"แจ้งเตือน LINE\" แล้วเลือกได้ว่าเรื่องไหนจะส่ง",
    ],
  },
  {
    id: "settings",
    icon: Building2,
    title: "ตั้งค่าอื่นๆ",
    intro: "เมนูที่ตั้งครั้งเดียวแล้วไม่ค่อยต้องแก้",
    steps: [
      "ตั้งค่าธนาคารรับฝาก: เลขบัญชี, รูป QR PromptPay, เรต USD/THB (ตามตลาด + ส่วนต่าง หรือกำหนดเอง)",
      "ทีมผู้ดูแลระบบ: เพิ่มแอดมินและตั้งรหัส PIN 6 หลัก",
      "สมาชิกทั้งหมด: ดูยอดเทรด/เทิร์นโบนัสของลูกค้า และระงับบัญชีลูกค้า",
      "เอกสารกฎหมาย: แก้ Privacy / Terms / AML ที่แสดงบนเว็บ",
    ],
  },
  {
    id: "support",
    icon: Headphones,
    title: "ซัพพอร์ตลูกค้า",
    href: "/admin/support",
    intro: "ตอบตั๋วคำร้อง จัดการคำถามพบบ่อย (FAQ) และดูตารางนัดหมายปรึกษาที่ลูกค้าจองไว้",
  },
];

const DAILY = [
  { text: "เช็กกระดิ่ง: มีตัวเลขงานค้างไหม", href: undefined },
  { text: "ฝากรอตรวจ → ดูสลิปแล้วอนุมัติ / ปฏิเสธ", href: "/admin/transactions" },
  { text: "ถอนรอโอน → โอนเงินแล้วกด \"สำเร็จ\"", href: "/admin/transactions" },
  { text: "คำขอเปิดบัญชี → ตรวจเอกสาร KYC", href: "/admin/account-requests" },
  { text: "ค่าแนะนำรออนุมัติ → อนุมัติจ่าย", href: "/admin/referrals" },
];

export default function AdminGuidePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766]">
          <BookOpen className="w-3.5 h-3.5" />
          <span>คู่มือแอดมิน (Admin Guide)</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-2">ระบบหลังบ้านทำงานอย่างไร</h1>
        <p className="text-xs text-slate-500 mt-1">อธิบายแต่ละเมนูว่าลูกค้าทำอะไร ระบบทำอะไรให้อัตโนมัติ และแอดมินต้องกดอะไรบ้าง</p>
        <nav className="mt-4 flex flex-wrap gap-1.5">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:border-[#c6a87c] hover:text-[#b89766]">
              {s.title}
            </a>
          ))}
        </nav>
      </div>

      <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5">
        <h2 className="text-sm font-black text-amber-800">งานประจำวันของแอดมิน</h2>
        <ol className="mt-3 space-y-1.5">
          {DAILY.map((d, i) => (
            <li key={d.text} className="flex items-start gap-2 text-xs text-slate-700">
              <span className="w-5 h-5 shrink-0 rounded-full bg-white border border-amber-200 text-amber-700 font-black text-[10px] flex items-center justify-center">{i + 1}</span>
              {d.href ? <Link href={d.href} className="hover:text-[#b89766] hover:underline pt-0.5">{d.text}</Link> : <span className="pt-0.5">{d.text}</span>}
            </li>
          ))}
        </ol>
      </div>

      {SECTIONS.map(({ id, icon: Icon, title, href, intro, steps, notes }) => (
        <section key={id} id={id} className="scroll-mt-6 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-[#fdfbf7] border border-[#e8d5b7] text-[#b89766] flex items-center justify-center"><Icon className="w-4 h-4" /></span>
              <div className="min-w-0">
                <h2 className="text-base font-black text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{intro}</p>
              </div>
            </div>
            {href && (
              <Link href={href} className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#b89766] hover:underline">
                ไปที่หน้านี้ <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {steps && (
            <ol className="mt-4 space-y-2 sm:pl-12">
              {steps.map((step, i) => (
                <li key={step} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          )}

          {notes && (
            <ul className="mt-3 space-y-1 sm:pl-12">
              {notes.map((note) => (
                <li key={note} className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">💡 {note}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <MessageCircle className="w-3.5 h-3.5" /> ถ้าระบบทำงานไม่ตรงกับคู่มือนี้ แจ้งทีมพัฒนาได้เลย
      </p>
    </div>
  );
}
