import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOTP, hashOTP, getOTPExpiry, isResendAllowed } from "@/lib/otp"
import { sendOTP, cleanupExpiredOTPs } from "@/lib/email"

const isDev = process.env.NODE_ENV !== "production"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await cleanupExpiredOTPs()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existingOTP = await prisma.oTP.findFirst({
      where: { userId: user.id }
    })

    if (existingOTP) {
      if (!isResendAllowed(existingOTP.lastResendAt)) {
        return NextResponse.json(
          { error: "Please wait before requesting a new code" },
          { status: 429 }
        )
      }
      // Delete old OTP so we can generate a fresh one
      await prisma.oTP.delete({ where: { id: existingOTP.id } })
    }

    const code = generateOTP()
    const hashedCode = await hashOTP(code)

    await prisma.oTP.create({
      data: { hashedCode, userId: user.id, expiresAt: getOTPExpiry() }
    })

    await sendOTP(email, code)

    const response = NextResponse.json({
      success: true,
      ...(isDev && { devCode: code }),
    })
    response.cookies.set("otp_email", email, {
      httpOnly: true,
      secure: !isDev,
      sameSite: "lax",
      maxAge: 5 * 60,
    })

    return response
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
