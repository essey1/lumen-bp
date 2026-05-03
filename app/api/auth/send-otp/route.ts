import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOTP, hashOTP, getOTPExpiry, isResendAllowed } from "@/lib/otp"
import { sendOTP, cleanupExpiredOTPs } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Cleanup expired OTPs
    await cleanupExpiredOTPs()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user already has an OTP (for rate limiting)
    const existingOTP = await prisma.otp.findFirst({
      where: { userId: user.id }
    })

    if (existingOTP) {
      // Check resend cooldown
      if (!isResendAllowed(existingOTP.lastResendAt)) {
        return NextResponse.json(
          { error: "Please wait before requesting a new code" },
          { status: 429 }
        )
      }

      // Update existing OTP with new attempts timestamp
      await prisma.otp.update({
        where: { id: existingOTP.id },
        data: {
          lastResendAt: new Date(),
          attempts: 0 // Reset attempts on resend
        }
      })
    } else {
      // Create new OTP
      const code = generateOTP()
      const hashedCode = await hashOTP(code)

      await prisma.otp.create({
        data: {
          hashedCode,
          userId: user.id,
          expiresAt: getOTPExpiry()
        }
      })

      await sendOTP(email, code)
    }

    // Create a secure cookie with user email (HTTP-only)
    const response = NextResponse.json({ success: true })
    response.cookies.set("otp_email", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 5 * 60 // 5 minutes
    })

    return response
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    )
  }
}
