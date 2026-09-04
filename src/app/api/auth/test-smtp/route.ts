import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// DELETE THIS FILE before going to production
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const config = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    passSet: Boolean(process.env.SMTP_PASS && process.env.SMTP_PASS !== "your_email_password_here"),
  };

  if (!config.passSet) {
    return NextResponse.json({
      ok: false,
      error: "SMTP_PASS is not configured. Edit .env.local and restart the dev server.",
      config,
    }, { status: 500 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    return NextResponse.json({ ok: true, message: "SMTP connection verified", config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message, config }, { status: 500 });
  }
}
