import { format } from "date-fns";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import ApproveRequestButton from "./approve-request-button";
import RejectRequestButton from "./reject-request-button";
import { getCampusRequests } from "../query/campus-requests.query";

const CampusRequestsTable = async () => {
  const requests = await getCampusRequests("PENDING");

  if (!requests || requests.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
        <p className="text-center text-gray-500">No pending campus requests found.</p>
      </div>
    );
  }

  return (
    <Table className="mx-auto max-w-screen-lg">
      <TableHeader>
        <TableRow>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            No.
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            User
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Campus
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Student Name
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Parent Contact
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Requested At
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Status
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request, index) => (
          <TableRow key={request.id}>
            <TableCell className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-900">
              {index + 1}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-900">
              <div>
                <div className="font-medium">{request.user.nickname}</div>
                <div className="text-xs text-gray-500">{request.user.email}</div>
              </div>
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-900">
              {request.campus.name}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
              {request.user.studentName || "-"}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
              <div>
                {request.user.parentName && (
                  <div className="font-medium">{request.user.parentName}</div>
                )}
                {request.user.parentPhone && (
                  <div className="text-xs">{request.user.parentPhone}</div>
                )}
                {!request.user.parentName && !request.user.parentPhone && "-"}
              </div>
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
              {format(new Date(request.requestedAt), "yyyy/MM/dd HH:mm")}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap">
              <Badge
                variant={
                  request.status === "PENDING"
                    ? "default"
                    : request.status === "APPROVED"
                      ? "secondary"
                      : "destructive"
                }
              >
                {request.status}
              </Badge>
            </TableCell>
            <TableCell className="flex items-center justify-center space-x-2 py-4 text-sm font-medium whitespace-nowrap">
              {request.status === "PENDING" && (
                <>
                  <ApproveRequestButton requestId={request.id} />
                  <RejectRequestButton requestId={request.id} />
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CampusRequestsTable;
