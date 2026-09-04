import "server-only";
import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT ?? 465);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: process.env.NODE_ENV !== "production",
  debug: process.env.NODE_ENV !== "production",
});

export async function sendOtpEmail(to: string, otp: string, lang: "en" | "th" = "en") {
  const isTh = lang === "th";

  const subject = isTh
    ? `${otp} คือรหัส OTP สำหรับรีเซ็ตรหัสผ่าน Lunaforex`
    : `${otp} is your Lunaforex password reset OTP`;

  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:#111827;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
              <p style="margin:0;font-size:22px;font-weight:700;color:#c6a87c;letter-spacing:1px;">LUNAFOREX</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">
                ${isTh ? "รีเซ็ตรหัสผ่านของคุณ" : "Reset Your Password"}
              </h1>
              <p style="margin:0 0 32px;font-size:14px;color:#9ca3af;line-height:1.6;">
                ${isTh
                  ? "ใช้รหัส OTP ด้านล่างเพื่อรีเซ็ตรหัสผ่าน รหัสนี้มีอายุ 15 นาที"
                  : "Use the OTP below to reset your password. This code expires in 15 minutes."}
              </p>

              <div style="background:#1f2937;border:1px solid rgba(198,168,124,0.3);border-radius:12px;
                          padding:24px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:2px;
                           color:#9ca3af;text-transform:uppercase;">
                  ${isTh ? "รหัส OTP" : "OTP Code"}
                </p>
                <p style="margin:0;font-size:40px;font-weight:700;letter-spacing:12px;color:#c6a87c;">
                  ${otp}
                </p>
              </div>

              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                ${isTh
                  ? "หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาละเว้นอีเมลนี้ บัญชีของคุณยังคงปลอดภัย"
                  : "If you did not request a password reset, please ignore this email. Your account remains secure."}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.08);
                       text-align:center;">
              <p style="margin:0;font-size:12px;color:#4b5563;">
                © ${new Date().getFullYear()} Lunaforex. ${isTh ? "สงวนลิขสิทธิ์" : "All rights reserved."}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Lunaforex" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
