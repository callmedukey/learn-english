"use client";

import { format } from "date-fns";
import { Edit, Plus, Trash2 } from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import DayPicker from "@/components/custom-ui/day-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  createTimeframeAction,
  deleteTimeframeAction,
  updateTimeframeAction,
} from "../actions/timeframe.actions";
import { BPATimeframeWithSemesters } from "../queries/bpa-admin.query";

interface TimeframeConfigClientProps {
  timeframes: BPATimeframeWithSemesters[];
}

const TimeframeConfigClient: React.FC<TimeframeConfigClientProps> = ({
  timeframes,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTimeframe, setEditingTimeframe] = useState<BPATimeframeWithSemesters | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  // Semester date states
  const [springSt, setSpringSt] = useState<Date | undefined>();
  const [springEnd, setSpringEnd] = useState<Date | undefined>();
  const [summerSt, setSummerSt] = useState<Date | undefined>();
  const [summerEnd, setSummerEnd] = useState<Date | undefined>();
  const [fallSt, setFallSt] = useState<Date | undefined>();
  const [fallEnd, setFallEnd] = useState<Date | undefined>();
  const [winterSt, setWinterSt] = useState<Date | undefined>();
  const [winterEnd, setWinterEnd] = useState<Date | undefined>();

  const handleCreateOrUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const result = editingTimeframe
        ? await updateTimeframeAction(editingTimeframe.id, formData)
        : await createTimeframeAction(formData);

      if (result.success) {
        toast.success(
          editingTimeframe
            ? "Timeframe updated successfully"
            : "Timeframe created successfully"
        );
        setIsDialogOpen(false);
        setEditingTimeframe(null);
      } else {
        toast.error(result.error || "Failed to save timeframe");
      }
    });
  };

  const handleEdit = (timeframe: BPATimeframeWithSemesters) => {
    setEditingTimeframe(timeframe);

    // Populate semester dates if they exist
    const spring = timeframe.semesters.find(s => s.season === "SPRING");
    const summer = timeframe.semesters.find(s => s.season === "SUMMER");
    const fall = timeframe.semesters.find(s => s.season === "FALL");
    const winter = timeframe.semesters.find(s => s.season === "WINTER");

    setSpringSt(spring ? new Date(spring.startDate) : undefined);
    setSpringEnd(spring ? new Date(spring.endDate) : undefined);
    setSummerSt(summer ? new Date(summer.startDate) : undefined);
    setSummerEnd(summer ? new Date(summer.endDate) : undefined);
    setFallSt(fall ? new Date(fall.startDate) : undefined);
    setFallEnd(fall ? new Date(fall.endDate) : undefined);
    setWinterSt(winter ? new Date(winter.startDate) : undefined);
    setWinterEnd(winter ? new Date(winter.endDate) : undefined);

    setIsDialogOpen(true);
  };

  const handleDelete = async (timeframeId: string) => {
    if (!confirm("Are you sure you want to delete this timeframe?")) {
      return;
    }

    startTransition(async () => {
      const result = await deleteTimeframeAction(timeframeId);

      if (result.success) {
        toast.success("Timeframe deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete timeframe");
      }
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTimeframe(null);
      // Reset semester dates
      setSpringSt(undefined);
      setSpringEnd(undefined);
      setSummerSt(undefined);
      setSummerEnd(undefined);
      setFallSt(undefined);
      setFallEnd(undefined);
      setWinterSt(undefined);
      setWinterEnd(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {timeframes.length} timeframe{timeframes.length !== 1 ? "s" : ""}{" "}
            configured
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Timeframe
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTimeframe ? "Edit Timeframe" : "Create Timeframe"}
              </DialogTitle>
              <DialogDescription>
                Configure a BPA timeframe. Each timeframe spans all 4 seasons
                (Spring, Summer, Fall, Winter).
              </DialogDescription>
            </DialogHeader>
            <form
              action={handleCreateOrUpdate}
              className="space-y-4 max-h-[70vh] overflow-y-auto"
            >
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  defaultValue={editingTimeframe?.year || new Date().getFullYear()}
                  min={2024}
                  max={2100}
                  required
                  placeholder="e.g., 2025"
                />
                <p className="text-xs text-gray-500">
                  The year this timeframe represents
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Month</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="month"
                  defaultValue={
                    editingTimeframe?.startDate
                      ? format(new Date(editingTimeframe.startDate), "yyyy-MM")
                      : ""
                  }
                  required
                />
                <p className="text-xs text-gray-500">
                  When this timeframe begins (first day of the month)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Month</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="month"
                  defaultValue={
                    editingTimeframe?.endDate
                      ? format(new Date(editingTimeframe.endDate), "yyyy-MM")
                      : ""
                  }
                  required
                />
                <p className="text-xs text-gray-500">
                  When this timeframe ends (last day of the month)
                </p>
              </div>

              {/* Semester Date Ranges */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium">Semester Date Ranges</h3>

                {/* Spring */}
                <div className="grid grid-cols-2 gap-2">
                  <DayPicker
                    label="Spring Start"
                    date={springSt}
                    setDate={setSpringSt}
                    placeholder="Select start date"
                  />
                  <DayPicker
                    label="Spring End"
                    date={springEnd}
                    setDate={setSpringEnd}
                    placeholder="Select end date"
                  />
                </div>

                {/* Summer */}
                <div className="grid grid-cols-2 gap-2">
                  <DayPicker
                    label="Summer Start"
                    date={summerSt}
                    setDate={setSummerSt}
                    placeholder="Select start date"
                  />
                  <DayPicker
                    label="Summer End"
                    date={summerEnd}
                    setDate={setSummerEnd}
                    placeholder="Select end date"
                  />
                </div>

                {/* Fall */}
                <div className="grid grid-cols-2 gap-2">
                  <DayPicker
                    label="Fall Start"
                    date={fallSt}
                    setDate={setFallSt}
                    placeholder="Select start date"
                  />
                  <DayPicker
                    label="Fall End"
                    date={fallEnd}
                    setDate={setFallEnd}
                    placeholder="Select end date"
                  />
                </div>

                {/* Winter */}
                <div className="grid grid-cols-2 gap-2">
                  <DayPicker
                    label="Winter Start"
                    date={winterSt}
                    setDate={setWinterSt}
                    placeholder="Select start date"
                  />
                  <DayPicker
                    label="Winter End"
                    date={winterEnd}
                    setDate={setWinterEnd}
                    placeholder="Select end date"
                  />
                </div>
              </div>

              {/* Hidden inputs for semester dates */}
              <input type="hidden" name="springSt" value={springSt?.toISOString() || ""} />
              <input type="hidden" name="springEnd" value={springEnd?.toISOString() || ""} />
              <input type="hidden" name="summerSt" value={summerSt?.toISOString() || ""} />
              <input type="hidden" name="summerEnd" value={summerEnd?.toISOString() || ""} />
              <input type="hidden" name="fallSt" value={fallSt?.toISOString() || ""} />
              <input type="hidden" name="fallEnd" value={fallEnd?.toISOString() || ""} />
              <input type="hidden" name="winterSt" value={winterSt?.toISOString() || ""} />
              <input type="hidden" name="winterEnd" value={winterEnd?.toISOString() || ""} />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Saving..."
                    : editingTimeframe
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {timeframes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-gray-500">
            No timeframes configured yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Start Month</TableHead>
                <TableHead>End Month</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeframes.map((timeframe) => {
                const start = new Date(timeframe.startDate);
                const end = new Date(timeframe.endDate);
                const durationDays = Math.ceil(
                  (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <TableRow key={timeframe.id}>
                    <TableCell className="font-medium">
                      {timeframe.year}
                    </TableCell>
                    <TableCell>
                      {format(start, "MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(end, "MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        {durationDays} days
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(timeframe.createdAt), "yyyy/MM/dd")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(timeframe)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(timeframe.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TimeframeConfigClient;
