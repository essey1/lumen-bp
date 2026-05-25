import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOTP } from "@/lib/otp"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, code, password } = await req.json()

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Email, code and password are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 })
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: { userId: user.id },
    })

    if (!otpRecord) {
      return NextResponse.json({ error: "No reset code found. Please request a new one." }, { status: 400 })
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } })
      return NextResponse.json({ error: "Reset code has expired. Please request a new one." }, { status: 400 })
    }

    const valid = await verifyOTP(code.trim(), otpRecord.hashedCode)

    if (!valid) {
      // Increment attempts
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      })
      return NextResponse.json({ error: "Invalid reset code. Please check and try again." }, { status: 400 })
    }

    // Valid — hash new password and update user, then delete OTP
    const hashedPassword = await hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    await prisma.oTP.delete({ where: { id: otpRecord.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
