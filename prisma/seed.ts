import bcrypt from "bcryptjs";

import { Gender, Role } from "./generated/prisma";
import { prisma } from "./prisma-client";

export const seed = async () => {
  try {
    const user = await prisma.user.create({
      data: {
        email: "iamdevduke@gmail.com",
        password: await bcrypt.hash("gen2kbgroup@", 10),
        nickname: "devduke",
        role: Role.ADMIN,
        country: "United States",
        gender: Gender.Male,
        birthday: new Date("2000-01-01"),
      },
    });

    console.log("User created:", user);
  } catch (err) {
    console.error(err);
  }
};

seed();
