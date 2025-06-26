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

import ChapterSection from "./chapter-section";
import DeleteNovelDialog from "./delete-novel-dialog";
import { updateNovelAction } from "../actions/novel-edit.actions";

interface NovelEditFormProps {
  novel: {
    id: string;
    title: string;
    description?: string | null;
    hidden: boolean;
    comingSoon: boolean;
    ARId: string | null;
    AR: {
      id: string;
      level: string;
      description?: string | null;
    } | null;
    novelChapters: Array<{
      id: string;
      title: string;
      description: string | null;
      orderNumber: number;
      isFree: boolean;
      novelQuestionSet: {
        id: string;
        instructions: string;
        active: boolean;
        novelQuestions: Array<{
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
    }>;
  };
  arLevels: Array<{
    id: string;
    level: string;
    description?: string | null;
  }>;
  novelSettings: {
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
    novelIds: string[];
  } | null;
}

const NovelEditForm: React.FC<NovelEditFormProps> = ({
  novel,
  arLevels,
  novelSettings,
  challenges,
  currentMonthChallenge,
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Form state
  const [title, setTitle] = useState(novel.title);
  const [description, setDescription] = useState(novel.description || "");
  const [selectedARId, setSelectedARId] = useState(novel.ARId || "");
  const [hidden, setHidden] = useState(novel.hidden);
  const [comingSoon, setComingSoon] = useState(novel.comingSoon);

  // Challenge state - initialize with props
  const [isInCurrentChallenge, setIsInCurrentChallenge] = useState(
    currentMonthChallenge
      ? currentMonthChallenge.novelIds.includes(novel.id)
      : false,
  );

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("novelId", novel.id);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("arId", selectedARId);
      if (hidden) {
        formData.append("hidden", "on");
      }
      if (comingSoon) {
        formData.append("comingSoon", "on");
      }

      // Add challenge data
      if (currentMonthChallenge) {
        formData.append("updateChallenge", "true");
        formData.append("challengeId", currentMonthChallenge.id);
        formData.append("includeInChallenge", isInCurrentChallenge.toString());
      }

      const result = await updateNovelAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Novel updated successfully");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/novels/${novel.ARId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Novels
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Novel</h1>
            <p className="text-gray-600">
              Level: {novel.AR?.level} • {novel.novelChapters.length} chapters
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
          <DeleteNovelDialog
            novelId={novel.id}
            novelTitle={novel.title}
            redirectPath={`/admin/novels/${novel.ARId}`}
          >
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Novel
            </Button>
          </DeleteNovelDialog>
        </div>
      </div>

      {/* Basic Information */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter novel title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter novel description"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="arLevel">AR Level</Label>
              <Select value={selectedARId} onValueChange={setSelectedARId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AR Level" />
                </SelectTrigger>
                <SelectContent>
                  {arLevels.map((ar) => (
                    <SelectItem key={ar.id} value={ar.id}>
                      {ar.level} - {ar.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
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
                <Label htmlFor="comingSoon">Coming Soon</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Participation */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Challenge Participation</h2>
        <div className="space-y-4">
          {/* Show current challenge participation */}
          {challenges.length > 0 && (
            <div>
              <Label className="mb-2 block text-sm font-medium">
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
              <Label className="text-sm font-medium">
                Current Month Challenge
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeInChallenge"
                  checked={isInCurrentChallenge}
                  onCheckedChange={(checked) =>
                    setIsInCurrentChallenge(checked as boolean)
                  }
                  disabled={isPending}
                />
                <Label
                  htmlFor="includeInChallenge"
                  className="text-sm font-normal"
                >
                  Include in{" "}
                  {new Date().toLocaleString("default", { month: "long" })}{" "}
                  {new Date().getFullYear()} challenge
                </Label>
              </div>
              {!isInCurrentChallenge && currentMonthChallenge && (
                <p className="ml-6 text-xs text-muted-foreground">
                  This novel is not currently part of the active monthly
                  challenge
                </p>
              )}
            </div>
          )}

          {!currentMonthChallenge && novel.ARId && (
            <p className="text-sm text-muted-foreground">
              No challenge exists for this AR level in the current month.
              <Link
                href={`/admin/challenges/challenges?levelType=AR&levelId=${novel.ARId}`}
                className="ml-1 text-blue-600 hover:underline"
              >
                Create one
              </Link>
            </p>
          )}

          {!novel.ARId && (
            <p className="text-sm text-muted-foreground">
              Select a Lexile level to manage challenge participation
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Chapters Section */}
      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Chapters & Questions</h2>
          <p className="text-sm text-gray-600">
            Manage chapters and their associated question sets
          </p>
        </div>

        <ChapterSection
          novelId={novel.id}
          chapters={novel.novelChapters}
          onChapterUpdate={() => router.refresh()}
          defaultTimer={novelSettings?.defaultTimer || 40}
          defaultScore={novelSettings?.defaultScore || 10}
        />
      </div>
    </div>
  );
};

export default NovelEditForm;
