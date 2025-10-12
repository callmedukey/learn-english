"use client";

import { format } from "date-fns";
import { Trash2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { ReactNode, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BPASeason } from "@/prisma/generated/prisma";

import {
  assignStudentToBPALevel,
  removeStudentBPALevelAssignment,
} from "../actions/level-assignment.actions";

interface AssignLevelDialogProps {
  studentId: string;
  studentName: string;
  campusId: string;
  mode: "create" | "edit";
  editingAssignment?: {
    id: string;
    timeframeId: string;
    season: BPASeason;
    bpaLevelId: string;
    bpaLevel: {
      id: string;
      name: string;
      stars: number;
    };
    timeframe: {
      id: string;
      year: number;
      startDate: Date;
      endDate: Date;
    };
    assignedAt: Date;
    assignedBy: string | null;
  } | null;
  allStudentAssignments: Array<{
    timeframeId: string;
    season: BPASeason;
  }>;
  bpaLevels: Array<{
    id: string;
    name: string;
    description: string | null;
    stars: number;
    orderNumber: number;
  }>;
  timeframes: Array<{
    id: string;
    year: number;
    startDate: Date;
    endDate: Date;
  }>;
  selectedTimeframeId?: string;
  selectedSeason?: BPASeason;
  adminUserId: string;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SEASONS: BPASeason[] = ["SPRING", "SUMMER", "FALL", "WINTER"];

const AssignLevelDialog: React.FC<AssignLevelDialogProps> = ({
  studentId,
  studentName,
  campusId,
  mode,
  editingAssignment,
  allStudentAssignments,
  bpaLevels,
  timeframes,
  selectedTimeframeId,
  selectedSeason,
  adminUserId,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  // Initialize state based on mode
  const [timeframeId, setTimeframeId] = useState<string>(
    mode === "edit" && editingAssignment
      ? editingAssignment.timeframeId
      : selectedTimeframeId || ""
  );
  const [season, setSeason] = useState<BPASeason | "">(
    mode === "edit" && editingAssignment
      ? editingAssignment.season
      : selectedSeason || ""
  );
  const [levelId, setLevelId] = useState<string>(
    mode === "edit" && editingAssignment
      ? editingAssignment.bpaLevelId
      : ""
  );

  // Check for duplicate timeframe-season combo (only in create mode)
  const isDuplicate = useMemo(() => {
    if (mode === "edit") return false;
    if (!timeframeId || !season) return false;

    return allStudentAssignments.some(
      (assignment) =>
        assignment.timeframeId === timeframeId && assignment.season === season
    );
  }, [timeframeId, season, allStudentAssignments, mode]);

  // Find the duplicate assignment details for display
  const duplicateAssignment = useMemo(() => {
    if (!isDuplicate) return null;

    const timeframe = timeframes.find((t) => t.id === timeframeId);
    if (!timeframe) return null;

    return {
      year: timeframe.year,
      season: season,
    };
  }, [isDuplicate, timeframeId, season, timeframes]);

  const handleAssign = () => {
    if (!timeframeId || !season || !levelId) {
      toast.error("Please select timeframe, season, and level");
      return;
    }

    startTransition(async () => {
      const result = await assignStudentToBPALevel(
        studentId,
        campusId,
        timeframeId,
        season as BPASeason,
        levelId,
        adminUserId
      );

      if (result.success) {
        toast.success(`Successfully assigned ${studentName} to level`);
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to assign student");
      }
    });
  };

  const handleRemove = () => {
    // Use timeframeId and season from state (works for both edit and create with filter)
    if (!timeframeId || !season) {
      toast.error("Cannot remove assignment without timeframe and season");
      return;
    }

    if (!confirm(`Remove ${studentName}'s level assignment for this semester?`)) {
      return;
    }

    startTransition(async () => {
      const result = await removeStudentBPALevelAssignment(
        studentId,
        campusId,
        timeframeId,
        season as BPASeason
      );

      if (result.success) {
        toast.success(`Removed ${studentName}'s level assignment`);
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove assignment");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit BPA Level" : "Assign BPA Level"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" ? (
              <>
                Edit the BPA level for <span className="font-medium">{studentName}</span>
              </>
            ) : (
              <>
                Assign <span className="font-medium">{studentName}</span> to a BPA
                level for a specific semester (timeframe + season).
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Editing Assignment Info */}
          {mode === "edit" && editingAssignment && (
            <div className="rounded-lg border p-3 bg-blue-50 space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Editing: {editingAssignment.timeframe.year}{" "}
                {editingAssignment.season.charAt(0) +
                  editingAssignment.season.slice(1).toLowerCase()}
              </p>
              <p className="text-sm text-blue-700">
                Current Level: <span className="font-medium">{editingAssignment.bpaLevel.name}</span>{" "}
                ({editingAssignment.bpaLevel.stars} ⭐)
              </p>
              <p className="text-xs text-blue-600">
                Assigned on {format(new Date(editingAssignment.assignedAt), "MMM dd, yyyy")}
              </p>
            </div>
          )}

          {/* Duplicate Warning */}
          {mode === "create" && isDuplicate && duplicateAssignment && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3">
              <p className="text-sm font-medium text-yellow-900">
                ⚠️ Assignment Already Exists
              </p>
              <p className="text-sm text-yellow-700">
                This student already has an assignment for{" "}
                {duplicateAssignment.year}{" "}
                {(duplicateAssignment.season as string).charAt(0) +
                  (duplicateAssignment.season as string).slice(1).toLowerCase()}.
                Click on the badge to edit it instead.
              </p>
            </div>
          )}

          {/* Timeframe Selection */}
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select
              value={timeframeId}
              onValueChange={setTimeframeId}
              disabled={mode === "edit"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {timeframes.map((timeframe) => (
                  <SelectItem key={timeframe.id} value={timeframe.id}>
                    {timeframe.year} ({format(new Date(timeframe.startDate), "MMM yyyy")} -{" "}
                    {format(new Date(timeframe.endDate), "MMM yyyy")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === "edit" && (
              <p className="text-xs text-gray-500">
                Timeframe cannot be changed in edit mode
              </p>
            )}
          </div>

          {/* Season Selection */}
          <div className="space-y-2">
            <Label>Season</Label>
            <Select
              value={season}
              onValueChange={(value) => setSeason(value as BPASeason)}
              disabled={mode === "edit"}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select season" />
              </SelectTrigger>
              <SelectContent>
                {SEASONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode === "edit" && (
              <p className="text-xs text-gray-500">
                Season cannot be changed in edit mode
              </p>
            )}
          </div>

          {/* Level Selection */}
          <div className="space-y-2">
            <Label>BPA Level</Label>
            <Select value={levelId} onValueChange={setLevelId}>
              <SelectTrigger>
                <SelectValue placeholder="Select BPA level" />
              </SelectTrigger>
              <SelectContent>
                {bpaLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name} ({level.stars} ⭐) - {level.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            {mode === "edit" && (
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Assignment
              </Button>
            )}
            <div className="flex space-x-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={
                  isPending ||
                  !timeframeId ||
                  !season ||
                  !levelId ||
                  (mode === "create" && isDuplicate)
                }
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {isPending
                  ? mode === "edit"
                    ? "Updating..."
                    : "Assigning..."
                  : mode === "edit"
                    ? "Update Assignment"
                    : "Assign Level"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignLevelDialog;
