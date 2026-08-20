import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";

const defaultFaqs = [
  {
    questionTh: "ใช้เวลาในการถอนเงินนานเท่าใด?",
    questionEn: "How long do withdrawals take?",
    answerTh: "การถอนเงินผ่านระบบธนาคารไทยอัตโนมัติจะดำเนินการรวดเร็วภายใน 5 - 15 นาที สำหรับการถอนผ่าน E-Wallet หรือ Crypto จะดำเนินการทันทีตลอด 24 ชั่วโมง",
    answerEn: "Local Thai bank withdrawals are processed automatically within 5-15 minutes. Crypto and E-wallet withdrawals are processed 24/7 instantly.",
    category: "deposit",
    order: 1,
  },
  {
    questionTh: "สเปรด (Spread) ของบัญชี Standard เริ่มต้นที่เท่าใด?",
    questionEn: "What is the starting spread for Standard accounts?",
    answerTh: "บัญชี Standard มีสเปรดเริ่มต้น 1.0 Pips ไม่มีค่าคอมมิชชั่น สำหรับบัญชี ECN Pro สเปรดเริ่มต้น 0.1 Pips และ VIP Zero สเปรดเริ่มต้น 0.0 Pips",
    answerEn: "Standard account spreads start from 1.0 pips with $0 commission. ECN Pro starts from 0.1 pips and VIP Zero starts from 0.0 pips.",
    category: "accounts",
    order: 2,
  },
  {
    questionTh: "ฉันสามารถเปลี่ยนเลเวอเรจ (Leverage) ได้หรือไม่?",
    questionEn: "Can I change my account leverage?",
    answerTh: "คุณสามารถปรับเปลี่ยนเลเวอเรจได้เองตลอดเวลาผ่านเมนู 'ศูนย์จัดการบัญชีเทรด' เลือกบัญชีที่ต้องการแล้วกดเปลี่ยนเลเวอเรจ สูงสุด 1:1000",
    answerEn: "You can adjust your leverage anytime via the 'Accounts Hub' menu. Select your account and set leverage up to 1:1000.",
    category: "accounts",
    order: 3,
  },
  {
    questionTh: "ลืมรหัสผ่าน MetaTrader 4 / MetaTrader 5 ต้องทำอย่างไร?",
    questionEn: "How do I reset my MT4/MT5 password?",
    answerTh: "กดปุ่มตั้งค่า (⚙) ที่การ์ดบัญชีเทรดของคุณในหน้าศูนย์จัดการบัญชีเทรด เลือกรีเซ็ตรหัสผ่าน ระบบจะส่งลิงก์รีเซ็ตไปยังอีเมลของคุณทันที",
    answerEn: "Click the Settings gear icon on your trading account card and select 'Reset Password'. A confirmation link will be sent to your email.",
    category: "platforms",
    order: 4,
  },
  {
    questionTh: "เงื่อนไขการรับโบนัสเงินฝาก 100% เป็นอย่างไร?",
    questionEn: "What are the terms for the 100% Deposit Bonus?",
    answerTh: "โบนัสเงินฝาก 100% สามารถกดรับได้ที่หน้าโปรโมชั่นเมื่อฝากเงินขั้นต่ำ $100 ขึ้นไป โบนัสทนลากได้และสามารถถอนออกได้เมื่อทำครบเงื่อนไข Lot",
    answerEn: "The 100% Deposit Bonus is available on the Promotions page with a min deposit of $100. Bonus supports drawdown and is withdrawable upon meeting volume requirements.",
    category: "promotions",
    order: 5,
  },
];

export async function GET() {
  try {
    const db = await getDb();
    let faqs = await db.collection("faqs").find({}).sort({ order: 1, createdAt: -1 }).toArray();

    if (faqs.length === 0) {
      const docs = defaultFaqs.map((f) => ({ ...f, createdAt: new Date() }));
      await db.collection("faqs").insertMany(docs);
      faqs = await db.collection("faqs").find({}).sort({ order: 1, createdAt: -1 }).toArray();
    }

    const formatted = faqs.map((f) => ({
      id: f._id.toString(),
      questionTh: f.questionTh,
      questionEn: f.questionEn,
      answerTh: f.answerTh,
      answerEn: f.answerEn,
      category: f.category || "general",
      order: f.order || 0,
      createdAt: f.createdAt,
    }));

    return NextResponse.json({ success: true, faqs: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionTh, questionEn, answerTh, answerEn, category, order } = body;

    if (!questionTh || !answerTh) {
      return NextResponse.json({ error: "กรุณากรอกคำถามและคำตอบภาษาไทย" }, { status: 400 });
    }

    const db = await getDb();
    const newFaq = {
      questionTh,
      questionEn: questionEn || questionTh,
      answerTh,
      answerEn: answerEn || answerTh,
      category: category || "general",
      order: Number(order) || 0,
      createdAt: new Date(),
    };

    const result = await db.collection("faqs").insertOne(newFaq);
    return NextResponse.json({
      success: true,
      faq: { id: result.insertedId.toString(), ...newFaq },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create FAQ" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, questionTh, questionEn, answerTh, answerEn, category, order } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing FAQ ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("faqs").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          questionTh,
          questionEn,
          answerTh,
          answerEn,
          category,
          order: Number(order) || 0,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update FAQ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing FAQ ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("faqs").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete FAQ" }, { status: 500 });
  }
}
