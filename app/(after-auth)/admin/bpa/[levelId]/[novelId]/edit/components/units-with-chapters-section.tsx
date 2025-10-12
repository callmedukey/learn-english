"use client";

import DOMPurify from "isomorphic-dompurify";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

import ChapterSection from "./chapter-section";
import { CreateUnitDialog } from "../../units/components/create-unit-dialog";
import { DeleteUnitDialog } from "../../units/components/delete-unit-dialog";
import { EditUnitDialog } from "../../units/components/edit-unit-dialog";

interface Unit {
  id: string;
  name: string;
  description: string | null;
  orderNumber: number;
  chapters: Array<{
    id: string;
    title: string;
    description: string | null;
    orderNumber: number;
    isFree: boolean;
    questionSet: {
      id: string;
      instructions: string;
      active: boolean;
      questions: Array<{
        id: string;
        orderNumber: number;
        question: string;
        choices: string[];
        answer: string;
        explanation: string;
        score: number;
        timeLimit: number;
      }>;
    } | null;
  }>;
}

interface UnitsWithChaptersSectionProps {
  novelId: string;
  units: Unit[];
  defaultTimer: number;
  defaultScore: number;
}

export function UnitsWithChaptersSection({
  novelId,
  units,
  defaultTimer,
  defaultScore,
}: UnitsWithChaptersSectionProps) {
  const router = useRouter();
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  // Transform units to match UnitsTable format
  const unitsForActions = units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    description: unit.description,
    orderNumber: unit.orderNumber,
    chapterCount: unit.chapters.length,
  }));

  if (units.length === 0) {
    return (
      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Units & Chapters</h2>
            <p className="text-sm text-gray-600">
              Organize chapters into units
            </p>
          </div>
          <CreateUnitDialog novelId={novelId} onSuccess={handleRefresh} />
        </div>
        <div className="py-12 text-center text-gray-500">
          <div className="mb-4 text-4xl">📚</div>
          <h3 className="mb-2 text-lg font-medium">No Units Yet</h3>
          <p className="mb-4">
            Create your first unit to organize chapters within this novel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Units & Chapters</h2>
          <p className="text-sm text-gray-600">
            {units.length} unit{units.length !== 1 ? "s" : ""} •{" "}
            {units.reduce((sum, unit) => sum + unit.chapters.length, 0)}{" "}
            total chapters
          </p>
        </div>
        <CreateUnitDialog novelId={novelId} onSuccess={handleRefresh} />
      </div>

      <div className="space-y-4">
        {units.map((unit) => {
          const isExpanded = expandedUnits.has(unit.id);

          return (
            <Collapsible
              key={unit.id}
              open={isExpanded}
              onOpenChange={() => toggleUnit(unit.id)}
            >
              <div className="rounded-lg border">
                {/* Unit Header */}
                <div className="flex items-center justify-between bg-gray-50 p-4">
                  <div className="flex flex-1 items-center gap-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-1">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{unit.name}</h3>
                        <Badge variant="outline">
                          {unit.chapters.length} chapter
                          {unit.chapters.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      {unit.description && (
                        <div
                          className="text-sm text-gray-600 mt-1"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(unit.description),
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditUnitDialog unit={unit} onSuccess={handleRefresh} />
                    <DeleteUnitDialog
                      unit={{
                        id: unit.id,
                        name: unit.name,
                        chapterCount: unit.chapters.length,
                      }}
                      availableUnits={unitsForActions}
                      onSuccess={handleRefresh}
                    />
                  </div>
                </div>

                {/* Unit Content (Chapters) */}
                <CollapsibleContent>
                  <div className="p-4">
                    {unit.chapters.length > 0 || isExpanded ? (
                      <>
                        <Separator className="mb-4" />
                        <ChapterSection
                          novelId={novelId}
                          unitId={unit.id}
                          chapters={unit.chapters}
                          onChapterUpdate={handleRefresh}
                          defaultTimer={defaultTimer}
                          defaultScore={defaultScore}
                        />
                      </>
                    ) : null}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
