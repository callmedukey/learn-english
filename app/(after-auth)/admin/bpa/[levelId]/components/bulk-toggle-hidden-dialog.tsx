"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { toggleBPANovelsHiddenStatus } from "../../actions/bpa-novel.actions";

interface BulkToggleHiddenDialogProps {
  selectedNovelIds: string[];
  onSuccess: () => void;
}

export function BulkToggleHiddenDialog({
  selectedNovelIds,
  onSuccess,
}: BulkToggleHiddenDialogProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"hide" | "show" | null>(null);
  const router = useRouter();

  const handleAction = async () => {
    if (!action) return;

    try {
      const result = await toggleBPANovelsHiddenStatus(
        selectedNovelIds,
        action === "hide",
      );

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        onSuccess();
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update novels");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while updating novels");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setAction("hide");
          setOpen(true);
        }}
      >
        <EyeOff className="mr-2 h-4 w-4" />
        Hide Selected
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setAction("show");
          setOpen(true);
        }}
      >
        <Eye className="mr-2 h-4 w-4" />
        Show Selected
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "hide" ? "Hide Novels" : "Show Novels"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {action === "hide" ? "hide" : "show"}{" "}
              {selectedNovelIds.length} selected novel
              {selectedNovelIds.length !== 1 ? "s" : ""}? This will{" "}
              {action === "hide"
                ? "make them invisible to users"
                : "make them visible to users"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {action === "hide" ? "Hide" : "Show"} Novels
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
