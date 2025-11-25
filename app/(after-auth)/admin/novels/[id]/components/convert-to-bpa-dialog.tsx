"use client";

import { ArrowRightFromLine, Plus, Trash2, Edit2, ChevronDown, ChevronRight, CheckSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { copyNovelToBPALevel, moveNovelToBPALevel } from "../../actions/convert-to-bpa.actions";
import type { ConversionFormData, UnitDefinition, ConversionStep } from "../../types/convert-to-bpa.types";

interface ConvertToBPADialogProps {
  novelId: string;
  novelTitle: string;
  chapters: {
    id: string;
    orderNumber: number;
    title: string;
    description: string | null;
  }[];
  bpaLevels: {
    id: string;
    name: string;
    description: string | null;
    stars: number;
  }[];
}

type OperationType = "move" | "copy";

export default function ConvertToBPADialog({
  novelId,
  novelTitle,
  chapters,
  bpaLevels,
}: ConvertToBPADialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ConversionStep>("config");
  const [operation, setOperation] = useState<OperationType>("move");
  const [selectedBPALevelId, setSelectedBPALevelId] = useState("");
  const [units, setUnits] = useState<UnitDefinition[]>([]);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConfirmedUnassigned, setHasConfirmedUnassigned] = useState(false);

  // Unit builder state
  const [unitName, setUnitName] = useState("");
  const [unitDescription, setUnitDescription] = useState("");
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  const resetDialog = () => {
    setStep("config");
    setOperation("move");
    setSelectedBPALevelId("");
    setUnits([]);
    setExpandedUnits(new Set());
    setUnitName("");
    setUnitDescription("");
    setEditingUnitId(null);
    setIsSubmitting(false);
    setHasConfirmedUnassigned(false);
  };

  const handleAddOrUpdateUnit = () => {
    if (!unitName.trim()) {
      toast.error("Unit name is required");
      return;
    }

    if (editingUnitId) {
      // Update existing unit
      setUnits((prev) =>
        prev.map((u) =>
          u.id === editingUnitId
            ? { ...u, name: unitName, description: unitDescription }
            : u
        )
      );
      toast.success("Unit updated");
    } else {
      // Add new unit
      const newUnit: UnitDefinition = {
        id: crypto.randomUUID(),
        name: unitName,
        description: unitDescription || undefined,
        orderNumber: units.length + 1,
        chapterIds: [],
      };
      setUnits((prev) => [...prev, newUnit]);
      toast.success("Unit added");
    }

    setUnitName("");
    setUnitDescription("");
    setEditingUnitId(null);
  };

  const handleEditUnit = (unit: UnitDefinition) => {
    setUnitName(unit.name);
    setUnitDescription(unit.description || "");
    setEditingUnitId(unit.id);
  };

  const handleDeleteUnit = (unitId: string) => {
    setUnits((prev) => {
      const filtered = prev.filter((u) => u.id !== unitId);
      // Reorder remaining units
      return filtered.map((u, idx) => ({ ...u, orderNumber: idx + 1 }));
    });
    toast.success("Unit deleted");
  };

  const handleToggleChapter = (unitId: string, chapterId: string) => {
    setUnits((prev) =>
      prev.map((unit) => {
        if (unit.id === unitId) {
          const hasChapter = unit.chapterIds.includes(chapterId);
          return {
            ...unit,
            chapterIds: hasChapter
              ? unit.chapterIds.filter((id) => id !== chapterId)
              : [...unit.chapterIds, chapterId],
          };
        }
        // Remove from other units (ensure no duplicates)
        return {
          ...unit,
          chapterIds: unit.chapterIds.filter((id) => id !== chapterId),
        };
      })
    );
  };

  const handleSelectAllUnassigned = (unitId: string) => {
    const unassignedChapters = getUnassignedChapters();
    if (unassignedChapters.length === 0) {
      toast.info("All chapters are already assigned");
      return;
    }

    setUnits((prev) =>
      prev.map((unit) => {
        if (unit.id === unitId) {
          return {
            ...unit,
            chapterIds: [...unit.chapterIds, ...unassignedChapters.map((ch) => ch.id)],
          };
        }
        return unit;
      })
    );
    toast.success(`Assigned ${unassignedChapters.length} unassigned chapter(s) to ${units.find(u => u.id === unitId)?.name}`);
  };

  const toggleUnitExpansion = (unitId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const getAssignedChapterIds = () => {
    const assigned = new Set<string>();
    units.forEach((unit) => {
      unit.chapterIds.forEach((id) => assigned.add(id));
    });
    return assigned;
  };

  const getUnassignedChapters = () => {
    const assignedIds = getAssignedChapterIds();
    return chapters.filter((ch) => !assignedIds.has(ch.id));
  };

  // Check if chapter is assigned to a different unit
  const isChapterInOtherUnit = (currentUnitId: string, chapterId: string): string | null => {
    for (const unit of units) {
      if (unit.id !== currentUnitId && unit.chapterIds.includes(chapterId)) {
        return unit.name;
      }
    }
    return null;
  };

  const handleNext = () => {
    if (step === "config") {
      if (!selectedBPALevelId) {
        toast.error("Please select a BPA level");
        return;
      }
      setStep("units");
    } else if (step === "units") {
      if (units.length === 0) {
        toast.error("Please create at least one unit");
        return;
      }
      setStep("chapters");
    } else if (step === "chapters") {
      setHasConfirmedUnassigned(false); // Reset confirmation when entering preview
      setStep("preview");
    }
  };

  const handleBack = () => {
    if (step === "units") {
      setStep("config");
    } else if (step === "chapters") {
      setStep("units");
    } else if (step === "preview") {
      setStep("chapters");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const formData: ConversionFormData = {
      sourceNovelId: novelId,
      targetBPALevelId: selectedBPALevelId,
      operationType: operation,
      units,
    };

    try {
      const result =
        operation === "move"
          ? await moveNovelToBPALevel(formData)
          : await copyNovelToBPALevel(formData);

      if (result.success) {
        const operationText = operation === "move" ? "moved to" : "copied to";
        toast.success(`Novel ${operationText} BPA level successfully`);
        setOpen(false);
        resetDialog();
      } else {
        toast.error(result.error || "Failed to convert novel");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "config":
        return (
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
                      Convert and delete the source Novel
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
                      Keep Novel and create BPA copy
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* BPA Level Selection */}
            <div className="space-y-2">
              <Label htmlFor="bpa-level" className="text-base font-medium">
                Target BPA Level
              </Label>
              <Select value={selectedBPALevelId} onValueChange={setSelectedBPALevelId}>
                <SelectTrigger id="bpa-level" className="w-full">
                  <SelectValue placeholder="Choose a BPA level" />
                </SelectTrigger>
                <SelectContent>
                  {bpaLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      <div className="flex w-full items-center justify-between">
                        <span>{level.name}</span>
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

            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-800">
                <strong>Next:</strong> You&apos;ll create units to organize the {chapters.length} chapters
                from this novel.
              </p>
            </div>
          </div>
        );

      case "units":
        return (
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Create Units</Label>

              {/* Unit Builder Form */}
              <div className="space-y-3 rounded-lg border p-4 bg-gray-50">
                <div className="space-y-2">
                  <Label htmlFor="unit-name">Unit Name *</Label>
                  <Input
                    id="unit-name"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="e.g., Introduction, Main Story, Conclusion"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-description">Unit Description (Optional)</Label>
                  <Textarea
                    id="unit-description"
                    value={unitDescription}
                    onChange={(e) => setUnitDescription(e.target.value)}
                    placeholder="Brief description of this unit"
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddOrUpdateUnit}
                  size="sm"
                  className="w-full"
                >
                  {editingUnitId ? (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Update Unit
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Unit
                    </>
                  )}
                </Button>
              </div>

              {/* Units List */}
              {units.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    Units ({units.length})
                  </Label>
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-start justify-between rounded-lg border p-3 bg-white"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{unit.name}</div>
                        {unit.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {unit.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Order: {unit.orderNumber} | Chapters: {unit.chapterIds.length}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUnit(unit)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUnit(unit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {units.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-4">
                  No units created yet. Add your first unit above.
                </div>
              )}
            </div>
          </div>
        );

      case "chapters":
        const unassignedChapters = getUnassignedChapters();
        return (
          <div className="grid gap-6 py-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Assign Chapters to Units
              </Label>

              {units.map((unit) => {
                const isExpanded = expandedUnits.has(unit.id);
                return (
                  <div key={unit.id} className="rounded-lg border">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleUnitExpansion(unit.id)}
                        className="flex items-center gap-2 flex-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div className="text-left">
                          <div className="font-medium">{unit.name}</div>
                          <div className="text-sm text-gray-500">
                            {unit.chapterIds.length} chapter(s) assigned
                          </div>
                        </div>
                      </button>
                      {unassignedChapters.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllUnassigned(unit.id);
                          }}
                          className="ml-2"
                        >
                          <CheckSquare className="h-3 w-3 mr-1" />
                          Select All Unassigned
                        </Button>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="border-t p-4 space-y-2 bg-gray-50">
                        {chapters.map((chapter) => {
                          const isAssignedToThisUnit = unit.chapterIds.includes(chapter.id);
                          const assignedToOtherUnit = isChapterInOtherUnit(unit.id, chapter.id);
                          const isDisabled = !!assignedToOtherUnit;

                          return (
                            <div
                              key={chapter.id}
                              className={`flex items-start space-x-3 p-2 rounded ${
                                isDisabled ? "opacity-50" : "hover:bg-white"
                              }`}
                            >
                              <Checkbox
                                id={`${unit.id}-${chapter.id}`}
                                checked={isAssignedToThisUnit}
                                disabled={isDisabled}
                                onCheckedChange={() =>
                                  handleToggleChapter(unit.id, chapter.id)
                                }
                              />
                              <label
                                htmlFor={`${unit.id}-${chapter.id}`}
                                className={`flex-1 text-sm ${
                                  isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                                }`}
                              >
                                <div className="font-medium flex items-center gap-2">
                                  <span>
                                    {chapter.orderNumber}. {chapter.title}
                                  </span>
                                  {assignedToOtherUnit && (
                                    <span className="text-xs text-amber-600 font-normal">
                                      (in {assignedToOtherUnit})
                                    </span>
                                  )}
                                </div>
                                {chapter.description && (
                                  <div className="text-gray-500 text-xs mt-1">
                                    {chapter.description}
                                  </div>
                                )}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {unassignedChapters.length > 0 && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Warning:</strong> {unassignedChapters.length} chapter(s) not
                    assigned to any unit. Please assign all chapters before proceeding.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case "preview":
        const assignedChapterIds = getAssignedChapterIds();
        const unassignedChaptersInPreview = getUnassignedChapters();
        const totalChapters = chapters.length;
        const assignedCount = assignedChapterIds.size;
        const unassignedCount = unassignedChaptersInPreview.length;

        return (
          <div className="grid gap-6 py-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-4">
              <Label className="text-base font-medium">Preview Structure</Label>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 bg-blue-50">
                  <div className="text-xs text-gray-600">Total Chapters</div>
                  <div className="text-2xl font-bold text-blue-700">{totalChapters}</div>
                </div>
                <div className="rounded-lg border p-3 bg-green-50">
                  <div className="text-xs text-gray-600">Assigned</div>
                  <div className="text-2xl font-bold text-green-700">{assignedCount}</div>
                </div>
                <div className={`rounded-lg border p-3 ${unassignedCount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div className="text-xs text-gray-600">Unassigned</div>
                  <div className={`text-2xl font-bold ${unassignedCount > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
                    {unassignedCount}
                  </div>
                </div>
              </div>

              {/* Structure Preview */}
              <div className="rounded-lg border p-4 bg-gray-50">
                <div className="font-bold text-lg mb-4">
                  {novelTitle}
                  <span className="text-sm text-gray-500 ml-2">
                    ({operation === "move" ? "Move" : "Copy"})
                  </span>
                </div>

                {units.map((unit) => {
                  const unitChapters = chapters
                    .filter((ch) => unit.chapterIds.includes(ch.id))
                    .sort((a, b) => a.orderNumber - b.orderNumber);

                  return (
                    <div key={unit.id} className="mb-4 ml-4">
                      <div className="font-semibold text-base">
                        📁 {unit.name}
                      </div>
                      {unit.description && (
                        <div className="text-sm text-gray-600 ml-4 mb-2">
                          {unit.description}
                        </div>
                      )}
                      <div className="ml-4 space-y-1">
                        {unitChapters.map((chapter) => (
                          <div key={chapter.id} className="text-sm">
                            📄 {chapter.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Warning and Confirmation for Unassigned Chapters */}
              {unassignedCount > 0 ? (
                <>
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800 mb-2">
                          ⚠️ Warning: Unassigned Chapters
                        </p>
                        <p className="text-sm text-amber-700 mb-3">
                          {unassignedCount} chapter(s) are not assigned to any unit and will NOT be included in the BPA novel:
                        </p>
                        <ul className="list-disc list-inside text-sm text-amber-700 space-y-1 ml-2">
                          {unassignedChaptersInPreview.slice(0, 5).map((ch) => (
                            <li key={ch.id}>
                              {ch.orderNumber}. {ch.title}
                            </li>
                          ))}
                          {unassignedCount > 5 && (
                            <li className="text-amber-600 italic">
                              ...and {unassignedCount - 5} more
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="confirm-unassigned"
                        checked={hasConfirmedUnassigned}
                        onCheckedChange={(checked) => setHasConfirmedUnassigned(checked === true)}
                      />
                      <label
                        htmlFor="confirm-unassigned"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        I understand that {unassignedCount} unassigned chapter(s) will NOT be included in the BPA novel
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-md bg-green-50 border border-green-200 p-3">
                  <p className="text-sm text-green-800">
                    <strong>Ready to convert!</strong> This will create a BPA novel with{" "}
                    {units.length} unit(s) and {assignedCount} chapter(s).
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "config":
        return "Configuration";
      case "units":
        return "Create Units";
      case "chapters":
        return "Assign Chapters";
      case "preview":
        return "Preview & Confirm";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightFromLine className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Convert to BPA - {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            Convert &quot;{novelTitle}&quot; to BPA format with unit organization
          </DialogDescription>
        </DialogHeader>

        {renderStep()}

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step !== "config" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetDialog();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {step !== "preview" ? (
              <Button type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (getUnassignedChapters().length > 0 && !hasConfirmedUnassigned)}
              >
                {isSubmitting ? "Converting..." : "Convert to BPA"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
