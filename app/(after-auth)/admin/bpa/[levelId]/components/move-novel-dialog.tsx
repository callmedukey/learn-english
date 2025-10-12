"use client";

import { MoveHorizontal } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { moveBPANovelToLevel } from "../../actions/bpa-novel.actions";

interface MoveNovelDialogProps {
  novelId: string;
  novelTitle: string;
  currentLevelId: string;
  bpaLevels: {
    id: string;
    name: string;
    description: string | null;
    stars: number;
  }[];
}

export default function MoveNovelDialog({
  novelId,
  novelTitle,
  currentLevelId,
  bpaLevels,
}: MoveNovelDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState("");

  const handleMove = async () => {
    if (!selectedLevelId) {
      return { success: false, error: "Please select a BPA level" };
    }

    const result = await moveBPANovelToLevel(novelId, selectedLevelId);

    if (result.success) {
      toast.success(`Novel moved successfully`);
      setOpen(false);
      setSelectedLevelId("");
    } else {
      toast.error(result.error || "Failed to move novel");
    }

    return result;
  };

  const [state, formAction] = useActionState(handleMove, null);

  // Filter out the current level from the options
  const availableLevels = bpaLevels.filter((level) => level.id !== currentLevelId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MoveHorizontal className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Novel</DialogTitle>
          <DialogDescription>
            Move &quot;{novelTitle}&quot; to a different BPA level. This will
            affect where the novel appears in the system.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="bpa-level" className="text-sm font-medium">
                Select New BPA Level
              </label>
              <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
                <SelectTrigger id="bpa-level" className="w-full">
                  <SelectValue placeholder="Choose a BPA level" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>{level.name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {"★".repeat(level.stars)}
                        </span>
                      </div>
                      {level.description && (
                        <div className="mt-1 text-xs text-gray-500">
                          {level.description}
                        </div>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSelectedLevelId("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedLevelId}>
              Move Novel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
