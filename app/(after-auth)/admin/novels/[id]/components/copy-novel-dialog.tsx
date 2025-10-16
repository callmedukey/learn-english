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

import { copyNovelToARLevel } from "../../actions/move-novel.actions";

interface CopyNovelDialogProps {
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

export default function CopyNovelDialog({
  novelId,
  novelTitle,
  currentARId,
  arLevels,
}: CopyNovelDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedARId, setSelectedARId] = useState("");

  const handleCopy = async () => {
    if (!selectedARId) {
      return { success: false, error: "Please select a Lexile level" };
    }

    const result = await copyNovelToARLevel(novelId, selectedARId);

    if (result.success) {
      toast.success(`Novel copied successfully`);
      setOpen(false);
      setSelectedARId("");
    } else {
      toast.error(result.error || "Failed to copy novel");
    }

    return result;
  };

  const [state, formAction] = useActionState(handleCopy, null);

  // Include all AR levels (including the current one) for copy
  const availableARLevels = arLevels;

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
            Create a copy of &quot;{novelTitle}&quot; at a different Lexile
            level. The original novel will remain unchanged.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="ar-level" className="text-base font-medium">
                Select Destination Lexile Level
              </label>
              <Select value={selectedARId} onValueChange={setSelectedARId}>
                <SelectTrigger id="ar-level" className="w-full">
                  <SelectValue placeholder="Choose a Lexile level" />
                </SelectTrigger>
                <SelectContent>
                  {availableARLevels.map((ar) => (
                    <SelectItem key={ar.id} value={ar.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>
                          Level {ar.level}
                          {ar.id === currentARId && " (current)"}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {"★".repeat(ar.stars)}
                        </span>
                      </div>
                      {ar.description && (
                        <div className="mt-1 text-sm text-gray-500">
                          {ar.description}
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
                setSelectedARId("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedARId}>
              Copy Novel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
