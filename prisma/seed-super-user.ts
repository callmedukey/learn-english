import bcrypt from "bcryptjs";

import { prisma } from "./prisma-client";

const SUPER_USER_EMAIL = "super@readingchamp.com";
const SUPER_USER_PASSWORD = "super2025@";

async function seedSuperUser() {
  console.log("Creating super user account...");

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: SUPER_USER_EMAIL },
  });

  if (existingUser) {
    console.log("Super user already exists. Updating password...");
    const hashedPassword = await bcrypt.hash(SUPER_USER_PASSWORD, 10);
    await prisma.user.update({
      where: { email: SUPER_USER_EMAIL },
      data: { password: hashedPassword },
    });
    console.log("Super user password updated successfully!");
  } else {
    // Hash the password
    const hashedPassword = await bcrypt.hash(SUPER_USER_PASSWORD, 10);

    // Create the super user
    await prisma.user.create({
      data: {
        email: SUPER_USER_EMAIL,
        password: hashedPassword,
        nickname: "superuser",
        birthday: new Date("2000-01-01"),
        emailVerified: new Date(),
      },
    });

    console.log("Super user created successfully!");
  }

  console.log(`Email: ${SUPER_USER_EMAIL}`);
  console.log(`Password: ${SUPER_USER_PASSWORD}`);
}

seedSuperUser()
  .catch((e) => {
    console.error("Error creating super user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
