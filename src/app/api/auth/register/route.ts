import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { createSession } from "@/lib/session";
import { findReferrer, REFERRAL_COOKIE } from "@/lib/referral";
import { notifyAdmins, thaiTime } from "@/lib/lineNotify";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, password, referralCode } = await req.json();

    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");

    const existing = await users.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Code typed in the form wins over the one remembered from a ?ref= link
    const referredBy = await findReferrer(db, referralCode || req.cookies.get(REFERRAL_COOKIE)?.value);

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const result = await users.insertOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      status: "active",
      accountType: "standard",
      ...(referredBy ? { referredBy } : {}),
      createdAt: now,
      updatedAt: now,
    });

    let referrerLine = "";
    if (referredBy) {
      const r = await users.findOne({ _id: referredBy }, { projection: { firstName: 1, lastName: 1, email: 1 } });
      if (r) referrerLine = `\nผู้แนะนำ: ${r.firstName} ${r.lastName} (${r.email})`;
    }
    void notifyAdmins(
      `🆕 สมาชิกใหม่สมัคร\nชื่อ: ${firstName.trim()} ${lastName.trim()}\nอีเมล: ${email.toLowerCase().trim()}\nโทร: ${phone.trim()}${referrerLine}\nเวลา: ${thaiTime()}`,
      "signup",
    );

    await createSession({
      userId: result.insertedId.toString(),
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
