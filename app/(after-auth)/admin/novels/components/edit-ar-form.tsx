"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { ExistingChallenges } from "@/components/admin/challenge-controls";
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
import { Textarea } from "@/components/ui/textarea";

import { getARChallenges, updateARAction } from "../actions/ar.actions";
import { ARData } from "../query/ar.query";

interface EditARFormProps {
  ar: ARData;
  onARUpdated: () => void;
}

const EditARForm: React.FC<EditARFormProps> = ({ ar, onARUpdated }) => {
  const [isPending, startTransition] = useTransition();
  const [challenges, setChallenges] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch existing challenges for this AR level
    async function fetchChallenges() {
      const arChallenges = await getARChallenges(ar.id);
      setChallenges(arChallenges);
    }
    fetchChallenges();
  }, [ar.id]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateARAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("AR record updated successfully!");
        onARUpdated();
      }
    });
  };

  const handleEditChallenge = (challengeId: string) => {
    router.push(`/admin/challenges/challenges/${challengeId}`);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="arId" value={ar.id} />

      <div className="space-y-2">
        <Label htmlFor="level">Level</Label>
        <Input
          id="level"
          name="level"
          defaultValue={ar.level}
          placeholder="e.g., Beginner, Intermediate, Advanced"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="score">Score</Label>
        <Input
          id="score"
          name="score"
          defaultValue={ar.score}
          placeholder="e.g., 85-90, 90-95"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stars">Stars (1-5)</Label>
        <Select
          name="stars"
          defaultValue={ar.stars.toString()}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Star</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relevantGrade">Relevant Grades</Label>
        <Input
          id="relevantGrade"
          name="relevantGrade"
          defaultValue={ar.relevantGrade || ""}
          placeholder="e.g., Grades 1~2, Grades 3~4"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fontSize">Font Size</Label>
        <Select
          name="fontSize"
          defaultValue={ar.ARSettings?.fontSize || "BASE"}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select font size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BASE">Base</SelectItem>
            <SelectItem value="LARGE">Large</SelectItem>
            <SelectItem value="XLARGE">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={ar.description || ""}
          placeholder="Enter AR description..."
          rows={3}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-lg font-semibold">Monthly Challenges</Label>
        <ExistingChallenges 
          challenges={challenges}
          onEditChallenge={handleEditChallenge}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/challenges/challenges?levelType=AR&levelId=${ar.id}`)}
          >
            Create New Challenge
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update AR"}
        </Button>
      </div>
    </form>
  );
};

export default EditARForm;
