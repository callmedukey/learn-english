"use client";

import { Edit, Target, Trash2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";

import DeleteBPALevelDialog from "./delete-bpa-level-dialog";
import EditBPALevelDialog from "./edit-bpa-level-dialog";
import OverridePointsDialog from "./override-points-dialog";
import { BPALevelData } from "../queries/bpa-admin.query";

interface BPALevelActionsProps {
  level: BPALevelData;
}

const BPALevelActions: React.FC<BPALevelActionsProps> = ({ level }) => {
  return (
    <div className="flex items-center justify-start space-x-2">
      <EditBPALevelDialog level={level}>
        <Button variant="outline" size="sm" title="Edit BPA Level">
          <Edit className="h-4 w-4" />
        </Button>
      </EditBPALevelDialog>
      <OverridePointsDialog
        bpaLevelId={level.id}
        levelName={level.name}
        questionCount={level.questionCount}
      >
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
          title="Override all question points"
        >
          <Target className="h-4 w-4" />
        </Button>
      </OverridePointsDialog>
      <DeleteBPALevelDialog
        levelId={level.id}
        levelName={level.name}
        novelCount={level.novelCount}
      >
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
          title={
            level.novelCount > 0
              ? "Cannot delete level with novels"
              : "Delete BPA Level"
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DeleteBPALevelDialog>
    </div>
  );
};

export default BPALevelActions;
