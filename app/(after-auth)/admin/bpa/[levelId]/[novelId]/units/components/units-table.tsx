"use client";

import DOMPurify from "isomorphic-dompurify";
import { GripVertical } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DeleteUnitDialog } from "./delete-unit-dialog";
import { EditUnitDialog } from "./edit-unit-dialog";

interface Unit {
  id: string;
  name: string;
  description: string | null;
  orderNumber: number;
  chapterCount: number;
}

interface UnitsTableProps {
  units: Unit[];
  onReorder?: () => void;
}

export function UnitsTable({ units, onReorder }: UnitsTableProps) {
  if (units.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No units created yet. Create your first unit to get started.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Order</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Chapters</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((unit) => (
            <TableRow key={unit.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                  <span className="font-medium">{unit.orderNumber}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{unit.name}</TableCell>
              <TableCell className="max-w-md truncate">
                {unit.description ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(unit.description),
                    }}
                  />
                ) : (
                  <span className="text-gray-400">No description</span>
                )}
              </TableCell>
              <TableCell>
                {unit.chapterCount > 0 ? (
                  <Badge variant="outline">{unit.chapterCount} chapters</Badge>
                ) : (
                  <span className="text-gray-400 text-sm">No chapters</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <EditUnitDialog unit={unit} onSuccess={onReorder} />
                  <DeleteUnitDialog
                    unit={unit}
                    availableUnits={units}
                    onSuccess={onReorder}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
