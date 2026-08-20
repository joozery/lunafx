"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, Plus, RefreshCw, Edit2, Trash2,
  Search, X, CheckCircle2, Star, Users, List, Grid,
  Activity, Award, ShieldCheck
} from "lucide-react";

interface MasterTrader {
  _id: string;
  id: string;
  name: string;
  accountType: string;
  server: string;
  badge: string;
  roi30d: number;
  roiTotal: number;
  copiers: number;
  aum: string;
  maxDrawdown: number;
  winRate: number;
  daysActive: number;
  profitShare: number;
  minDeposit: number;
  riskScore: number;
  status: "active" | "paused";
  featured?: boolean;
}

const BADGE_STYLES: Record<string, string> = {
  "Top Master": "bg-amber-50 text-amber-700 border-amber-200",
  "Verified":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Low Risk":   "bg-blue-50 text-blue-700 border-blue-200",
  "High Growth":"bg-purple-50 text-purple-700 border-purple-200",
};

export function AdminCopyTradingClient() {
  const [masters, setMasters] = useState<MasterTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all");

  const [showModal, setShowModal] = useState(false);
  const [editingMaster, setEditingMaster] = useState<MasterTrader | null>(null);

  const emptyForm = {
    name: "", accountType: "Real MT5", server: "LunaForex-Live01",
    badge: "Verified", roi30d: 15.5, roiTotal: 120.0, copiers: 100,
    aum: "$50,000", maxDrawdown: 5.0, winRate: 80.0, daysActive: 100,
    profitShare: 15, minDeposit: 200, riskScore: 3,
  };
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchMasters(); }, []);

  const fetchMasters = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/copy-trading/masters");
      const data = await res.json();
      if (data.masters) setMasters(data.masters);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingMaster(null); setFormData(emptyForm);
    setError(""); setSuccess(false); setShowModal(true);
  };

  const openEdit = (m: MasterTrader) => {
    setEditingMaster(m);
    setFormData({ name: m.name, accountType: m.accountType, server: m.server, badge: m.badge,
      roi30d: m.roi30d, roiTotal: m.roiTotal, copiers: m.copiers, aum: m.aum,
      maxDrawdown: m.maxDrawdown, winRate: m.winRate, daysActive: m.daysActive,
      profitShare: m.profitShare, minDeposit: m.minDeposit, riskScore: m.riskScore });
    setError(""); setSuccess(false); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(""); setSuccess(false);
    try {
      const method = editingMaster ? "PUT" : "POST";
      const payload = editingMaster ? { id: editingMaster._id, ...formData } : formData;
      const res = await fetch("/api/copy-trading/masters", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => { setShowModal(false); setSuccess(false); fetchMasters(); }, 1000);
      } else { setError(data.error || "เกิดข้อผิดพลาด"); }
    } catch { setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์"); }
    finally { setSubmitting(false); }
  };

  const toggleStatus = async (m: MasterTrader) => {
    await fetch("/api/copy-trading/masters", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m._id, status: m.status === "active" ? "paused" : "active" }),
    });
    fetchMasters();
  };

  const deleteMaster = async (id: string) => {
    if (!confirm("ลบ Master Trader นี้ออกจากระบบ?")) return;
    await fetch(`/api/copy-trading/masters?id=${id}`, { method: "DELETE" });
    fetchMasters();
  };

  const activeCount = masters.filter((m) => m.status === "active").length;
  const totalCopiers = masters.reduce((a, m) => a + (m.copiers || 0), 0);
  const avgRoi = masters.length > 0
    ? (masters.reduce((a, m) => a + (m.roi30d || 0), 0) / masters.length).toFixed(1)
    : "0.0";

  const filtered = masters.filter((m) => {
    const ok = m.name.toLowerCase().includes(search.toLowerCase());
    if (riskFilter === "low") return ok && m.riskScore <= 2;
    if (riskFilter === "medium") return ok && m.riskScore >= 3 && m.riskScore <= 4;
    if (riskFilter === "high") return ok && m.riskScore >= 5;
    return ok;
  });

  const badgeClass = (b: string) =>
    `text-[10px] font-bold px-2 py-px rounded-md border ${BADGE_STYLES[b] ?? "bg-slate-100 text-slate-600 border-slate-200"}`;

  const riskBarColor = (score: number) =>
    score <= 2 ? "bg-emerald-500" : score <= 4 ? "bg-amber-500" : "bg-rose-500";

  // ── Form field helper
  const Field = ({
    label, col = 1, children
  }: { label: string; col?: number; children: React.ReactNode }) => (
    <div className={`space-y-1 ${col === 2 ? "col-span-2" : ""}`}>
      <label className="block text-[11px] font-bold text-slate-600">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#c6a87c]";

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12 font-sans text-slate-800">

      {/* ── COMPACT HEADER ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#fdfbf7] text-[#b89766] border border-[#e8d5b7] uppercase font-mono">
              <TrendingUp className="w-3 h-3" />
              Master Trader Portal
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              จัดการ Copy Trading & Leaderboard
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              เพิ่ม/แก้ไข Master Traders กำหนด Profit Share และ Risk Level
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button onClick={fetchMasters}
              className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl border border-slate-200 transition-all" title="รีเฟรช">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={openCreate}
              className="bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black px-4 py-2 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              เพิ่ม Master Trader
            </button>
          </div>
        </div>

        {/* Summary metrics row */}
        <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
            <Award className="w-4 h-4 text-[#b89766] shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500">Master ทั้งหมด</p>
              <p className="font-black text-slate-900 text-sm font-mono">
                {masters.length} <span className="text-[10px] text-emerald-600 font-sans">({activeCount} active)</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
            <Users className="w-4 h-4 text-[#b89766] shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500">รวมผู้ติดตาม</p>
              <p className="font-black text-slate-900 text-sm font-mono">{totalCopiers.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
            <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500">เฉลี่ย ROI 30D</p>
              <p className="font-black text-emerald-600 text-sm font-mono">+{avgRoi}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา Master Trader..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#c6a87c] font-medium"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Risk filter */}
          <div className="flex items-center gap-px bg-slate-100 p-0.5 rounded-xl">
            {(["all", "low", "medium", "high"] as const).map((r) => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${riskFilter === r ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-700"}`}>
                {r === "all" ? "ทั้งหมด" : r === "low" ? "เสี่ยงต่ำ" : r === "medium" ? "ปานกลาง" : "เสี่ยงสูง"}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-px bg-slate-100 p-0.5 rounded-xl">
            <button onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400"}`}>
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Master Trader</th>
                  <th className="px-4 py-3">ROI</th>
                  <th className="px-4 py-3">Copiers / AUM</th>
                  <th className="px-4 py-3">Fees</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-xs text-slate-400">กำลังโหลด...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-xs text-slate-400">ไม่พบ Master Trader</td></tr>
                ) : filtered.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Identity */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#c6a87c] to-[#997a49] text-white flex items-center justify-center font-black text-xs shrink-0">
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            {m.name}
                            {m.featured && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                          </p>
                          <span className={badgeClass(m.badge)}>{m.badge}</span>
                        </div>
                      </div>
                    </td>

                    {/* ROI */}
                    <td className="px-4 py-3 font-mono">
                      <p className="text-xs font-black text-emerald-600">+{m.roi30d}%</p>
                      <p className="text-[10px] text-slate-400">Total: +{m.roiTotal}%</p>
                    </td>

                    {/* Copiers / AUM */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        {m.copiers.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{m.aum}</p>
                    </td>

                    {/* Fees */}
                    <td className="px-4 py-3 font-mono">
                      <p className="text-xs font-bold text-slate-800">{m.profitShare}% profit</p>
                      <p className="text-[10px] text-slate-400">min ${m.minDeposit}</p>
                    </td>

                    {/* Win Rate */}
                    <td className="px-4 py-3 font-mono">
                      <p className="text-xs font-bold text-slate-800">{m.winRate}%</p>
                      <p className="text-[10px] text-rose-400">DD: {m.maxDrawdown}%</p>
                    </td>

                    {/* Risk Score bar */}
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-bold text-slate-600 font-mono mb-1">{m.riskScore}/10</p>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${riskBarColor(m.riskScore)}`}
                          style={{ width: `${(m.riskScore / 10) * 100}%` }} />
                      </div>
                    </td>

                    {/* Status pill */}
                    <td className="px-4 py-3">
                      {m.status === "active" ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <span className="w-1 h-1 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <span className="w-1 h-1 rounded-full bg-amber-500" /> Paused
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => openEdit(m)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleStatus(m)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                          <Star className={`w-3.5 h-3.5 ${m.status === "active" ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                        </button>
                        <button onClick={() => deleteMaster(m._id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div key={m._id} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:border-[#c6a87c]/60 transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c6a87c] to-[#997a49] text-white flex items-center justify-center font-black text-sm shrink-0">
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">{m.name}</p>
                    <span className={badgeClass(m.badge)}>{m.badge}</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMaster(m._id)} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">ROI 30D</span>
                  <span className="font-black text-emerald-600">+{m.roi30d}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Win Rate</span>
                  <span className="font-bold text-slate-800">{m.winRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Copiers</span>
                  <span className="font-bold text-slate-800">{m.copiers.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Profit Share</span>
                  <span className="font-bold text-slate-800">{m.profitShare}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">Min: ${m.minDeposit}</span>
                <button onClick={() => toggleStatus(m)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    m.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                  {m.status === "active" ? "● Active" : "● Paused"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#fdfbf7] border border-[#e8d5b7] flex items-center justify-center text-[#b89766]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingMaster ? "แก้ไข Master Trader" : "เพิ่ม Master Trader ใหม่"}
                </h3>
                <p className="text-[11px] text-slate-400">กำหนดสถิติ ผลตอบแทน และเงื่อนไขการคัดลอก</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
              <Field label="ชื่อ Master Trader" col={2}>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="เช่น Alex_Gold_Algo" className={inputCls} />
              </Field>

              <Field label="Badge">
                <select value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} className={inputCls}>
                  {["Verified","Top Master","Low Risk","High Growth"].map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>

              <Field label="Account Type">
                <select value={formData.accountType} onChange={e => setFormData({...formData, accountType: e.target.value})} className={inputCls}>
                  {["Real MT5","Real ECN","Real MT4"].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="ROI 30 วัน (%)">
                <input type="number" step="0.1" required value={formData.roi30d}
                  onChange={e => setFormData({...formData, roi30d: parseFloat(e.target.value)})} className={inputCls} />
              </Field>

              <Field label="ROI ทั้งหมด (%)">
                <input type="number" step="0.1" required value={formData.roiTotal}
                  onChange={e => setFormData({...formData, roiTotal: parseFloat(e.target.value)})} className={inputCls} />
              </Field>

              <Field label="Win Rate (%)">
                <input type="number" step="0.1" required value={formData.winRate}
                  onChange={e => setFormData({...formData, winRate: parseFloat(e.target.value)})} className={inputCls} />
              </Field>

              <Field label="Max Drawdown (%)">
                <input type="number" step="0.1" required value={formData.maxDrawdown}
                  onChange={e => setFormData({...formData, maxDrawdown: parseFloat(e.target.value)})} className={inputCls} />
              </Field>

              <Field label="Copiers">
                <input type="number" required value={formData.copiers}
                  onChange={e => setFormData({...formData, copiers: parseInt(e.target.value)})} className={inputCls} />
              </Field>

              <Field label="AUM">
                <input type="text" required value={formData.aum} placeholder="$100,000"
                  onChange={e => setFormData({...formData, aum: e.target.value})} className={inputCls} />
              </Field>

              <Field label="Profit Share (%)">
                <input type="number" required value={formData.profitShare}
                  onChange={e => setFormData({...formData, profitShare: parseInt(e.target.value)})} className={inputCls} />
              </Field>

              <Field label="Min Deposit ($)">
                <input type="number" required value={formData.minDeposit}
                  onChange={e => setFormData({...formData, minDeposit: parseInt(e.target.value)})} className={inputCls} />
              </Field>

              <Field label="Risk Score (1–10)" col={2}>
                <div className="flex items-center gap-3">
                  <input type="range" min="1" max="10" value={formData.riskScore}
                    onChange={e => setFormData({...formData, riskScore: parseInt(e.target.value)})}
                    className="flex-1 accent-[#c6a87c]" />
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white ${riskBarColor(formData.riskScore)}`}>
                    {formData.riskScore}
                  </span>
                </div>
              </Field>

              {error && (
                <div className="col-span-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">{error}</div>
              )}
              {success && (
                <div className="col-span-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> บันทึกสำเร็จแล้ว!
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="col-span-2 bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] hover:brightness-110 text-white font-black py-2.5 rounded-xl text-xs transition-all shadow-md">
                {submitting ? "กำลังบันทึก..." : editingMaster ? "บันทึกการแก้ไข" : "สร้าง Master Trader"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
