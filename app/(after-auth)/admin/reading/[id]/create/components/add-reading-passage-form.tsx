"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createQuestionSetAction } from "../../[keywordId]/edit/actions/question-set.actions";

interface AddReadingPassageFormProps {
  keywordId: string;
  onFinish: () => void;
}

const AddReadingPassageForm: React.FC<AddReadingPassageFormProps> = ({
  keywordId,
  onFinish,
}) => {
  const [isPending, startTransition] = useTransition();
  const [passages, setPassages] = useState([{ title: "", passage: "" }]);

  const addPassage = () => {
    setPassages([...passages, { title: "", passage: "" }]);
  };

  const removePassage = (index: number) => {
    if (passages.length > 1) {
      setPassages(passages.filter((_, i) => i !== index));
    }
  };

  const updatePassage = (
    index: number,
    field: "title" | "passage",
    value: string,
  ) => {
    const newPassages = [...passages];
    newPassages[index][field] = value;
    setPassages(newPassages);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // For now, we'll only create the first passage since the schema supports one passage per keyword
    const firstPassage = passages[0];
    if (!firstPassage.title.trim() || !firstPassage.passage.trim()) {
      toast.error("Please fill in both title and passage");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("keywordId", keywordId);
      formData.append("title", firstPassage.title.trim());
      formData.append("passage", firstPassage.passage.trim());

      const result = await createQuestionSetAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("Reading passage created successfully!");
        onFinish();
      } else {
        toast.error("An unexpected error occurred");
      }
    });
  };

  const handleSkip = () => {
    onFinish();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Add Reading Passage</h2>
        <p className="text-gray-600">
          Create a reading passage for students to practice comprehension
          skills. You can skip this step and add it later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {passages.map((passage, index) => (
          <div key={index} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Reading Passage {index + 1}
              </h3>
              {passages.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removePassage(index)}
                  disabled={isPending}
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor={`title-${index}`}>Passage Title</Label>
                <Input
                  id={`title-${index}`}
                  value={passage.title}
                  onChange={(e) =>
                    updatePassage(index, "title", e.target.value)
                  }
                  placeholder="Enter the title of the reading passage"
                  disabled={isPending}
                />
              </div>

              <div>
                <Label htmlFor={`passage-${index}`}>Reading Passage</Label>
                <Textarea
                  id={`passage-${index}`}
                  value={passage.passage}
                  onChange={(e) =>
                    updatePassage(index, "passage", e.target.value)
                  }
                  placeholder="Enter the reading passage text..."
                  rows={8}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={isPending}
          >
            Skip for Now
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Reading Passage"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddReadingPassageForm;
