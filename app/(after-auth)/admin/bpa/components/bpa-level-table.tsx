import { format } from "date-fns";
import { Edit, Target, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Role } from "@/prisma/generated/prisma";

import DeleteBPALevelDialog from "./delete-bpa-level-dialog";
import EditBPALevelDialog from "./edit-bpa-level-dialog";
import OverridePointsDialog from "./override-points-dialog";
import { BPALevelData } from "../queries/bpa-admin.query";

interface BPALevelTableProps {
  levels: BPALevelData[];
  userRole?: Role;
}

const BPALevelTable: React.FC<BPALevelTableProps> = ({ levels, userRole }) => {
  if (!levels || levels.length === 0) {
    return (
      <p className="text-center text-gray-500">No BPA levels found.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {userRole === Role.ADMIN && (
            <TableHead className="text-left">Actions</TableHead>
          )}
          <TableHead>Order</TableHead>
          <TableHead>Level Name</TableHead>
          <TableHead>Stars</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Novel Count</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {levels.map((level) => (
          <TableRow key={level.id}>
            {userRole === Role.ADMIN && (
              <TableCell className="text-left">
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
              </TableCell>
            )}
            <TableCell className="font-medium">{level.orderNumber}</TableCell>
            <TableCell className="font-medium">
              <Link
                href={`/admin/bpa/${encodeURIComponent(level.id)}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {level.name}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                {"★".repeat(level.stars)}
                {"☆".repeat(5 - level.stars)}
                <span className="ml-1 text-base text-gray-500">
                  ({level.stars})
                </span>
              </div>
            </TableCell>
            <TableCell
              className="max-w-xs truncate"
              title={level?.description || ""}
            >
              {level.description || "-"}
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 hover:bg-blue-200">
                {level.novelCount}
              </span>
            </TableCell>
            <TableCell className="text-base text-gray-500">
              {format(new Date(level.createdAt), "yyyy/MM/dd")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BPALevelTable;
