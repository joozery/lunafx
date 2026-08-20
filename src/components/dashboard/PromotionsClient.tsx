"use client";

import { useState, useEffect } from "react";
import { type Locale } from "@/dictionaries";

interface Promotion {
  id: string;
  badge: string;
  badgeType: "hot" | "free" | "vip" | "cashback" | "referral";
  title: string;
  subtitle: string;
  description: string;
  descriptionTh: string;
  valueDisplay: string;
  valueLabel: string;
  valueLabelTh: string;
  bgImage: string;
  endsIn?: string;
  conditions: string[];
  conditionsTh: string[];
  progressPercent?: number;
  progressText?: string;
  progressTextTh?: string;
}

export function PromotionsClient({ lang }: { lang: string }) {
  const isth = (lang as Locale) === "th";

  const [activeTab, setActiveTab] = useState<"all" | "deposit" | "no-deposit" | "vip">("all");
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [agreedTerms, setAgreedTerms] = useState<boolean>(false);
  const [claimedPromos, setClaimedPromos] = useState<string[]>([]);
  const [rebateLots, setRebateLots] = useState<number>(15);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [apiPromotions, setApiPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    fetch("/api/promotions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.promotions && data.promotions.length > 0) {
          const activePromos = data.promotions.filter((p: any) => p.active !== false);
          setApiPromotions(activePromos);
        }
      })
      .catch((err) => console.error("Failed to load promotions", err));
  }, []);

  const promotions: Promotion[] = [
    {
      id: "promo-100",
      badge: isth ? "ยอดนิยมสูงสุด" : "Most Popular",
      badgeType: "hot",
      title: "100% Instant Deposit Bonus",
      subtitle: isth ? "เพิ่มมาร์จิ้นเป็น 2 เท่าทันทีที่ฝากเงิน" : "Double your trading margin instantly",
      description: "Deposit any amount up to $500 and get a 100% matched margin bonus instantly credited to your trading account.",
      descriptionTh: "ฝากเงินครั้งแรกวันนี้ รับโบนัสสมทบ 100% ทันทีสูงสุด $500 เพิ่มความยืดหยุ่นในการถือออเดอร์และทน Drawdown ได้มากขึ้น",
      valueDisplay: "100%",
      valueLabel: "Match Bonus",
      valueLabelTh: "โบนัสสมทบ",
      bgImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
      endsIn: "08d 14h 30m",
      conditions: [
        "เงินฝากขั้นต่ำ $100 ต่อรายการฝาก",
        "โบนัสสูงสุดไม่เกิน $500 ต่อบัญชีผู้ใช้",
        "เครดิตโบนัสช่วยรองรับ Margin และ Drawdown ในการเทรดได้จริง",
        "กำไรที่เกิดจากการเทรดสามารถถอนได้เมื่อสะสม Volume ครบ 10 lots",
        "โบนัสมีอายุการใช้งาน 60 วันนับจากวันที่ได้รับ",
      ],
      conditionsTh: [
        "เงินฝากขั้นต่ำ $100 ต่อรายการฝาก",
        "โบนัสสูงสุดไม่เกิน $500 ต่อบัญชีผู้ใช้",
        "เครดิตโบนัสช่วยรองรับ Margin และ Drawdown ในการเทรดได้จริง",
        "กำไรที่เกิดจากการเทรดสามารถถอนได้เมื่อสะสม Volume ครบ 10 lots",
        "โบนัสมีอายุการใช้งาน 60 วันนับจากวันที่ได้รับ",
      ],
    },
    {
      id: "promo-30",
      badge: isth ? "ทุนฟรี ไม่ต้องฝาก" : "No Deposit Bonus",
      badgeType: "free",
      title: "$30 Welcome Credit",
      subtitle: isth ? "สำหรับสมาชิกใหม่ที่ยืนยันตัวตนสำเร็จ" : "Exclusive for newly verified accounts",
      description: "Complete your KYC profile verification and receive $30 real trading credit. No deposit required. Profits are fully withdrawable.",
      descriptionTh: "เปิดบัญชีและยืนยันตัวตน (KYC) วันนี้ รับโบนัสต้อนรับ $30 เข้าพอร์ตฟรีทันที ไม่ต้องฝากเงินก่อน กำไรถอนได้จริง",
      valueDisplay: "$30",
      valueLabel: "Free Credit",
      valueLabelTh: "เครดิตฟรี",
      bgImage: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80",
      endsIn: isth ? "สิทธิ์จำนวนจำกัด" : "Limited Claims",
      conditions: [
        "เฉพาะบัญชีผู้ใช้ใหม่ที่ผ่านการตรวจสอบเอกสาร KYC เรียบร้อยแล้ว",
        "โบนัสต้อนรับ $30 จะโอนเข้าบัญชีเทรดโดยอัตโนมัติภายใน 24 ชั่วโมง",
        "สามารถถอนกำไรสุทธิได้สูงสุด $100 เมื่อเทรดสะสมครบ 5 lots",
        "สิทธิ์จำกัด 1 บัญชีต่อ 1 บุคคล/IP Address เท่านั้น",
      ],
      conditionsTh: [
        "เฉพาะบัญชีผู้ใช้ใหม่ที่ผ่านการตรวจสอบเอกสาร KYC เรียบร้อยแล้ว",
        "โบนัสต้อนรับ $30 จะโอนเข้าบัญชีเทรดโดยอัตโนมัติภายใน 24 ชั่วโมง",
        "สามารถถอนกำไรสุทธิได้สูงสุด $100 เมื่อเทรดสะสมครบ 5 lots",
        "สิทธิ์จำกัด 1 บัญชีต่อ 1 บุคคล/IP Address เท่านั้น",
      ],
    },
    {
      id: "promo-cashback",
      badge: isth ? "เงินคืนทุกสัปดาห์" : "Weekly Rebate",
      badgeType: "cashback",
      title: "$8/Lot Cash Rebate",
      subtitle: isth ? "รับเงินคืนเข้ากระเป๋าอัตโนมัติทุกวันจันทร์" : "Automated weekly cashback into wallet",
      description: "Earn up to $8 cashback for every lot traded across Forex and Gold pairs. Paid automatically every Monday with zero volume cap.",
      descriptionTh: "รับเงินคืนสูงสุด $8 ต่อ 1 lot ทุกการเทรดคู่เงินและทองคำ ระบบโอนเงินสดเข้า Wallet อัตโนมัติทุกวันจันทร์ ถอนได้ทันทีไม่ติดเงื่อนไข",
      valueDisplay: "$8.00",
      valueLabel: "Per Traded Lot",
      valueLabelTh: "ต่อ 1 Lot ที่เทรด",
      bgImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
      progressPercent: 68,
      progressText: "Current Week: 15.0 / 22.0 Lots ($120.00 Cashback)",
      progressTextTh: "สัปดาห์นี้เทรดไปแล้ว: 15.0 / 22.0 Lots (รับคืนแล้ว $120.00)",
      conditions: [
        "ครอบคลุมการเทรดในบัญชี Standard และ ECN ทุกประเภท",
        "คำนวณเงินคืนจาก Volume การออเดอร์ปิดที่ถือครองเกิน 2 นาทีขึ้นไป",
        "เงินสดจะโอนเข้าบัญชี Wallet ทุกวันจันทร์ เวลา 07:00 น. (GMT+7)",
        "ไม่มีเพดานจำกัดยอดเงินคืนสูงสุด และสามารถถอนเงินสดได้ทันที",
      ],
      conditionsTh: [
        "ครอบคลุมการเทรดในบัญชี Standard และ ECN ทุกประเภท",
        "คำนวณเงินคืนจาก Volume การออเดอร์ปิดที่ถือครองเกิน 2 นาทีขึ้นไป",
        "เงินสดจะโอนเข้าบัญชี Wallet ทุกวันจันทร์ เวลา 07:00 น. (GMT+7)",
        "ไม่มีเพดานจำกัดยอดเงินคืนสูงสุด และสามารถถอนเงินสดได้ทันที",
      ],
    },
    {
      id: "promo-vip",
      badge: isth ? "คลับเอกสิทธิ์ VIP" : "VIP Privileges",
      badgeType: "vip",
      title: "Luna VIP Loyalty Club",
      subtitle: "Tiered rewards & 3X points multiplier",
      description: "Unlock VIP status to get personalized account manager, zero withdrawal fees, 3X Luna Points, and luxury gadget rewards.",
      descriptionTh: "ยกระดับสู่สมาชิกระดับ VIP รับผู้ดูแลบัญชีส่วนตัว 24/7, ฟรีค่าธรรมเนียมถอนเงินทุกช่องทาง, คะแนนคูณ 3 และสิทธิ์แลกรับไอโฟน/ทองคำแท่ง",
      valueDisplay: "3X",
      valueLabel: "Points Multiplier",
      valueLabelTh: "ตัวคูณแต้มสะสม",
      bgImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80",
      progressPercent: 45,
      progressText: "4,500 / 10,000 Volume Points (Gold Tier)",
      progressTextTh: "สะสม 4,500 / 10,000 Points เพื่อขึ้น Gold VIP",
      conditions: [
        "ระดับ Gold VIP: ยอดฝากสะสมขั้นต่ำ $5,000 หรือ Volume เทรดสะสม 100 lots",
        "ระดับ Platinum VIP: ยอดฝากสะสมขั้นต่ำ $25,000 หรือ Volume เทรดสะสม 500 lots",
        "สิทธิพิเศษผู้ดูแลส่วนตัวและฟรีค่าธรรมเนียมถอนเปิดใช้งานทันทีที่ปรับระดับ",
        "แต้มสะสม Luna Points มีอายุ 12 เดือนนับจากวันที่ได้รับ",
      ],
      conditionsTh: [
        "ระดับ Gold VIP: ยอดฝากสะสมขั้นต่ำ $5,000 หรือ Volume เทรดสะสม 100 lots",
        "ระดับ Platinum VIP: ยอดฝากสะสมขั้นต่ำ $25,000 หรือ Volume เทรดสะสม 500 lots",
        "สิทธิพิเศษผู้ดูแลส่วนตัวและฟรีค่าธรรมเนียมถอนเปิดใช้งานทันทีที่ปรับระดับ",
        "แต้มสะสม Luna Points มีอายุ 12 เดือนนับจากวันที่ได้รับ",
      ],
    },
    {
      id: "promo-referral",
      badge: isth ? "ชวนเพื่อนรับเงิน" : "Referral Program",
      badgeType: "referral",
      title: "Refer & Earn $50 Cash",
      subtitle: "Unlimited commission per invited friend",
      description: "Invite fellow traders using your unique referral link. Get $50 cash bonus instantly when your friend deposits and trades 2 lots.",
      descriptionTh: "ชวนเพื่อนมาเทรดผ่านลิงก์ของคุณ รับเงินสด $50 เข้ากระเป๋าทันทีเมื่อเพื่อนฝากเงินและเทรดครบ 2 lots ชวนได้ไม่จำกัดจำนวน",
      valueDisplay: "$50",
      valueLabel: "Per Friend",
      valueLabelTh: "ต่อเพื่อน 1 คน",
      bgImage: "https://images.unsplash.com/photo-1521791136364-798a7bc0d262?auto=format&fit=crop&w=600&q=80",
      conditions: [
        "เพื่อนที่ได้รับการแนะนำต้องสมัครผ่านลิงก์ของคุณเท่านั้น",
        "เพื่อนต้องมียอดฝากเงินครั้งแรกขั้นต่ำ $100 และเทรดสะสมอย่างน้อย 2 lots",
        "ค่าตอบแทน $50 จะถูกโอนเข้า Wallet ของคุณโดยอัตโนมัติภายใน 48 ชั่วโมง",
        "สามารถแนะนำเพื่อนได้ไม่จำกัดจำนวนคน ไม่มีเพดานรายได้",
      ],
      conditionsTh: [
        "เพื่อนที่ได้รับการแนะนำต้องสมัครผ่านลิงก์ของคุณเท่านั้น",
        "เพื่อนต้องมียอดฝากเงินครั้งแรกขั้นต่ำ $100 และเทรดสะสมอย่างน้อย 2 lots",
        "ค่าตอบแทน $50 จะถูกโอนเข้า Wallet ของคุณโดยอัตโนมัติภายใน 48 ชั่วโมง",
        "สามารถแนะนำเพื่อนได้ไม่จำกัดจำนวนคน ไม่มีเพดานรายได้",
      ],
    },
  ];

  const displayPromos = apiPromotions.length > 0 ? apiPromotions : promotions;

  const filteredPromos = displayPromos.filter((p) => {
    if (activeTab === "deposit") return p.id === "promo-100";
    if (activeTab === "no-deposit") return p.id === "promo-30" || p.id === "promo-referral";
    if (activeTab === "vip") return p.id === "promo-vip" || p.id === "promo-cashback";
    return true;
  });

  const handleOpenModal = (promo: Promotion) => {
    setSelectedPromo(promo);
    setAgreedTerms(false);
    setShowSuccessMessage(false);
  };

  const handleConfirmClaim = () => {
    if (!selectedPromo || !agreedTerms) return;
    if (!claimedPromos.includes(selectedPromo.id)) {
      setClaimedPromos((prev) => [...prev, selectedPromo.id]);
    }
    setShowSuccessMessage(true);
    setTimeout(() => {
      setSelectedPromo(null);
      setShowSuccessMessage(false);
    }, 1500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://lunaforex.com/ref/user8892");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. HEADER BANNER - INSTITUTIONAL WHITE & CHAMPAGNE GOLD */}
      <div className="bg-gradient-to-r from-white via-[#faf8f5] to-[#f5efe4] border border-[#e8d5b7]/70 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isth ? "โปรโมชั่นและสิทธิพิเศษ" : "Promotions & Rewards"}
              </h1>
              <span className="text-[10px] font-semibold text-[#b89766] bg-[#f7f1e5] border border-[#e6cda3]/60 px-2 py-0.5 rounded uppercase tracking-wide">
                Institutional Privileges
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isth
                ? "คลิกเลือกดูรายละเอียดโปรโมชั่นและยอมรับเงื่อนไขเพื่อเปิดใช้งานสิทธิ์"
                : "Select a promotion to view terms & conditions and activate your benefits"}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-white border border-[#e8d5b7]/50 rounded-xl px-4 py-2 shadow-2xs font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "โบนัสสูงสุด" : "Max Bonus"}</span>
              <span className="font-bold text-slate-900">$1,080+</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "เงินคืนสด" : "Cashback"}</span>
              <span className="font-bold text-emerald-600">$8/Lot</span>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="pt-3 border-t border-[#e8d5b7]/40 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl">
            {[
              { id: "all", label: isth ? "โปรโมชั่นทั้งหมด" : "All Offers" },
              { id: "deposit", label: isth ? "โบนัสฝากเงิน" : "Deposit Bonus" },
              { id: "no-deposit", label: isth ? "ทุนฟรี & ชวนเพื่อน" : "Free Credit & Referral" },
              { id: "vip", label: isth ? "VIP & รีเบตเงินคืน" : "VIP & Cashbacks" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. PROMOTIONS CARDS GRID - 4 CARDS PER ROW (COMPACT SLEEK) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredPromos.map((promo) => {
          const isClaimed = claimedPromos.includes(promo.id);

          return (
            <div
              key={promo.id}
              className="bg-white border border-[#e8d5b7]/80 hover:border-[#c6a87c] rounded-2xl overflow-hidden shadow-2xs hover:shadow-xl hover:shadow-[#c6a87c]/10 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Top Image Banner Header */}
                <div className="h-36 w-full relative overflow-hidden bg-slate-950">
                  <img
                    src={promo.bgImage}
                    alt={promo.title}
                    className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="text-[10px] font-extrabold text-slate-900 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                      {promo.badge}
                    </span>
                    {promo.endsIn && (
                      <span className="text-[10px] font-mono text-amber-300 font-bold bg-slate-950/60 backdrop-blur-xs border border-amber-500/30 px-2 py-0.5 rounded-full">
                        {promo.endsIn}
                      </span>
                    )}
                  </div>

                  {/* Value Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 flex items-baseline justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block">
                        {isth ? promo.valueLabelTh : promo.valueLabel}
                      </span>
                      <span className="text-2xl font-black font-mono bg-gradient-to-r from-[#ffe5ba] via-[#c6a87c] to-[#ffffff] bg-clip-text text-transparent">
                        {promo.valueDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body - CLEAN & COMPACT */}
                <div className="p-4 space-y-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#b89766] transition-colors">
                      {promo.title}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">{promo.subtitle}</p>
                  </div>

                  {/* Short 1-line note */}
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {isth ? promo.descriptionTh : promo.description}
                  </p>
                </div>
              </div>

              {/* Action Button: Opens Details & Terms Modal */}
              <div className="p-4 pt-2">
                <button
                  onClick={() => handleOpenModal(promo)}
                  className={`w-full font-bold py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95 text-center ${
                    isClaimed
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white shadow-[#c6a87c]/20"
                  }`}
                >
                  {isClaimed
                    ? isth
                      ? "✓ รับสิทธิ์แล้ว (ดูเงื่อนไข)"
                      : "✓ Claimed (View Terms)"
                    : isth
                    ? "ดูรายละเอียด & รับสิทธิ์"
                    : "View Details & Claim"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. TERMS & CONDITIONS MODAL POPUP */}
      {selectedPromo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#f0d8b3] rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header Image */}
            <div className="h-36 w-full relative overflow-hidden bg-slate-950 shrink-0">
              <img src={selectedPromo.bgImage} alt={selectedPromo.title} className="w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => setSelectedPromo(null)}
                  className="text-white hover:text-slate-300 font-bold text-sm bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="absolute bottom-3 left-5 right-5 z-10 text-white flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded-full uppercase">
                    {selectedPromo.badge}
                  </span>
                  <h3 className="font-black text-lg text-white mt-1">{selectedPromo.title}</h3>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-300 uppercase block">{isth ? selectedPromo.valueLabelTh : selectedPromo.valueLabel}</span>
                  <span className="text-2xl font-black text-amber-300">{selectedPromo.valueDisplay}</span>
                </div>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 pt-2 space-y-4 overflow-y-auto flex-1">
              {showSuccessMessage ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 font-black text-2xl mx-auto flex items-center justify-center">
                    ✓
                  </div>
                  <h4 className="text-lg font-black text-slate-900">{isth ? "รับสิทธิ์โปรโมชั่นสำเร็จ!" : "Promotion Activated Successfully!"}</h4>
                  <p className="text-xs text-slate-500">
                    {isth ? "ระบบได้เปิดใช้งานโปรโมชั่นนี้ให้พอร์ตของคุณเรียบร้อยแล้ว" : "The promotion is now active for your trading account."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Detailed Description */}
                  <div className="bg-[#fdfbf7] border border-[#f0d8b3]/60 rounded-2xl p-4">
                    <h4 className="font-extrabold text-slate-900 text-xs mb-1">{isth ? "รายละเอียดโปรโมชั่น:" : "Offer Details:"}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {isth ? selectedPromo.descriptionTh : selectedPromo.description}
                    </p>
                  </div>

                  {/* Interactive Rebate Calculator if applicable */}
                  {selectedPromo.badgeType === "cashback" && (
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-500 font-sans font-bold">{isth ? "ประมาณการเงินคืนสะสม:" : "Estimated Weekly Rebate:"}</span>
                        <span className="font-black text-emerald-600 text-base">${(rebateLots * 8).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={rebateLots}
                          onChange={(e) => setRebateLots(Number(e.target.value))}
                          className="w-full accent-[#c6a87c]"
                        />
                        <span className="text-xs font-mono text-slate-700 font-bold whitespace-nowrap">{rebateLots} Lots</span>
                      </div>
                    </div>
                  )}

                  {/* Referral Link Copy Area if applicable */}
                  {selectedPromo.badgeType === "referral" && (
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                      <span className="text-xs font-bold text-slate-700 block">{isth ? "ลิงก์แนะนำของคุณ:" : "Your Referral Link:"}</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value="https://lunaforex.com/ref/user8892"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 flex-1 focus:outline-none"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shrink-0"
                        >
                          {copiedLink ? (isth ? "คัดลอกแล้ว!" : "Copied!") : (isth ? "คัดลอก" : "Copy")}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Full Terms & Conditions List */}
                  <div className="space-y-2 pt-1">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">{isth ? "เงื่อนไขและข้อตกลงในการรับสิทธิ์:" : "Terms & Conditions:"}</h4>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
                      {(isth ? selectedPromo.conditionsTh : selectedPromo.conditions).map((cond, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                          <span className="text-[#b89766] font-bold shrink-0">•</span>
                          <span className="leading-relaxed">{cond}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terms Acceptance Checkbox */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#c6a87c] focus:ring-[#c6a87c] accent-[#c6a87c]"
                      />
                      <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">
                        {isth
                          ? "ฉันได้อ่านและยอมรับเงื่อนไขข้อตกลงการรับสิทธิ์โปรโมชั่นนี้เรียบร้อยแล้ว"
                          : "I have read and agree to the Terms & Conditions of this promotion."}
                      </span>
                    </label>
                  </div>

                  {/* Confirm & Claim Action Button */}
                  <button
                    disabled={!agreedTerms}
                    onClick={handleConfirmClaim}
                    className={`w-full py-3.5 rounded-xl font-black text-xs transition-all shadow-md text-center ${
                      agreedTerms
                        ? "bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white shadow-[#c6a87c]/30 cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isth ? "ยืนยันการรับสิทธิ์โปรโมชั่น" : "Accept Terms & Claim Offer"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
