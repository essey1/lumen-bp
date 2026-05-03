import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

/**
 * Verify credentials and check if OTP is required
 * Returns: { success: boolean, otpRequired: boolean, email: string }
 */

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      otpRequired: user.otpEnabled,
      email: user.email
    })
  } catch (error) {
    console.error("Credentials verification error:", error)
    return NextResponse.json(
      { error: "Failed to verify credentials" },
      { status: 500 }
    )
  }
}
