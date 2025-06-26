import { prisma } from "@/prisma/prisma-client";

import MedalImagesTabs from "./medal-images-tabs";

async function getMedalImages() {
  // Get all AR and RC levels
  const [arLevels, rcLevels] = await Promise.all([
    prisma.aR.findMany({ orderBy: { stars: "asc" } }),
    prisma.rCLevel.findMany({ orderBy: { stars: "asc" } }),
  ]);

  // Get all medal images
  const medalImages = await prisma.medalImage.findMany();

  // Create a map for easy lookup
  const imageMap = new Map(
    medalImages.map((img) => [
      `${img.levelType}-${img.levelId}-${img.medalType}`,
      img,
    ]),
  );

  // Combine levels with their medal images
  const levels = [
    ...arLevels.map((level) => ({
      id: level.id,
      type: "AR" as const,
      name: `${level.level}`,
      description: level.score,
      medals: {
        GOLD: imageMap.get(`AR-${level.id}-GOLD`),
        SILVER: imageMap.get(`AR-${level.id}-SILVER`),
        BRONZE: imageMap.get(`AR-${level.id}-BRONZE`),
      },
    })),
    ...rcLevels.map((level) => ({
      id: level.id,
      type: "RC" as const,
      name: `RC ${level.level}`,
      description: level.relevantGrade,
      medals: {
        GOLD: imageMap.get(`RC-${level.id}-GOLD`),
        SILVER: imageMap.get(`RC-${level.id}-SILVER`),
        BRONZE: imageMap.get(`RC-${level.id}-BRONZE`),
      },
    })),
  ];

  return levels;
}

export default async function MedalImagesPage() {
  const levels = await getMedalImages();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Medal Images</h1>
        <p className="text-muted-foreground">
          Upload and manage medal images for each AR and RC level
        </p>
      </div>

      <MedalImagesTabs levels={levels} />
    </div>
  );
}
