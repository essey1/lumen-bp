import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function sendOTP(email: string, code: string): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"Lumen" <${gmailUser}>`,
    to: email,
    subject: "Your Lumen verification code",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fff;">
        <div style="margin-bottom: 32px;">
          <span style="font-size: 20px; font-weight: 600; color: #000;">✦ Lumen</span>
        </div>
        <h2 style="font-size: 22px; font-weight: 700; color: #111; margin: 0 0 8px;">Your verification code</h2>
        <p style="font-size: 15px; color: #666; margin: 0 0 28px;">Use this code to verify your Lumen account. It expires in 10 minutes.</p>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
          <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #111; font-family: monospace;">${code}</span>
        </div>
        <p style="font-size: 13px; color: #999; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
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
