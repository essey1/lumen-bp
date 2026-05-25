import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateOTP, hashOTP, getOTPExpiry, isResendAllowed } from "@/lib/otp"
import { sendPasswordResetOTP } from "@/lib/email"
import { cleanupExpiredOTPs } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    await cleanupExpiredOTPs()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    })

    // Always return success to avoid leaking which emails are registered
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const existingOTP = await prisma.oTP.findFirst({
      where: { userId: user.id },
    })

    if (existingOTP) {
      if (!isResendAllowed(existingOTP.lastResendAt)) {
        return NextResponse.json(
          { error: "Please wait before requesting a new code" },
          { status: 429 }
        )
      }
      await prisma.oTP.delete({ where: { id: existingOTP.id } })
    }

    const code = generateOTP()
    const hashedCode = await hashOTP(code)

    await prisma.oTP.create({
      data: {
        hashedCode,
        userId: user.id,
        expiresAt: getOTPExpiry(),
      },
    })

    await sendPasswordResetOTP(normalizedEmail, code, user.name ?? undefined)

    const response = NextResponse.json({ success: true })
    response.cookies.set("reset_email", normalizedEmail, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10 min
    })

    return response
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
