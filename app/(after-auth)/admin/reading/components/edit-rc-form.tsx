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

import { getRCChallenges, updateRCLevelAction } from "../actions/rc.actions";
import { RCLevelData } from "../query/rc.query";

interface EditRCFormProps {
  rcLevel: RCLevelData;
  onRCUpdated: () => void;
}

const EditRCForm: React.FC<EditRCFormProps> = ({ rcLevel, onRCUpdated }) => {
  const [isPending, startTransition] = useTransition();
  const [challenges, setChallenges] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch existing challenges for this RC level
    async function fetchChallenges() {
      const rcChallenges = await getRCChallenges(rcLevel.id);
      setChallenges(rcChallenges);
    }
    fetchChallenges();
  }, [rcLevel.id]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateRCLevelAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("RC level updated successfully!");
        onRCUpdated();
      }
    });
  };

  const handleEditChallenge = (challengeId: string) => {
    router.push(`/admin/challenges/challenges/${challengeId}`);
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="rcLevelId" value={rcLevel.id} />

      <div className="space-y-2">
        <Label htmlFor="level">Level</Label>
        <Input
          id="level"
          name="level"
          defaultValue={rcLevel.level}
          placeholder="e.g., Beginner, Intermediate, Advanced"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="relevantGrade">Relevant Grade</Label>
        <Input
          id="relevantGrade"
          name="relevantGrade"
          defaultValue={rcLevel.relevantGrade}
          placeholder="e.g., Grade 3-4, Grade 5-6"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stars">Stars (0-5)</Label>
        <Select
          name="stars"
          defaultValue={rcLevel.stars.toString()}
          disabled={isPending}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 Stars</SelectItem>
            <SelectItem value="0.5">0.5 Stars</SelectItem>
            <SelectItem value="1">1 Star</SelectItem>
            <SelectItem value="1.5">1.5 Stars</SelectItem>
            <SelectItem value="2">2 Stars</SelectItem>
            <SelectItem value="2.5">2.5 Stars</SelectItem>
            <SelectItem value="3">3 Stars</SelectItem>
            <SelectItem value="3.5">3.5 Stars</SelectItem>
            <SelectItem value="4">4 Stars</SelectItem>
            <SelectItem value="4.5">4.5 Stars</SelectItem>
            <SelectItem value="5">5 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberOfQuestions">Number of Questions</Label>
        <Input
          id="numberOfQuestions"
          name="numberOfQuestions"
          type="number"
          defaultValue={rcLevel.numberOfQuestions}
          placeholder="e.g., 10, 15, 20"
          min="1"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fontSize">Font Size</Label>
        <Select
          name="fontSize"
          defaultValue={rcLevel.RCLevelSettings?.fontSize || "BASE"}
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
          defaultValue={rcLevel.description || ""}
          placeholder="Enter RC level description..."
          rows={3}
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
            onClick={() => router.push(`/admin/challenges/challenges?levelType=RC&levelId=${rcLevel.id}`)}
          >
            Create New Challenge
          </Button>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update RC Level"}
        </Button>
      </div>
    </form>
  );
};

export default EditRCForm;
