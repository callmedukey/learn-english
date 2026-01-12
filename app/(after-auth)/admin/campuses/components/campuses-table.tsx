import { format } from "date-fns";
import Link from "next/link";
import React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/prisma/prisma-client";

import CampusActions from "./campus-actions";

interface CampusesTableProps {
  showActions: boolean;
}

const CampusesTable = async ({ showActions }: CampusesTableProps) => {
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
          {showActions && (
            <TableHead
              scope="col"
              className="px-6 py-3 text-left text-sm font-medium uppercase tracking-wider text-gray-500"
            >
              Actions
            </TableHead>
          )}
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-gray-500"
          >
            No.
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-gray-500"
          >
            Campus Name
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-gray-500"
          >
            User Count
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-gray-500"
          >
            Created At
          </TableHead>
          <TableHead
            scope="col"
            className="px-6 py-3 text-center text-sm font-medium uppercase tracking-wider text-gray-500"
          >
            Updated At
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campuses.map((campus, index) => (
          <TableRow key={campus.id}>
            {showActions && (
              <TableCell className="flex items-center justify-start space-x-2 whitespace-nowrap px-6 py-4 text-base font-medium">
                <CampusActions campus={campus} />
              </TableCell>
            )}
            <TableCell className="whitespace-nowrap px-6 py-4 text-center text-base font-medium text-gray-900">
              {index + 1}
            </TableCell>
            <TableCell className="whitespace-nowrap px-6 py-4 text-center text-base text-gray-900">
              <Link
                href={`/admin/campuses/${campus.id}`}
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                {campus.name}
              </Link>
            </TableCell>
            <TableCell className="whitespace-nowrap px-6 py-4 text-center text-base text-gray-500">
              {campus._count.users}
            </TableCell>
            <TableCell className="whitespace-nowrap px-6 py-4 text-center text-base text-gray-500">
              {format(new Date(campus.createdAt), "yyyy/MM/dd")}
            </TableCell>
            <TableCell className="whitespace-nowrap px-6 py-4 text-center text-base text-gray-500">
              {format(new Date(campus.updatedAt), "yyyy/MM/dd")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CampusesTable;
