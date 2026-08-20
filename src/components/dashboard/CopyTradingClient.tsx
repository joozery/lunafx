"use client";

import { useState, useEffect } from "react";
import { type Locale } from "@/dictionaries";

interface MasterTrader {
  id: string;
  name: string;
  accountType: string;
  server: string;
  badge: "Verified" | "Top Master" | "Low Risk" | "High Growth" | string;
  roi30d: number;
  roiTotal: number;
  copiers: number;
  aum: string; // Assets under management
  maxDrawdown: number;
  winRate: number;
  daysActive: number;
  profitShare: number;
  minDeposit: number;
  riskScore: number; // 1-10
  chartPath?: string; // SVG path for smooth line chart
  avatarColor?: string;
  status?: string;
}

export function CopyTradingClient({ lang }: { lang: string }) {
  const isth = (lang as Locale) === "th";

  // Tab & View State
  const [activeTab, setActiveTab] = useState<"explore" | "my-copies" | "become-master">("explore");
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"roi30d" | "roiTotal" | "copiers" | "aum" | "risk">("roi30d");

  const [apiMasters, setApiMasters] = useState<MasterTrader[]>([]);

  useEffect(() => {
    fetch("/api/copy-trading/masters")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.masters && data.masters.length > 0) {
          const activeOnly = data.masters.filter((m: any) => m.status !== "paused");
          setApiMasters(activeOnly);
        }
      })
      .catch((err) => console.error("Failed to load master traders", err));
  }, []);

  // Selected Master for Copy Modal
  const [selectedMaster, setSelectedMaster] = useState<MasterTrader | null>(null);
  const [copyAmount, setCopyAmount] = useState<number>(300);
  const [copyMode, setCopyMode] = useState<"ratio" | "fixed">("ratio");
  const [maxLossPercent, setMaxLossPercent] = useState<number>(15);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Active user copies
  const [activeCopies, setActiveCopies] = useState<
    Array<{ id: string; masterName: string; amount: number; profit: number; roi: number; status: "Active" | "Paused" }>
  >([
    { id: "c1", masterName: "Alex_Gold_Algo", amount: 500, profit: 42.8, roi: 8.56, status: "Active" },
    { id: "c2", masterName: "Sovereign_FX", amount: 1000, profit: 115.2, roi: 11.52, status: "Active" },
  ]);

  const masters: MasterTrader[] = [
    {
      id: "m1",
      name: "Alex_Gold_Algo",
      accountType: "Real MT5",
      server: "LunaForex-Live01",
      badge: "Verified",
      roi30d: 14.8,
      roiTotal: 184.2,
      copiers: 1420,
      aum: "$485,200",
      maxDrawdown: 4.2,
      winRate: 81.5,
      daysActive: 512,
      profitShare: 15,
      minDeposit: 200,
      riskScore: 2,
      avatarColor: "from-[#c6a87c] to-[#997a49]",
      chartPath: "M0,35 Q20,32 40,28 T80,22 T120,18 T160,12 T200,5",
    },
    {
      id: "m2",
      name: "Quantum_Fund_v4",
      accountType: "Real ECN",
      server: "LunaForex-Live02",
      badge: "Top Master",
      roi30d: 22.4,
      roiTotal: 340.5,
      copiers: 2890,
      aum: "$1,240,000",
      maxDrawdown: 7.8,
      winRate: 76.4,
      daysActive: 740,
      profitShare: 20,
      minDeposit: 500,
      riskScore: 4,
      avatarColor: "from-amber-600 to-amber-800",
      chartPath: "M0,38 Q20,35 40,25 T80,30 T120,15 T160,10 T200,2",
    },
    {
      id: "m3",
      name: "Sovereign_FX",
      accountType: "Real MT4",
      server: "LunaForex-Live01",
      badge: "Low Risk",
      roi30d: 8.2,
      roiTotal: 92.4,
      copiers: 3150,
      aum: "$2,100,000",
      maxDrawdown: 2.1,
      winRate: 89.2,
      daysActive: 890,
      profitShare: 10,
      minDeposit: 100,
      riskScore: 1,
      avatarColor: "from-slate-700 to-slate-900",
      chartPath: "M0,38 Q30,36 60,33 T120,26 T160,20 T200,14",
    },
    {
      id: "m4",
      name: "Apex_Macro_Strategy",
      accountType: "Real ECN",
      server: "LunaForex-Live02",
      badge: "High Growth",
      roi30d: 31.5,
      roiTotal: 412.0,
      copiers: 980,
      aum: "$310,000",
      maxDrawdown: 12.4,
      winRate: 68.9,
      daysActive: 310,
      profitShare: 25,
      minDeposit: 500,
      riskScore: 6,
      avatarColor: "from-[#b89766] to-[#7a5e33]",
      chartPath: "M0,39 Q20,30 40,36 T80,20 T120,28 T160,12 T200,3",
    },
    {
      id: "m5",
      name: "Zenith_Trend_Follower",
      accountType: "Real MT5",
      server: "LunaForex-Live01",
      badge: "Verified",
      roi30d: 11.6,
      roiTotal: 126.8,
      copiers: 1120,
      aum: "$680,000",
      maxDrawdown: 5.4,
      winRate: 83.1,
      daysActive: 445,
      profitShare: 15,
      minDeposit: 200,
      riskScore: 3,
      avatarColor: "from-emerald-700 to-emerald-900",
      chartPath: "M0,36 Q25,32 50,28 T100,22 T150,16 T200,8",
    },
    {
      id: "m6",
      name: "Alpha_Scalp_Institutional",
      accountType: "Real Prime",
      server: "LunaForex-Live02",
      badge: "Top Master",
      roi30d: 19.3,
      roiTotal: 215.4,
      copiers: 1840,
      aum: "$920,000",
      maxDrawdown: 6.2,
      winRate: 79.8,
      daysActive: 620,
      profitShare: 20,
      minDeposit: 300,
      riskScore: 3,
      avatarColor: "from-amber-700 to-amber-950",
      chartPath: "M0,37 Q20,30 40,24 T80,26 T120,18 T160,10 T200,4",
    },
  ];

  const displayMasters = apiMasters.length > 0 ? apiMasters : masters;

  // Filter & Sort
  const filteredMasters = displayMasters
    .filter((m) => {
      const matchQuery =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.accountType.toLowerCase().includes(searchQuery.toLowerCase());
      if (riskFilter === "low") return matchQuery && m.riskScore <= 2;
      if (riskFilter === "medium") return matchQuery && m.riskScore >= 3 && m.riskScore <= 4;
      if (riskFilter === "high") return matchQuery && m.riskScore >= 5;
      return matchQuery;
    })
    .sort((a, b) => {
      if (sortBy === "roi30d") return b.roi30d - a.roi30d;
      if (sortBy === "roiTotal") return b.roiTotal - a.roiTotal;
      if (sortBy === "copiers") return b.copiers - a.copiers;
      if (sortBy === "aum") return parseFloat(b.aum.replace(/[^0-9.]/g, "")) - parseFloat(a.aum.replace(/[^0-9.]/g, ""));
      if (sortBy === "risk") return a.riskScore - b.riskScore;
      return 0;
    });

  const handleConfirmCopy = () => {
    if (!selectedMaster) return;
    setActiveCopies((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        masterName: selectedMaster.name,
        amount: copyAmount,
        profit: 0.0,
        roi: 0.0,
        status: "Active",
      },
    ]);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedMaster(null);
      setActiveTab("my-copies");
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      {/* 1. TOP HEADER & SUMMARY METRICS BAR */}
      <div className="bg-gradient-to-r from-white via-[#faf8f5] to-[#f5efe4] border border-[#e8d5b7]/70 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isth ? "ระบบคัดลอกการเทรด (Copy Trading)" : "Copy Trading System"}
              </h1>
              <span className="text-[10px] font-semibold text-[#b89766] bg-[#f7f1e5] border border-[#e6cda3]/60 px-2 py-0.5 rounded uppercase tracking-wide">
                Institutional Grade
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isth
                ? "เชื่อมต่อและคัดลอกคำสั่งซื้อขายอัตโนมัติจาก Master Trader ที่ผ่านการตรวจสอบประวัติ Real Account"
                : "Automatically mirror verified master traders with real-time execution & risk protection"}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-white border border-[#e8d5b7]/50 rounded-xl px-4 py-2.5 shadow-2xs text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "ผู้คัดลอกทั้งหมด" : "Total Copiers"}</span>
              <span className="font-extrabold text-slate-900">11,480</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "AUM รวม" : "Total AUM"}</span>
              <span className="font-extrabold text-[#b89766]">$6.85M</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "กำไรเฉลี่ย 30 วัน" : "Avg 30d ROI"}</span>
              <span className="font-extrabold text-emerald-600">+14.6%</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-[#e8d5b7]/40">
          <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "explore"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isth ? "รายการ Master Trader" : "Master Traders"}
            </button>
            <button
              onClick={() => setActiveTab("my-copies")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "my-copies"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isth ? "รายการที่คัดลอกอยู่" : "My Copied Portfolio"} ({activeCopies.length})
            </button>
            <button
              onClick={() => setActiveTab("become-master")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "become-master"
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isth ? "สมัครเป็น Master Trader" : "Become Master"}
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB: EXPLORE MASTERS */}
      {activeTab === "explore" && (
        <div className="space-y-4">
          {/* Compact Filter Toolbar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder={isth ? "ค้นหาชื่อ หรือ บัญชี..." : "Search trader or account..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c6a87c]"
              />
            </div>

            {/* Risk Filter Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">{isth ? "ระดับความเสี่ยง:" : "Risk:"}</span>
              {[
                { id: "all", label: isth ? "ทั้งหมด" : "All" },
                { id: "low", label: isth ? "ต่ำ (Risk 1-2)" : "Low (1-2)" },
                { id: "medium", label: isth ? "ปานกลาง (3-4)" : "Med (3-4)" },
                { id: "high", label: isth ? "สูง (5+)" : "High (5+)" },
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setRiskFilter(rf.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    riskFilter === rf.id ? "bg-[#f5efe4] text-[#b89766] border border-[#e8d5b7]" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">{isth ? "เรียงตาม:" : "Sort:"}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#c6a87c]"
              >
                <option value="roi30d">{isth ? "กำไร 30 วันสูงสุด" : "30d Return"}</option>
                <option value="roiTotal">{isth ? "กำไรสะสมรวม" : "Total Return"}</option>
                <option value="copiers">{isth ? "ผู้คัดลอกมากที่สุด" : "Copiers"}</option>
                <option value="aum">{isth ? "AUM สูงสุด" : "Highest AUM"}</option>
                <option value="risk">{isth ? "ความเสี่ยงต่ำสุด" : "Lowest Risk"}</option>
              </select>
            </div>
          </div>

          {/* Master Trader Grid (Compact Sleek Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMasters.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-slate-200/90 hover:border-[#d4c0a1] rounded-xl p-4 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3"
              >
                {/* Header Profile */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.avatarColor} text-white font-bold text-xs flex items-center justify-center shadow-2xs`}
                    >
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{m.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Online" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {m.accountType} • {m.server}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#b89766] bg-[#f9f6f0] border border-[#e8d5b7]/60 px-2 py-0.5 rounded">
                    {m.badge}
                  </span>
                </div>

                {/* 30-Day Return & Chart Micro Graphic */}
                <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">{isth ? "กำไร 30 วัน" : "30-Day Return"}</span>
                    <span className="text-lg font-black text-emerald-600 font-mono">+{m.roi30d.toFixed(1)}%</span>
                  </div>
                  {/* Clean SVG Line Chart */}
                  <div className="w-24 h-9">
                    <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                      <path d={m.chartPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                {/* Key Metrics Grid 2x2 */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1 border-y border-slate-100">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans">{isth ? "ผู้คัดลอก" : "Copiers"}</span>
                    <span className="font-bold text-slate-800">{m.copiers.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans">AUM</span>
                    <span className="font-bold text-slate-800">{m.aum}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans">Max DD</span>
                    <span className="font-bold text-slate-700">{m.maxDrawdown}%</span>
                  </div>
                </div>

                {/* Additional Specs */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>
                    {isth ? "อัตราชนะ:" : "Win Rate:"} <strong className="text-slate-800">{m.winRate}%</strong>
                  </span>
                  <span>
                    {isth ? "ขั้นต่ำ:" : "Min:"} <strong className="text-slate-800">${m.minDeposit}</strong>
                  </span>
                </div>

                {/* Copy Action Button */}
                <button
                  onClick={() => setSelectedMaster(m)}
                  className="w-full bg-[#c6a87c] hover:bg-[#b5966a] text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-2xs active:scale-[0.98]"
                >
                  {isth ? "คัดลอก (Copy)" : "Copy Trade"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB: MY ACTIVE COPIES */}
      {activeTab === "my-copies" && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">{isth ? "พอร์ตที่กำลังคัดลอกอยู่" : "Active Copied Subscriptions"}</h3>

          {activeCopies.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">{isth ? "ยังไม่มีรายการคัดลอก" : "No active copies"}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] border-b border-slate-200">
                    <th className="p-3 font-semibold">{isth ? "ชื่อ Master" : "Master Name"}</th>
                    <th className="p-3 font-semibold">{isth ? "เงินทุนที่ลง" : "Allocated Amount"}</th>
                    <th className="p-3 font-semibold">{isth ? "กำไรสุทธิ ($)" : "Net Profit ($)"}</th>
                    <th className="p-3 font-semibold">ROI (%)</th>
                    <th className="p-3 font-semibold">{isth ? "สถานะ" : "Status"}</th>
                    <th className="p-3 font-semibold text-right">{isth ? "จัดการ" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeCopies.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">{c.masterName}</td>
                      <td className="p-3 text-slate-700">${c.amount.toFixed(2)}</td>
                      <td className="p-3 text-emerald-600 font-bold">+${c.profit.toFixed(2)}</td>
                      <td className="p-3 text-emerald-600 font-bold">+{c.roi.toFixed(2)}%</td>
                      <td className="p-3">
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="text-rose-600 hover:text-rose-700 font-bold text-[11px] underline">
                          {isth ? "หยุดคัดลอก" : "Stop Copy"}
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

      {/* 4. TAB: BECOME A MASTER */}
      {activeTab === "become-master" && (
        <div className="bg-white border border-[#e8d5b7]/70 rounded-xl p-6 shadow-2xs space-y-4">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] font-bold text-[#b89766] bg-[#f9f6f0] border border-[#e8d5b7]/60 px-2 py-0.5 rounded uppercase">
              Master Trader Program
            </span>
            <h2 className="text-lg font-bold text-slate-900">{isth ? "เปิดรับสมัคร Master Trader" : "Become a Certified Master Trader"}</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isth
                ? "แชร์สัญญาณการเทรดจากพอร์ตจริงของคุณ พร้อมรับส่วนแบ่งกำไรสูงสุด 20% จากผู้คัดลอกโดยอัตโนมัติ"
                : "Share your trading signals and earn up to 20% profit share paid weekly"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono max-w-lg">
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "ส่วนแบ่งกำไร" : "Profit Share"}</span>
              <span className="font-bold text-slate-900 text-sm">Up to 20%</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "การจ่ายเงิน" : "Payout"}</span>
              <span className="font-bold text-slate-900 text-sm">Weekly</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg">
              <span className="text-[10px] text-slate-400 block font-sans">{isth ? "ประวัติเทรด" : "Track Record"}</span>
              <span className="font-bold text-slate-900 text-sm">30 Days</span>
            </div>
          </div>

          <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors">
            {isth ? "ยื่นสมัครพอร์ต Master" : "Apply Now"}
          </button>
        </div>
      )}

      {/* 5. COPY CONFIRMATION MODAL */}
      {selectedMaster && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-md w-full shadow-lg space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {isth ? "ตั้งค่าการคัดลอก:" : "Copy Trade Setup:"} <span className="text-[#b89766]">{selectedMaster.name}</span>
              </h3>
              <button onClick={() => setSelectedMaster(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {isSuccess ? (
              <div className="py-6 text-center text-emerald-600 font-bold">
                ✓ {isth ? "เริ่มคัดลอกสำเร็จแล้ว!" : "Copy trading activated!"}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 flex justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">{isth ? "กำไร 30 วัน" : "30d Return"}</span>
                    <span className="font-bold text-emerald-600">+{selectedMaster.roi30d}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Max DD</span>
                    <span className="font-bold text-slate-800">{selectedMaster.maxDrawdown}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">{isth ? "ส่วนแบ่งกำไร" : "Profit Share"}</span>
                    <span className="font-bold text-slate-800">{selectedMaster.profitShare}%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">{isth ? "จำนวนเงินลงทุน ($ USD):" : "Investment ($ USD):"}</label>
                  <input
                    type="number"
                    value={copyAmount}
                    onChange={(e) => setCopyAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c6a87c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block">{isth ? "โหมดการสั่งเทรด:" : "Copy Mode:"}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCopyMode("ratio")}
                      className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                        copyMode === "ratio" ? "bg-[#f5efe4] text-[#b89766] border-[#e8d5b7]" : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {isth ? "ตามสัดส่วนเงินทุน" : "Equity Ratio"}
                    </button>
                    <button
                      onClick={() => setCopyMode("fixed")}
                      className={`p-2 rounded-lg border text-center font-semibold transition-all ${
                        copyMode === "fixed" ? "bg-[#f5efe4] text-[#b89766] border-[#e8d5b7]" : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {isth ? "ตาม Lot เท่ากัน" : "Fixed Lot"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleConfirmCopy}
                  className="w-full bg-[#c6a87c] hover:bg-[#b5966a] text-white font-bold py-2.5 rounded-lg transition-colors shadow-2xs"
                >
                  {isth ? "ยืนยันเริ่มคัดลอก" : "Confirm Copy"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
