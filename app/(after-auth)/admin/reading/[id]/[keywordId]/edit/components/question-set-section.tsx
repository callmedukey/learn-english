"use client";

import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import DeleteQuestionSetDialog from "./delete-question-set-dialog";
import DeleteRCQuestionDialog from "./delete-rc-question-dialog";
import {
  createQuestionSetAction,
  updateQuestionSetAction,
  createQuestionAction,
  updateQuestionAction,
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
      timeLimit: number;
    } | null;
  };
  defaultTimer: number;
  defaultScore: number;
}

const QuestionSetSection: React.FC<QuestionSetSectionProps> = ({
  keyword,
  defaultTimer,
  defaultScore,
}) => {
  const [isPending, startTransition] = useTransition();
  const [editingQuestionSet, setEditingQuestionSet] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  // Question Set form state
  const [title, setTitle] = useState(keyword.RCQuestionSet?.title || "");
  const [passage, setPassage] = useState(keyword.RCQuestionSet?.passage || "");
  const [questionSetTimeLimit, setQuestionSetTimeLimit] = useState(
    keyword.RCQuestionSet?.timeLimit || defaultTimer,
  );

  // Question form state
  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [score, setScore] = useState(defaultScore);
  const [timeLimit, setTimeLimit] = useState(defaultTimer);

  const resetQuestionForm = () => {
    setQuestionText("");
    setChoices(["", "", "", ""]);
    setAnswer("");
    setExplanation("");
    setScore(defaultScore);
    setTimeLimit(defaultTimer);
  };

  const handleCreateQuestionSet = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("keywordId", keyword.id);
      formData.append("title", title);
      formData.append("passage", passage);
      formData.append("timeLimit", questionSetTimeLimit.toString());

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
      formData.append("timeLimit", questionSetTimeLimit.toString());

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
            This keyword doesn&apos;t have a reading passage yet. Create one to
            start adding questions.
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
              <div>
                <Label htmlFor="questionSetTimeLimit">
                  Time Limit (seconds)
                </Label>
                <Input
                  id="questionSetTimeLimit"
                  type="number"
                  value={questionSetTimeLimit}
                  onChange={(e) =>
                    setQuestionSetTimeLimit(
                      parseInt(e.target.value) || defaultTimer,
                    )
                  }
                  placeholder={defaultTimer.toString()}
                  min="10"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Default time limit for this reading passage (minimum 10
                  seconds)
                </p>
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
                    setQuestionSetTimeLimit(defaultTimer);
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
                <DeleteQuestionSetDialog
                  questionSetId={keyword.RCQuestionSet!.id}
                  questionCount={keyword.RCQuestionSet.RCQuestion.length}
                  onSuccess={() => window.location.reload()}
                >
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Passage
                  </Button>
                </DeleteQuestionSetDialog>
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
                    setQuestionSetTimeLimit(
                      keyword.RCQuestionSet?.timeLimit || defaultTimer,
                    );
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
            <div>
              <Label htmlFor="editQuestionSetTimeLimit">
                Time Limit (seconds)
              </Label>
              <Input
                id="editQuestionSetTimeLimit"
                type="number"
                value={questionSetTimeLimit}
                onChange={(e) =>
                  setQuestionSetTimeLimit(
                    parseInt(e.target.value) || defaultTimer,
                  )
                }
                placeholder={defaultTimer.toString()}
                min="0"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-medium">
                {keyword.RCQuestionSet.title}
              </h4>
              <p className="text-sm text-gray-600">
                Time Limit: {keyword.RCQuestionSet.timeLimit} seconds
              </p>
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
                      setTimeLimit(parseInt(e.target.value) || defaultTimer)
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

        {keyword.RCQuestionSet.RCQuestion.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onUpdate={() => window.location.reload()}
            defaultTimer={defaultTimer}
          />
        ))}
      </div>
    </div>
  );
};

// Individual Question Card Component
interface QuestionCardProps {
  question: {
    id: string;
    orderNumber: number;
    question: string;
    choices: string[];
    answer: string;
    explanation: string;
    score: number;
    timeLimit: number;
  };
  onUpdate: () => void;
  defaultTimer: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onUpdate,
  defaultTimer,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editForm, setEditForm] = useState({
    question: question.question,
    choices: [...question.choices],
    answer: question.answer,
    explanation: question.explanation,
    score: question.score,
    timeLimit: question.timeLimit,
  });

  // Validation helper
  const isAnswerValid = (answer: string, choices: string[]) => {
    const validChoices = choices.filter((c) => c.trim());
    return validChoices.includes(answer);
  };

  const handleUpdate = () => {
    // Client-side validation
    const validChoices = editForm.choices.filter((c) => c.trim());
    if (!isAnswerValid(editForm.answer, validChoices)) {
      toast.error(
        "The correct answer must exactly match one of the provided choices",
      );
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("questionId", question.id);
      formData.append("question", editForm.question);
      formData.append("choices", JSON.stringify(validChoices));
      formData.append("answer", editForm.answer);
      formData.append("explanation", editForm.explanation);
      formData.append("score", editForm.score.toString());
      formData.append("timeLimit", editForm.timeLimit.toString());

      const result = await updateQuestionAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Question updated successfully");
        setIsEditing(false);
        onUpdate();
      }
    });
  };

  const validEditChoices = editForm.choices.filter((c) => c.trim());
  const isEditAnswerValid = isAnswerValid(editForm.answer, validEditChoices);

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Edit Question {question.orderNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`question-${question.id}`}>Question</Label>
            <Textarea
              id={`question-${question.id}`}
              value={editForm.question}
              onChange={(e) =>
                setEditForm({ ...editForm, question: e.target.value })
              }
              rows={3}
            />
          </div>

          <div>
            <Label>Answer Choices</Label>
            {editForm.choices.map((choice, index) => (
              <Input
                key={index}
                value={choice}
                onChange={(e) => {
                  const newChoices = [...editForm.choices];
                  newChoices[index] = e.target.value;
                  setEditForm({ ...editForm, choices: newChoices });
                }}
                placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                className="mt-1"
              />
            ))}
          </div>

          <div>
            <Label htmlFor={`answer-${question.id}`}>Correct Answer</Label>
            <Input
              id={`answer-${question.id}`}
              value={editForm.answer}
              onChange={(e) =>
                setEditForm({ ...editForm, answer: e.target.value })
              }
              placeholder="Enter the correct answer exactly as written above"
              className={
                !editForm.answer || isEditAnswerValid
                  ? ""
                  : "border-red-500 bg-red-50"
              }
            />
            {editForm.answer && !isEditAnswerValid && (
              <p className="mt-1 text-xs text-red-600">
                Answer must exactly match one of the choices above
              </p>
            )}
          </div>

          <div>
            <Label htmlFor={`explanation-${question.id}`}>Explanation</Label>
            <Textarea
              id={`explanation-${question.id}`}
              value={editForm.explanation}
              onChange={(e) =>
                setEditForm({ ...editForm, explanation: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`score-${question.id}`}>Score</Label>
              <Input
                id={`score-${question.id}`}
                type="number"
                value={editForm.score}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    score: parseInt(e.target.value) || 1,
                  })
                }
                min="1"
              />
            </div>
            <div>
              <Label htmlFor={`timeLimit-${question.id}`}>
                Time Limit (seconds)
              </Label>
              <Input
                id={`timeLimit-${question.id}`}
                type="number"
                value={editForm.timeLimit}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    timeLimit: parseInt(e.target.value) || defaultTimer,
                  })
                }
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                // Reset form to original values
                setEditForm({
                  question: question.question,
                  choices: [...question.choices],
                  answer: question.answer,
                  explanation: question.explanation,
                  score: question.score,
                  timeLimit: question.timeLimit,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={
                isPending ||
                !editForm.question ||
                !editForm.answer ||
                !isEditAnswerValid ||
                validEditChoices.length === 0
              }
            >
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Updating..." : "Update"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              Question {question.orderNumber}
            </CardTitle>
            <CardDescription>
              Score: {question.score} • Time: {question.timeLimit}s
            </CardDescription>
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <DeleteRCQuestionDialog
              questionId={question.id}
              questionNumber={question.orderNumber}
              onSuccess={onUpdate}
            >
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DeleteRCQuestionDialog>
          </div>
        </div>
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
  );
};

export default QuestionSetSection;
