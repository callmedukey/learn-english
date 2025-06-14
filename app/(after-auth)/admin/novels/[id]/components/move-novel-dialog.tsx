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

import { moveNovelToARLevel } from "../../actions/move-novel.actions";

interface MoveNovelDialogProps {
  novelId: string;
  novelTitle: string;
  currentARId: string;
  arLevels: {
    id: string;
    level: string;
    description: string | null;
    stars: number;
  }[];
}

export default function MoveNovelDialog({
  novelId,
  novelTitle,
  currentARId,
  arLevels,
}: MoveNovelDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedARId, setSelectedARId] = useState("");

  const handleMove = async () => {
    if (!selectedARId) {
      return { success: false, error: "Please select an AR level" };
    }

    const result = await moveNovelToARLevel(novelId, selectedARId);

    if (result.success) {
      toast.success(`Novel moved successfully`);
      setOpen(false);
      setSelectedARId("");
    } else {
      toast.error(result.error || "Failed to move novel");
    }

    return result;
  };

  const [state, formAction] = useActionState(handleMove, null);

  // Filter out the current AR level from the options
  const availableARLevels = arLevels.filter((ar) => ar.id !== currentARId);

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
            Move &quot;{novelTitle}&quot; to a different AR level. This will
            affect where the novel appears in the system.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="ar-level" className="text-sm font-medium">
                Select New AR Level
              </label>
              <Select value={selectedARId} onValueChange={setSelectedARId}>
                <SelectTrigger id="ar-level" className="w-full">
                  <SelectValue placeholder="Choose an AR level" />
                </SelectTrigger>
                <SelectContent>
                  {availableARLevels.map((ar) => (
                    <SelectItem key={ar.id} value={ar.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>Level {ar.level}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {"★".repeat(ar.stars)}
                        </span>
                      </div>
                      {ar.description && (
                        <div className="mt-1 text-xs text-gray-500">
                          {ar.description}
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
                setSelectedARId("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedARId}>
              Move Novel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
