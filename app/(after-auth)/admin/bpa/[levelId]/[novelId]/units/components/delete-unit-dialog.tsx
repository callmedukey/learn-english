"use client";

import { Trash2 } from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { deleteBPAUnit } from "../actions/unit.actions";

interface DeleteUnitDialogProps {
  unit: {
    id: string;
    name: string;
    chapterCount: number;
  };
  availableUnits: Array<{
    id: string;
    name: string;
  }>;
  onSuccess?: () => void;
}

export function DeleteUnitDialog({
  unit,
  availableUnits,
  onSuccess,
}: DeleteUnitDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [targetUnitId, setTargetUnitId] = useState<string>("");

  const hasChapters = unit.chapterCount > 0;
  const otherUnits = availableUnits.filter((u) => u.id !== unit.id);

  const handleDelete = () => {
    if (hasChapters && !targetUnitId) {
      toast.error("Please select a unit to move chapters to");
      return;
    }

    startTransition(async () => {
      const result = await deleteBPAUnit(
        unit.id,
        targetUnitId || null
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Unit deleted successfully");
        setOpen(false);
        onSuccess?.();
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Unit</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete <strong>{unit.name}</strong>?
            </p>
            {hasChapters && (
              <div className="space-y-2">
                <p className="text-amber-600 font-medium">
                  This unit has {unit.chapterCount} chapter(s).
                </p>
                {otherUnits.length > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="targetUnit">
                      Move chapters to: *
                    </Label>
                    <Select
                      value={targetUnitId}
                      onValueChange={setTargetUnitId}
                      disabled={isPending}
                    >
                      <SelectTrigger id="targetUnit">
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherUnits.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-red-600">
                    Cannot delete: No other units available to move chapters to.
                    Please create another unit first or delete the chapters.
                  </p>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={
              isPending ||
              (hasChapters && (otherUnits.length === 0 || !targetUnitId))
            }
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Delete Unit"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
