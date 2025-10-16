"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createBPANovelAction } from "../../../actions/create-bpa-novel.actions";

interface CreateBPANovelFormProps {
  levelId: string;
}

const CreateBPANovelForm: React.FC<CreateBPANovelFormProps> = ({ levelId }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("levelId", levelId);

    startTransition(async () => {
      const result = await createBPANovelAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("BPA Novel created successfully!");
        router.push(`/admin/bpa/${levelId}`);
      } else {
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/bpa/${levelId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Novels
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Novel Title</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Enter novel title"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-base text-gray-500">
              The title of the BPA novel
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter novel description"
              rows={4}
              disabled={isPending}
            />
            <p className="mt-1 text-base text-gray-500">
              Optional description of the novel
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/bpa/${levelId}`)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Novel"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBPANovelForm;
