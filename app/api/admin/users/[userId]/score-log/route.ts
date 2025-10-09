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

    // Fetch RC scores with details
    const rcScores = await prisma.rCQuestionCompleted.findMany({
      where: { userId },
      include: {
        RCQuestion: {
          include: {
            RCQuestionSet: {
              include: {
                RCKeyword: {
                  include: {
                    RCLevel: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Limit to last 200 entries
    });

    // Fetch Novel scores with details
    const novelScores = await prisma.novelQuestionCompleted.findMany({
      where: { userId },
      include: {
        novelQuestion: {
          include: {
            novelQuestionSet: {
              include: {
                novelChapter: {
                  include: {
                    novel: {
                      include: {
                        AR: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Limit to last 200 entries
    });

    // Map RC scores to ScoreLogEntry format
    const rcLogs: ScoreLogEntry[] = rcScores.map((score) => ({
      id: score.id,
      score: score.score,
      source: "RC" as const,
      sourceDetails: `${score.RCQuestion.RCQuestionSet.RCKeyword?.RCLevel?.level || "Unknown Level"} - ${score.RCQuestion.RCQuestionSet.RCKeyword?.name || "Unknown Keyword"}`,
      createdAt: score.createdAt,
      questionText: score.RCQuestion.question,
      selectedAnswer: score.selectedAnswer,
      correctAnswer: score.RCQuestion.answer,
      isCorrect: score.isCorrect,
      isRetry: score.isRetry,
      isTimedOut: score.isTimedOut,
      explanation: score.RCQuestion.explanation,
    }));

    // Map Novel scores to ScoreLogEntry format
    const novelLogs: ScoreLogEntry[] = novelScores.map((score) => ({
      id: score.id,
      score: score.score,
      source: "Novel" as const,
      sourceDetails: `${score.novelQuestion.novelQuestionSet.novelChapter?.novel?.title || "Unknown Novel"} - Chapter ${score.novelQuestion.novelQuestionSet.novelChapter?.orderNumber || "?"}`,
      createdAt: score.createdAt,
      questionText: score.novelQuestion.question,
      selectedAnswer: score.selectedAnswer,
      correctAnswer: score.novelQuestion.answer,
      isCorrect: score.isCorrect,
      isRetry: score.isRetry,
      isTimedOut: score.isTimedOut,
      explanation: score.novelQuestion.explanation,
    }));

    // Combine and sort by createdAt (latest first)
    const allLogs = [...rcLogs, ...novelLogs].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Apply pagination
    const total = allLogs.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLogs = allLogs.slice(startIndex, endIndex);

    return NextResponse.json({
      logs: paginatedLogs,
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
