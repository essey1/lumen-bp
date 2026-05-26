import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set");
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

export async function sendOTP(email: string, code: string): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Lumen" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your Lumen verification code",
    html: buildCodeEmail("Your verification code", "Use this code to verify your Lumen account. It expires in 10 minutes.", code),
  });
}

export async function sendPasswordResetOTP(
  email: string,
  code: string,
  name?: string
): Promise<void> {
  const transporter = getTransporter();
  const greeting = name ? `Hi ${name},` : "Hi there,";
  await transporter.sendMail({
    from: `"Lumen" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset your Lumen password",
    html: buildCodeEmail(
      "Reset your password",
      `${greeting} Use this 6-digit code to reset your Lumen password. It expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.`,
      code
    ),
  });
}

function buildCodeEmail(title: string, body: string, code: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
      <div style="margin-bottom:32px;"><span style="font-size:20px;font-weight:600;color:#000;">✦ Lumen</span></div>
      <h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px;">${title}</h2>
      <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6;">${body}</p>
      <div style="background:#f4f4f5;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#111;font-family:monospace;">${code}</span>
      </div>
      <p style="font-size:13px;color:#999;margin:0;">Lumen · Berea College Academic Planner</p>
    </div>
  `;
}

export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    await prisma.oTP.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch (error) {
    console.error("OTP cleanup error:", error);
  }
}
