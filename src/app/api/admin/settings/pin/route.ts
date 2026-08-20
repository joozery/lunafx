import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPin, confirmPin } = await req.json();

    if (!newPin || newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      return NextResponse.json({ error: "กรุณากรอกรหัส PIN เป็นตัวเลข 6 หลัก" }, { status: 400 });
    }

    if (newPin !== confirmPin) {
      return NextResponse.json({ error: "รหัส PIN ใหม่ไม่ตรงกัน" }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: new ObjectId(admin.userId) },
      { $set: { adminPin: newPin, pinUpdatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, message: "เปลี่ยนรหัส PIN ความปลอดภัยสำเร็จแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update PIN" }, { status: 500 });
  }
}
