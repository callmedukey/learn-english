"use client";

import { ArrowRightFromLine } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  moveBPANovelToARLevel,
  copyBPANovelToARLevel
} from "../../actions/convert-to-novel.actions";

interface ConvertToARDialogProps {
  novelId: string;
  novelTitle: string;
  arLevels: {
    id: string;
    level: string;
    description: string | null;
    stars: number;
  }[];
}

type OperationType = "move" | "copy";

export default function ConvertToARDialog({
  novelId,
  novelTitle,
  arLevels,
}: ConvertToARDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedARId, setSelectedARId] = useState("");
  const [operation, setOperation] = useState<OperationType>("move");

  const handleConvert = async () => {
    if (!selectedARId) {
      return { success: false, error: "Please select an AR level" };
    }

    const result = operation === "move"
      ? await moveBPANovelToARLevel(novelId, selectedARId)
      : await copyBPANovelToARLevel(novelId, selectedARId);

    if (result.success) {
      const operationText = operation === "move" ? "moved to" : "copied to";
      toast.success(`Novel ${operationText} AR level successfully`);
      setOpen(false);
      setSelectedARId("");
      setOperation("move");
    } else {
      toast.error(result.error || "Failed to convert novel");
    }

    return result;
  };

  const [state, formAction] = useActionState(handleConvert, null);

  const operationDescriptions = {
    move: "Convert and delete the source BPA novel. Units will be flattened and chapters renumbered sequentially.",
    copy: "Convert to AR novel while keeping the source BPA novel. Units will be flattened and chapters renumbered sequentially.",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightFromLine className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert to AR Level</DialogTitle>
          <DialogDescription>
            Convert &quot;{novelTitle}&quot; from BPA to a regular AR novel.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-6 py-4">
            {/* Operation Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Operation Type</Label>
              <RadioGroup
                value={operation}
                onValueChange={(value) => setOperation(value as OperationType)}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                  <RadioGroupItem value="move" id="move" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="move" className="cursor-pointer font-medium">
                      Move
                    </Label>
                    <p className="text-sm text-gray-500">
                      Convert and delete the source BPA novel
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50">
                  <RadioGroupItem value="copy" id="copy" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="copy" className="cursor-pointer font-medium">
                      Copy
                    </Label>
                    <p className="text-sm text-gray-500">
                      Keep BPA novel and create AR copy
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* AR Level Selection */}
            <div className="space-y-2">
              <Label htmlFor="ar-level" className="text-base font-medium">
                Target AR Level
              </Label>
              <Select value={selectedARId} onValueChange={setSelectedARId}>
                <SelectTrigger id="ar-level" className="w-full">
                  <SelectValue placeholder="Choose an AR level" />
                </SelectTrigger>
                <SelectContent>
                  {arLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>{level.level}</span>
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
            </div>

            {/* Dynamic Warning */}
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> {operationDescriptions[operation]}
              </p>
            </div>

            {state?.error && (
              <p className="text-base text-red-600">{state.error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSelectedARId("");
                setOperation("move");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedARId}>
              {operation === "move" ? "Move to AR" : "Copy to AR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
