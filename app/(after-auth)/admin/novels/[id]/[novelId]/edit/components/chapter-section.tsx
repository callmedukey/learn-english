"use client";

import {
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import React, { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import DeleteChapterDialog from "./delete-chapter-dialog";
import DeleteQuestionDialog from "./delete-question-dialog";
import DeleteQuestionSetDialog from "./delete-question-set-dialog";
import {
  createChapterAction,
  updateChapterAction,
  createQuestionSetAction,
  updateQuestionSetAction,
  createQuestionAction,
  updateQuestionAction,
} from "../actions/chapter.actions";

interface Chapter {
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
}

interface ChapterSectionProps {
  novelId: string;
  chapters: Chapter[];
  onChapterUpdate: () => void;
  defaultTimer: number;
  defaultScore: number;
}

const ChapterSection: React.FC<ChapterSectionProps> = ({
  novelId,
  chapters,
  onChapterUpdate,
  defaultTimer,
  defaultScore,
}) => {
  const [isPending, startTransition] = useTransition();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(),
  );
  const [showNewChapterForm, setShowNewChapterForm] = useState(false);

  // Form states
  const [newChapter, setNewChapter] = useState({
    title: "",
    description: "",
    orderNumber: chapters.length + 1,
    isFree: false,
  });

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleCreateChapter = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("novelId", novelId);
      formData.append("title", newChapter.title);
      formData.append("description", newChapter.description);
      formData.append("orderNumber", newChapter.orderNumber.toString());
      if (newChapter.isFree) {
        formData.append("isFree", "on");
      }

      const result = await createChapterAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Chapter created successfully");
        setNewChapter({
          title: "",
          description: "",
          orderNumber: chapters.length + 2,
          isFree: false,
        });
        setShowNewChapterForm(false);
        onChapterUpdate();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New Chapter Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Chapters ({chapters.length})</h3>
        <Button
          onClick={() => setShowNewChapterForm(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Chapter
        </Button>
      </div>

      {/* New Chapter Form */}
      {showNewChapterForm && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-medium">New Chapter</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewChapterForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="new-chapter-title">Title</Label>
              <Input
                id="new-chapter-title"
                value={newChapter.title}
                onChange={(e) =>
                  setNewChapter({ ...newChapter, title: e.target.value })
                }
                placeholder="Chapter title"
              />
            </div>
            <div>
              <Label htmlFor="new-chapter-order">Order Number</Label>
              <Input
                id="new-chapter-order"
                type="number"
                value={newChapter.orderNumber}
                onChange={(e) =>
                  setNewChapter({
                    ...newChapter,
                    orderNumber: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="md:col-span-1">
              <Label htmlFor="new-chapter-description">Description</Label>
              <Textarea
                id="new-chapter-description"
                value={newChapter.description}
                onChange={(e) =>
                  setNewChapter({ ...newChapter, description: e.target.value })
                }
                placeholder="Chapter description"
                rows={2}
              />
            </div>
            <div className="md:col-span-1">
              <div className="mt-2 flex items-center space-x-2">
                <Checkbox
                  id="new-chapter-isFree"
                  checked={newChapter.isFree}
                  onCheckedChange={(checked) =>
                    setNewChapter({ ...newChapter, isFree: checked === true })
                  }
                />
                <Label htmlFor="new-chapter-isFree">Free Access</Label>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowNewChapterForm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChapter}
              disabled={isPending || !newChapter.title}
            >
              <Save className="mr-2 h-4 w-4" />
              Create Chapter
            </Button>
          </div>
        </div>
      )}

      {/* Chapters List */}
      <div className="space-y-4">
        {chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            isExpanded={expandedChapters.has(chapter.id)}
            onToggle={() => toggleChapter(chapter.id)}
            onUpdate={onChapterUpdate}
            isPending={isPending}
            defaultTimer={defaultTimer}
            defaultScore={defaultScore}
          />
        ))}
      </div>

      {chapters.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          <p>No chapters yet. Create your first chapter to get started.</p>
        </div>
      )}
    </div>
  );
};

// Individual Chapter Card Component
interface ChapterCardProps {
  chapter: Chapter;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
  isPending: boolean;
  defaultTimer: number;
  defaultScore: number;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  isExpanded,
  onToggle,
  onUpdate,
  isPending,
  defaultTimer,
  defaultScore,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: chapter.title,
    description: chapter.description || "",
    orderNumber: chapter.orderNumber,
    isFree: chapter.isFree,
  });

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append("chapterId", chapter.id);
    formData.append("title", editForm.title);
    formData.append("description", editForm.description);
    formData.append("orderNumber", editForm.orderNumber.toString());
    if (editForm.isFree) {
      formData.append("isFree", "on");
    }

    const result = await updateChapterAction(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Chapter updated successfully");
      setIsEditing(false);
      onUpdate();
    }
  };

  return (
    <div className="rounded-lg border">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">
                    Chapter {chapter.orderNumber}: {chapter.title}
                  </h4>
                  {chapter.isFree ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                      Paid
                    </span>
                  )}
                  {chapter.novelQuestionSet &&
                    (chapter.novelQuestionSet.active ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        Quiz Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                        Quiz Inactive
                      </span>
                    ))}
                </div>
                <p className="text-sm text-gray-600">
                  {chapter.description || "No description"}
                  {chapter.novelQuestionSet && (
                    <span className="ml-2 text-blue-600">
                      • {chapter.novelQuestionSet.novelQuestions.length}{" "}
                      questions
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div
              className="flex space-x-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isExpanded) {
                    onToggle();
                  }
                  setIsEditing(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <DeleteChapterDialog
                chapterId={chapter.id}
                chapterTitle={chapter.title}
                onSuccess={onUpdate}
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DeleteChapterDialog>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 border-t bg-gray-50 p-4">
            {/* Edit Chapter Form */}
            {isEditing && (
              <div className="rounded-lg bg-yellow-50 p-4">
                <h5 className="mb-3 font-medium">Edit Chapter</h5>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Order Number</Label>
                    <Input
                      type="number"
                      value={editForm.orderNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          orderNumber: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label>Description</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <div className="mt-2 flex items-center space-x-2">
                      <Checkbox
                        checked={editForm.isFree}
                        onCheckedChange={(checked) =>
                          setEditForm({ ...editForm, isFree: checked === true })
                        }
                      />
                      <Label>Free Access</Label>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>
                    <Save className="mr-2 h-4 w-4" />
                    Update
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Question Set Section */}
            <QuestionSetSection
              chapterId={chapter.id}
              questionSet={chapter.novelQuestionSet}
              onUpdate={onUpdate}
              defaultTimer={defaultTimer}
              defaultScore={defaultScore}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Question Set Section Component
interface QuestionSetSectionProps {
  chapterId: string;
  questionSet: Chapter["novelQuestionSet"];
  onUpdate: () => void;
  defaultTimer: number;
  defaultScore: number;
}

const QuestionSetSection: React.FC<QuestionSetSectionProps> = ({
  chapterId,
  questionSet,
  onUpdate,
  defaultTimer,
  defaultScore,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [instructions, setInstructions] = useState(
    questionSet?.instructions || "Find the best answer for each question.",
  );
  const [active, setActive] = useState<boolean>(questionSet?.active ?? true);

  const handleCreateQuestionSet = async () => {
    const formData = new FormData();
    formData.append("chapterId", chapterId);
    formData.append("instructions", instructions);
    formData.append("active", active.toString());

    const result = await createQuestionSetAction(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Question set created successfully");
      setShowCreateForm(false);
      onUpdate();
    }
  };

  const handleUpdateQuestionSet = async () => {
    if (!questionSet) return;

    const formData = new FormData();
    formData.append("questionSetId", questionSet.id);
    formData.append("instructions", instructions);
    formData.append("active", active.toString());

    const result = await updateQuestionSetAction(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Question set updated successfully");
      setIsEditing(false);
      onUpdate();
    }
  };

  if (!questionSet && !showCreateForm) {
    return (
      <div className="py-6 text-center">
        <p className="mb-4 text-gray-500">No question set for this chapter</p>
        <Button
          onClick={() => setShowCreateForm(true)}
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Question Set
        </Button>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="rounded-lg bg-green-50 p-4">
        <h5 className="mb-3 font-medium">Create Question Set</h5>
        <div className="space-y-4">
          <div>
            <Label>Instructions</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter instructions for this question set"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="create-active"
              checked={active}
              onCheckedChange={(checked) => setActive(checked as boolean)}
            />
            <Label htmlFor="create-active" className="text-sm">
              Active (users can access this quiz)
            </Label>
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateQuestionSet}>
            <Save className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h5 className="font-medium">Question Set</h5>
          <div className="flex items-center space-x-2">
            {questionSet?.active ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                Inactive
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteQuestionSetDialog
            questionSetId={questionSet?.id || ""}
            onSuccess={onUpdate}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DeleteQuestionSetDialog>
        </div>
      </div>

      {isEditing ? (
        <div className="rounded-lg bg-yellow-50 p-4">
          <div className="space-y-4">
            <div>
              <Label>Instructions</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-active"
                checked={active}
                onCheckedChange={(checked) => setActive(checked as boolean)}
              />
              <Label htmlFor="edit-active" className="text-sm">
                Active (users can access this quiz)
              </Label>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuestionSet}>
              <Save className="mr-2 h-4 w-4" />
              Update
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded bg-gray-50 p-3">
          <p className="text-sm">{questionSet?.instructions}</p>
        </div>
      )}

      {/* Questions Section */}
      <QuestionsSection
        questionSetId={questionSet?.id || ""}
        questions={questionSet?.novelQuestions || []}
        onUpdate={onUpdate}
        defaultTimer={defaultTimer}
        defaultScore={defaultScore}
      />
    </div>
  );
};

// Questions Section Component
interface QuestionsSectionProps {
  questionSetId: string;
  questions: Array<{
    id: string;
    orderNumber: number;
    question: string;
    choices: string[];
    answer: string;
    explanation: string;
    score: number;
    timeLimit: number;
  }>;
  onUpdate: () => void;
  defaultTimer: number;
  defaultScore: number;
}

const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  questionSetId,
  questions,
  onUpdate,
  defaultTimer,
  defaultScore,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    choices: ["", "", "", ""],
    answer: "",
    explanation: "",
    score: defaultScore,
    timeLimit: defaultTimer,
    orderNumber: questions.length + 1,
  });

  // Validation helper
  const isAnswerValid = (answer: string, choices: string[]) => {
    const validChoices = choices.filter((c) => c.trim());
    return validChoices.includes(answer);
  };

  const handleCreateQuestion = async () => {
    // Client-side validation
    const validChoices = newQuestion.choices.filter((c) => c.trim());
    if (!isAnswerValid(newQuestion.answer, validChoices)) {
      toast.error(
        "The correct answer must exactly match one of the provided choices",
      );
      return;
    }

    const formData = new FormData();
    formData.append("questionSetId", questionSetId);
    formData.append("question", newQuestion.question);
    formData.append("choices", JSON.stringify(validChoices));
    formData.append("answer", newQuestion.answer);
    formData.append("explanation", newQuestion.explanation);
    formData.append("score", newQuestion.score.toString());
    formData.append("timeLimit", newQuestion.timeLimit.toString());
    formData.append("orderNumber", newQuestion.orderNumber.toString());

    const result = await createQuestionAction(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Question created successfully");
      setNewQuestion({
        question: "",
        choices: ["", "", "", ""],
        answer: "",
        explanation: "",
        score: defaultScore,
        timeLimit: defaultTimer,
        orderNumber: questions.length + 2,
      });
      setShowCreateForm(false);
      onUpdate();
    }
  };

  const validChoices = newQuestion.choices.filter((c) => c.trim());
  const isNewQuestionAnswerValid = isAnswerValid(
    newQuestion.answer,
    validChoices,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h6 className="font-medium">Questions ({questions.length})</h6>
        <Button
          onClick={() => setShowCreateForm(true)}
          size="sm"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      {/* Create Question Form */}
      {showCreateForm && (
        <div className="space-y-4 rounded-lg bg-blue-50 p-4">
          <h6 className="font-medium">New Question</h6>

          <div className="space-y-4">
            <div>
              <Label>Question</Label>
              <Textarea
                value={newQuestion.question}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, question: e.target.value })
                }
                placeholder="Enter the question"
                rows={3}
              />
            </div>

            <div>
              <Label>Answer Choices</Label>
              {newQuestion.choices.map((choice, index) => (
                <Input
                  key={index}
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [...newQuestion.choices];
                    newChoices[index] = e.target.value;
                    setNewQuestion({ ...newQuestion, choices: newChoices });
                  }}
                  placeholder={`Choice ${String.fromCharCode(65 + index)}`}
                  className="mt-1"
                />
              ))}
            </div>

            <div>
              <Label>Correct Answer</Label>
              <Input
                value={newQuestion.answer}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, answer: e.target.value })
                }
                placeholder="Enter the correct answer exactly as written above"
                className={
                  !newQuestion.answer || isNewQuestionAnswerValid
                    ? ""
                    : "border-red-500 bg-red-50"
                }
              />
              {newQuestion.answer && !isNewQuestionAnswerValid && (
                <p className="mt-1 text-xs text-red-600">
                  Answer must exactly match one of the choices above
                </p>
              )}
            </div>

            <div>
              <Label>Explanation</Label>
              <Textarea
                value={newQuestion.explanation}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    explanation: e.target.value,
                  })
                }
                placeholder="Explanation for the correct answer"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Score</Label>
                <Input
                  type="number"
                  value={newQuestion.score}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      score: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label>Time Limit (seconds)</Label>
                <Input
                  type="number"
                  value={newQuestion.timeLimit}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      timeLimit: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Order Number</Label>
              <Input
                type="number"
                value={newQuestion.orderNumber}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    orderNumber: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateQuestion}
              disabled={
                !newQuestion.question ||
                !newQuestion.answer ||
                !isNewQuestionAnswerValid ||
                validChoices.length === 0
              }
            >
              <Save className="mr-2 h-4 w-4" />
              Create Question
            </Button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-2">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      {questions.length === 0 && (
        <div className="py-4 text-center text-gray-500">
          <p>No questions yet. Add your first question above.</p>
        </div>
      )}
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
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    question: question.question,
    choices: [...question.choices],
    answer: question.answer,
    explanation: question.explanation,
    score: question.score,
    timeLimit: question.timeLimit,
    orderNumber: question.orderNumber,
  });

  // Validation helper
  const isAnswerValid = (answer: string, choices: string[]) => {
    const validChoices = choices.filter((c) => c.trim());
    return validChoices.includes(answer);
  };

  const handleUpdate = async () => {
    // Client-side validation
    const validChoices = editForm.choices.filter((c) => c.trim());
    if (!isAnswerValid(editForm.answer, validChoices)) {
      toast.error(
        "The correct answer must exactly match one of the provided choices",
      );
      return;
    }

    const formData = new FormData();
    formData.append("questionId", question.id);
    formData.append("question", editForm.question);
    formData.append("choices", JSON.stringify(validChoices));
    formData.append("answer", editForm.answer);
    formData.append("explanation", editForm.explanation);
    formData.append("score", editForm.score.toString());
    formData.append("timeLimit", editForm.timeLimit.toString());
    formData.append("orderNumber", editForm.orderNumber.toString());

    const result = await updateQuestionAction(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Question updated successfully");
      setIsEditing(false);
      onUpdate();
    }
  };

  const validEditChoices = editForm.choices.filter((c) => c.trim());
  const isEditAnswerValid = isAnswerValid(editForm.answer, validEditChoices);

  if (isEditing) {
    return (
      <div className="space-y-4 rounded-lg bg-yellow-50 p-4">
        <h6 className="font-medium">Edit Question {question.orderNumber}</h6>

        <div className="space-y-4">
          <div>
            <Label>Question</Label>
            <Textarea
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
            <Label>Correct Answer</Label>
            <Input
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
            <Label>Explanation</Label>
            <Textarea
              value={editForm.explanation}
              onChange={(e) =>
                setEditForm({ ...editForm, explanation: e.target.value })
              }
              placeholder="Explanation for the correct answer"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Score</Label>
              <Input
                type="number"
                value={editForm.score}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    score: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Time Limit (seconds)</Label>
              <Input
                type="number"
                value={editForm.timeLimit}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    timeLimit: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label>Order Number</Label>
            <Input
              type="number"
              value={editForm.orderNumber}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  orderNumber: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={
              !editForm.question ||
              !editForm.answer ||
              !isEditAnswerValid ||
              validEditChoices.length === 0
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Update
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center space-x-2">
            <span className="text-sm font-medium">Q{question.orderNumber}</span>
            <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
              {question.score} pts
            </span>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
              {question.timeLimit}s
            </span>
          </div>
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
        </div>
        <div className="ml-4 flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <DeleteQuestionDialog
            questionId={question.id}
            questionNumber={question.orderNumber}
            onSuccess={onUpdate}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </DeleteQuestionDialog>
        </div>
      </div>
    </div>
  );
};

export default ChapterSection;
