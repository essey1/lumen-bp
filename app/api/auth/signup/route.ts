import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function isSchemaMismatchError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  const code = "code" in error && typeof error.code === "string" ? error.code : "";

  return (
    code === "P2022" ||
    message.includes("Unknown argument") ||
    message.includes("does not exist in the current database")
  );
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, major, year, bio, completedSemesters } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!email.endsWith("@berea.edu")) {
      return NextResponse.json({ error: "Only Berea College email addresses (@berea.edu) are allowed." }, { status: 400 });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ error: "Password does not meet the required strength criteria." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const baseUserData = {
      name,
      email,
      password: hashedPassword,
      otpEnabled: true,
    };

    let user;
    try {
      user = await prisma.user.create({
        data: {
          ...baseUserData,
          major: major || null,
          year: year ? parseInt(year) : null,
          bio: bio || null,
          completedSemesters: completedSemesters ? JSON.stringify(completedSemesters) : null,
        },
        select: { id: true, name: true, email: true },
      });
    } catch (error) {
      if (!isSchemaMismatchError(error)) throw error;

      console.warn("Signup profile fields are not available in the current database schema. Creating account without onboarding profile fields.");
      user = await prisma.user.create({
        data: baseUserData,
        select: { id: true, name: true, email: true },
      });
    }

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
