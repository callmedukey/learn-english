import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    // Get all medals for the user
    const medals = await prisma.medal.findMany({
      where: { userId },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
        { medalType: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        medalType: true,
        levelType: true,
        levelId: true,
        year: true,
        month: true,
        score: true,
        createdAt: true,
      },
    });

    // Get level names and medal images
    const arLevelIds = [
      ...new Set(
        medals.filter((m) => m.levelType === "AR").map((m) => m.levelId),
      ),
    ];
    const rcLevelIds = [
      ...new Set(
        medals.filter((m) => m.levelType === "RC").map((m) => m.levelId),
      ),
    ];

    const [arLevels, rcLevels, medalImages] = await Promise.all([
      arLevelIds.length > 0
        ? prisma.aR.findMany({
            where: { id: { in: arLevelIds } },
            select: { id: true, level: true },
          })
        : [],
      rcLevelIds.length > 0
        ? prisma.rCLevel.findMany({
            where: { id: { in: rcLevelIds } },
            select: { id: true, level: true },
          })
        : [],
      prisma.medalImage.findMany({
        where: {
          OR: medals.map((m) => ({
            levelType: m.levelType,
            levelId: m.levelId,
            medalType: m.medalType,
          })),
        },
        select: {
          levelType: true,
          levelId: true,
          medalType: true,
          imageUrl: true,
        },
      }),
    ]);

    const levelMap = new Map([
      ...arLevels.map((l) => [`AR-${l.id}`, l.level] as [string, string]),
      ...rcLevels.map((l) => [`RC-${l.id}`, l.level] as [string, string]),
    ]);

    const imageMap = new Map(
      medalImages.map((img) => [
        `${img.levelType}-${img.levelId}-${img.medalType}`,
        img.imageUrl,
      ]),
    );

    // Format medals with level names and images
    const formattedMedals = medals.map((medal) => ({
      id: medal.id,
      medalType: medal.medalType,
      levelType: medal.levelType,
      levelName:
        levelMap.get(`${medal.levelType}-${medal.levelId}`) || "Unknown Level",
      year: medal.year,
      month: medal.month,
      score: medal.score,
      imageUrl:
        imageMap.get(
          `${medal.levelType}-${medal.levelId}-${medal.medalType}`,
        ) || null,
      earnedAt: medal.createdAt,
    }));

    return NextResponse.json({ medals: formattedMedals });
  } catch (error) {
    console.error("Error fetching medal history:", error);
    return NextResponse.json(
      { error: "Failed to fetch medal history" },
      { status: 500 },
    );
  }
}
