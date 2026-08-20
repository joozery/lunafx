"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Download, 
  Monitor, 
  Smartphone, 
  Globe, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Laptop, 
  Apple, 
  ChevronRight,
  RefreshCw,
  QrCode
} from "lucide-react";

interface PlatformsClientProps {
  lang: string;
}

export function PlatformsClient({ lang }: PlatformsClientProps) {
  const isth = lang === "th";
  const [activeTab, setActiveTab] = useState<"all" | "desktop" | "mobile" | "web">("all");

  // Simulated WebTrader quick quote
  const [bid, setBid] = useState(2746.50);
  const [ask, setAsk] = useState(2746.70);

  const handleSimulateQuote = () => {
    const delta = (Math.random() - 0.49) * 0.8;
    const newBid = parseFloat((bid + delta).toFixed(2));
    const newAsk = parseFloat((newBid + 0.20).toFixed(2));
    setBid(newBid);
    setAsk(newAsk);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* 1. HERO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#c6a87c]/20 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {isth ? "ดาวน์โหลดแพลตฟอร์มการเทรด" : "Trading Platforms"}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {isth
                ? "สัมผัสประสบการณ์การเทรดกับ MetaTrader 5, MetaTrader 4 และ Luna WebTrader ที่เสถียรที่สุด ความเร็วระดับมิลลิวินาที รองรับทุกอุปกรณ์ทั้ง Windows, Mac, iOS และ Android"
                : "Experience trading with MetaTrader 5, MetaTrader 4, and Luna WebTrader. Sub-millisecond execution across Windows, Mac, iOS, and Android."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Server Latency: &lt; 1ms
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c6a87c]" />
                128-bit SSL Encryption
              </span>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold self-start lg:self-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "all"
                  ? "bg-[#c6a87c] text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {isth ? "ทั้งหมด" : "All"}
            </button>
            <button
              onClick={() => setActiveTab("desktop")}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "desktop"
                  ? "bg-[#c6a87c] text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Desktop
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "mobile"
                  ? "bg-[#c6a87c] text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Mobile
            </button>
            <button
              onClick={() => setActiveTab("web")}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === "web"
                  ? "bg-[#c6a87c] text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              WebTrader
            </button>
          </div>
        </div>
      </div>

      {/* 2. FEATURED FLAGSHIP PLATFORMS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PLATFORM 1: METATRADER 5 (MT5) */}
        {(activeTab === "all" || activeTab === "desktop" || activeTab === "mobile") && (
          <div className="bg-white border-2 border-[#c6a87c] rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            {/* Recommended Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-[#c6a87c] to-[#997a49] text-white font-extrabold text-[10px] uppercase px-3 py-1 rounded-full shadow-xs tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-200" />
              <span>{isth ? "แนะนำสูงสุด" : "RECOMMENDED"}</span>
            </div>

            <div className="space-y-4">
              {/* Platform Logo Badge */}
              <div className="flex items-center gap-3">
                <Image
                  src="/MetaTrader_5.png"
                  alt="MetaTrader 5"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain rounded-2xl shadow-sm group-hover:scale-105 transition-transform"
                />
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">MetaTrader 5</h3>
                  <p className="text-xs text-slate-500">{isth ? "แพลตฟอร์มการเทรดรุ่นใหม่ล่าสุด" : "Next-Generation Multi-Asset Platform"}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {isth
                  ? "รองรับการเทรดหุ้น Forex คริปโต ทองคำ พร้อมเครื่องมือวิเคราะห์ทางเทคนิค 80+ ชนิด และปฏิทินเศรษฐกิจในตัว"
                  : "Trade Forex, Gold, Commodities & Crypto with 80+ technical indicators and integrated economic calendar."}
              </p>

              {/* Feature Specs */}
              <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>21 Timeframes & 6 Pending Order types</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Depth of Market (DOM) & Level 2 Quotes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated Trading with MQL5 Expert Advisors</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sub-millisecond order execution</span>
                </li>
              </ul>
            </div>

            {/* Downloads List */}
            <div className="space-y-2.5 pt-5 mt-4 border-t border-slate-100">
              <a
                href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/mt5setup.exe"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Monitor className="w-4 h-4 text-[#c6a87c]" />
                <span>{isth ? "ดาวน์โหลด MT5 สำหรับ Windows" : "Download MT5 for Windows"}</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/MetaTrader5.dmg"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Apple className="w-3.5 h-3.5 text-slate-700" />
                  <span>macOS</span>
                </a>

                <a
                  href="https://download.mql5.com/cdn/mobile/mt5/android"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>iOS / Android</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM 2: METATRADER 4 (MT4) */}
        {(activeTab === "all" || activeTab === "desktop" || activeTab === "mobile") && (
          <div className="bg-white border border-slate-200/90 hover:border-[#c6a87c]/60 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-4">
              {/* Platform Logo Badge */}
              <div className="flex items-center gap-3">
                <Image
                  src="/MetaTrader_4.png"
                  alt="MetaTrader 4"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain rounded-2xl shadow-sm group-hover:scale-105 transition-transform"
                />
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">MetaTrader 4</h3>
                  <p className="text-xs text-slate-500">{isth ? "แพลตฟอร์มมาตรฐานระดับสากล" : "World Standard Forex Platform"}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {isth
                  ? "แพลตฟอร์มยอดนิยมระดับโลก เหมาะสำหรับการเทรด Forex และทองคำ การใช้งานง่าย ปลอดภัย และเสถียรสูงสุด"
                  : "The most famous Forex platform. Simple, reliable, and equipped with powerful charting capabilities."}
              </p>

              {/* Feature Specs */}
              <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>9 Timeframes & 30 Built-in Technical Indicators</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated Trading with MQL4 Expert Advisors</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>128-bit SSL Data Security Encryption</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom Indicator & Script Library</span>
                </li>
              </ul>
            </div>

            {/* Downloads List */}
            <div className="space-y-2.5 pt-5 mt-4 border-t border-slate-100">
              <a
                href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt4/mt4setup.exe"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Monitor className="w-4 h-4 text-[#c6a87c]" />
                <span>{isth ? "ดาวน์โหลด MT4 สำหรับ Windows" : "Download MT4 for Windows"}</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt4/MetaTrader4.dmg"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Apple className="w-3.5 h-3.5 text-slate-700" />
                  <span>macOS</span>
                </a>

                <a
                  href="https://download.mql5.com/cdn/mobile/mt4/android"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>iOS / Android</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM 3: LUNA WEBTRADER */}
        {(activeTab === "all" || activeTab === "web") && (
          <div className="bg-gradient-to-br from-[#fffdfa] via-white to-[#fdf8f0] border border-[#c6a87c]/60 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden group">
            <div className="space-y-4">
              {/* Platform Logo Badge */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c6a87c] to-[#997a49] text-white flex items-center justify-center font-mono font-black text-2xl shadow-md group-hover:scale-105 transition-transform">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Luna WebTrader</h3>
                  <p className="text-xs text-slate-500">{isth ? "เข้าเทรดผ่านเว็บได้ทันที" : "Instant Browser-Based Trading"}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {isth
                  ? "เทรดตรงผ่านเบราว์เซอร์ได้ทันทีโดยไม่ต้องดาวน์โหลดโปรแกรม ปลอดภัยด้วยการเชื่อมต่อ SSL ตรงกับเซิร์ฟเวอร์ Lunaforex"
                  : "Trade directly in Chrome, Safari, or Edge without any software installation. Fast & secure."}
              </p>

              {/* Feature Specs */}
              <ul className="text-xs space-y-2 text-slate-700 font-medium pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero Installation Needed</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>One-Click Trading & Chart Trading</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-time quotes & Interactive Charts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Synchronized across all devices</span>
                </li>
              </ul>
            </div>

            {/* Launch Action */}
            <div className="space-y-2.5 pt-5 mt-4 border-t border-slate-100">
              <Link
                href={`/${lang}/dashboard`}
                className="w-full bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-[#c6a87c]/25 border border-[#f0d8b3]/30"
              >
                <Globe className="w-4 h-4 text-white" />
                <span>{isth ? "เปิดใช้งาน Luna WebTrader ทันที" : "Launch Luna WebTrader"}</span>
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* 3. INTERACTIVE WEBTRADER LIVE SIMULATOR / DEMO CARD */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-[#fdfbf7] border border-[#f0d8b3]/50 rounded-2xl p-6 text-slate-800 shadow-xl shadow-[#c6a87c]/5 space-y-5 relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#f0d8b3]/30 relative z-10">
          <div className="flex flex-col">
            <h3 className="font-extrabold text-lg text-slate-900">
              {isth ? "ทดลองใช้ระบบ WebTrader (Live Price Simulator)" : "WebTrader Interactive Terminal"}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {isth ? "ส่งคำสั่งซื้อขายทดสอบผ่านระบบเว็บด้วยราคา Real-Time" : "Test instant order execution directly in browser"}
            </p>
          </div>

          <button
            onClick={handleSimulateQuote}
            className="bg-white hover:bg-slate-50 border border-[#e6cda3] text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center font-mono"
          >
            {isth ? "อัปเดตราคา" : "Tick Quote"}
          </button>
        </div>

        {/* Live Terminal Ticket Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          {/* Symbol Info */}
          <div className="bg-white border border-[#f0d8b3]/60 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-black text-xl text-slate-900 font-mono tracking-tight">XAU/USD</span>
                <span className="text-[10px] font-bold text-[#b89766] bg-[#fdfbf7] px-2.5 py-1 rounded-md border border-[#e6cda3]/50 uppercase tracking-wider">GOLD</span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-mono font-medium">Spot Gold / US Dollar</p>
            </div>
            <div className="pt-4 mt-2 border-t border-[#f0d8b3]/30 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 font-medium">Spread:</span>
              <span className="text-[#b89766] font-extrabold">0.20 Pips</span>
            </div>
          </div>

          {/* Sell Button */}
          <button
            onClick={handleSimulateQuote}
            className="bg-white hover:bg-rose-50/50 border border-rose-200 hover:border-rose-300 rounded-xl p-5 text-left transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="flex justify-between items-center text-rose-600 text-xs font-black uppercase tracking-wider mb-2">
              <span>SELL (SHORT)</span>
            </div>
            <p className="text-3xl font-black font-mono text-slate-900 tracking-tighter">${bid.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500 mt-2 font-mono font-medium">{isth ? "คลิกเพื่อส่งคำสั่ง Sell ด่วน" : "Click for instant Sell order"}</p>
          </button>

          {/* Buy Button */}
          <button
            onClick={handleSimulateQuote}
            className="bg-white hover:bg-emerald-50/50 border border-emerald-200 hover:border-emerald-300 rounded-xl p-5 text-left transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex flex-col justify-between"
          >
            <div className="flex justify-between items-center text-emerald-600 text-xs font-black uppercase tracking-wider mb-2">
              <span>BUY (LONG)</span>
            </div>
            <p className="text-3xl font-black font-mono text-slate-900 tracking-tighter">${ask.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500 mt-2 font-mono font-medium">{isth ? "คลิกเพื่อส่งคำสั่ง Buy ด่วน" : "Click for instant Buy order"}</p>
          </button>
        </div>
      </div>

      {/* 4. OS & DEVICE COMPATIBILITY BAR - OFFICIAL BRAND SVG LOGOS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">
          {isth ? "ระบบปฏิบัติการและอุปกรณ์ที่รองรับ" : "Supported Operating Systems"}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              name: "Windows",
              desc: "10 & 11 (64-bit)",
              svg: (
                <svg className="w-7 h-7 mb-2 text-[#0078D4] group-hover:scale-110 transition-transform" viewBox="0 0 88 88" fill="currentColor">
                  <path d="M0 0h41.6v41.6H0zM46.4 0H88v41.6H46.4zM0 46.4h41.6V88H0zM46.4 46.4H88V88H46.4z"/>
                </svg>
              ),
            },
            {
              name: "macOS",
              desc: "Sonoma & Ventura",
              svg: (
                <svg className="w-7 h-7 mb-2 text-slate-900 group-hover:scale-110 transition-transform" viewBox="0 0 170 170" fill="currentColor">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-5.01.12-9.94-1.93-14.8-6.14-3.34-2.88-7.2-7.59-11.59-14.14-6.43-9.54-11.53-20.15-15.3-31.84-3.77-11.69-5.65-22.95-5.65-33.78 0-14.42 3.63-26.4 10.89-35.94 7.26-9.54 16.4-14.4 27.42-14.58 4.65 0 9.87 1.25 15.66 3.75 5.79 2.5 9.77 3.75 11.94 3.75 1.8 0 5.86-1.32 12.18-3.96 6.32-2.64 11.75-3.84 16.29-3.6 12.06.96 21.6 5.58 28.62 13.86-10.74 6.48-15.99 15.54-15.75 27.18.24 9.12 3.75 16.8 10.53 23.04 6.78 6.24 14.82 9.72 24.12 10.44-2.4 7.08-5.64 14.1-9.72 21.06zM119.22 31.55c0-7.08 2.55-13.86 7.65-20.34 5.1-6.48 11.49-10.44 19.17-11.88.24 1.08.36 2.04.36 2.88 0 7.08-2.61 13.92-7.83 20.52-5.22 6.6-11.67 10.5-19.35 11.7-0.12-0.84-0.12-1.74-0.12-2.88z"/>
                </svg>
              ),
            },
            {
              name: "iOS (iPhone)",
              desc: "iOS 15.0+",
              svg: (
                <svg className="w-7 h-7 mb-2 text-[#000000] group-hover:scale-110 transition-transform" viewBox="0 0 170 170" fill="currentColor">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-5.01.12-9.94-1.93-14.8-6.14-3.34-2.88-7.2-7.59-11.59-14.14-6.43-9.54-11.53-20.15-15.3-31.84-3.77-11.69-5.65-22.95-5.65-33.78 0-14.42 3.63-26.4 10.89-35.94 7.26-9.54 16.4-14.4 27.42-14.58 4.65 0 9.87 1.25 15.66 3.75 5.79 2.5 9.77 3.75 11.94 3.75 1.8 0 5.86-1.32 12.18-3.96 6.32-2.64 11.75-3.84 16.29-3.6 12.06.96 21.6 5.58 28.62 13.86-10.74 6.48-15.99 15.54-15.75 27.18.24 9.12 3.75 16.8 10.53 23.04 6.78 6.24 14.82 9.72 24.12 10.44-2.4 7.08-5.64 14.1-9.72 21.06zM119.22 31.55c0-7.08 2.55-13.86 7.65-20.34 5.1-6.48 11.49-10.44 19.17-11.88.24 1.08.36 2.04.36 2.88 0 7.08-2.61 13.92-7.83 20.52-5.22 6.6-11.67 10.5-19.35 11.7-0.12-0.84-0.12-1.74-0.12-2.88z"/>
                </svg>
              ),
            },
            {
              name: "Android",
              desc: "Android 8.0+",
              svg: (
                <svg className="w-7 h-7 mb-2 text-[#3DDC84] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9997.4482.9997.9993s-.4486.9997-.9997.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9997.4482.9997.9993s-.4486.9997-.9997.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1522-.5676.416.416 0 00-.5676.1522l-2.0223 3.503C15.5902 8.358 13.8533 8 12 8s-3.5902.358-5.1367.9498L4.841 5.4466a.416.416 0 00-.5676-.1522.416.416 0 00-.1522.5676l1.9973 3.4592C2.6886 11.1843.3448 14.379.0343 18h23.9314c-.3105-3.621-2.6543-6.8157-6.0842-8.6786"/>
                </svg>
              ),
            },
            {
              name: "Web Browser",
              desc: "Chrome / Safari",
              svg: (
                <svg className="w-7 h-7 mb-2 text-[#4285F4] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="21.17" y1="8" x2="12" y2="8" />
                  <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                  <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                </svg>
              ),
            },
            {
              name: "Linux",
              desc: "Ubuntu / Debian",
              svg: (
                <svg className="w-7 h-7 mb-2 text-[#E95420] group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.273c.725 0 1.424.088 2.093.253a6.83 6.83 0 00-.776 2.379 8.683 8.683 0 00-1.317-.105c-4.78 0-8.655 3.875-8.655 8.655 0 .452.036.895.105 1.325a6.837 6.837 0 00-2.378.775A8.72 8.72 0 013.273 12c0-4.82 3.907-8.727 8.727-8.727zm8.474 6.634a6.837 6.837 0 00-2.379-.776c.069.43.105.873.105 1.325 0 2.222-.838 4.25-2.223 5.792a6.818 6.818 0 002.04 1.442A8.675 8.675 0 0020.727 12a8.65 8.65 0 00-.253-2.093zM12 16.909a4.909 4.909 0 110-9.818 4.909 4.909 0 010 9.818z"/>
                </svg>
              ),
            },
          ].map((os, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 hover:bg-[#fef9f2] border border-slate-200/80 hover:border-[#c6a87c] rounded-xl transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              {os.svg}
              <p className="font-bold text-xs text-slate-900">{os.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{os.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
