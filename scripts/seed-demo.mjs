import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "arayae@berea.edu";
  const password = "demo1234";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Update profile fields in case they're missing
    await prisma.user.update({
      where: { email },
      data: {
        name: "Alex Johnson",
        major: "Computer and Information Science",
        year: 2,
        bio: "Second-year CS student passionate about building tools that help people. Interested in software engineering and human-computer interaction.",
      },
    });
    console.log("Demo account already exists — profile updated.");
    return;
  }

  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      name: "Alex Johnson",
      email,
      password: hashedPassword,
      otpEnabled: true,
      major: "Computer and Information Science",
      year: 2,
      bio: "Second-year CS student passionate about building tools that help people. Interested in software engineering and human-computer interaction.",
    },
  });

  console.log("Demo account created:");
  console.log("  Email:    demo@berea.edu");
  console.log("  Password: demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
