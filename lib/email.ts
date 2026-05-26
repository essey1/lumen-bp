import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const FROM = "Lumen <onboarding@resend.dev>";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export async function sendOTP(email: string, code: string): Promise<void> {
  const resend = getResend();

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Your Lumen verification code",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
        <div style="margin-bottom:32px;">
          <span style="font-size:20px;font-weight:600;color:#000;">✦ Lumen</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 8px;">Your verification code</h2>
        <p style="font-size:15px;color:#666;margin:0 0 28px;">Use this code to verify your Lumen account. It expires in 10 minutes.</p>
        <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
          <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#111;font-family:monospace;">${code}</span>
        </div>
        <p style="font-size:13px;color:#999;margin:0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetOTP(
  email: string,
  code: string,
  name?: string
): Promise<void> {
  const resend = getResend();
  const greeting = name ? `Hi ${name},` : "Hi there,";

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Lumen password",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
        <div style="margin-bottom:32px;">
          <span style="font-size:20px;font-weight:600;color:#000;">✦ Lumen</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 8px;">Reset your password</h2>
        <p style="font-size:15px;color:#666;margin:0 0 8px;">${greeting}</p>
        <p style="font-size:15px;color:#666;margin:0 0 28px;">
          Use this code to reset your Lumen password. It expires in <strong>10 minutes</strong>.
          If you didn't request a reset, you can safely ignore this email.
        </p>
        <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
          <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#111;font-family:monospace;">${code}</span>
        </div>
        <p style="font-size:13px;color:#999;margin:0;">
          This code is single-use and will expire after one successful reset.
        </p>
      </div>
    `,
  });
}

export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await prisma.oTP.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch (error) {
    console.error("OTP cleanup error:", error);
  }
}
