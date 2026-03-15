"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { deleteAccount } from "../../actions/delete-account.action";

interface DeleteAccountFormProps {
  userId: string;
}

export default function DeleteAccountForm({ userId }: DeleteAccountFormProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isConfirmValid = confirmText === "DELETE";

  const handleDeleteRequest = () => {
    if (!isConfirmValid) {
      toast.error("Please type DELETE to confirm");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setShowConfirmDialog(false);

    try {
      const result = await deleteAccount(userId, {
        confirmText: confirmText as "DELETE",
        reason: reason || undefined,
      });

      if (result.success) {
        toast.success("Account deleted successfully. You will be signed out.");
        // Sign out and redirect to home
        await signOut({ redirect: false });
        router.push("/");
      } else {
        toast.error(result.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Warning Section */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-red-800">
              Warning: This action cannot be undone
            </h2>
            <div className="mt-3 text-sm text-red-700">
              <p className="mb-3">
                Deleting your account will permanently remove:
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Your profile information (name, email, nickname)</li>
                <li>All learning records and progress</li>
                <li>Quiz scores and achievements</li>
                <li>Subscription information</li>
                <li>Device tokens and notification settings</li>
              </ul>
              <p className="mt-3 font-medium">
                Payment records will be retained for legal compliance as
                required by law.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Korean Warning */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <h3 className="mb-3 font-semibold text-amber-800">
          계정 삭제 안내
        </h3>
        <div className="text-sm text-amber-700">
          <p className="mb-3">계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>프로필 정보 (이름, 이메일, 닉네임)</li>
            <li>학습 기록 및 진도</li>
            <li>퀴즈 점수 및 업적</li>
            <li>구독 정보</li>
            <li>기기 토큰 및 알림 설정</li>
          </ul>
          <p className="mt-3 font-medium">
            결제 기록은 법률에 따라 보관됩니다.
          </p>
        </div>
      </div>

      {/* Deletion Form */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="reason">
            Reason for leaving (optional) / 탈퇴 사유 (선택)
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please let us know why you're leaving... / 탈퇴 사유를 알려주시면 서비스 개선에 참고하겠습니다."
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="confirmText">
            Type <span className="font-bold text-red-600">DELETE</span> to
            confirm / 확인을 위해{" "}
            <span className="font-bold text-red-600">DELETE</span>를 입력하세요
          </Label>
          <Input
            id="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="DELETE"
            className="mt-1"
          />
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isDeleting}
          >
            Cancel / 취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteRequest}
            disabled={!isConfirmValid || isDeleting}
          >
            {isDeleting ? "Deleting... / 삭제 중..." : "Delete Account / 계정 삭제"}
          </Button>
        </div>
      </div>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Final Confirmation / 최종 확인</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="font-medium text-red-600">
                  Are you absolutely sure you want to delete your account?
                </p>
                <p>
                  정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel / 취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, delete my account / 네, 삭제합니다
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
