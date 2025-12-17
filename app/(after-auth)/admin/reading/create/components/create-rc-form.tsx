"use client";

import { useRouter } from "next/navigation";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { ChallengeControls } from "@/components/admin/challenge-controls";
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

import { createRCLevelAction } from "../../actions/rc.actions";

const CreateRCForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [challengeSettings, setChallengeSettings] = useState({
    createChallenge: false,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    scheduledActive: false,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Add challenge settings to formData
    if (challengeSettings.createChallenge) {
      formData.append("createChallenge", "true");
      formData.append("challengeYear", challengeSettings.year.toString());
      formData.append("challengeMonth", challengeSettings.month.toString());
      formData.append("challengeScheduledActive", challengeSettings.scheduledActive.toString());
    }

    startTransition(async () => {
      const result = await createRCLevelAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("RC level created successfully!");
        if (challengeSettings.createChallenge && result.challengeCreated) {
          toast.success("Monthly challenge created successfully!");
        }
        router.push("/admin/reading");
      } else {
        toast.error("An unexpected error occurred");
      }
    });
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="level">RC Level</Label>
            <Input
              id="level"
              name="level"
              type="text"
              placeholder="Beginner"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-base text-gray-500">
              The reading comprehension level (e.g., Beginner, Intermediate,
              Advanced)
            </p>
          </div>

          <div>
            <Label htmlFor="relevantGrade">Relevant Grades</Label>
            <Input
              id="relevantGrade"
              name="relevantGrade"
              type="text"
              placeholder="Grades 3-4"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-base text-gray-500">
              Target grades for this RC level
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="stars">Stars (0-5)</Label>
            <Select name="stars" defaultValue="3" disabled={isPending}>
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
            <p className="mt-1 text-base text-gray-500">
              Difficulty rating (0 = easiest, 5 = hardest)
            </p>
          </div>

          <div>
            <Label htmlFor="numberOfQuestions">Number of Questions</Label>
            <Input
              id="numberOfQuestions"
              name="numberOfQuestions"
              type="number"
              min="1"
              placeholder="10"
              required
              disabled={isPending}
            />
            <p className="mt-1 text-base text-gray-500">
              Total number of questions for this level
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="fontSize">Font Size</Label>
            <Select name="fontSize" defaultValue="BASE" disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select font size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BASE">Base</SelectItem>
                <SelectItem value="LARGE">Large</SelectItem>
                <SelectItem value="XLARGE">Extra Large</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-base text-gray-500">
              Default font size for this RC level
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            disabled={isPending}
          />
          <p className="mt-1 text-base text-gray-500">
            Optional description of this RC level
          </p>
        </div>

        <div>
          <Label className="text-lg font-semibold">Monthly Challenge Settings</Label>
          <p className="mb-3 text-base text-gray-500">
            Optionally create a monthly challenge for this RC level
          </p>
          <ChallengeControls
            onChallengeSettingsChange={setChallengeSettings}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/reading")}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create RC Level"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRCForm;
