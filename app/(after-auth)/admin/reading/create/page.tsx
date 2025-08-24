import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Role } from "@/prisma/generated/prisma";

import CreateRCForm from "./components/create-rc-form";

const CreateRCPage = async () => {
  const session = await auth();
  
  // Only ADMIN can create RC levels
  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/admin/reading");
  }
  return (
    <div className="space-y-6 px-1 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/reading">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reading
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create RC Level</h1>
            <p className="text-sm text-gray-600">
              Add a new Reading Comprehension Level
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <CreateRCForm />
      </div>
    </div>
  );
};

export default CreateRCPage;
