"use client";

import { useState } from "react";
import { 
  History, 
  ChevronDown, 
  CreditCard, 
  Landmark, 
  Wallet, 
  Bitcoin, 
  ShieldCheck, 
  CircleDollarSign, 
  Clock, 
  Tag,
  ArrowDownToLine,
  ArrowUpFromLine
} from "lucide-react";
import Link from "next/link";

export function FundsClient({ lang }: { lang: string }) {
  const isth = lang === "th";
  const [activeTab, setActiveTab] = useState<"deposit" | "withdrawal">("deposit");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert(isth ? "กรุณาระบุจำนวนเงินที่ถูกต้อง" : "Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          method: paymentMethod,
          type: activeTab
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(isth ? `เตรียมเชื่อมต่อ Payment Gateway...\n(จำลอง API สำเร็จ รหัสอ้างอิง: ${data.transactionId})` : `Connecting to Gateway...\n(Mock Success: ${data.transactionId})`);
        // ในระบบจริง จะใช้ window.location.href = data.checkoutUrl
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      alert("API Connection Error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isth ? "ฝาก / ถอนเงิน" : "Deposit / Withdrawal"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isth ? "ฝากเงินเข้าบัญชีหรือถอนกำไรของคุณอย่างปลอดภัย" : "Fund your account or withdraw your profits securely"}
          </p>
        </div>
        <Link href={`/${lang}/dashboard/history`} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm border border-gray-300 transition-colors flex items-center gap-2 shadow-sm">
          <History className="w-4 h-4" />
          {isth ? "ประวัติธุรกรรม" : "Transaction History"}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button 
          onClick={() => setActiveTab("deposit")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "deposit" 
              ? "border-[#c6a87c] text-[#a38458]" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          {isth ? "ฝากเงิน" : "Deposit"}
        </button>
        <button 
          onClick={() => setActiveTab("withdrawal")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "withdrawal" 
              ? "border-[#c6a87c] text-[#a38458]" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          {isth ? "ถอนเงิน" : "Withdrawal"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column - Form */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* 1. Select Account */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 mb-4">1. {isth ? "เลือกบัญชี" : "Select Account"}</h3>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-[#c6a87c] hover:ring-1 hover:ring-[#c6a87c] transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Wallet className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{isth ? "เลือกบัญชีเทรด" : "Select Trading Account"}</p>
                  <p className="text-sm text-gray-500">{isth ? "กรุณาเลือกบัญชีที่ต้องการทำรายการ" : "Please select an account to proceed"}</p>
                </div>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </section>

          {/* 2. Select Payment Method */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 mb-4">2. {isth ? "เลือกช่องทางการชำระเงิน" : "Select Payment Method"}</h3>
            <div className="space-y-3">
              {[
                { id: "card", icon: CreditCard, title: isth ? "บัตรเครดิต / เดบิต" : "Credit / Debit Card", desc: "Visa, Mastercard", time: isth ? "ทันที" : "Instant", fee: isth ? "ไม่มีค่าธรรมเนียม" : "No Fees" },
                { id: "bank", icon: Landmark, title: isth ? "โอนผ่านธนาคาร" : "Bank Transfer", desc: isth ? "ธนาคารในประเทศ" : "Local Bank Transfer", time: isth ? "1-3 วันทำการ" : "1-3 Business Days", fee: isth ? "ไม่มีค่าธรรมเนียม" : "No Fees" },
                { id: "wallet", icon: Wallet, title: "E-Wallet", desc: "Skrill, Neteller", time: isth ? "ทันที" : "Instant", fee: isth ? "ไม่มีค่าธรรมเนียม" : "No Fees" },
                { id: "crypto", icon: Bitcoin, title: isth ? "คริปโตเคอร์เรนซี" : "Cryptocurrency", desc: "USDT, BTC, ETH", time: isth ? "ทันที" : "Instant", fee: isth ? "ไม่มีค่าธรรมเนียม" : "No Fees" },
              ].map((method) => (
                <div 
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    paymentMethod === method.id 
                      ? "border-[#c6a87c] bg-[#c6a87c]/5 ring-1 ring-[#c6a87c]" 
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === method.id ? "border-[#c6a87c]" : "border-gray-300"}`}>
                      {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-[#c6a87c]" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                        <method.icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{method.title}</p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-900">{method.time}</p>
                    <p className="text-xs text-gray-500">{method.fee}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Enter Amount */}
          <section>
            <h3 className="text-sm font-bold text-gray-900 mb-4">3. {isth ? "ระบุจำนวนเงิน" : `Enter ${activeTab === "deposit" ? "Deposit" : "Withdrawal"} Amount`}</h3>
            <div className="space-y-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-[#c6a87c] focus-within:ring-1 focus-within:ring-[#c6a87c] transition-all">
                <div className="px-4 py-3 bg-gray-50 border-r border-gray-200 text-sm font-semibold text-gray-700">
                  USD
                </div>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={isth ? "ระบุจำนวนเงิน" : "Enter amount"} 
                  className="flex-1 px-4 py-3 outline-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {["$100", "$500", "$1,000", "$5,000", isth ? "อื่นๆ" : "Other"].map((val) => (
                  <button 
                    key={val}
                    onClick={() => val !== (isth ? "อื่นๆ" : "Other") && setAmount(val.replace(/\$|,/g, ""))}
                    className="py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-[#c6a87c] hover:text-[#a38458] transition-colors"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Secure Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{isth ? "ธุรกรรมที่ปลอดภัย" : "Secure Transactions"}</p>
              <p className="text-xs text-gray-500 mt-1">
                {isth 
                  ? "เงินทุนของคุณได้รับการปกป้องด้วยระบบรักษาความปลอดภัยระดับธนาคารและการเข้ารหัสข้อมูลธุรกรรม" 
                  : "Your funds are protected with bank-level security and encrypted transactions."}
              </p>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[#c6a87c] hover:bg-[#b0936b] text-white font-bold py-4 rounded-xl shadow-md transition-colors text-lg disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isSubmitting && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {activeTab === "deposit" ? (isth ? "ฝากเงินตอนนี้" : "Deposit Now") : (isth ? "ถอนเงินตอนนี้" : "Withdraw Now")}
          </button>

          <p className="text-xs text-gray-400 mt-4">
            * {isth 
                ? "โปรดตรวจสอบให้แน่ใจว่าชื่อบัญชีเทรดตรงกับชื่อบัญชีชำระเงินเพื่อหลีกเลี่ยงความล่าช้า" 
                : "Please ensure that the account name matches the payment account name to avoid any delays."}
          </p>

        </div>

        {/* Right Column - Info & History */}
        <div className="space-y-6">
          
          {/* Important Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-6">{isth ? "ข้อมูลสำคัญ" : "Important Information"}</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <CircleDollarSign className="w-4 h-4 text-[#c6a87c]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{isth ? "ยอดฝากขั้นต่ำ" : "Minimum Deposit"}</p>
                  <p className="text-xs text-gray-500 mt-1">{isth ? "$10 หรือเทียบเท่า" : "$10 or equivalent"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#c6a87c]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{isth ? "ระยะเวลาดำเนินการ" : "Processing Time"}</p>
                  <p className="text-xs text-gray-500 mt-1">{isth ? "ทันที - 1 วันทำการ ขึ้นอยู่กับช่องทาง" : "Instant - 1 Business Day depending on the payment method"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Tag className="w-4 h-4 text-[#c6a87c]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{isth ? "ค่าธรรมเนียม" : "Fees"}</p>
                  <p className="text-xs text-gray-500 mt-1">{isth ? "เราไม่คิดค่าธรรมเนียมการฝากเงิน (อาจมีค่าธรรมเนียมจากผู้ให้บริการชำระเงิน)" : "We do not charge any deposit fees. Fees may be charged by your payment provider."}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <CircleDollarSign className="w-4 h-4 text-[#c6a87c]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{isth ? "สกุลเงินบัญชี" : "Account Currency"}</p>
                  <p className="text-xs text-gray-500 mt-1">{isth ? "การฝากเงินทั้งหมดจะถูกแปลงเป็นสกุลเงินหลักของบัญชีคุณ (USD)" : "All deposits will be converted to your account base currency (USD)"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">{isth ? "ธุรกรรมล่าสุด" : "Recent Transactions"}</h3>
              <Link href={`/${lang}/dashboard/history`} className="text-sm font-medium text-[#c6a87c] hover:text-[#a38458]">
                {isth ? "ดูทั้งหมด" : "View All"}
              </Link>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                <History className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {isth ? "ไม่มีประวัติการทำรายการ" : "No Recent Transactions"}
              </p>
              <p className="text-xs text-gray-500 max-w-[200px]">
                {isth
                  ? "รายการฝาก/ถอนของคุณจะแสดงที่นี่"
                  : "Your deposit and withdrawal history will appear here."}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
