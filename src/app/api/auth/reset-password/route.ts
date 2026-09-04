import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = await getDb();

    const record = await db.collection("passwordResets").findOne({
      email: normalizedEmail,
      otp: String(otp).trim(),
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.collection("users").updateOne(
      { email: normalizedEmail },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    await db.collection("passwordResets").updateOne(
      { _id: record._id },
      { $set: { used: true } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
