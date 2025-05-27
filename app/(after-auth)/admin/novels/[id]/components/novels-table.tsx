import { format } from "date-fns";
import { Edit } from "lucide-react";
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

import DeleteNovelAlert from "./delete-novel-alert";
import { NovelData } from "../../query/novel.query";

interface NovelsTableProps {
  novels: NovelData[];
}

const NovelsTable: React.FC<NovelsTableProps> = ({ novels }) => {
  if (!novels || novels.length === 0) {
    return (
      <p className="text-center text-gray-500">
        No novels found for this level.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Chapters</TableHead>
          <TableHead>Free Chapters</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {novels.map((novel) => {
          const freeChaptersCount = novel.novelChapters.filter(
            (chapter) => chapter.isFree,
          ).length;

          return (
            <TableRow key={novel.id}>
              <TableCell className="font-medium">{novel.title}</TableCell>
              <TableCell className="max-w-xs truncate">
                {novel.description}
              </TableCell>
              <TableCell>
                {novel.novelChapters.length > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {novel.novelChapters.length} chapters
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    No chapters
                  </span>
                )}
              </TableCell>
              <TableCell>
                {freeChaptersCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    {freeChaptersCount} free
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    No free
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {format(new Date(novel.createdAt), "yyyy/MM/dd")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Link
                      href={`/admin/novels/${novel.AR?.id}/${novel.id}/edit`}
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DeleteNovelAlert novelId={novel.id} title={novel.title} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default NovelsTable;
