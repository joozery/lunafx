import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password, pin } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    if (user.status === "suspended") {
      return NextResponse.json({ error: "บัญชีของคุณถูกระงับการใช้งาน" }, { status: 403 });
    }

    // Check if user is Admin and PIN is required
    const isAdmin = user.role === "admin";
    if (isAdmin) {
      const requiredPin = user.adminPin || "123456";
      if (!pin) {
        return NextResponse.json({ requiresPin: true, message: "กรุณากรอกรหัส PIN ความปลอดภัย 6 หลัก" });
      }
      if (String(pin).trim() !== String(requiredPin).trim()) {
        return NextResponse.json({ error: "รหัส PIN ความปลอดภัย 6 หลักไม่ถูกต้อง" }, { status: 401 });
      }
    }

    await createSession({
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return NextResponse.json({ ok: true, isAdmin });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
