/**
 * Migration script to populate BPASemester table and link existing data
 *
 * This script:
 * 1. Creates 4 semesters for each existing timeframe (evenly distributed)
 * 2. Links existing BPAUserLevelAssignment records to semesters
 * 3. Links existing BPAUserLevelAssignmentHistory records to semesters
 * 4. Links existing BPANovelSemesterAssignment records to semesters
 */

import { prisma } from "../prisma-client";
import { BPASeason } from "../generated/prisma";

async function main() {
  console.log("Starting BPASemester migration...");

  // Get all existing timeframes
  const timeframes = await prisma.bPATimeframe.findMany({
    orderBy: { startDate: "asc" },
  });

  console.log(`Found ${timeframes.length} timeframes`);

  for (const timeframe of timeframes) {
    console.log(`Processing timeframe ${timeframe.year} (${timeframe.id})`);

    // Calculate semester date ranges (evenly distributed)
    const startDate = new Date(timeframe.startDate);
    const endDate = new Date(timeframe.endDate);
    const totalDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysPerSemester = Math.floor(totalDays / 4);

    const seasons: BPASeason[] = ["SPRING", "SUMMER", "FALL", "WINTER"];
    const semesterIds: Record<BPASeason, string> = {} as any;

    // Create 4 semesters for this timeframe
    for (let i = 0; i < 4; i++) {
      const season = seasons[i];
      const semesterStart = new Date(startDate);
      semesterStart.setDate(semesterStart.getDate() + i * daysPerSemester);

      const semesterEnd = new Date(semesterStart);
      if (i === 3) {
        // Last semester ends on timeframe end date
        semesterEnd.setTime(endDate.getTime());
      } else {
        semesterEnd.setDate(semesterEnd.getDate() + daysPerSemester - 1);
      }

      // Create or get existing semester
      const semester = await prisma.bPASemester.upsert({
        where: {
          timeframeId_season: {
            timeframeId: timeframe.id,
            season: season,
          },
        },
        update: {},
        create: {
          timeframeId: timeframe.id,
          season: season,
          startDate: semesterStart,
          endDate: semesterEnd,
        },
      });

      semesterIds[season] = semester.id;
      console.log(
        `  Created semester ${season}: ${semesterStart.toISOString().split("T")[0]} to ${semesterEnd.toISOString().split("T")[0]}`
      );
    }

    // Update existing BPAUserLevelAssignment records
    for (const season of seasons) {
      const assignmentsUpdated = await prisma.bPAUserLevelAssignment.updateMany(
        {
          where: {
            timeframeId: timeframe.id,
            season: season,
            semesterId: null,
          },
          data: {
            semesterId: semesterIds[season],
          },
        }
      );
      if (assignmentsUpdated.count > 0) {
        console.log(
          `  Updated ${assignmentsUpdated.count} user level assignments for ${season}`
        );
      }
    }

    // Update existing BPAUserLevelAssignmentHistory records
    for (const season of seasons) {
      const historyUpdated =
        await prisma.bPAUserLevelAssignmentHistory.updateMany({
          where: {
            timeframeId: timeframe.id,
            season: season,
            semesterId: null,
          },
          data: {
            semesterId: semesterIds[season],
          },
        });
      if (historyUpdated.count > 0) {
        console.log(
          `  Updated ${historyUpdated.count} assignment history records for ${season}`
        );
      }
    }

    // Update existing BPANovelSemesterAssignment records
    for (const season of seasons) {
      const novelAssignmentsUpdated =
        await prisma.bPANovelSemesterAssignment.updateMany({
          where: {
            timeframeId: timeframe.id,
            season: season,
            semesterId: null,
          },
          data: {
            semesterId: semesterIds[season],
          },
        });
      if (novelAssignmentsUpdated.count > 0) {
        console.log(
          `  Updated ${novelAssignmentsUpdated.count} novel semester assignments for ${season}`
        );
      }
    }

    // Note: BPAScore doesn't have any records to migrate based on earlier check
    console.log(`Completed timeframe ${timeframe.year}`);
  }

  console.log("Migration completed successfully!");
}

main()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
