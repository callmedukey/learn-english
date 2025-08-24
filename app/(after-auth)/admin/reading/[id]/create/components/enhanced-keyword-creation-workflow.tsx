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

import AddKeywordForm from "./add-keyword-form";
import { createQuestionSetAction } from "../../[keywordId]/edit/actions/question-set.actions";
import { createQuestionAction } from "../../[keywordId]/edit/actions/question-set.actions";

interface Question {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  score: number;
  timeLimit: number;
}

interface EnhancedKeywordCreationWorkflowProps {
  rcLevelId: string;
  defaultTimer?: number;
  defaultScore?: number;
}

const EnhancedKeywordCreationWorkflow: React.FC<EnhancedKeywordCreationWorkflowProps> = ({
  rcLevelId,
  defaultTimer = 60,
  defaultScore = 1,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<"keyword" | "content">("keyword");
  const [createdKeywordId, setCreatedKeywordId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Passage form state
  const [title, setTitle] = useState("");
  const [passage, setPassage] = useState("");
  const [passageTimeLimit, setPassageTimeLimit] = useState(defaultTimer);
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

  const handleKeywordCreated = (keywordId: string) => {
    setCreatedKeywordId(keywordId);
    setCurrentStep("content");
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
    if (!title.trim() || !passage.trim()) {
      toast.error("Please fill in both title and passage");
      return;
    }

    if (passageTimeLimit < 10) {
      toast.error("Passage time limit must be at least 10 seconds");
      return;
    }

    setIsCreating(true);

    try {
      // First create the question set (passage)
      const passageFormData = new FormData();
      passageFormData.append("keywordId", createdKeywordId!);
      passageFormData.append("title", title.trim());
      passageFormData.append("passage", passage.trim());
      passageFormData.append("timeLimit", passageTimeLimit.toString());
      passageFormData.append("isActive", isActive.toString());

      const passageResult = await createQuestionSetAction(passageFormData);
      
      if (passageResult.error) {
        toast.error(passageResult.error);
        setIsCreating(false);
        return;
      }

      if (!passageResult.questionSet) {
        toast.error("Failed to create reading passage");
        setIsCreating(false);
        return;
      }

      // Then create all questions
      const questionSetId = passageResult.questionSet.id;
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
        toast.success(`Created reading passage with ${createdCount} questions`);
      } else {
        toast.success("Reading passage created successfully!");
      }

      router.push(`/admin/reading/${rcLevelId}`);
    } catch (error) {
      console.error("Error creating content:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSkip = () => {
    router.push(`/admin/reading/${rcLevelId}`);
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
            className={`flex items-center ${currentStep === "keyword" ? "text-slate-700" : "text-slate-500"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                currentStep === "keyword" ? "bg-slate-600" : "bg-slate-400"
              }`}
            >
              {currentStep === "keyword" ? "1" : "✓"}
            </div>
            <span className="ml-2 font-medium">Create Keyword</span>
          </div>

          <div
            className={`h-1 w-8 ${currentStep === "content" ? "bg-slate-600" : "bg-slate-300"}`}
          ></div>

          <div
            className={`flex items-center ${currentStep === "content" ? "text-slate-700" : "text-slate-400"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${
                currentStep === "content" ? "bg-slate-600" : "bg-slate-300"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Add Content & Questions</span>
          </div>
        </div>
      </div>

      {/* Form content */}
      {currentStep === "keyword" && (
        <AddKeywordForm
          rcLevelId={rcLevelId}
          onKeywordCreated={handleKeywordCreated}
        />
      )}

      {currentStep === "content" && createdKeywordId && (
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Add Reading Passage & Questions</h2>
            <p className="text-gray-600">
              Create a reading passage and add comprehension questions
            </p>
          </div>

          {/* Reading Passage Section */}
          <Card>
            <CardHeader>
              <CardTitle>Reading Passage</CardTitle>
              <CardDescription>
                Create the main reading content for this keyword
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Passage Title</Label>
                <TiptapEditor
                  value={title}
                  onChange={(value) => setTitle(value)}
                  placeholder="Enter the title of the reading passage"
                  rows={1}
                />
              </div>

              <div>
                <Label htmlFor="passage">Reading Passage</Label>
                <TiptapEditor
                  value={passage}
                  onChange={(value) => setPassage(value)}
                  placeholder="Enter the reading passage text..."
                  rows={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passageTimeLimit">
                    Time Limit (seconds)
                  </Label>
                  <Input
                    id="passageTimeLimit"
                    type="number"
                    value={passageTimeLimit}
                    onChange={(e) =>
                      setPassageTimeLimit(parseInt(e.target.value) || defaultTimer)
                    }
                    placeholder={defaultTimer.toString()}
                    min="10"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Default time limit for this passage
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setIsActive(checked === "indeterminate" ? true : checked)
                    }
                  />
                  <Label htmlFor="isActive">Make passage active</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Comprehension Questions</CardTitle>
                  <CardDescription>
                    Add questions to test understanding ({questions.length} added)
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
                          <div key={index} className="flex items-center space-x-2">
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
                        onChange={(e) => setScore(parseInt(e.target.value) || 1)}
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
                    <Button onClick={addQuestion}>
                      Add Question
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetQuestionForm}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4"
                >
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
                    <strong>Score:</strong> {question.score} • <strong>Time:</strong> {question.timeLimit}s
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
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={isCreating}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleFinish}
              disabled={isCreating || !title.trim() || !passage.trim()}
            >
              {isCreating ? "Creating..." : "Create Keyword Content"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedKeywordCreationWorkflow;