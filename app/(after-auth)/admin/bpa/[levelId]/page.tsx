import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Role } from "@/prisma/generated/prisma";

import { getBPALevelById, getNovelsByBPALevel, getBPALevelsForSelection } from "../query/bpa.query";
import NovelsTable from "./components/novels-table";

interface PageProps {
  params: Promise<{ levelId: string }>;
}

const BPALevelPage = async ({ params }: PageProps) => {
  const { levelId } = await params;

  const bpaLevel = await getBPALevelById(levelId);
  if (!bpaLevel) {
    notFound();
  }

  // Fetch novels for this level and all BPA levels for moving novels
  const [novels, bpaLevels, session] = await Promise.all([
    getNovelsByBPALevel(levelId),
    getBPALevelsForSelection(),
    auth(),
  ]);
  const userRole = session?.user?.role as Role | undefined;

  return (
    <div className="space-y-6 px-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/bpa">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to BPA Levels
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              Novels - {bpaLevel.name}
            </h1>
            <p className="text-base text-gray-600">
              {bpaLevel.description} • {novels.length} novel
              {novels.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {(userRole === Role.ADMIN || userRole === Role.SUB_ADMIN) && (
          <Link href={`/admin/bpa/${bpaLevel.id}/create`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Novel
            </Button>
          </Link>
        )}
      </div>

      {/* BPA Level Info */}
      <div className="rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="text-base font-medium text-gray-500">Level</p>
            <p className="text-xl font-semibold">{bpaLevel.name}</p>
          </div>
          <div>
            <p className="text-base font-medium text-gray-500">Order</p>
            <p className="text-xl font-semibold">{bpaLevel.orderNumber}</p>
          </div>
          <div>
            <p className="text-base font-medium text-gray-500">Difficulty</p>
            <div className="flex items-center">
              {"★".repeat(bpaLevel.stars)}
              {"☆".repeat(5 - bpaLevel.stars)}
              <span className="ml-1 text-base text-gray-500">
                ({bpaLevel.stars}/5)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Novels Table */}
      <Suspense
        fallback={<div className="py-8 text-center">Loading novels...</div>}
      >
        <NovelsTable novels={novels} bpaLevels={bpaLevels} userRole={userRole} />
      </Suspense>
    </div>
  );
};

export default BPALevelPage;
