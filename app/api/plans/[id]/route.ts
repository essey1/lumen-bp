import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const plan = await prisma.plan.findUnique({ where: { id } });

  if (!plan || plan.userId !== user.id) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...plan,
    majors: JSON.parse(plan.majors),
    minors: JSON.parse(plan.minors),
    interests: JSON.parse(plan.interests),
    careerGoals: JSON.parse(plan.careerGoals),
    waivedCourses: JSON.parse(plan.waivedCourses),
    semesters: JSON.parse(plan.semesters),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const plan = await prisma.plan.findUnique({ where: { id } });

  if (!plan || plan.userId !== user.id) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const { name, semesters } = await req.json();

  const updated = await prisma.plan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(semesters !== undefined && { semesters: JSON.stringify(semesters) }),
    },
  });

  return NextResponse.json({ id: updated.id, name: updated.name, updatedAt: updated.updatedAt });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const plan = await prisma.plan.findUnique({ where: { id } });

  if (!plan || plan.userId !== user.id) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
