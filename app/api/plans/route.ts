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

  const plan = await prisma.plan.create({
    data: {
      userId: user.id,
      name: name || "My Plan",
      majors: JSON.stringify(majors ?? []),
      minors: JSON.stringify(minors ?? []),
      interests: JSON.stringify(interests ?? []),
      careerGoals: JSON.stringify(careerGoals ?? []),
      mathPlacement: mathPlacement ?? "none",
      waivedCourses: JSON.stringify(waivedCourses ?? []),
      planType: planType ?? "A",
      groupId: groupId ?? null,
      semesters: JSON.stringify(semesters),
    },
  });

  return NextResponse.json({ id: plan.id }, { status: 201 });
}
