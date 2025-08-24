"use client";

import DOMPurify from "isomorphic-dompurify";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { TiptapEditor } from "@/components/custom-ui/tiptap-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import AddNovelForm from "./add-novel-form";
import {
  createQuestionSetAction,
  createQuestionAction,
} from "../../[novelId]/edit/actions/chapter.actions";
import { createChapter } from "../actions/chapters.admin-actions";

interface Question {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  score: number;
  timeLimit: number;
}

interface EnhancedChapterCreationWorkflowProps {
  levelId: string;
  defaultTimer?: number;
  defaultScore?: number;
}

const EnhancedChapterCreationWorkflow: React.FC<
  EnhancedChapterCreationWorkflowProps
> = ({ levelId, defaultTimer = 60, defaultScore = 1 }) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<"novel" | "chapters">("novel");
  const [createdNovelId, setCreatedNovelId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createdChapters, setCreatedChapters] = useState<string[]>([]);

  // Chapter form state
  const [orderNumber, setOrderNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [instructions, setInstructions] = useState(
    "Find the best answer for each question."
  );
  const [isActive, setIsActive] = useState(true);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // New question form state
  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [score, setScore] = useState(defaultScore);
  const [timeLimit, setTimeLimit] = useState(defaultTimer);

  const handleNovelCreated = (novelId: string) => {
    setCreatedNovelId(novelId);
    setCurrentStep("chapters");
  };

  const resetQuestionForm = () => {
    setQuestionText("");
    setChoices(["", "", "", ""]);
    setAnswer("");
    setExplanation("");
    setScore(defaultScore);
    setTimeLimit(defaultTimer);
    setShowAddQuestion(false);
  };

  const resetChapterForm = () => {
    setOrderNumber(createdChapters.length + 2); // Next order number
    setTitle("");
    setDescription("");
    setIsFree(false);
    setInstructions("Find the best answer for each question.");
    setIsActive(true);
    setQuestions([]);
    resetQuestionForm();
  };

  const addQuestion = () => {
    if (!questionText.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const validChoices = choices.filter((c) => c.trim());
    if (validChoices.length < 2) {
      toast.error("Please provide at least 2 answer choices");
      return;
    }

    if (!answer) {
      toast.error("Please select the correct answer");
      return;
    }

    if (!explanation.trim()) {
      toast.error("Please provide an explanation");
      return;
    }

    const newQuestion: Question = {
      question: questionText,
      choices: validChoices,
      answer,
      explanation,
      score,
      timeLimit,
    };

    setQuestions([...questions, newQuestion]);
    resetQuestionForm();
    toast.success("Question added");
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (!title.trim()) {
      toast.error("Please enter a chapter title");
      return;
    }

    setIsCreating(true);

    try {
      // First create the chapter
      const chapterFormData = new FormData();
      chapterFormData.append("novelId", createdNovelId!);
      chapterFormData.append("orderNumber", orderNumber.toString());
      chapterFormData.append("title", title.trim());
      chapterFormData.append("description", description.trim());
      if (isFree) {
        chapterFormData.append("isFree", "on");
      }

      const chapterResult = await createChapter(chapterFormData);

      if (chapterResult.error) {
        if (chapterResult.error.includes("already exists")) {
          toast.error(
            `${chapterResult.error}. Please use a different order number.`
          );
          // Increment the order number for convenience
          setOrderNumber(orderNumber + 1);
        } else {
          toast.error(chapterResult.error);
        }
        setIsCreating(false);
        return;
      }

      if (!chapterResult.chapter) {
        toast.error("Failed to create chapter");
        setIsCreating(false);
        return;
      }

      const chapterId = chapterResult.chapter.id;

      // If we have instructions and/or questions, create the question set
      if (instructions.trim() || questions.length > 0) {
        const questionSetFormData = new FormData();
        questionSetFormData.append("chapterId", chapterId);
        questionSetFormData.append(
          "instructions",
          instructions.trim() || "Find the best answer for each question."
        );
        questionSetFormData.append("active", isActive.toString());

        const questionSetResult =
          await createQuestionSetAction(questionSetFormData);

        if (questionSetResult.error) {
          toast.error(questionSetResult.error);
          setIsCreating(false);
          return;
        }

        if (!questionSetResult.questionSet) {
          toast.error("Failed to create question set");
          setIsCreating(false);
          return;
        }

        // Then create all questions
        const questionSetId = questionSetResult.questionSet.id;
        let createdCount = 0;

        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const questionFormData = new FormData();
          questionFormData.append("questionSetId", questionSetId);
          questionFormData.append("question", question.question);
          questionFormData.append("choices", JSON.stringify(question.choices));
          questionFormData.append("answer", question.answer);
          questionFormData.append("explanation", question.explanation);
          questionFormData.append("score", question.score.toString());
          questionFormData.append("timeLimit", question.timeLimit.toString());
          questionFormData.append("orderNumber", (i + 1).toString());

          const questionResult = await createQuestionAction(questionFormData);

          if (questionResult.success) {
            createdCount++;
          }
        }

        if (questions.length > 0) {
          toast.success(
            `Created chapter ${orderNumber} with ${createdCount} questions`
          );
        } else {
          toast.success(
            `Chapter ${orderNumber} with instructions created successfully!`
          );
        }
      } else {
        toast.success(`Chapter ${orderNumber} created successfully!`);
      }

      // Add chapter to created list
      setCreatedChapters([...createdChapters, chapterId]);

      // Reset creating state before resetting form
      setIsCreating(false);

      // Reset form for next chapter
      resetChapterForm();
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("An unexpected error occurred");
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    router.push(`/admin/novels/${levelId}`);
  };

  // Helper to extract plain text from HTML
  const stripHtml = (html: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center ${currentStep === "novel" ? "text-slate-700" : "text-slate-500"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                currentStep === "novel" ? "bg-slate-600" : "bg-slate-400"
              }`}
            >
              {currentStep === "novel" ? "1" : "✓"}
            </div>
            <span className="ml-2 font-medium">Create Novel</span>
          </div>

          <div
            className={`h-1 w-8 ${currentStep === "chapters" ? "bg-slate-600" : "bg-slate-300"}`}
          ></div>

          <div
            className={`flex items-center ${currentStep === "chapters" ? "text-slate-700" : "text-slate-400"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                currentStep === "chapters" ? "bg-slate-600" : "bg-slate-300"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Add Chapter & Questions</span>
          </div>
        </div>
      </div>

      {/* Form content */}
      {currentStep === "novel" && (
        <AddNovelForm levelId={levelId} onNovelCreated={handleNovelCreated} />
      )}

      {currentStep === "chapters" && createdNovelId && (
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Add Chapters & Questions</h2>
            <p className="text-gray-600">
              {createdChapters.length > 0
                ? `${createdChapters.length} chapter${createdChapters.length > 1 ? "s" : ""} created. Create another or finish.`
                : "Create chapters and optionally add comprehension questions"}
            </p>
          </div>

          {/* Created Chapters List */}
          {createdChapters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Created Chapters</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {createdChapters.map((chapterId, index) => (
                    <li key={chapterId} className="flex items-center text-sm">
                      <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
                        ✓
                      </span>
                      Chapter {index + 1}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Chapter Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Chapter Details</CardTitle>
              <CardDescription>Create the chapter information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderNumber">Chapter Order</Label>
                  <Input
                    id="orderNumber"
                    type="number"
                    value={orderNumber}
                    onChange={(e) =>
                      setOrderNumber(parseInt(e.target.value) || 1)
                    }
                    min="1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use a unique order number for each chapter
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="isFree"
                    checked={isFree}
                    onCheckedChange={(checked) =>
                      setIsFree(checked === "indeterminate" ? false : checked)
                    }
                  />
                  <Label htmlFor="isFree">Free Chapter</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Chapter Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter the chapter title"
                />
              </div>

              <div>
                <Label htmlFor="description">Chapter Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a brief description of the chapter (optional)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Question Set Section */}
          <Card>
            <CardHeader>
              <CardTitle>Question Set (Optional)</CardTitle>
              <CardDescription>
                Add instructions and questions for this chapter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <TiptapEditor
                  value={instructions}
                  onChange={(value) => setInstructions(value)}
                  placeholder="Enter instructions for the questions"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setIsActive(checked === "indeterminate" ? true : checked)
                  }
                />
                <Label htmlFor="isActive">Make question set active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Novel Questions</CardTitle>
                  <CardDescription>
                    Add questions to test understanding ({questions.length}{" "}
                    added)
                  </CardDescription>
                </div>
                {!showAddQuestion && (
                  <Button onClick={() => setShowAddQuestion(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Question Form */}
              {showAddQuestion && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h4 className="font-medium">New Question</h4>

                  <div>
                    <Label htmlFor="questionText">Question</Label>
                    <TiptapEditor
                      value={questionText}
                      onChange={(value) => setQuestionText(value)}
                      placeholder="Enter the question..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Answer Choices</Label>
                    {choices.map((choice, index) => (
                      <div key={index} className="mt-1">
                        <TiptapEditor
                          value={choice}
                          onChange={(value) => {
                            const newChoices = [...choices];
                            newChoices[index] = value;
                            setChoices(newChoices);
                          }}
                          placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                          rows={1}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label htmlFor="answer">Correct Answer</Label>
                    <RadioGroup
                      value={answer}
                      onValueChange={(value) => setAnswer(value)}
                      className="mt-2"
                    >
                      {choices.map((choice, index) => {
                        const choiceText = stripHtml(choice).trim();
                        if (!choiceText) return null;
                        return (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={choice}
                              id={`choice-${index}`}
                            />
                            <Label
                              htmlFor={`choice-${index}`}
                              className="flex flex-1 cursor-pointer font-normal"
                            >
                              <span className="mr-2 font-medium">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(choice),
                                }}
                              />
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="explanation">Explanation</Label>
                    <TiptapEditor
                      value={explanation}
                      onChange={(value) => setExplanation(value)}
                      placeholder="Explain why this is the correct answer..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="score">Score</Label>
                      <Input
                        id="score"
                        type="number"
                        value={score}
                        onChange={(e) =>
                          setScore(parseInt(e.target.value) || 1)
                        }
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        value={timeLimit}
                        onChange={(e) =>
                          setTimeLimit(parseInt(e.target.value) || defaultTimer)
                        }
                        min="10"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={addQuestion}>Add Question</Button>
                    <Button variant="outline" onClick={resetQuestionForm}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {questions.map((question, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h5 className="font-medium">Question {index + 1}</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div
                    className="mb-2"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(question.question),
                    }}
                  />

                  <div className="mb-2 space-y-1">
                    {question.choices.map((choice, choiceIndex) => (
                      <div
                        key={choiceIndex}
                        className={`flex rounded p-1 text-sm ${
                          choice === question.answer
                            ? "bg-green-100 font-medium text-green-800"
                            : "bg-gray-50"
                        }`}
                      >
                        <span className="mr-2">
                          {String.fromCharCode(65 + choiceIndex)}.
                        </span>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(choice),
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600">
                    <strong>Score:</strong> {question.score} •{" "}
                    <strong>Time:</strong> {question.timeLimit}s
                  </div>
                </div>
              ))}

              {questions.length === 0 && !showAddQuestion && (
                <p className="text-center text-gray-500">
                  No questions added yet. You can add questions now or later.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {createdChapters.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isCreating}
              >
                Finish & Go to Novel
              </Button>
            )}
            <Button
              onClick={handleFinish}
              disabled={isCreating || !title.trim()}
              title={!title.trim() ? "Please enter a chapter title" : ""}
            >
              {isCreating
                ? "Creating..."
                : createdChapters.length > 0
                  ? "Create Another Chapter"
                  : "Create Chapter"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChapterCreationWorkflow;
