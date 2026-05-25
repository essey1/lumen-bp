import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Base fields that definitely exist in every schema version
const BASE_SELECT = {
  name: true,
  email: true,
  major: true,
  minor: true,
  year: true,
  bio: true,
  completedSemesters: true,
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prismaUser = prisma.user as any;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prismaUser.findUnique({
      where: { email: session.user.email },
      select: { ...BASE_SELECT, mathPlacement: true, waivedCourses: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    // Fallback: fetch without the new fields if schema hasn't been migrated yet
    const user = await prismaUser.findUnique({
      where: { email: session.user.email },
      select: BASE_SELECT,
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ ...user, mathPlacement: "none", waivedCourses: null });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, major, minor, year, bio, completedSemesters, mathPlacement, waivedCourses } = await request.json();

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }
  if (year !== undefined && year !== null && (year < 1 || year > 4)) {
    return NextResponse.json({ error: "Year must be between 1 and 4" }, { status: 400 });
  }

  try {
    const user = await prismaUser.update({
      where: { email: session.user.email },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(major !== undefined && { major: major || null }),
        ...(minor !== undefined && { minor: minor || null }),
        ...(year !== undefined && { year: year || null }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(completedSemesters !== undefined && { completedSemesters: completedSemesters ? JSON.stringify(completedSemesters) : null }),
        ...(mathPlacement !== undefined && { mathPlacement: mathPlacement || "none" }),
        ...(waivedCourses !== undefined && { waivedCourses: waivedCourses ? JSON.stringify(waivedCourses) : null }),
      },
      select: { ...BASE_SELECT, mathPlacement: true, waivedCourses: true },
    });
    return NextResponse.json(user);
  } catch {
    // Fallback without new fields
    const user = await prismaUser.update({
      where: { email: session.user.email },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(major !== undefined && { major: major || null }),
        ...(minor !== undefined && { minor: minor || null }),
        ...(year !== undefined && { year: year || null }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(completedSemesters !== undefined && { completedSemesters: completedSemesters ? JSON.stringify(completedSemesters) : null }),
      },
      select: BASE_SELECT,
    });
    return NextResponse.json({ ...user, mathPlacement: "none", waivedCourses: null });
  }
}
