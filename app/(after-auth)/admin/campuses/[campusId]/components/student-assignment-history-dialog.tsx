"use client";

import { format } from "date-fns";
import { Clock, History } from "lucide-react";
import React, { ReactNode, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BPAAssignmentAction } from "@/prisma/generated/prisma";

import { AssignmentHistoryRecord } from "../queries/assignment-history.query";

interface StudentAssignmentHistoryDialogProps {
  studentName: string;
  history: AssignmentHistoryRecord[];
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEditAssignment?: (historyRecord: AssignmentHistoryRecord) => void;
}

const getActionBadge = (action: BPAAssignmentAction) => {
  switch (action) {
    case "CREATED":
      return (
        <Badge variant="default" className="bg-green-600">
          Created
        </Badge>
      );
    case "UPDATED":
      return (
        <Badge variant="default" className="bg-blue-600">
          Updated
        </Badge>
      );
    case "DELETED":
      return (
        <Badge variant="destructive">
          Deleted
        </Badge>
      );
  }
};

const StudentAssignmentHistoryDialog: React.FC<
  StudentAssignmentHistoryDialogProps
> = ({ studentName, history, children, open, onOpenChange, onEditAssignment }) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or uncontrolled state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Assignment History</span>
          </DialogTitle>
          <DialogDescription>
            Complete assignment history for <span className="font-medium">{studentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh]">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No assignment history found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Timeframe</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Date</TableHead>
                  {onEditAssignment && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{getActionBadge(record.action)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.timeframe.year}</span>
                        {record.semester ? (
                          <span className="text-xs text-gray-500">
                            {format(new Date(record.semester.startDate), "MMM d")} -{" "}
                            {format(new Date(record.semester.endDate), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {format(new Date(record.timeframe.startDate), "MMM yyyy")} -{" "}
                            {format(new Date(record.timeframe.endDate), "MMM yyyy")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {record.season.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {record.bpaLevel.name} ({record.bpaLevel.stars} ⭐)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.assignedByUser ? (
                        <div className="flex flex-col">
                          <span>{record.assignedByUser.name || "-"}</span>
                          <span className="text-xs text-gray-500">
                            {record.assignedByUser.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(record.createdAt), "yyyy/MM/dd HH:mm")}
                    </TableCell>
                    {onEditAssignment && (
                      <TableCell className="text-right">
                        {record.action !== "DELETED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditAssignment(record)}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentAssignmentHistoryDialog;
