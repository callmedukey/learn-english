"use client";

import { Upload } from "lucide-react";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedalType } from "@/prisma/generated/prisma";

import UploadMedalImageDialog from "./upload-medal-image-dialog";

interface MedalImageLevel {
  id: string;
  type: "AR" | "RC";
  name: string;
  description?: string | null;
  medals: {
    GOLD?: { imageUrl: string; width: number; height: number };
    SILVER?: { imageUrl: string; width: number; height: number };
    BRONZE?: { imageUrl: string; width: number; height: number };
  };
}

interface MedalImagesTabsProps {
  levels: MedalImageLevel[];
}

const medalTypes: MedalType[] = ["GOLD", "SILVER", "BRONZE"];
const medalColors = {
  GOLD: "text-yellow-600",
  SILVER: "text-gray-400",
  BRONZE: "text-orange-600",
};

export default function MedalImagesTabs({ levels }: MedalImagesTabsProps) {
  const arLevels = levels.filter((level) => level.type === "AR");
  const rcLevels = levels.filter((level) => level.type === "RC");

  return (
    <Tabs defaultValue="AR" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="AR">Novel Levels ({arLevels.length})</TabsTrigger>
        <TabsTrigger value="RC">RC Levels ({rcLevels.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="AR" className="mt-6">
        <div className="grid gap-6">
          {arLevels.map((level) => (
            <MedalImageCard key={`${level.type}-${level.id}`} level={level} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="RC" className="mt-6">
        <div className="grid gap-6">
          {rcLevels.map((level) => (
            <MedalImageCard key={`${level.type}-${level.id}`} level={level} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

function MedalImageCard({ level }: { level: MedalImageLevel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{level.name}</span>
        </CardTitle>
        {level.description && (
          <CardDescription>{level.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          {medalTypes.map((medalType) => {
            const medal = level.medals[medalType];
            return (
              <div
                key={medalType}
                className="flex flex-col items-center space-y-4"
              >
                <h3 className={`font-semibold ${medalColors[medalType]}`}>
                  {medalType}
                </h3>
                <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                  {medal?.imageUrl ? (
                    <Image
                      src={medal.imageUrl}
                      alt={`${level.name} ${medalType} medal`}
                      width={medal.width}
                      height={medal.height}
                      className="h-full w-full object-contain"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="mx-auto mb-2 h-8 w-8" />
                      <p className="text-sm">No image</p>
                    </div>
                  )}
                </div>
                <UploadMedalImageDialog
                  levelType={level.type}
                  levelId={level.id}
                  levelName={level.name}
                  medalType={medalType}
                  currentImageUrl={medal?.imageUrl}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
