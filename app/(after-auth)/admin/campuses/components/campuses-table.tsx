import { format } from "date-fns";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { prisma } from "@/prisma/prisma-client";

import DeleteCampusDialog from "./delete-campus-dialog";
import UpdateCampusDialog from "./update-campus-dialog";

const CampusesTable = async () => {
  const campuses = await prisma.campus.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!campuses || campuses.length === 0) {
    return <p className="text-center text-gray-500">No campuses found.</p>;
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
            Campus Name
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            User Count
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Created At
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Updated At
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
        {campuses.map((campus, index) => (
          <TableRow key={campus.id}>
            <TableCell className="px-6 py-4 text-center text-sm font-medium whitespace-nowrap text-gray-900">
              {index + 1}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-900">
              {campus.name}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
              {campus._count.users}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
              {format(new Date(campus.createdAt), "yyyy/MM/dd")}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-sm whitespace-nowrap text-gray-500">
              {format(new Date(campus.updatedAt), "yyyy/MM/dd")}
            </TableCell>
            <TableCell className="flex items-center justify-center space-x-2 py-4 text-sm font-medium whitespace-nowrap">
              <UpdateCampusDialog campus={campus}>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </UpdateCampusDialog>
              <DeleteCampusDialog
                campusId={campus.id}
                campusName={campus.name}
                userCount={campus._count.users}
              >
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </DeleteCampusDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CampusesTable;
