import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash("bereacollege", 12);

  const user = await prisma.user.upsert({
    where: { email: "mountaineer@berea.edu" },
    update: {},
    create: {
      email: "mountaineer@berea.edu",
      name: "Test Mountaineer",
      password: hashedPassword,
      otpEnabled: false, // Set to true once you have the OTP page ready
    },
  });

  console.log({ user });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });