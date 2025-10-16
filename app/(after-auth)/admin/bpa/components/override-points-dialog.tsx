"use client";

import React, { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { overrideAllBPAQuestionPointsAction } from "../actions/override-points.actions";

interface OverridePointsDialogProps {
  bpaLevelId: string;
  levelName: string;
  questionCount: number;
  children: React.ReactNode;
}

const OverridePointsDialog: React.FC<OverridePointsDialogProps> = ({
  bpaLevelId,
  levelName,
  questionCount,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [points, setPoints] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const pointsValue = parseInt(points);
    if (isNaN(pointsValue) || pointsValue <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    startTransition(async () => {
      const result = await overrideAllBPAQuestionPointsAction({
        bpaLevelId,
        points: pointsValue,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Successfully updated ${result.updatedCount} questions to ${pointsValue} points`
        );
        setOpen(false);
        setPoints("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Override All Question Points</DialogTitle>
          <DialogDescription>
            Set a uniform point value for all {questionCount} questions in{" "}
            <span className="font-semibold">{levelName}</span>. This will
            override the current point values for every question in this level.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="points">Points per Question</Label>
            <Input
              id="points"
              name="points"
              type="number"
              min="1"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g., 50"
              required
              disabled={isPending}
              autoFocus
            />
            <p className="text-base text-muted-foreground">
              This will affect all questions across all novels and chapters in
              this level.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !points}>
              {isPending ? "Updating..." : "Override Points"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OverridePointsDialog;
