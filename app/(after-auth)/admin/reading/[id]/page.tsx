import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Role } from "@/prisma/generated/prisma";

import {
  getRCLevelById,
  getRCKeywordsByLevel,
  getRCLevelsForSelection,
} from "../query/rc-detail.query";
import KeywordsTable from "./components/keywords-table";

interface PageProps {
  params: Promise<{ id: string }>;
}

const RCLevelDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;

  const rcLevel = await getRCLevelById(id);
  if (!rcLevel) {
    notFound();
  }

  // Fetch keywords for this level and all RC levels for moving keywords
  const [keywords, rcLevels, session] = await Promise.all([
    getRCKeywordsByLevel(id),
    getRCLevelsForSelection(),
    auth(),
  ]);
  const userRole = session?.user?.role as Role | undefined;

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/reading">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to RC Levels
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              Keywords - Level {rcLevel.level}
            </h1>
            <p className="text-sm text-gray-600">
              {rcLevel.description} • {keywords.length} keyword
              {keywords.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {(userRole === Role.ADMIN || userRole === Role.SUB_ADMIN) && (
          <Link href={`/admin/reading/${rcLevel.id}/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Keyword
            </Button>
          </Link>
        )}
      </div>

      {/* RC Level Info */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Level</p>
            <p className="text-lg font-semibold">{rcLevel.level}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Questions</p>
            <p className="text-lg font-semibold">{rcLevel.numberOfQuestions}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Relevant Grade</p>
            <p className="text-lg font-semibold">{rcLevel.relevantGrade}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Difficulty</p>
            <div className="flex items-center">
              {"★".repeat(rcLevel.stars)}
              {"☆".repeat(5 - rcLevel.stars)}
              <span className="ml-1 text-sm text-gray-500">
                ({rcLevel.stars}/5)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Keywords Table */}
      <Suspense
        fallback={<div className="py-8 text-center">Loading keywords...</div>}
      >
        <KeywordsTable keywords={keywords} rcLevels={rcLevels} userRole={userRole} />
      </Suspense>
    </div>
  );
};

export default RCLevelDetailPage;
