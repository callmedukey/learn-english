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

import DeleteARDialog from "./delete-ar-dialog";
import EditARDialog from "./edit-ar-dialog";
import OverridePointsDialog from "./override-points-dialog";
import { ARData } from "../query/ar.query";

interface ARTableProps {
  ars: ARData[];
  userRole?: Role;
}

const ARTable: React.FC<ARTableProps> = ({ ars, userRole }) => {
  if (!ars || ars.length === 0) {
    return (
      <p className="text-center text-gray-500">No Lexile records found.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {userRole === Role.ADMIN && (
            <TableHead className="text-left">Actions</TableHead>
          )}
          <TableHead>Level</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Stars</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Novel Count</TableHead>
          <TableHead>Free Chapters</TableHead>
          <TableHead>Font Size</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ars.map((ar) => (
          <TableRow key={ar.id}>
            {userRole === Role.ADMIN && (
              <TableCell className="text-left">
                <div className="flex items-center justify-start space-x-2">
                  <EditARDialog ar={ar}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </EditARDialog>
                  <OverridePointsDialog
                    arId={ar.id}
                    arLevel={ar.level}
                    questionCount={ar.questionCount}
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
                  <DeleteARDialog
                    arId={ar.id}
                    arLevel={ar.level}
                    novelCount={ar.novelCount}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DeleteARDialog>
                </div>
              </TableCell>
            )}
            <TableCell className="font-medium">
              <Link
                href={`/admin/novels/${encodeURIComponent(ar.id)}`}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                {ar.level}
              </Link>
            </TableCell>
            <TableCell>{ar.score}</TableCell>
            <TableCell>
              <div className="flex items-center">
                {"★".repeat(ar.stars)}
                {"☆".repeat(5 - ar.stars)}
                <span className="ml-1 text-base text-gray-500">({ar.stars})</span>
              </div>
            </TableCell>
            <TableCell
              className="max-w-xs truncate"
              title={ar?.description || ""}
            >
              {ar.description}
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 hover:bg-blue-200">
                {ar.novelCount}
              </span>
            </TableCell>
            <TableCell>
              {ar.freeChapterCount > 0 ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-sm font-medium text-green-800">
                  {ar.freeChapterCount} free
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-sm font-medium text-gray-500">
                  None
                </span>
              )}
            </TableCell>
            <TableCell>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-sm font-medium text-amber-800">
                {ar.ARSettings?.fontSize || "BASE"}
              </span>
            </TableCell>
            <TableCell className="text-base text-gray-500">
              {format(new Date(ar.createdAt), "yyyy/MM/dd")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ARTable;
