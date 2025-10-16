import { format } from "date-fns";
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
            className="px-6 py-3 text-left text-sm font-medium tracking-wider text-gray-500 uppercase"
          >
            Actions
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium tracking-wider text-gray-500 uppercase"
          >
            No.
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium tracking-wider text-gray-500 uppercase"
          >
            Campus Name
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium tracking-wider text-gray-500 uppercase"
          >
            User Count
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium tracking-wider text-gray-500 uppercase"
          >
            Created At
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium tracking-wider text-gray-500 uppercase"
          >
            Updated At
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campuses.map((campus, index) => (
          <TableRow key={campus.id}>
            <TableCell className="flex items-center justify-start space-x-2 py-4 text-base font-medium whitespace-nowrap px-6">
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
            <TableCell className="px-6 py-4 text-center text-base font-medium whitespace-nowrap text-gray-900">
              {index + 1}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-base whitespace-nowrap text-gray-900">
              <Link
                href={`/admin/campuses/${campus.id}`}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                {campus.name}
              </Link>
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-base whitespace-nowrap text-gray-500">
              {campus._count.users}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-base whitespace-nowrap text-gray-500">
              {format(new Date(campus.createdAt), "yyyy/MM/dd")}
            </TableCell>
            <TableCell className="px-6 py-4 text-center text-base whitespace-nowrap text-gray-500">
              {format(new Date(campus.updatedAt), "yyyy/MM/dd")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CampusesTable;
