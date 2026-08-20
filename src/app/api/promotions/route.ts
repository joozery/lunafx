import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin } from "@/lib/adminAuth";

const defaultPromotions = [
  {
    badge: "ยอดนิยมสูงสุด",
    badgeType: "hot",
    title: "100% Instant Deposit Bonus",
    subtitle: "เพิ่มมาร์จิ้นเป็น 2 เท่าทันทีที่ฝากเงิน",
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
    active: true,
  },
  {
    badge: "ทุนฟรี ไม่ต้องฝาก",
    badgeType: "free",
    title: "$30 Welcome Credit",
    subtitle: "สำหรับสมาชิกใหม่ที่ยืนยันตัวตนสำเร็จ",
    description: "Complete your KYC profile verification and receive $30 real trading credit. No deposit required. Profits are fully withdrawable.",
    descriptionTh: "เปิดบัญชีและยืนยันตัวตน (KYC) วันนี้ รับโบนัสต้อนรับ $30 เข้าพอร์ตฟรีทันที ไม่ต้องฝากเงินก่อน กำไรถอนได้จริง",
    valueDisplay: "$30",
    valueLabel: "Free Credit",
    valueLabelTh: "เครดิตฟรี",
    bgImage: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80",
    endsIn: "สิทธิ์จำนวนจำกัด",
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
    active: true,
  },
  {
    badge: "เงินคืนทุกสัปดาห์",
    badgeType: "cashback",
    title: "$8/Lot Cash Rebate",
    subtitle: "รับเงินคืนเข้ากระเป๋าอัตโนมัติทุกวันจันทร์",
    description: "Earn up to $8 cashback for every lot traded across Forex and Gold pairs. Paid automatically every Monday with zero volume cap.",
    descriptionTh: "รับเงินคืนสูงสุด $8 ต่อ 1 lot ทุกการเทรดคู่เงินและทองคำ ระบบโอนเงินสดเข้า Wallet อัตโนมัติทุกวันจันทร์ ถอนได้ทันทีไม่ติดเงื่อนไข",
    valueDisplay: "$8.00",
    valueLabel: "Cashback / Lot",
    valueLabelTh: "เงินคืน / Lot",
    bgImage: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
    endsIn: "สิทธิ์ตลอดชีพ",
    conditions: [
      "นับ Volume รวมทุกออเดอร์ในคู่เงิน Forex และ Gold (XAUUSD)",
      "จ่ายเงินคืนเข้า Wallet ในบัญชีอัตโนมัติทุกวันจันทร์ เวลา 10:00 น.",
      "เงิน Rebate เป็นเงินสดจริง ไม่มีเงื่อนไขทำเทิร์น สามารถถอนได้ทันที",
    ],
    conditionsTh: [
      "นับ Volume รวมทุกออเดอร์ในคู่เงิน Forex และ Gold (XAUUSD)",
      "จ่ายเงินคืนเข้า Wallet ในบัญชีอัตโนมัติทุกวันจันทร์ เวลา 10:00 น.",
      "เงิน Rebate เป็นเงินสดจริง ไม่มีเงื่อนไขทำเทิร์น สามารถถอนได้ทันที",
    ],
    active: true,
  },
];

export async function GET() {
  try {
    const db = await getDb();
    let promos = await db.collection("promotions").find({}).sort({ createdAt: -1 }).toArray();

    if (promos.length === 0) {
      const docs = defaultPromotions.map((p) => ({ ...p, createdAt: new Date() }));
      await db.collection("promotions").insertMany(docs);
      promos = await db.collection("promotions").find({}).sort({ createdAt: -1 }).toArray();
    }

    const formatted = promos.map((p) => ({
      id: p._id.toString(),
      badge: p.badge || "โปรโมชั่น",
      badgeType: p.badgeType || "hot",
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      descriptionTh: p.descriptionTh || p.description,
      valueDisplay: p.valueDisplay,
      valueLabel: p.valueLabel,
      valueLabelTh: p.valueLabelTh || p.valueLabel,
      bgImage: p.bgImage || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
      endsIn: p.endsIn || "ระยะเวลาจำกัด",
      conditions: p.conditions || [],
      conditionsTh: p.conditionsTh || p.conditions || [],
      active: p.active !== false,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ success: true, promotions: formatted });
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
    const {
      title,
      subtitle,
      descriptionTh,
      badge,
      badgeType,
      valueDisplay,
      valueLabelTh,
      bgImage,
      endsIn,
      conditionsTh,
      active,
    } = body;

    if (!title || !descriptionTh) {
      return NextResponse.json({ error: "กรุณากรอกชื่อโปรโมชั่นและรายละเอียดภาษาไทย" }, { status: 400 });
    }

    const db = await getDb();
    const newPromo = {
      badge: badge || "โปรโมชั่น",
      badgeType: badgeType || "hot",
      title,
      subtitle: subtitle || "",
      description: descriptionTh,
      descriptionTh,
      valueDisplay: valueDisplay || "Bonus",
      valueLabel: valueLabelTh || "โปรโมชั่น",
      valueLabelTh: valueLabelTh || "โปรโมชั่น",
      bgImage: bgImage || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80",
      endsIn: endsIn || "ระยะเวลาจำกัด",
      conditions: Array.isArray(conditionsTh) ? conditionsTh : [conditionsTh],
      conditionsTh: Array.isArray(conditionsTh) ? conditionsTh : [conditionsTh],
      active: active !== false,
      createdAt: new Date(),
    };

    const result = await db.collection("promotions").insertOne(newPromo);

    return NextResponse.json({
      success: true,
      promotion: { id: result.insertedId.toString(), ...newPromo },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create promotion" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      subtitle,
      descriptionTh,
      badge,
      badgeType,
      valueDisplay,
      valueLabelTh,
      bgImage,
      endsIn,
      conditionsTh,
      active,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing Promotion ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("promotions").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          badge,
          badgeType,
          title,
          subtitle,
          description: descriptionTh,
          descriptionTh,
          valueDisplay,
          valueLabelTh,
          valueLabel: valueLabelTh,
          bgImage,
          endsIn,
          conditions: Array.isArray(conditionsTh) ? conditionsTh : [conditionsTh],
          conditionsTh: Array.isArray(conditionsTh) ? conditionsTh : [conditionsTh],
          active: Boolean(active),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update promotion" }, { status: 500 });
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
      return NextResponse.json({ error: "Missing Promotion ID" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("promotions").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete promotion" }, { status: 500 });
  }
}
