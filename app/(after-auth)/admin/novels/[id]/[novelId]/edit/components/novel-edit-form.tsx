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
import ImageUploadSection from "./image-upload-section";
import {
  deleteNovelAction,
  updateNovelAction,
} from "../actions/novel-edit.actions";

interface NovelEditFormProps {
  novel: {
    id: string;
    title: string;
    description?: string | null;
    ARId: string | null;
    AR: {
      id: string;
      level: string;
      description?: string | null;
    } | null;
    image: {
      id: string;
      imageUrl: string;
      width: number;
      height: number;
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
}

const NovelEditForm: React.FC<NovelEditFormProps> = ({ novel, arLevels }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  // Form state
  const [title, setTitle] = useState(novel.title);
  const [description, setDescription] = useState(novel.description || "");
  const [selectedARId, setSelectedARId] = useState(novel.ARId || "");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("novelId", novel.id);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("arId", selectedARId);

      if (imageFile) {
        formData.append("imageFile", imageFile);
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

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteNovelAction(novel.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Novel deleted successfully");
        router.push(`/admin/novels/${novel.ARId}`);
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isDeleting} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete Novel"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  novel &quot;<strong>{novel.title}</strong>&quot; and all of
                  its chapters, question sets, and questions.
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
                  {isDeleting ? "Deleting..." : "Yes, delete novel"}
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
          </div>

          <div>
            <ImageUploadSection
              currentImage={novel.image}
              onImageChange={setImageFile}
            />
          </div>
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
        />
      </div>
    </div>
  );
};

export default NovelEditForm;
