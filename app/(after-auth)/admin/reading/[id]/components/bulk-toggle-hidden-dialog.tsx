"use client";

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
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toggleKeywordsHiddenStatus } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BulkToggleHiddenDialogProps {
  selectedKeywordIds: string[];
  onSuccess: () => void;
}

export function BulkToggleHiddenDialog({
  selectedKeywordIds,
  onSuccess,
}: BulkToggleHiddenDialogProps) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"hide" | "show" | null>(null);
  const router = useRouter();

  const handleAction = async () => {
    if (!action) return;

    try {
      const result = await toggleKeywordsHiddenStatus(
        selectedKeywordIds,
        action === "hide",
      );

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        onSuccess();
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update keywords");
      }
    } catch (error) {
      toast.error("An error occurred while updating keywords");
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
              {action === "hide" ? "Hide Keywords" : "Show Keywords"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {action === "hide" ? "hide" : "show"}{" "}
              {selectedKeywordIds.length} selected keyword
              {selectedKeywordIds.length !== 1 ? "s" : ""}? This will{" "}
              {action === "hide"
                ? "make them invisible to users"
                : "make them visible to users"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              {action === "hide" ? "Hide" : "Show"} Keywords
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
