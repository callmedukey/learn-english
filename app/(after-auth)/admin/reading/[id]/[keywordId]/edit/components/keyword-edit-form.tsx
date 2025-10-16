"use client";

import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { ChallengeBadge } from "@/components/admin/challenge-badge";
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
import { Role } from "@/prisma/generated/prisma";

import DeleteKeywordDialog from "./delete-keyword-dialog";
import QuestionSetSection from "./question-set-section";
import { updateKeywordAction } from "../actions/keyword-edit.actions";

interface KeywordEditFormProps {
  keyword: {
    id: string;
    name: string;
    description?: string | null;
    rcLevelId: string;
    isFree: boolean;
    hidden: boolean;
    comingSoon: boolean;
    locked?: boolean;
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
  rcSettings: {
    id: string;
    defaultTimer: number;
    defaultScore: number;
  } | null;
  challenges: Array<{
    id: string;
    year: number;
    month: number;
    active: boolean;
    scheduledActive: boolean;
    _count?: {
      medals: number;
    };
  }>;
  currentMonthChallenge: {
    id: string;
    year: number;
    month: number;
    active: boolean;
    scheduledActive: boolean;
    keywordIds: string[];
  } | null;
  userRole?: Role;
}

const KeywordEditForm: React.FC<KeywordEditFormProps> = ({
  keyword,
  rcLevels,
  rcSettings,
  challenges,
  currentMonthChallenge,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState(keyword.name);
  const [description, setDescription] = useState(keyword.description || "");
  const [selectedRCLevelId, setSelectedRCLevelId] = useState(keyword.rcLevelId);
  const [isFree, setIsFree] = useState(keyword.isFree);
  const [hidden, setHidden] = useState(keyword.hidden);
  const [comingSoon, setComingSoon] = useState(keyword.comingSoon);
  const [isActive, setIsActive] = useState(
    keyword.RCQuestionSet?.active || false,
  );

  // Challenge state - initialize with props
  const [isInCurrentChallenge, setIsInCurrentChallenge] = useState(
    currentMonthChallenge
      ? currentMonthChallenge.keywordIds.includes(keyword.id)
      : false,
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
      if (hidden) {
        formData.append("hidden", "on");
      }
      if (comingSoon) {
        formData.append("comingSoon", "on");
      }
      if (isActive) {
        formData.append("isActive", "on");
      }

      // Add challenge data
      if (currentMonthChallenge) {
        formData.append("updateChallenge", "true");
        formData.append("challengeId", currentMonthChallenge.id);
        formData.append("includeInChallenge", isInCurrentChallenge.toString());
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
          <DeleteKeywordDialog
            keywordId={keyword.id}
            keywordName={keyword.name}
            rcLevelId={keyword.rcLevelId}
          >
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Keyword
            </Button>
          </DeleteKeywordDialog>
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-2xl font-semibold">Basic Information</h2>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hidden"
                checked={hidden}
                onCheckedChange={(checked) => setHidden(checked === true)}
                disabled={isPending}
              />
              <Label htmlFor="hidden">Hidden</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comingSoon"
                checked={comingSoon}
                onCheckedChange={(checked) => setComingSoon(checked === true)}
                disabled={isPending}
              />
              <Label htmlFor="comingSoon">Coming Next Month</Label>
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

      {/* Challenge Participation */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-2xl font-semibold">Challenge Participation</h2>
        <div className="space-y-4">
          {/* Show current challenge participation */}
          {challenges.length > 0 && (
            <div>
              <Label className="mb-2 block text-base font-medium">
                Challenge History
              </Label>
              <div className="flex flex-wrap gap-2">
                {challenges.map((challenge) => (
                  <ChallengeBadge key={challenge.id} challenges={[challenge]} />
                ))}
              </div>
            </div>
          )}

          {/* Current month challenge toggle */}
          {currentMonthChallenge && (
            <div className="space-y-2">
              <Label className="text-base font-medium">
                Current Month Challenge
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInChallenge"
                  checked={isInCurrentChallenge}
                  onCheckedChange={(checked) => {
                    console.log("RC Challenge checkbox changed:", checked);
                    setIsInCurrentChallenge(checked === true);
                  }}
                  disabled={isPending}
                />
                <Label
                  htmlFor="includeInChallenge"
                  className="text-base font-normal"
                >
                  Include in{" "}
                  {new Date().toLocaleString("default", { month: "long" })}{" "}
                  {new Date().getFullYear()} challenge
                </Label>
              </div>
              {!isInCurrentChallenge && currentMonthChallenge && (
                <p className="ml-6 text-sm text-muted-foreground">
                  This keyword is not currently part of the active monthly
                  challenge
                </p>
              )}
            </div>
          )}

          {!currentMonthChallenge && (
            <p className="text-base text-muted-foreground">
              No challenge exists for this RC level in the current month.
              <Link
                href={`/admin/challenges/challenges?levelType=RC&levelId=${keyword.rcLevelId}`}
                className="ml-1 text-blue-600 hover:underline"
              >
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Question Set Section */}
      <QuestionSetSection
        keyword={keyword}
        defaultTimer={rcSettings?.defaultTimer || 60}
        defaultScore={rcSettings?.defaultScore || 1}
      />
    </div>
  );
};

export default KeywordEditForm;
