"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BirthdayConfirmationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isKorea: boolean;
}

const BirthdayConfirmationDialog = ({
  open,
  onConfirm,
  onCancel,
  isKorea,
}: BirthdayConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isKorea ? "생년월일 확인" : "Birthday Confirmation"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isKorea
              ? "생년월일은 문제풀이를 진행할 사람(자녀)의 생일을 입력하세요"
              : "Please enter the birthday of the person (child) who will be solving the quizzes"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {isKorea ? "돌아가기" : "Go Back"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isKorea ? "계속하기" : "Proceed"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BirthdayConfirmationDialog;