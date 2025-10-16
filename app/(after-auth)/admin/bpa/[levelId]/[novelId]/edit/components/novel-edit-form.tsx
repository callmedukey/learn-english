"use client";

import { format } from "date-fns";
import { ArrowLeft, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BPASeason, Role } from "@/prisma/generated/prisma";

import DeleteNovelDialog from "./delete-novel-dialog";
import { UnitsWithChaptersSection } from "./units-with-chapters-section";
import { updateNovelAction } from "../actions/novel-edit.actions";
import { assignNovelToSemestersAction } from "../actions/semester-assignment.actions";

interface NovelEditFormProps {
  novel: {
    id: string;
    title: string;
    description?: string | null;
    hidden: boolean;
    comingSoon: boolean;
    locked?: boolean;
    bpaLevelId: string | null;
    bpaLevel: {
      id: string;
      name: string;
      description?: string | null;
    } | null;
    units: Array<{
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
    }>;
  };
  bpaLevels: Array<{
    id: string;
    name: string;
    description?: string | null;
  }>;
  novelSettings: {
    id: string;
    defaultTimer: number;
    defaultScore: number;
  } | null;
  timeframes: Array<{
    id: string;
    year: number;
    startDate: Date;
    endDate: Date;
  }>;
  semesterAssignments: Array<{
    id: string;
    timeframeId: string;
    season: BPASeason;
    timeframe: {
      id: string;
      year: number;
      startDate: Date;
      endDate: Date;
    };
  }>;
  userRole?: Role;
}

const SEASONS: BPASeason[] = ["SPRING", "SUMMER", "FALL", "WINTER"];

const NovelEditForm: React.FC<NovelEditFormProps> = ({
  novel,
  bpaLevels,
  novelSettings,
  timeframes,
  semesterAssignments,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Form state
  const [title, setTitle] = useState(novel.title);
  const [description, setDescription] = useState(novel.description || "");
  const [selectedBPALevelId, setSelectedBPALevelId] = useState(novel.bpaLevelId || "");
  const [hidden, setHidden] = useState(novel.hidden);
  const [comingSoon, setComingSoon] = useState(novel.comingSoon);

  // Semester assignment state
  const [selectedSemesters, setSelectedSemesters] = useState<
    Array<{ timeframeId: string; season: BPASeason }>
  >(
    semesterAssignments.map((assignment) => ({
      timeframeId: assignment.timeframeId,
      season: assignment.season,
    }))
  );

  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<BPASeason | "">("");

  const handleAddSemester = () => {
    if (!selectedTimeframe || !selectedSeason) {
      toast.error("Please select both a timeframe and season");
      return;
    }

    // Check if already added
    const alreadyExists = selectedSemesters.some(
      (s) => s.timeframeId === selectedTimeframe && s.season === selectedSeason
    );

    if (alreadyExists) {
      toast.error("This semester is already assigned");
      return;
    }

    setSelectedSemesters([
      ...selectedSemesters,
      { timeframeId: selectedTimeframe, season: selectedSeason },
    ]);
    setSelectedTimeframe("");
    setSelectedSeason("");
  };

  const handleRemoveSemester = (timeframeId: string, season: BPASeason) => {
    setSelectedSemesters(
      selectedSemesters.filter(
        (s) => !(s.timeframeId === timeframeId && s.season === season)
      )
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("novelId", novel.id);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("bpaLevelId", selectedBPALevelId);
      if (hidden) {
        formData.append("hidden", "on");
      }
      if (comingSoon) {
        formData.append("comingSoon", "on");
      }

      const result = await updateNovelAction(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Save semester assignments
      const semesterResult = await assignNovelToSemestersAction(
        novel.id,
        novel.bpaLevelId || "",
        selectedSemesters
      );

      if (semesterResult.error) {
        toast.error(semesterResult.error);
        return;
      }

      toast.success("BPA novel updated successfully");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/bpa/${novel.bpaLevelId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Novels
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit BPA Novel</h1>
            <p className="text-gray-600">
              Level: {novel.bpaLevel?.name} • {novel.units.reduce((sum, unit) => sum + unit.chapters.length, 0)} chapters
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <DeleteNovelDialog
            novelId={novel.id}
            novelTitle={novel.title}
            redirectPath={`/admin/bpa/${novel.bpaLevelId}`}
          >
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Novel
            </Button>
          </DeleteNovelDialog>
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-2xl font-semibold">Basic Information</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter novel title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter novel description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="bpaLevel">BPA Level</Label>
              <Select value={selectedBPALevelId} onValueChange={setSelectedBPALevelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select BPA Level" />
                </SelectTrigger>
                <SelectContent>
                  {bpaLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name} - {level.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hidden"
                  checked={hidden}
                  onCheckedChange={(checked) => setHidden(checked === true)}
                  disabled={isPending}
                />
                <Label htmlFor="hidden">Hidden</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comingSoon"
                  checked={comingSoon}
                  onCheckedChange={(checked) => setComingSoon(checked === true)}
                  disabled={isPending}
                />
                <Label htmlFor="comingSoon">Coming Next Month</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Semester Assignment */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-2xl font-semibold">Semester Assignment</h2>
        <p className="mb-4 text-base text-muted-foreground">
          Assign this novel to specific semesters (timeframe + season). Users can
          only access novels assigned to the current semester.
        </p>

        <div className="space-y-6">
          {/* Add Semester Section */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Add Semester</Label>
            <div className="flex flex-wrap gap-3">
              <Select
                value={selectedTimeframe}
                onValueChange={setSelectedTimeframe}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((timeframe) => (
                    <SelectItem key={timeframe.id} value={timeframe.id}>
                      {timeframe.year} ({format(new Date(timeframe.startDate), "MMM yyyy")} - {format(new Date(timeframe.endDate), "MMM yyyy")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSeason}
                onValueChange={(value) => setSelectedSeason(value as BPASeason)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((season) => (
                    <SelectItem key={season} value={season}>
                      {season.charAt(0) + season.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                onClick={handleAddSemester}
                variant="outline"
                disabled={!selectedTimeframe || !selectedSeason}
              >
                Add Semester
              </Button>
            </div>
          </div>

          {/* Current Assignments */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Assigned Semesters ({selectedSemesters.length})
            </Label>
            {selectedSemesters.length === 0 ? (
              <p className="text-base text-muted-foreground">
                No semesters assigned. This novel will be &quot;Coming Soon&quot; for all users.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSemesters.map((semester) => {
                  const timeframe = timeframes.find(
                    (t) => t.id === semester.timeframeId
                  );
                  return (
                    <Badge
                      key={`${semester.timeframeId}-${semester.season}`}
                      variant="secondary"
                      className="flex items-center gap-2 pr-2"
                    >
                      {timeframe?.year} {semester.season.charAt(0) + semester.season.slice(1).toLowerCase()}
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveSemester(semester.timeframeId, semester.season)
                        }
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Units & Chapters Section */}
      <UnitsWithChaptersSection
        novelId={novel.id}
        units={novel.units}
        defaultTimer={novelSettings?.defaultTimer || 40}
        defaultScore={novelSettings?.defaultScore || 10}
      />
    </div>
  );
};

export default NovelEditForm;
