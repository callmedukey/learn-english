"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";

import AddKeywordForm from "./add-keyword-form";
import AddReadingPassageForm from "./add-reading-passage-form";

interface KeywordCreationWorkflowProps {
  rcLevelId: string;
}

const KeywordCreationWorkflow: React.FC<KeywordCreationWorkflowProps> = ({
  rcLevelId,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<"keyword" | "passage">(
    "keyword",
  );
  const [createdKeywordId, setCreatedKeywordId] = useState<string | null>(null);

  const handleKeywordCreated = (keywordId: string) => {
    setCreatedKeywordId(keywordId);
    setCurrentStep("passage");
  };

  const handleFinish = () => {
    router.push(`/admin/reading/${rcLevelId}`);
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
              className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-medium text-white ${
                currentStep === "keyword" ? "bg-slate-600" : "bg-slate-400"
              }`}
            >
              {currentStep === "keyword" ? "1" : "✓"}
            </div>
            <span className="ml-2 font-medium">Create Keyword</span>
          </div>

          <div
            className={`h-1 w-8 ${currentStep === "passage" ? "bg-slate-600" : "bg-slate-300"}`}
          ></div>

          <div
            className={`flex items-center ${currentStep === "passage" ? "text-slate-700" : "text-slate-400"}`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-medium text-white ${
                currentStep === "passage" ? "bg-slate-600" : "bg-slate-300"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Add Reading Passage</span>
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

      {currentStep === "passage" && createdKeywordId && (
        <AddReadingPassageForm
          keywordId={createdKeywordId}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
};

export default KeywordCreationWorkflow;
