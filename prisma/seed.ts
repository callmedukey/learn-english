import bcrypt from "bcryptjs";

import { Gender, Role } from "./generated/prisma";
import { prisma } from "./prisma-client";

export const seed = async () => {
  try {
    await prisma.country.createMany({
      data: [
        {
          name: "United States",
        },
        {
          name: "United Kingdom",
        },
        {
          name: "Philippines",
        },
        {
          name: "India",
        },
        {
          name: "China",
        },
        {
          name: "Japan",
        },
        {
          name: "Germany",
        },
        {
          name: "France",
        },
        {
          name: "South Korea",
        },
        {
          name: "Spain",
        },
        {
          name: "Thailand",
        },
      ],
    });

    const korea = await prisma.country.findFirst({
      where: {
        name: "South Korea",
      },
    });

    const user = await prisma.user.create({
      data: {
        email: "iamdevduke@gmail.com",
        password: await bcrypt.hash("gen2kbgroup@", 10),
        nickname: "devduke",
        role: Role.ADMIN,
        countryId: korea?.id,
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
