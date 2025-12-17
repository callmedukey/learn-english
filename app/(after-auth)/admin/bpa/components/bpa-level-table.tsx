"use client";

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
import { Role } from "@/prisma/generated/prisma";

import BPALevelActions from "./bpa-level-actions";
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
                <BPALevelActions level={level} />
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
              <div className="flex items-center gap-0.5">
                {/* Full stars */}
                {Array.from({ length: Math.floor(level.stars) }).map((_, i) => (
                  <span key={`full-${i}`} className="text-amber-400">★</span>
                ))}
                {/* Half star */}
                {level.stars % 1 >= 0.5 && (
                  <span className="relative inline-block">
                    <span className="text-gray-300">★</span>
                    <span className="absolute left-0 top-0 overflow-hidden text-amber-400" style={{ width: '0.45em' }}>★</span>
                  </span>
                )}
                {/* Empty stars */}
                {Array.from({ length: 5 - Math.floor(level.stars) - (level.stars % 1 >= 0.5 ? 1 : 0) }).map((_, i) => (
                  <span key={`empty-${i}`} className="text-gray-300">★</span>
                ))}
                <span className="ml-1 text-sm text-gray-500">({level.stars})</span>
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
