import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

import { Button } from "@/components/ui/button";

import { getARLevelsForSelection } from "../query/ar.query";
import { getARByLevel, getNovelsByARLevel } from "../query/novel.query";
import NovelsTable from "./components/novels-table";

interface PageProps {
  params: Promise<{ id: string }>;
}

const NovelsListPage = async ({ params }: PageProps) => {
  const { id } = await params;

  const arLevel = await getARByLevel(id);
  if (!arLevel) {
    notFound();
  }

  // Fetch novels for this level and all AR levels for moving novels
  const [novels, arLevels] = await Promise.all([
    getNovelsByARLevel(id),
    getARLevelsForSelection(),
  ]);

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/novels">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lexile Levels
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              Novels - Level {arLevel.level}
            </h1>
            <p className="text-sm text-gray-600">
              {arLevel.description} • {novels.length} novel
              {novels.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Link href={`/admin/novels/${arLevel.id}/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Novel
          </Button>
        </Link>
      </div>

      {/* AR Level Info */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Level</p>
            <p className="text-lg font-semibold">{arLevel.level}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Score Range</p>
            <p className="text-lg font-semibold">{arLevel.score}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Difficulty</p>
            <div className="flex items-center">
              {"★".repeat(arLevel.stars)}
              {"☆".repeat(5 - arLevel.stars)}
              <span className="ml-1 text-sm text-gray-500">
                ({arLevel.stars}/5)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Novels Table */}
      <Suspense
        fallback={<div className="py-8 text-center">Loading novels...</div>}
      >
        <NovelsTable novels={novels} arLevels={arLevels} />
      </Suspense>
    </div>
  );
};

export default NovelsListPage;
