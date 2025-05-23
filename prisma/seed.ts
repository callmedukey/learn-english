import bcrypt from "bcryptjs";

import { Gender, Role } from "./generated/prisma";
import { prisma } from "./prisma-client";

export const seed = async () => {
  try {
    const [korea, hasUser, hasAR] = await Promise.all([
      prisma.country.findFirst({
        where: {
          name: "South Korea",
        },
      }),
      prisma.user.findFirst(),
      prisma.aR.findFirst(),
    ]);

    if (korea) {
      console.log("Country already exists");
    } else {
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
    }

    if (hasUser) {
      console.log("User already exists");
    } else {
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
    }

    if (hasAR) {
      console.log("AR already exists");
    } else {
      await prisma.aR.createMany({
        data: [
          {
            level: "AR Level 2",
            score: "2.0 ~ 2.9",
            relevantGrade: "Grade 1~2",
            stars: 1,
            description: "Early Reader",
          },
          {
            level: "AR Level 3",
            score: "3.0 ~ 3.9",
            relevantGrade: "Grade 3~4",
            stars: 2,
            description: "Developing Reader",
          },
          {
            level: "AR Level 4",
            score: "4.0 ~ 4.9",
            relevantGrade: "Grade 5~6",
            stars: 3,
            description: "Proficient Reader",
          },
          {
            level: "AR Level 5",
            score: "5.0 ~ 5.9",
            relevantGrade: "Grade 7~8",
            stars: 4,
            description: "Advanced Reader",
          },
          {
            level: "AR Level 6",
            score: "6.0 ~ 6.9",
            relevantGrade: "Grade 9+",
            stars: 5,
            description: "Expert Reader",
          },
        ],
      });

      console.log("AR created");
    }
  } catch (err) {
    console.error(err);
  }
};

seed();
