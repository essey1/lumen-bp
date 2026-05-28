import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

function getTransporter() {
  const key = process.env.BREVO_SMTP_KEY;
  if (!key) throw new Error("BREVO_SMTP_KEY must be set");
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.GMAIL_USER, // your verified sender email (lumen.berea@gmail.com)
      pass: key,
    },
  });
}

const FROM = `"Lumen" <${process.env.GMAIL_USER ?? "lumen.berea@gmail.com"}>`;

// ── Sign-up / login OTP ───────────────────────────────────────────────────────

export async function sendOTP(email: string, code: string): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `${code} is your Lumen code`,
    text:    buildPlainText(code, "verification"),
    html:    buildHtml(code, "verification"),
  });
}

// ── Forgot-password OTP ───────────────────────────────────────────────────────

export async function sendPasswordResetOTP(
  email: string,
  code: string,
  name?: string
): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from:    FROM,
    to:      email,
    subject: `${code} is your Lumen password reset code`,
    text:    buildPlainText(code, "password reset", name),
    html:    buildHtml(code, "password reset", name),
  });
}

// ── Templates ─────────────────────────────────────────────────────────────────

function buildPlainText(code: string, purpose: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return [
    greeting,
    "",
    `Your Lumen ${purpose} code is: ${code}`,
    "",
    "This code expires in 10 minutes.",
    "If you did not request this, you can safely ignore this email.",
    "",
    "— Lumen · Berea College Academic Planner",
  ].join("\n");
}

function buildHtml(code: string, purpose: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Lumen code</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111111;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;border-bottom:1px solid #e5e7eb;">
              <span style="font-size:17px;font-weight:700;color:#111111;">✦ Lumen</span>
              <span style="font-size:13px;color:#6b7280;margin-left:8px;">Berea College Academic Planner</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 0 0;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">${greeting}</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
                Here is your Lumen ${purpose} code. It expires in <strong>10 minutes</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">
                Your code: <strong style="font-size:22px;letter-spacing:4px;font-family:monospace;color:#111111;">${code}</strong>
              </p>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6b7280;">
                Enter this code on the Lumen sign-in page to continue.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                If you did not request this, you can safely ignore this email — your account is not at risk.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;border-top:1px solid #f3f4f6;margin-top:28px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Lumen · Berea College Academic Planner · This is an automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── OTP cleanup ───────────────────────────────────────────────────────────────

export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await prisma.oTP.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch (error) {
    console.error("OTP cleanup error:", error);
  }
}
