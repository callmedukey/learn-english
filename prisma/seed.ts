import bcrypt from "bcryptjs";

import { Role, Gender } from "./generated/prisma";
import { prisma } from "./prisma-client";

export const seed = async () => {
  try {
    const korea = await prisma.country.findFirst({
      where: {
        name: "South Korea",
      },
    });

    await prisma.user.upsert({
      where: {
        email: "admin2@readingchamp.com",
      },
      update: {
        password: await bcrypt.hash("admin2025@@@", 10),
        countryId: korea?.id,
        gender: Gender.Male,
        birthday: new Date("2000-01-01"),
      },
      create: {
        email: "admin2@readingchamp.com",
        password: await bcrypt.hash("admin2025@@@", 10),
        nickname: "admin2",
        role: Role.ADMIN,
        countryId: korea?.id,
        gender: Gender.Male,
        birthday: new Date("2000-01-01"),
      },
    });
    // const [hasKorea, hasUser, hasAR, hasRCLevel, hasPlans] = await Promise.all([
    //   prisma.country.findFirst({
    //     where: {
    //       name: "South Korea",
    //     },
    //   }),
    //   prisma.user.findFirst(),
    //   prisma.aR.findFirst(),
    //   prisma.rCLevel.findFirst(),
    //   prisma.plan.findFirst(),
    // ]);

    // if (hasKorea) {
    //   korea = hasKorea;
    // } else {
    //   await prisma.country.createMany({
    //     data: [
    //       {
    //         name: "United States",
    //       },
    //       {
    //         name: "United Kingdom",
    //       },
    //       {
    //         name: "Philippines",
    //       },
    //       {
    //         name: "India",
    //       },
    //       {
    //         name: "China",
    //       },
    //       {
    //         name: "Japan",
    //       },
    //       {
    //         name: "Germany",
    //       },
    //       {
    //         name: "France",
    //       },

    //       {
    //         name: "Spain",
    //       },
    //       {
    //         name: "Thailand",
    //       },
    //     ],
    //   });

    //   const createdCountry = await prisma.country.create({
    //     data: {
    //       name: "South Korea",
    //     },
    //   });

    //   korea = createdCountry;
    // }

    // if (hasUser) {
    //   console.log("User already exists");
    // } else {
    //   const user = await prisma.user.create({
    //     data: {
    //       email: "admin@readingchamp.com",
    //       password: await bcrypt.hash("admin2025@@@", 10),
    //       nickname: "admin",
    //       role: Role.ADMIN,
    //       countryId: korea?.id,
    //       gender: Gender.Male,
    //       birthday: new Date("2000-01-01"),
    //     },
    //   });

    //   await prisma.user.create({
    //     data: {
    //       email: "test@readingchamp.com",
    //       password: await bcrypt.hash("test2025@@@", 10),
    //       nickname: "TESTUSER",
    //       role: Role.USER,
    //       countryId: korea?.id,
    //       gender: Gender.Male,
    //       birthday: new Date("2000-01-01"),
    //     },
    //   });

    //   console.log("User created:", user);
    //   console.log("User country:", user.countryId);
    // }

    // if (hasAR) {
    //   console.log("AR already exists");
    // } else {
    //   await prisma.aR.createMany({
    //     data: [
    //       {
    //         level: "AR Level 2",
    //         score: "2.0 ~ 2.9",
    //         stars: 1,
    //         description: "Early Reader",
    //       },
    //       {
    //         level: "AR Level 3",
    //         score: "3.0 ~ 3.9",
    //         stars: 2,
    //         description: "Developing Reader",
    //       },
    //       {
    //         level: "AR Level 4",
    //         score: "4.0 ~ 4.9",
    //         stars: 3,
    //         description: "Proficient Reader",
    //       },
    //       {
    //         level: "AR Level 5",
    //         score: "5.0 ~ 5.9",
    //         stars: 4,
    //         description: "Advanced Reader",
    //       },
    //       {
    //         level: "AR Level 6",
    //         score: "6.0 ~ 6.9",
    //         stars: 5,
    //         description: "Expert Reader",
    //       },
    //     ],
    //   });

    //   console.log("AR created");
    // }

    // if (hasRCLevel) {
    //   console.log("RC Level already exists");
    // } else {
    //   await prisma.rCLevel.createMany({
    //     data: [
    //       {
    //         level: "Beginner",
    //         relevantGrade: "Grades 1~2",
    //         stars: 1,
    //         numberOfQuestions: 5,
    //       },
    //       {
    //         level: "Intermediate",
    //         relevantGrade: "Grades 3~4",
    //         stars: 2,
    //         numberOfQuestions: 7,
    //       },
    //       {
    //         level: "Advanced",
    //         relevantGrade: "Grades 5~6",
    //         stars: 3,
    //         numberOfQuestions: 10,
    //       },
    //       {
    //         level: "Expert",
    //         relevantGrade: "Grades 7~9",
    //         stars: 4,
    //         numberOfQuestions: 10,
    //       },
    //       {
    //         level: "Master",
    //         relevantGrade: "Grades 10+",
    //         stars: 5,
    //         numberOfQuestions: 10,
    //       },
    //     ],
    //   });
    // }

    // if (hasPlans) {
    //   console.log("Subscription plans already exist");
    // } else {
    //   await prisma.plan.createMany({
    //     data: [
    //       {
    //         name: "1 Month Plan",
    //         price: 9900, // 9,900원
    //         duration: 30,
    //         description: "Access to all features for 1 month",
    //         sortOrder: 1,
    //         isActive: true,
    //       },
    //       {
    //         name: "3 Month Plan",
    //         price: 24900, // 24,900원 (약 17% 할인)
    //         duration: 90,
    //         description: "Access to all features for 3 months - Best Value!",
    //         sortOrder: 2,
    //         isActive: true,
    //       },
    //       {
    //         name: "1 Year Plan",
    //         price: 89900, // 89,900원 (약 25% 할인)
    //         duration: 365,
    //         description: "Access to all features for 1 year - Maximum Savings!",
    //         sortOrder: 3,
    //         isActive: true,
    //       },
    //     ],
    //   });

    //   console.log("Subscription plans created");
    // }
  } catch (err) {
    console.error(err);
  }
};

seed();
