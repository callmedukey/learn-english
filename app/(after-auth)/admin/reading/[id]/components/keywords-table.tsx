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
import { canEditKeyword, canDeleteKeyword } from "@/lib/utils/permissions";
import { Role } from "@/prisma/generated/prisma";

import { BulkToggleComingSoonDialog } from "./bulk-toggle-coming-soon-dialog";
import { BulkToggleHiddenDialog } from "./bulk-toggle-hidden-dialog";
import DeleteKeywordAlert from "./delete-keyword-alert";
import MoveKeywordDialog from "./move-keyword-dialog";
import { RCKeywordData } from "../../query/rc-detail.query";

interface KeywordsTableProps {
  keywords: RCKeywordData[];
  rcLevels: {
    id: string;
    level: string;
    description: string | null;
    stars: number;
  }[];
  userRole?: Role;
}

const KeywordsTable: React.FC<KeywordsTableProps> = ({
  keywords,
  rcLevels,
  userRole,
}) => {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKeywords(keywords.map((k) => k.id));
    } else {
      setSelectedKeywords([]);
    }
  };

  const handleSelectOne = (keywordId: string, checked: boolean) => {
    if (checked) {
      setSelectedKeywords([...selectedKeywords, keywordId]);
    } else {
      setSelectedKeywords(selectedKeywords.filter((id) => id !== keywordId));
    }
  };

  const isAllSelected =
    keywords.length > 0 && selectedKeywords.length === keywords.length;
  const isIndeterminate =
    selectedKeywords.length > 0 && selectedKeywords.length < keywords.length;

  if (!keywords || keywords.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No keywords found for this level.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {userRole === Role.ADMIN && selectedKeywords.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
          <p className="text-sm font-medium">
            {selectedKeywords.length} keyword
            {selectedKeywords.length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center space-x-2">
            <BulkToggleHiddenDialog
              selectedKeywordIds={selectedKeywords}
              onSuccess={() => setSelectedKeywords([])}
            />
            <BulkToggleComingSoonDialog
              selectedKeywordIds={selectedKeywords}
              onSuccess={() => setSelectedKeywords([])}
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
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Paid/Free</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Question Set</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Challenge</TableHead>
              <TableHead>Created At</TableHead>
              {(canEditKeyword(userRole) || canDeleteKeyword(userRole)) && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((keyword) => (
              <TableRow key={keyword.id}>
                {userRole === Role.ADMIN && (
                  <TableCell>
                    <Checkbox
                      checked={selectedKeywords.includes(keyword.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(keyword.id, checked as boolean)
                      }
                      aria-label={`Select ${keyword.name}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{keyword.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {keyword.description || "No description"}
                </TableCell>
                <TableCell>
                  {keyword.isFree ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                      Paid
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {keyword.hidden ? (
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
                    {keyword.comingSoon && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        Coming Next Month
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {keyword.RCQuestionSet ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Has question set
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      No question set
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {keyword.RCQuestionSet?.RCQuestion.length ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {keyword.RCQuestionSet.RCQuestion.length} questions
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      No questions
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <ChallengeBadge challenges={keyword.challenges || []} />
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {format(new Date(keyword.createdAt), "yyyy/MM/dd")}
                </TableCell>
                {(canEditKeyword(userRole) || canDeleteKeyword(userRole)) && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {canEditKeyword(userRole) && (
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/admin/reading/${keyword.rcLevelId}/${keyword.id}/edit`}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {canDeleteKeyword(userRole) && (
                        <>
                          <MoveKeywordDialog
                            keywordId={keyword.id}
                            keywordName={keyword.name}
                            currentRCLevelId={keyword.rcLevelId}
                            rcLevels={rcLevels}
                          />
                          <DeleteKeywordAlert
                            keywordId={keyword.id}
                            name={keyword.name}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default KeywordsTable;
