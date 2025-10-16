"use client";

import { Copy } from "lucide-react";
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

import { copyBPANovelToLevel } from "../../actions/bpa-novel.actions";

interface CopyNovelDialogProps {
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

export default function CopyNovelDialog({
  novelId,
  novelTitle,
  currentLevelId,
  bpaLevels,
}: CopyNovelDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState("");

  const handleCopy = async () => {
    if (!selectedLevelId) {
      return { success: false, error: "Please select a BPA level" };
    }

    const result = await copyBPANovelToLevel(novelId, selectedLevelId);

    if (result.success) {
      toast.success(`Novel copied successfully`);
      setOpen(false);
      setSelectedLevelId("");
    } else {
      toast.error(result.error || "Failed to copy novel");
    }

    return result;
  };

  const [state, formAction] = useActionState(handleCopy, null);

  // Include all BPA levels (including the current one) for copy
  const availableLevels = bpaLevels;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Copy Novel</DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{novelTitle}&quot; at a different BPA level.
            The original novel will remain unchanged.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="bpa-level" className="text-base font-medium">
                Select Destination BPA Level
              </label>
              <Select
                value={selectedLevelId}
                onValueChange={setSelectedLevelId}
              >
                <SelectTrigger id="bpa-level" className="w-full">
                  <SelectValue placeholder="Choose a BPA level" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>
                          {level.name}
                          {level.id === currentLevelId && " (current)"}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {"★".repeat(level.stars)}
                        </span>
                      </div>
                      {level.description && (
                        <div className="mt-1 text-sm text-gray-500">
                          {level.description}
                        </div>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state?.error && (
                <p className="text-base text-red-600">{state.error}</p>
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
              Copy Novel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
