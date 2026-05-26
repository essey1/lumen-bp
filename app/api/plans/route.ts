import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.plan.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      majors: true,
      minors: true,
      planType: true,
      groupId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, majors, minors, interests, careerGoals, mathPlacement, waivedCourses, planType, groupId, semesters } =
    await req.json();

  if (!semesters) {
    return NextResponse.json({ error: "Plan data is required" }, { status: 400 });
  }

  // Use raw SQL for the INSERT so we have full control over which columns are
  // referenced. Prisma's typed API always includes every schema column in both
  // the INSERT and RETURNING clauses — if groupId doesn't exist in the DB yet
  // that causes a hard error. Raw SQL lets us omit groupId entirely from the
  // main INSERT and add it later via a separate UPDATE (which fails silently
  // if the column doesn't exist yet, so the plan is never lost).
  const { randomUUID } = await import("crypto");
  const planId = randomUUID();

  const planName    = name || "My Plan";
  const majorsJson  = JSON.stringify(majors ?? []);
  const minorsJson  = JSON.stringify(minors ?? []);
  const interestsJson   = JSON.stringify(interests ?? []);
  const careerGoalsJson = JSON.stringify(careerGoals ?? []);
  const mathPlacementVal = mathPlacement ?? "none";
  const waivedJson  = JSON.stringify(waivedCourses ?? []);
  const planTypeVal = planType ?? "A";
  const semestersJson = JSON.stringify(semesters);

  await prisma.$executeRaw`
    INSERT INTO "Plan" (
      "id", "userId", "name", "majors", "minors", "interests",
      "careerGoals", "mathPlacement", "waivedCourses", "planType",
      "semesters", "createdAt", "updatedAt"
    ) VALUES (
      ${planId}, ${user.id}, ${planName},
      ${majorsJson}, ${minorsJson}, ${interestsJson},
      ${careerGoalsJson}, ${mathPlacementVal}, ${waivedJson},
      ${planTypeVal}, ${semestersJson},
      NOW(), NOW()
    )
  `;

  // Best-effort: set groupId so A/B/C plans can be linked.
  // If the column doesn't exist yet this UPDATE fails silently — the plan
  // is already saved above and will work fine without groupId.
  if (groupId) {
    try {
      await prisma.$executeRaw`
        UPDATE "Plan" SET "groupId" = ${groupId} WHERE "id" = ${planId}
      `;
    } catch { /* groupId column not in DB yet — plan saved, just not grouped */ }
  }

  return NextResponse.json({ id: planId }, { status: 201 });
}
