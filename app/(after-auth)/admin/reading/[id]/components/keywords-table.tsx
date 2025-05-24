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

import DeleteKeywordAlert from "./delete-keyword-alert";
import { RCKeywordData } from "../../query/rc-detail.query";

interface KeywordsTableProps {
  keywords: RCKeywordData[];
}

const KeywordsTable: React.FC<KeywordsTableProps> = ({ keywords }) => {
  if (!keywords || keywords.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">No keywords found for this level.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Paid/Free</TableHead>
            <TableHead>Question Set</TableHead>
            <TableHead>Questions</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keywords.map((keyword) => (
            <TableRow key={keyword.id}>
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
              <TableCell className="text-sm text-gray-500">
                {format(new Date(keyword.createdAt), "yyyy/MM/dd")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/admin/reading/${keyword.rcLevelId}/${keyword.id}/edit`}
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DeleteKeywordAlert
                    keywordId={keyword.id}
                    name={keyword.name}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default KeywordsTable;
