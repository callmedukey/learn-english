/**
 * Seed BPA Test Data
 * Creates a test novel with clearly marked correct answers for easy testing
 *
 * Run: tsx prisma/seed-bpa-test.ts
 */

import { prisma } from "./prisma-client";

const BPA_LEVEL_2_ID = "22b472ef-f35c-4923-9368-9b0415c98c2b";

async function seedBPATestData() {
  console.log("=== Starting BPA Test Data Seeding ===");

  try {
    // 1. Create or find test novel
    const testNovel = await prisma.bPANovel.upsert({
      where: {
        id: "test-novel-auto-grade-001",
      },
      update: {},
      create: {
        id: "test-novel-auto-grade-001",
        title: "🧪 TEST NOVEL - Auto Graded",
        description: "Test novel for automated testing. All correct answers are marked with (Answer).",
        bpaLevelId: BPA_LEVEL_2_ID,
        hidden: false,
        comingSoon: false,
        locked: false,
      },
    });
    console.log(`✓ Test novel created: ${testNovel.title}`);

    // 2. Create test chapter
    const testChapter = await prisma.bPAChapter.upsert({
      where: {
        id: "test-chapter-auto-grade-001",
      },
      update: {},
      create: {
        id: "test-chapter-auto-grade-001",
        novelId: testNovel.id,
        unitId: null, // No unit
        orderNumber: 999, // High number to avoid conflicts
        title: "Test Chapter 1",
        description: "Auto-graded test questions. Look for (Answer) prefix!",
        isFree: true,
      },
    });
    console.log(`✓ Test chapter created: ${testChapter.title}`);

    // 3. Create question set
    const questionSet = await prisma.bPAQuestionSet.upsert({
      where: {
        id: "test-questionset-auto-grade-001",
      },
      update: {},
      create: {
        id: "test-questionset-auto-grade-001",
        chapterId: testChapter.id,
        instructions: "Select the choice marked with (Answer). Scores are in increments of 1000 for easy testing.",
        active: true,
      },
    });
    console.log(`✓ Question set created`);

    // 4. Create 10 test questions with clearly marked answers
    const questions = [
      {
        id: "test-q-001",
        question: "Question 1: What is the capital of France?",
        choices: ["(Answer) Paris", "London", "Berlin", "Madrid"],
        answer: "(Answer) Paris",
        score: 1000,
      },
      {
        id: "test-q-002",
        question: "Question 2: What is 2 + 2?",
        choices: ["3", "(Answer) 4", "5", "6"],
        answer: "(Answer) 4",
        score: 2000,
      },
      {
        id: "test-q-003",
        question: "Question 3: What color is the sky?",
        choices: ["Red", "Green", "(Answer) Blue", "Yellow"],
        answer: "(Answer) Blue",
        score: 3000,
      },
      {
        id: "test-q-004",
        question: "Question 4: How many days in a week?",
        choices: ["5", "6", "(Answer) 7", "8"],
        answer: "(Answer) 7",
        score: 4000,
      },
      {
        id: "test-q-005",
        question: "Question 5: What is the opposite of hot?",
        choices: ["Warm", "Cool", "(Answer) Cold", "Freezing"],
        answer: "(Answer) Cold",
        score: 5000,
      },
      {
        id: "test-q-006",
        question: "Question 6: What is 10 - 3?",
        choices: ["6", "(Answer) 7", "8", "9"],
        answer: "(Answer) 7",
        score: 1000,
      },
      {
        id: "test-q-007",
        question: "Question 7: What shape has 4 equal sides?",
        choices: ["Triangle", "Rectangle", "(Answer) Square", "Pentagon"],
        answer: "(Answer) Square",
        score: 2000,
      },
      {
        id: "test-q-008",
        question: "Question 8: What is the first letter of the alphabet?",
        choices: ["(Answer) A", "B", "C", "D"],
        answer: "(Answer) A",
        score: 3000,
      },
      {
        id: "test-q-009",
        question: "Question 9: How many fingers on one hand?",
        choices: ["4", "(Answer) 5", "6", "7"],
        answer: "(Answer) 5",
        score: 4000,
      },
      {
        id: "test-q-010",
        question: "Question 10: What comes after 9?",
        choices: ["8", "9", "(Answer) 10", "11"],
        answer: "(Answer) 10",
        score: 5000,
      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const existing = await prisma.bPAQuestion.findUnique({
        where: { id: q.id },
      });

      if (existing) {
        await prisma.bPAQuestion.update({
          where: { id: q.id },
          data: {
            question: q.question,
            choices: q.choices,
            answer: q.answer,
            score: q.score,
            explanation: `The correct answer was ${q.answer}. This is a test question.`,
            timeLimit: 60,
            orderNumber: i + 1,
          },
        });
        updatedCount++;
      } else {
        await prisma.bPAQuestion.create({
          data: {
            id: q.id,
            questionSetId: questionSet.id,
            orderNumber: i + 1,
            question: q.question,
            choices: q.choices,
            answer: q.answer,
            explanation: `The correct answer was ${q.answer}. This is a test question.`,
            score: q.score,
            timeLimit: 60,
          },
        });
        createdCount++;
      }
    }

    console.log(`✓ Questions: ${createdCount} created, ${updatedCount} updated`);

    console.log("\n=== BPA Test Data Seeding Complete ===");
    console.log("Novel ID:", testNovel.id);
    console.log("Chapter ID:", testChapter.id);
    console.log("Question Set ID:", questionSet.id);
    console.log("\nTo test:");
    console.log("1. Navigate to BPA Level 2");
    console.log("2. Find '🧪 TEST NOVEL - Auto Graded'");
    console.log("3. Start 'Test Chapter 1'");
    console.log("4. Select answers with (Answer) prefix");
    console.log("5. Check server logs for MonthlyBPAScore debug output");
    console.log("\nScores: 1000, 2000, 3000, 4000, 5000, 1000, 2000, 3000, 4000, 5000");
    console.log("Total possible: 30,000 points");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedBPATestData()
  .then(() => {
    console.log("\n✅ Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
