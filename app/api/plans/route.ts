import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({ where: { email: session.user.email } });
}

type PlanListRow = {
  id: string;
  name: string;
  majors: string;
  minors: string;
  planType: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Raw SQL — never references groupId so it works regardless of DB migration state
  const basePlans = await prisma.$queryRaw<PlanListRow[]>`
    SELECT "id", "name", "majors", "minors", "planType", "createdAt", "updatedAt"
    FROM "Plan"
    WHERE "userId" = ${user.id}
    ORDER BY "updatedAt" DESC
  `;

  // Best-effort: fetch groupId for A/B/C grouping. Fails silently if column missing.
  const groupMap = new Map<string, string | null>();
  try {
    const groups = await prisma.$queryRaw<{ id: string; groupId: string | null }[]>`
      SELECT "id", "groupId" FROM "Plan" WHERE "userId" = ${user.id}
    `;
    for (const g of groups) groupMap.set(g.id, g.groupId);
  } catch { /* groupId column not in DB yet — plans still load, just not grouped */ }

  const plans = basePlans.map(p => ({ ...p, groupId: groupMap.get(p.id) ?? null }));
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, majors, minors, interests, careerGoals, mathPlacement, waivedCourses, semesters } =
    await req.json();

  if (!semesters) {
    return NextResponse.json({ error: "Plan data is required" }, { status: 400 });
  }

  const { randomUUID } = await import("crypto");
  const planId = randomUUID();

  const planName        = name || "My Plan";
  const majorsJson      = JSON.stringify(majors ?? []);
  const minorsJson      = JSON.stringify(minors ?? []);
  const interestsJson   = JSON.stringify(interests ?? []);
  const careerGoalsJson = JSON.stringify(careerGoals ?? []);
  const mathVal         = mathPlacement ?? "none";
  const waivedJson      = JSON.stringify(waivedCourses ?? []);
  // "ABC" marks this as a multi-variant plan (semesters is { A, B, C })
  const planTypeVal     = "ABC";
  const semestersJson   = JSON.stringify(semesters);
  const userId          = user.id;

  // Raw INSERT — zero reference to groupId so it never fails on missing column
  await prisma.$executeRaw`
    INSERT INTO "Plan" (
      "id", "userId", "name", "majors", "minors", "interests",
      "careerGoals", "mathPlacement", "waivedCourses", "planType",
      "semesters", "createdAt", "updatedAt"
    ) VALUES (
      ${planId}, ${userId}, ${planName},
      ${majorsJson}, ${minorsJson}, ${interestsJson},
      ${careerGoalsJson}, ${mathVal}, ${waivedJson},
      ${planTypeVal}, ${semestersJson},
      NOW(), NOW()
    )
  `;

  return NextResponse.json({ id: planId }, { status: 201 });
}
