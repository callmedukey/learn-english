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

import { moveKeywordToRCLevel } from "../../actions/move-keyword.actions";

interface MoveKeywordDialogProps {
  keywordId: string;
  keywordName: string;
  currentRCLevelId: string;
  rcLevels: {
    id: string;
    level: string;
    description: string | null;
    stars: number;
  }[];
}

export default function MoveKeywordDialog({
  keywordId,
  keywordName,
  currentRCLevelId,
  rcLevels,
}: MoveKeywordDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRCLevelId, setSelectedRCLevelId] = useState("");

  const handleMove = async () => {
    if (!selectedRCLevelId) {
      return { success: false, error: "Please select an RC level" };
    }

    const result = await moveKeywordToRCLevel(keywordId, selectedRCLevelId);

    if (result.success) {
      toast.success(`Keyword moved successfully`);
      setOpen(false);
      setSelectedRCLevelId("");
    } else {
      toast.error(result.error || "Failed to move keyword");
    }

    return result;
  };

  const [state, formAction] = useActionState(handleMove, null);

  // Filter out the current RC level from the options
  const availableRCLevels = rcLevels.filter((rc) => rc.id !== currentRCLevelId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MoveHorizontal className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Keyword</DialogTitle>
          <DialogDescription>
            Move &quot;{keywordName}&quot; to a different RC level. This will
            affect where the keyword appears in the system.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="rc-level" className="text-sm font-medium">
                Select New RC Level
              </label>
              <Select
                value={selectedRCLevelId}
                onValueChange={setSelectedRCLevelId}
              >
                <SelectTrigger id="rc-level" className="w-full">
                  <SelectValue placeholder="Choose an RC level" />
                </SelectTrigger>
                <SelectContent>
                  {availableRCLevels.map((rc) => (
                    <SelectItem key={rc.id} value={rc.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>Level {rc.level}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {"★".repeat(rc.stars)}
                        </span>
                      </div>
                      {rc.description && (
                        <div className="mt-1 text-xs text-gray-500">
                          {rc.description}
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
                setSelectedRCLevelId("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedRCLevelId}>
              Move Keyword
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
