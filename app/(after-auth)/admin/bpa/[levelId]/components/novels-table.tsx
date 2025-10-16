"use client";

import { format } from "date-fns";
import { Edit, Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import Link from "next/link";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

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
import { canEditBPANovel, canDeleteBPANovel, canLockBPANovel } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";

import { BulkToggleComingSoonDialog } from "./bulk-toggle-coming-soon-dialog";
import { BulkToggleHiddenDialog } from "./bulk-toggle-hidden-dialog";
import CopyNovelDialog from "./copy-novel-dialog";
import DeleteNovelAlert from "./delete-novel-alert";
import MoveNovelDialog from "./move-novel-dialog";
import { toggleBPANovelLock } from "../../actions/bpa-novel.actions";
import { BPANovelData } from "../../query/bpa.query";

interface NovelsTableProps {
  novels: BPANovelData[];
  bpaLevels: {
    id: string;
    name: string;
    description: string | null;
    stars: number;
  }[];
  userRole?: Role;
}

const NovelsTable: React.FC<NovelsTableProps> = ({ novels, bpaLevels, userRole }) => {
  const [selectedNovels, setSelectedNovels] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [lockingNovelId, setLockingNovelId] = useState<string | null>(null);

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

  const handleLockToggle = async (novelId: string) => {
    setLockingNovelId(novelId);
    startTransition(async () => {
      const result = await toggleBPANovelLock(novelId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || "Failed to toggle lock status");
      }
      setLockingNovelId(null);
    });
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
          <p className="text-base font-medium">
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
              {(canEditBPANovel(userRole) || canDeleteBPANovel(userRole)) && (
                <TableHead className="text-left">Actions</TableHead>
              )}
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              {canLockBPANovel(userRole) && <TableHead>Lock</TableHead>}
              <TableHead>Chapters</TableHead>
              <TableHead>Free Chapters</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {novels.map((novel) => {
              const freeChaptersCount = novel.chapters.filter(
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
                  {(canEditBPANovel(userRole, novel.locked) || canDeleteBPANovel(userRole)) && (
                    <TableCell className="text-left">
                      <div className="flex items-center justify-start space-x-2">
                        {canEditBPANovel(userRole, novel.locked) && (
                          <Button variant="outline" size="sm">
                            <Link
                              href={`/admin/bpa/${novel.bpaLevel?.id}/${novel.id}/edit`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {canDeleteBPANovel(userRole) && novel.bpaLevel && (
                          <>
                            <MoveNovelDialog
                              novelId={novel.id}
                              novelTitle={novel.title}
                              currentLevelId={novel.bpaLevel.id}
                              bpaLevels={bpaLevels}
                            />
                            <CopyNovelDialog
                              novelId={novel.id}
                              novelTitle={novel.title}
                              currentLevelId={novel.bpaLevel.id}
                              bpaLevels={bpaLevels}
                            />
                          </>
                        )}
                        {canDeleteBPANovel(userRole) && (
                          <DeleteNovelAlert
                            novelId={novel.id}
                            title={novel.title}
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {novel.title}
                      {novel.locked && (
                        <span title="Locked - Only admins can edit">
                          <Lock className="h-4 w-4 text-amber-600" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {novel.description || "No description"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {novel.hidden ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                          <Eye className="mr-1 h-3 w-3" />
                          Visible
                        </span>
                      )}
                      {novel.comingSoon && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-800">
                          Coming Next Month
                        </span>
                      )}
                    </div>
                  </TableCell>
                  {canLockBPANovel(userRole) && (
                    <TableCell>
                      <Button
                        variant={novel.locked ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleLockToggle(novel.id)}
                        disabled={isPending && lockingNovelId === novel.id}
                      >
                        {novel.locked ? (
                          <Lock className="h-4 w-4 text-amber-600" />
                        ) : (
                          <LockOpen className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  )}
                  <TableCell>
                    {novel.chapters.length > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                        {novel.chapters.length} chapters
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                        No chapters
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {freeChaptersCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                        {freeChaptersCount} free
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-500">
                        None
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-base text-gray-500">
                    {format(new Date(novel.createdAt), "yyyy/MM/dd")}
                  </TableCell>
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
