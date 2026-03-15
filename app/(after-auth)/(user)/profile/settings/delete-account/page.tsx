import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import DeleteAccountForm from "./delete-account-form";

export const metadata: Metadata = {
  title: "Delete Account | 계정 삭제",
  description: "Delete your Reading Champ account | 리딩챔프 계정 삭제",
};

export default async function DeleteAccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Delete Account</h1>
        <p className="mt-2 text-gray-600">
          Permanently delete your account and all associated data
        </p>
      </div>

      <DeleteAccountForm userId={session.user.id} />
    </div>
  );
}
