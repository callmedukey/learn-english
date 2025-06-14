import { useEffect } from "react";
import { submitRCAnswer } from "@/app/(after-auth)/(user)/rc/[rcLevelId]/[keywordId]/actions/rc-question.actions";

interface UsePageVisibilityProps {
  currentQuestionId: string | undefined;
  isAnswered: boolean;
  showExplanation: boolean;
  quizStarted: boolean;
  keywordId: string;
  rcLevelId: string;
  initialStatus: string;
}

export function useRCPageVisibility({
  currentQuestionId,
  isAnswered,
  showExplanation,
  quizStarted,
  keywordId,
  rcLevelId,
  initialStatus,
}: UsePageVisibilityProps) {
  useEffect(() => {
    if (!currentQuestionId || isAnswered || showExplanation || !quizStarted) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window - mark as timeout
        submitRCAnswer(
          currentQuestionId,
          "", // No answer selected
          keywordId,
          rcLevelId,
          true, // Timed out/left page
          initialStatus === "retry",
        );
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // User is leaving the page - mark as timeout
      submitRCAnswer(
        currentQuestionId,
        "", // No answer selected
        keywordId,
        rcLevelId,
        true, // Timed out/left page
        initialStatus === "retry",
      );

      // Show confirmation dialog
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    currentQuestionId,
    isAnswered,
    showExplanation,
    quizStarted,
    keywordId,
    rcLevelId,
    initialStatus,
  ]);
}
