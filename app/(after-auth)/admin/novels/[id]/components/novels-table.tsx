"use client";

import { format } from "date-fns";
import { Edit, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { ChallengeBadge } from "@/components/admin/challenge-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canEditNovel, canDeleteNovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";

import { BulkToggleComingSoonDialog } from "./bulk-toggle-coming-soon-dialog";
import { BulkToggleHiddenDialog } from "./bulk-toggle-hidden-dialog";
import DeleteNovelAlert from "./delete-novel-alert";
import MoveNovelDialog from "./move-novel-dialog";
import { NovelData } from "../../query/novel.query";

interface NovelsTableProps {
  novels: NovelData[];
  arLevels: {
    id: string;
    level: string;
    description: string | null;
    stars: number;
  }[];
  userRole?: Role;
}

const NovelsTable: React.FC<NovelsTableProps> = ({ novels, arLevels, userRole }) => {
  const [selectedNovels, setSelectedNovels] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNovels(novels.map((n) => n.id));
    } else {
      setSelectedNovels([]);
    }
  };

  const handleSelectOne = (novelId: string, checked: boolean) => {
    if (checked) {
      setSelectedNovels([...selectedNovels, novelId]);
    } else {
      setSelectedNovels(selectedNovels.filter((id) => id !== novelId));
    }
  };

  const isAllSelected =
    novels.length > 0 && selectedNovels.length === novels.length;
  const isIndeterminate =
    selectedNovels.length > 0 && selectedNovels.length < novels.length;

  if (!novels || novels.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No novels found for this level.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {userRole === Role.ADMIN && selectedNovels.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
          <p className="text-sm font-medium">
            {selectedNovels.length} novel
            {selectedNovels.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center space-x-2">
            <BulkToggleHiddenDialog
              selectedNovelIds={selectedNovels}
              onSuccess={() => setSelectedNovels([])}
            />
            <BulkToggleComingSoonDialog
              selectedNovelIds={selectedNovels}
              onSuccess={() => setSelectedNovels([])}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {userRole === Role.ADMIN && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={
                      isIndeterminate ? "data-[state=checked]:bg-gray-400" : ""
                    }
                  />
                </TableHead>
              )}
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Chapters</TableHead>
              <TableHead>Free Chapters</TableHead>
              <TableHead>Challenge</TableHead>
              <TableHead>Created At</TableHead>
              {(canEditNovel(userRole) || canDeleteNovel(userRole)) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {novels.map((novel) => {
              const freeChaptersCount = novel.novelChapters.filter(
                (chapter) => chapter.isFree,
              ).length;

              return (
                <TableRow key={novel.id}>
                  {userRole === Role.ADMIN && (
                    <TableCell>
                      <Checkbox
                        checked={selectedNovels.includes(novel.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(novel.id, checked as boolean)
                        }
                        aria-label={`Select ${novel.title}`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{novel.title}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {novel.description || "No description"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {novel.hidden ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          <Eye className="mr-1 h-3 w-3" />
                          Visible
                        </span>
                      )}
                      {novel.comingSoon && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          Coming Next Month
                        </span>
                      )}
                    </div>
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
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ChallengeBadge challenges={novel.challenges || []} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(novel.createdAt), "yyyy/MM/dd")}
                  </TableCell>
                  {(canEditNovel(userRole) || canDeleteNovel(userRole)) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canEditNovel(userRole) && (
                          <Button variant="outline" size="sm">
                            <Link
                              href={`/admin/novels/${novel.AR?.id}/${novel.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {canDeleteNovel(userRole) && novel.AR && (
                          <MoveNovelDialog
                            novelId={novel.id}
                            novelTitle={novel.title}
                            currentARId={novel.AR.id}
                            arLevels={arLevels}
                          />
                        )}
                        {canDeleteNovel(userRole) && (
                          <DeleteNovelAlert
                            novelId={novel.id}
                            title={novel.title}
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default NovelsTable;
