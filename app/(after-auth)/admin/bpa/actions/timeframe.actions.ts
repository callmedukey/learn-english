"use server";

import { revalidatePath } from "next/cache";

import { BPASeason } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

export async function createTimeframeAction(formData: FormData) {
  try {
    const year = parseInt(formData.get("year") as string, 10);
    const startMonth = formData.get("startDate") as string; // Format: "2025-05"
    const endMonth = formData.get("endDate") as string; // Format: "2026-01"

    // Get semester dates
    const springSt = formData.get("springSt") as string;
    const springEnd = formData.get("springEnd") as string;
    const summerSt = formData.get("summerSt") as string;
    const summerEnd = formData.get("summerEnd") as string;
    const fallSt = formData.get("fallSt") as string;
    const fallEnd = formData.get("fallEnd") as string;
    const winterSt = formData.get("winterSt") as string;
    const winterEnd = formData.get("winterEnd") as string;

    if (!year || !startMonth || !endMonth) {
      return { success: false, error: "Missing required fields" };
    }

    if (!springSt || !springEnd || !summerSt || !summerEnd || !fallSt || !fallEnd || !winterSt || !winterEnd) {
      return { success: false, error: "All semester dates are required" };
    }

    // Convert month strings to dates
    // Start date: First day of the start month
    const [startYear, startMonthNum] = startMonth.split("-").map(Number);
    const startDate = new Date(startYear, startMonthNum - 1, 1);

    // End date: Last day of the end month
    const [endYear, endMonthNum] = endMonth.split("-").map(Number);
    const endDate = new Date(endYear, endMonthNum, 0); // Day 0 = last day of previous month

    // Validation
    if (endDate <= startDate) {
      return { success: false, error: "End date must be after start date" };
    }

    // Create timeframe with semesters
    await prisma.bPATimeframe.create({
      data: {
        year,
        startDate,
        endDate,
        semesters: {
          create: [
            {
              season: BPASeason.SPRING,
              startDate: new Date(springSt),
              endDate: new Date(springEnd),
            },
            {
              season: BPASeason.SUMMER,
              startDate: new Date(summerSt),
              endDate: new Date(summerEnd),
            },
            {
              season: BPASeason.FALL,
              startDate: new Date(fallSt),
              endDate: new Date(fallEnd),
            },
            {
              season: BPASeason.WINTER,
              startDate: new Date(winterSt),
              endDate: new Date(winterEnd),
            },
          ],
        },
      },
    });

    revalidatePath("/admin/bpa");
    return { success: true };
  } catch (error) {
    console.error("Error creating timeframe:", error);
    return { success: false, error: "Failed to create timeframe" };
  }
}

export async function updateTimeframeAction(
  timeframeId: string,
  formData: FormData
) {
  try {
    const year = parseInt(formData.get("year") as string, 10);
    const startMonth = formData.get("startDate") as string;
    const endMonth = formData.get("endDate") as string;

    // Get semester dates
    const springSt = formData.get("springSt") as string;
    const springEnd = formData.get("springEnd") as string;
    const summerSt = formData.get("summerSt") as string;
    const summerEnd = formData.get("summerEnd") as string;
    const fallSt = formData.get("fallSt") as string;
    const fallEnd = formData.get("fallEnd") as string;
    const winterSt = formData.get("winterSt") as string;
    const winterEnd = formData.get("winterEnd") as string;

    if (!year || !startMonth || !endMonth) {
      return { success: false, error: "Missing required fields" };
    }

    if (!springSt || !springEnd || !summerSt || !summerEnd || !fallSt || !fallEnd || !winterSt || !winterEnd) {
      return { success: false, error: "All semester dates are required" };
    }

    // Convert month strings to dates
    const [startYear, startMonthNum] = startMonth.split("-").map(Number);
    const startDate = new Date(startYear, startMonthNum - 1, 1);

    const [endYear, endMonthNum] = endMonth.split("-").map(Number);
    const endDate = new Date(endYear, endMonthNum, 0);

    // Validation
    if (endDate <= startDate) {
      return { success: false, error: "End date must be after start date" };
    }

    // Update timeframe and upsert semesters
    await prisma.bPATimeframe.update({
      where: { id: timeframeId },
      data: {
        year,
        startDate,
        endDate,
      },
    });

    // Upsert semesters (update if exists, create if not)
    const seasons = [
      { season: BPASeason.SPRING, start: springSt, end: springEnd },
      { season: BPASeason.SUMMER, start: summerSt, end: summerEnd },
      { season: BPASeason.FALL, start: fallSt, end: fallEnd },
      { season: BPASeason.WINTER, start: winterSt, end: winterEnd },
    ];

    for (const { season, start, end } of seasons) {
      await prisma.bPASemester.upsert({
        where: {
          timeframeId_season: {
            timeframeId,
            season,
          },
        },
        update: {
          startDate: new Date(start),
          endDate: new Date(end),
        },
        create: {
          timeframeId,
          season,
          startDate: new Date(start),
          endDate: new Date(end),
        },
      });
    }

    revalidatePath("/admin/bpa");
    return { success: true };
  } catch (error) {
    console.error("Error updating timeframe:", error);
    return { success: false, error: "Failed to update timeframe" };
  }
}

export async function deleteTimeframeAction(timeframeId: string) {
  try {
    await prisma.bPATimeframe.delete({
      where: { id: timeframeId },
    });

    revalidatePath("/admin/bpa");
    return { success: true };
  } catch (error) {
    console.error("Error deleting timeframe:", error);
    return { success: false, error: "Failed to delete timeframe" };
  }
}
