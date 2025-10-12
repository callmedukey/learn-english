import { NextRequest, NextResponse } from "next/server";

import { ScoreLogEntry } from "@/app/(after-auth)/admin/types/score-log.types";
import { prisma } from "@/prisma/prisma-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Math.min(Number(searchParams.get("pageSize")) || 20, 50); // Max 50 per page
    const sourceFilter = searchParams.get("source") as "RC" | "Novel" | "BPA" | null;

    // Build where clause
    const whereClause: { userId: string; source?: string } = { userId };
    if (sourceFilter) {
      whereClause.source = sourceFilter;
    }

    // Get total count
    const total = await prisma.scoreTransaction.count({
      where: whereClause,
    });

    // Fetch transactions with pagination
    const transactions = await prisma.scoreTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Map to ScoreLogEntry format
    const logs: ScoreLogEntry[] = transactions.map((transaction) => {
      // Build sourceDetails from available fields
      let sourceDetails = "";
      if (transaction.source === "RC") {
        sourceDetails = `${transaction.levelInfo || "Unknown Level"} - ${transaction.keywordInfo || "Unknown Keyword"}`;
      } else if (transaction.source === "Novel") {
        sourceDetails = `${transaction.novelInfo || "Unknown Novel"} - ${transaction.chapterInfo || "Unknown Chapter"}`;
      } else if (transaction.source === "BPA") {
        sourceDetails = [
          transaction.levelInfo,
          transaction.novelInfo,
          transaction.unitInfo,
          transaction.chapterInfo,
        ]
          .filter(Boolean)
          .join(" - ");
      }

      return {
        id: transaction.id,
        score: transaction.score,
        source: transaction.source as "RC" | "Novel" | "BPA",
        sourceDetails,
        createdAt: transaction.createdAt,
        questionText: transaction.questionText,
        selectedAnswer: transaction.selectedAnswer,
        correctAnswer: transaction.correctAnswer,
        isCorrect: transaction.isCorrect,
        isRetry: transaction.isRetry,
        isTimedOut: transaction.isTimedOut,
        explanation: transaction.explanation,
      };
    });

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching score log:", error);
    return NextResponse.json(
      { error: "Failed to fetch score log" },
      { status: 500 }
    );
  }
}
