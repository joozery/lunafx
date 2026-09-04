import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sendOtpEmail } from "@/lib/email";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email, lang } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = await getDb();

    const user = await db.collection("users").findOne({ email: normalizedEmail });
    if (!user) {
      // Return ok to avoid leaking which emails are registered
      return NextResponse.json({ ok: true });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Remove any existing unused OTPs for this email
    await db.collection("passwordResets").deleteMany({ email: normalizedEmail });

    await db.collection("passwordResets").insertOne({
      email: normalizedEmail,
      otp,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    await sendOtpEmail(normalizedEmail, otp, (lang === "th" ? "th" : "en"));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
