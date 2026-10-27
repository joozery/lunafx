"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Save, Send, CheckCircle2, RefreshCw, Copy, Plus, X } from "lucide-react";

interface Source { id: string; type: string; lastSeenAt: string }

const EVENTS = [
  { key: "signup",   label: "มีสมาชิกใหม่สมัคร" },
  { key: "deposit",  label: "มีการฝากเงิน / ส่งสลิป" },
  { key: "withdraw", label: "มีคำขอถอนเงิน" },
  { key: "copy",     label: "Copy Trade: มีคนสมัคร Master / เริ่มคัดลอก" },
  { key: "referral", label: "มีค่าแนะนำเพื่อนรออนุมัติ" },
] as const;

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900 text-xs focus:outline-none focus:border-[#c6a87c]";

export function AdminLineClient() {
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [tokenHint, setTokenHint] = useState("");
  const [secretHint, setSecretHint] = useState("");
  const [targets, setTargets] = useState<string[]>([]);
  const [newTarget, setNewTarget] = useState("");
  const [events, setEvents] = useState({ signup: true, deposit: true, withdraw: true, copy: true, referral: true });
  const [sources, setSources] = useState<Source[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const flash = (ok: boolean, text: string) => {
    setMessage({ ok, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const load = async () => {
    try {
      const d = await fetch("/api/admin/settings/line").then((r) => r.json());
      if (d.setting) {
        setEnabled(d.setting.enabled);
        setTargets(d.setting.targets ?? []);
        setEvents({ signup: true, deposit: true, withdraw: true, copy: true, referral: true, ...d.setting.events });
        setTokenHint(d.setting.tokenHint);
        setSecretHint(d.setting.secretHint);
      }
      setSources(d.sources ?? []);
    } catch (err) {
      console.error("Failed to load LINE settings", err);
    }
  };

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/line/webhook`);
    load();
  }, []);

  const addTarget = (id: string) => {
    const v = id.trim();
    if (v && !targets.includes(v)) setTargets((t) => [...t, v]);
    setNewTarget("");
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy("save");
    try {
      const d = await fetch("/api/admin/settings/line", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, channelAccessToken: token, channelSecret: secret, targets, events }),
      }).then((r) => r.json());
      if (d.success) {
        flash(true, "บันทึกการตั้งค่า LINE แล้ว");
        setToken("");
        setSecret("");
        load();
      } else flash(false, d.error ?? "บันทึกไม่สำเร็จ");
    } catch {
      flash(false, "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy("test");
    try {
      const d = await fetch("/api/admin/settings/line", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test" }),
      }).then((r) => r.json());
      if (d.success) flash(true, `ส่งข้อความทดสอบแล้ว ${d.sent} ปลายทาง — เช็คใน LINE ได้เลย`);
      else flash(false, d.error ?? "ส่งไม่สำเร็จ");
    } catch {
      flash(false, "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>LINE Messaging API</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">แจ้งเตือนแอดมินผ่าน LINE</h1>
          <p className="text-xs text-slate-500 mt-1">ส่งข้อความเข้ากลุ่ม LINE ของทีมเมื่อมีคนสมัคร ฝากเงิน หรือขอถอนเงิน</p>
        </div>
        <button onClick={load} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${message.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
          {message.ok && <CheckCircle2 className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onSubmit={save} className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-5 text-xs">
          <label className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <span className="font-bold text-slate-900 text-sm">เปิดใช้แจ้งเตือน LINE</span>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-5 h-5 accent-[#b89766]" />
          </label>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Channel Access Token (long-lived)</label>
            <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className={inputCls}
              placeholder={tokenHint ? `บันทึกไว้แล้ว (${tokenHint}) — เว้นว่างเพื่อใช้ค่าเดิม` : "วาง token จาก LINE Developers"} />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Channel Secret</label>
            <input type="password" autoComplete="off" value={secret} onChange={(e) => setSecret(e.target.value)} className={inputCls}
              placeholder={secretHint ? `บันทึกไว้แล้ว (${secretHint}) — เว้นว่างเพื่อใช้ค่าเดิม` : "ใช้ยืนยัน webhook (สำหรับหา ID กลุ่มอัตโนมัติ)"} />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">ส่งไปที่ (ID กลุ่มหรือผู้ใช้)</label>
            {targets.length > 0 && (
              <ul className="space-y-1">
                {targets.map((t) => (
                  <li key={t} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono">
                    <span className="truncate">{t.startsWith("C") ? "👥 " : "👤 "}{t}</span>
                    <button type="button" onClick={() => setTargets((x) => x.filter((y) => y !== t))} aria-label="ลบ" className="text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input value={newTarget} onChange={(e) => setNewTarget(e.target.value)} placeholder="C1234... หรือ U1234..." className={inputCls} />
              <button type="button" onClick={() => addTarget(newTarget)} className="shrink-0 px-3 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> เพิ่ม</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-700 block">แจ้งเตือนเมื่อ</label>
            {EVENTS.map((ev) => (
              <label key={ev.key} className="flex items-center gap-2 font-bold text-slate-700">
                <input type="checkbox" checked={events[ev.key]} onChange={(e) => setEvents((x) => ({ ...x, [ev.key]: e.target.checked }))} className="w-4 h-4 accent-[#b89766]" />
                {ev.label}
              </label>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button type="submit" disabled={busy !== null} className="flex-1 bg-gradient-to-r from-[#c6a87c] via-[#b89766] to-[#997a49] text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {busy === "save" ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button type="button" onClick={test} disabled={busy !== null} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              <Send className="w-4 h-4" /> {busy === "test" ? "กำลังส่ง..." : "ส่งข้อความทดสอบ"}
            </button>
          </div>
          <p className="text-[11px] text-slate-400">ปุ่มทดสอบใช้ค่าที่บันทึกไว้แล้ว — กดบันทึกก่อนทดสอบ</p>
        </form>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl space-y-3 text-xs">
            <h3 className="font-bold text-[#e6cda3] text-sm">วิธีตั้งค่า (ครั้งเดียว)</h3>
            <ol className="list-decimal pl-4 space-y-2 text-slate-300 leading-relaxed">
              <li>เข้า <span className="font-mono text-white">developers.line.biz</span> → สร้าง Provider → สร้าง <b className="text-white">Messaging API channel</b> (จะได้ LINE Official Account)</li>
              <li>แท็บ Basic settings → คัดลอก <b className="text-white">Channel secret</b> มาใส่</li>
              <li>แท็บ Messaging API → กด Issue <b className="text-white">Channel access token</b> มาใส่ → กดบันทึก</li>
              <li>แท็บ Messaging API → ใส่ Webhook URL ด้านล่าง → เปิด <b className="text-white">Use webhook</b> และเปิด <b className="text-white">Allow bot to join group chats</b></li>
              <li>เชิญบอทเข้ากลุ่ม LINE ของทีม → บอทจะตอบ ID กลุ่มให้ (หรือพิมพ์ <span className="font-mono text-white">id</span> ในกลุ่ม) → ID จะขึ้นในกล่อง "พบแล้ว" ด้านล่างด้วย</li>
              <li>กด "ใช้ ID นี้" → บันทึก → ส่งข้อความทดสอบ</li>
            </ol>
            <div className="bg-slate-800 rounded-xl p-3 space-y-1.5">
              <p className="text-slate-400">Webhook URL</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-white break-all flex-1">{webhookUrl}</span>
                <button type="button" onClick={async () => { await navigator.clipboard.writeText(webhookUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="shrink-0 p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600" aria-label="คัดลอก">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">ID ที่บอทพบแล้ว</h3>
            {sources.length === 0 ? (
              <p className="text-slate-400">ยังไม่พบ — เชิญบอทเข้ากลุ่มหรือทักบอท แล้วกดรีเฟรช</p>
            ) : (
              <ul className="space-y-1.5">
                {sources.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 border border-slate-100 rounded-lg px-3 py-2">
                    <div className="min-w-0">
                      <p className="font-bold">{s.type === "group" ? "👥 กลุ่ม" : s.type === "room" ? "💬 ห้องแชท" : "👤 ผู้ใช้"}</p>
                      <p className="font-mono text-slate-400 truncate">{s.id}</p>
                    </div>
                    {targets.includes(s.id) ? (
                      <span className="text-emerald-600 font-bold shrink-0">ใช้อยู่</span>
                    ) : (
                      <button type="button" onClick={() => addTarget(s.id)} className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold">ใช้ ID นี้</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
