import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyOTP } from "@/lib/otp"
import { cleanupExpiredOTPs } from "@/lib/email"
import type { NextRequest } from "next/server"

const MAX_ATTEMPTS = 3

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      )
    }

    // Get email from HTTP-only cookie
    const email = req.cookies.get("otp_email")?.value
    if (!email) {
      return NextResponse.json(
        { error: "Email cookie not found. Please request a new code." },
        { status: 401 }
      )
    }

    // Cleanup expired OTPs
    await cleanupExpiredOTPs()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() }
      }
    })

    if (!otp) {
      return NextResponse.json(
        { error: "No valid OTP found. Please request a new code." },
        { status: 401 }
      )
    }

    // Check if max attempts exceeded
    if (otp.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      )
    }

    // Verify hashed OTP
    const isValid = await verifyOTP(code, otp.hashedCode)

    if (!isValid) {
      // Increment attempts
      const updatedOTP = await prisma.oTP.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 }
      })

      const remainingAttempts = MAX_ATTEMPTS - updatedOTP.attempts
      return NextResponse.json(
        {
          error: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? "s" : ""} remaining.`
        },
        { status: 401 }
      )
    }

    // Delete OTP after successful verification
    await prisma.oTP.delete({ where: { id: otp.id } })

    const response = NextResponse.json({ success: true, userId: user.id })
    
    // Clear the OTP email cookie
    response.cookies.delete("otp_email")

    return response
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    )
  }
}
