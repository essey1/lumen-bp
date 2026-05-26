import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

type FullPlanRow = {
  id: string; userId: string; name: string;
  majors: string; minors: string; interests: string;
  careerGoals: string; mathPlacement: string; waivedCourses: string;
  planType: string; semesters: string;
  createdAt: Date; updatedAt: Date;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Raw SQL — no groupId reference so it works regardless of DB migration state
  const rows = await prisma.$queryRaw<FullPlanRow[]>`
    SELECT "id", "userId", "name", "majors", "minors", "interests",
           "careerGoals", "mathPlacement", "waivedCourses", "planType",
           "semesters", "createdAt", "updatedAt"
    FROM "Plan" WHERE "id" = ${id}
  `;
  const plan = rows[0];

  if (!plan || plan.userId !== user.id) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...plan,
    majors:        JSON.parse(plan.majors),
    minors:        JSON.parse(plan.minors),
    interests:     JSON.parse(plan.interests),
    careerGoals:   JSON.parse(plan.careerGoals),
    waivedCourses: JSON.parse(plan.waivedCourses),
    semesters:     JSON.parse(plan.semesters),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Ownership check — only selects id/userId, never touches groupId
  const [existing] = await prisma.$queryRaw<{ id: string; userId: string }[]>`
    SELECT "id", "userId" FROM "Plan" WHERE "id" = ${id}
  `;
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const { name, semesters } = await req.json();
  const now = new Date().toISOString();

  if (name !== undefined && semesters !== undefined) {
    const semJson = JSON.stringify(semesters);
    await prisma.$executeRaw`
      UPDATE "Plan" SET "name" = ${name}, "semesters" = ${semJson}, "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;
  } else if (name !== undefined) {
    await prisma.$executeRaw`UPDATE "Plan" SET "name" = ${name}, "updatedAt" = NOW() WHERE "id" = ${id}`;
  } else if (semesters !== undefined) {
    const semJson = JSON.stringify(semesters);
    await prisma.$executeRaw`UPDATE "Plan" SET "semesters" = ${semJson}, "updatedAt" = NOW() WHERE "id" = ${id}`;
  }

  return NextResponse.json({ id, name: name ?? existing.id, updatedAt: now });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await prisma.$queryRaw<{ id: string; userId: string }[]>`
    SELECT "id", "userId" FROM "Plan" WHERE "id" = ${id}
  `;
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Raw DELETE — no RETURNING clause, no groupId reference
  await prisma.$executeRaw`DELETE FROM "Plan" WHERE "id" = ${id}`;
  return NextResponse.json({ success: true });
}
