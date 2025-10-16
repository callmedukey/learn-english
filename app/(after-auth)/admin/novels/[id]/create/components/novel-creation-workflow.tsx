"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import AddChapterForm from "./add-chapter-form";
import AddNovelForm from "./add-novel-form";

interface NovelCreationWorkflowProps {
  levelId: string;
}

const NovelCreationWorkflow: React.FC<NovelCreationWorkflowProps> = ({
  levelId,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<"novel" | "chapters">("novel");
  const [createdNovelId, setCreatedNovelId] = useState<string | null>(null);

  const handleNovelCreated = (novelId: string) => {
    setCreatedNovelId(novelId);
    setCurrentStep("chapters");
  };

  const handleFinish = () => {
    router.push(`/admin/novels/${levelId}`);
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
              className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-medium text-white ${
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
              className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-medium text-white ${
                currentStep === "chapters" ? "bg-slate-600" : "bg-slate-300"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Add Chapters</span>
          </div>
        </div>
      </div>

      {/* Form content */}
      {currentStep === "novel" && (
        <AddNovelForm levelId={levelId} onNovelCreated={handleNovelCreated} />
      )}

      {currentStep === "chapters" && createdNovelId && (
        <AddChapterForm novelId={createdNovelId} onFinish={handleFinish} />
      )}
    </div>
  );
};

export default NovelCreationWorkflow;
