"use client";

import { Plus, Edit, Trash2, Save, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  createQuestionSetAction,
  updateQuestionSetAction,
  deleteQuestionSetAction,
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
} from "../actions/question-set.actions";

interface QuestionSetSectionProps {
  keyword: {
    id: string;
    name: string;
    RCQuestionSet: {
      id: string;
      title: string;
      passage: string;
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
}

const QuestionSetSection: React.FC<QuestionSetSectionProps> = ({ keyword }) => {
  const [isPending, startTransition] = useTransition();
  const [editingQuestionSet, setEditingQuestionSet] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Question Set form state
  const [title, setTitle] = useState(keyword.RCQuestionSet?.title || "");
  const [passage, setPassage] = useState(keyword.RCQuestionSet?.passage || "");

  // Question form state
  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [score, setScore] = useState(1);
  const [timeLimit, setTimeLimit] = useState(60);

  const resetQuestionForm = () => {
    setQuestionText("");
    setChoices(["", "", "", ""]);
    setAnswer("");
    setExplanation("");
    setScore(1);
    setTimeLimit(60);
  };

  const handleCreateQuestionSet = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("keywordId", keyword.id);
      formData.append("title", title);
      formData.append("passage", passage);

      const result = await createQuestionSetAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Question set created successfully");
        setEditingQuestionSet(false);
        window.location.reload();
      }
    });
  };

  const handleUpdateQuestionSet = () => {
    if (!keyword.RCQuestionSet) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("questionSetId", keyword.RCQuestionSet!.id);
      formData.append("title", title);
      formData.append("passage", passage);

      const result = await updateQuestionSetAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Question set updated successfully");
        setEditingQuestionSet(false);
        window.location.reload();
      }
    });
  };

  const handleDeleteQuestionSet = () => {
    if (!keyword.RCQuestionSet) return;

    startTransition(async () => {
      const result = await deleteQuestionSetAction(keyword.RCQuestionSet!.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Question set deleted successfully");
        window.location.reload();
      }
    });
  };

  const handleCreateQuestion = () => {
    if (!keyword.RCQuestionSet) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("questionSetId", keyword.RCQuestionSet!.id);
      formData.append("question", questionText);
      formData.append(
        "choices",
        JSON.stringify(choices.filter((c) => c.trim())),
      );
      formData.append("answer", answer);
      formData.append("explanation", explanation);
      formData.append("score", score.toString());
      formData.append("timeLimit", timeLimit.toString());

      const result = await createQuestionAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Question created successfully");
        resetQuestionForm();
        setShowAddQuestion(false);
        window.location.reload();
      }
    });
  };

  if (!keyword.RCQuestionSet) {
    return (
      <div className="rounded-lg border p-6">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold">No Reading Passage</h3>
          <p className="mb-4 text-gray-600">
            This keyword doesn't have a reading passage yet. Create one to start
            adding questions.
          </p>
          {!editingQuestionSet ? (
            <Button onClick={() => setEditingQuestionSet(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Reading Passage
            </Button>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4">
              <div>
                <Label htmlFor="title">Passage Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter the title of the reading passage..."
                />
              </div>
              <div>
                <Label htmlFor="passage">Reading Passage</Label>
                <Textarea
                  id="passage"
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="Enter the reading passage text..."
                  rows={8}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleCreateQuestionSet} disabled={isPending}>
                  {isPending ? "Creating..." : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingQuestionSet(false);
                    setTitle("");
                    setPassage("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reading Passage Section */}
      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reading Passage</h3>
          <div className="flex space-x-2">
            {!editingQuestionSet ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingQuestionSet(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Passage
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Passage
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete Reading Passage?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the reading passage and all{" "}
                        {keyword.RCQuestionSet.RCQuestion.length} questions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteQuestionSet}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleUpdateQuestionSet} disabled={isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingQuestionSet(false);
                    setTitle(keyword.RCQuestionSet?.title || "");
                    setPassage(keyword.RCQuestionSet?.passage || "");
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {editingQuestionSet ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Passage Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the title of the reading passage..."
              />
            </div>
            <div>
              <Label htmlFor="passage">Reading Passage</Label>
              <Textarea
                id="passage"
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                placeholder="Enter the reading passage text..."
                rows={8}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium">
                {keyword.RCQuestionSet.title}
              </h4>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="whitespace-pre-wrap text-gray-700">
                {keyword.RCQuestionSet.passage}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Questions ({keyword.RCQuestionSet.RCQuestion.length})
          </h3>
          <Button onClick={() => setShowAddQuestion(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>

        {/* Add Question Form */}
        {showAddQuestion && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="questionText">Question</Label>
                <Textarea
                  id="questionText"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the question..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Answer Choices</Label>
                {choices.map((choice, index) => (
                  <Input
                    key={index}
                    value={choice}
                    onChange={(e) => {
                      const newChoices = [...choices];
                      newChoices[index] = e.target.value;
                      setChoices(newChoices);
                    }}
                    placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                    className="mt-1"
                  />
                ))}
              </div>

              <div>
                <Label htmlFor="answer">Correct Answer</Label>
                <Input
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Enter the correct answer exactly as written above"
                />
              </div>

              <div>
                <Label htmlFor="explanation">Explanation</Label>
                <Textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
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
                      setTimeLimit(parseInt(e.target.value) || 60)
                    }
                    min="10"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleCreateQuestion} disabled={isPending}>
                  {isPending ? "Adding..." : "Add Question"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddQuestion(false);
                    resetQuestionForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {keyword.RCQuestionSet.RCQuestion.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                Question {question.orderNumber}
              </CardTitle>
              <CardDescription>
                Score: {question.score} • Time: {question.timeLimit}s
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-2 font-medium">{question.question}</p>
              <div className="mb-2 space-y-1">
                {question.choices.map((choice, choiceIndex) => (
                  <div
                    key={choiceIndex}
                    className={`rounded p-2 text-sm ${
                      choice === question.answer
                        ? "bg-green-100 font-medium text-green-800"
                        : "bg-gray-50"
                    }`}
                  >
                    {String.fromCharCode(65 + choiceIndex)}. {choice}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <strong>Explanation:</strong> {question.explanation}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuestionSetSection;
