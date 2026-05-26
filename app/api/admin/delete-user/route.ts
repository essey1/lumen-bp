import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ONE-TIME admin route — REMOVE THIS FILE after use
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get("secret")
  const email  = searchParams.get("email")

  if (secret !== "lumen-admin-2024" || !email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await prisma.user.delete({ where: { email } })
  return NextResponse.json({ success: true, deleted: email })
}
