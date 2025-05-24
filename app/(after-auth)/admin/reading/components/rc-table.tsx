import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
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

import DeleteRCDialog from "./delete-rc-dialog";
import EditRCDialog from "./edit-rc-dialog";
import { RCLevelData } from "../query/rc.query";

interface RCTableProps {
  rcLevels: RCLevelData[];
}

const RCTable: React.FC<RCTableProps> = ({ rcLevels }) => {
  if (!rcLevels || rcLevels.length === 0) {
    return <p className="text-center text-gray-500">No RC levels found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Level</TableHead>
          <TableHead>Relevant Grade</TableHead>
          <TableHead>Stars</TableHead>
          <TableHead>Questions</TableHead>
          <TableHead>Keywords</TableHead>
          <TableHead>Free Keywords</TableHead>
          <TableHead>Total Questions</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rcLevels.map((rcLevel) => (
          <TableRow key={rcLevel.id}>
            <TableCell className="font-medium">
              <Link
                href={`/admin/reading/${encodeURIComponent(rcLevel.id)}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {rcLevel.level}
              </Link>
            </TableCell>
            <TableCell>{rcLevel.relevantGrade}</TableCell>
            <TableCell>
              <div className="flex items-center">
                {"★".repeat(rcLevel.stars)}
                {"☆".repeat(5 - rcLevel.stars)}
                <span className="ml-1 text-sm text-gray-500">
                  ({rcLevel.stars})
                </span>
              </div>
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                {rcLevel.numberOfQuestions}
              </span>
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                {rcLevel.keywordCount}
              </span>
            </TableCell>
            <TableCell>
              {rcLevel.freeKeywordCount > 0 ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                  {rcLevel.freeKeywordCount} free
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                  No free
                </span>
              )}
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {rcLevel.questionCount}
              </span>
            </TableCell>
            <TableCell
              className="max-w-xs truncate"
              title={rcLevel?.description || ""}
            >
              {rcLevel.description}
            </TableCell>
            <TableCell className="text-sm text-gray-500">
              {format(new Date(rcLevel.createdAt), "yyyy/MM/dd")}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end space-x-2">
                <EditRCDialog rcLevel={rcLevel}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </EditRCDialog>
                <DeleteRCDialog
                  rcLevelId={rcLevel.id}
                  rcLevel={rcLevel.level}
                  keywordCount={rcLevel.keywordCount}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DeleteRCDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RCTable;
