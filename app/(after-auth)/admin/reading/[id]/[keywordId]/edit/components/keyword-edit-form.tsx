"use client";

import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import QuestionSetSection from "./question-set-section";
import {
  deleteKeywordAction,
  updateKeywordAction,
} from "../actions/keyword-edit.actions";

interface KeywordEditFormProps {
  keyword: {
    id: string;
    name: string;
    description?: string | null;
    rcLevelId: string;
    isFree: boolean;
    RCLevel: {
      id: string;
      level: string;
      description?: string | null;
    };
    RCQuestionSet: {
      id: string;
      title: string;
      passage: string;
      active: boolean;
      timeLimit: number;
      RCQuestion: Array<{
        id: string;
        orderNumber: number;
        question: string;
        choices: string[];
        answer: string;
        explanation: string;
        score: number;
        timeLimit: number;
      }>;
    } | null;
  };
  rcLevels: Array<{
    id: string;
    level: string;
    description?: string | null;
  }>;
}

const KeywordEditForm: React.FC<KeywordEditFormProps> = ({
  keyword,
  rcLevels,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  // Form state
  const [name, setName] = useState(keyword.name);
  const [description, setDescription] = useState(keyword.description || "");
  const [selectedRCLevelId, setSelectedRCLevelId] = useState(keyword.rcLevelId);
  const [isFree, setIsFree] = useState(keyword.isFree);
  const [isActive, setIsActive] = useState(
    keyword.RCQuestionSet?.active || false,
  );

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("keywordId", keyword.id);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("rcLevelId", selectedRCLevelId);
      if (isFree) {
        formData.append("isFree", "on");
      }
      if (isActive) {
        formData.append("isActive", "on");
      }

      const result = await updateKeywordAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Keyword updated successfully");
        router.refresh();
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteKeywordAction(keyword.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Keyword deleted successfully");
        router.push(`/admin/reading/${keyword.rcLevelId}`);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/reading/${keyword.rcLevelId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Keywords
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Keyword</h1>
            <p className="text-gray-600">
              Level: {keyword.RCLevel.level} •{" "}
              {keyword.RCQuestionSet?.RCQuestion.length || 0} questions
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isDeleting} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete Keyword"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  keyword &quot;<strong>{keyword.name}</strong>&quot; and all of
                  its question sets and questions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "Deleting..." : "Yes, delete keyword"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Keyword Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Idea, Character Analysis"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="rcLevel">RC Level</Label>
              <Select
                value={selectedRCLevelId}
                onValueChange={setSelectedRCLevelId}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select RC Level" />
                </SelectTrigger>
                <SelectContent>
                  {rcLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFree"
                checked={isFree}
                onCheckedChange={(checked) => setIsFree(checked === true)}
                disabled={isPending}
              />
              <Label htmlFor="isFree">Free Access</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
                disabled={isPending}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this keyword focuses on..."
              rows={4}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Question Set Section */}
      <QuestionSetSection keyword={keyword} />
    </div>
  );
};

export default KeywordEditForm;
