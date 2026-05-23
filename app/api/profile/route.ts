import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const SELECT = { name: true, email: true, major: true, minor: true, year: true, bio: true, completedSemesters: true } as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: SELECT });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, major, minor, year, bio, completedSemesters } = await request.json();

  if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }
  if (year !== undefined && year !== null && (year < 1 || year > 4)) {
    return NextResponse.json({ error: "Year must be between 1 and 4" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(major !== undefined && { major: major || null }),
      ...(minor !== undefined && { minor: minor || null }),
      ...(year !== undefined && { year: year || null }),
      ...(bio !== undefined && { bio: bio || null }),
      ...(completedSemesters !== undefined && { completedSemesters: completedSemesters ? JSON.stringify(completedSemesters) : null }),
    },
    select: SELECT,
  });

  return NextResponse.json(user);
}
