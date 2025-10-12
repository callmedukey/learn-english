import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Role } from "@/prisma/generated/prisma";

import CreateBPALevelForm from "./components/create-bpa-level-form";

const CreateBPALevelPage = async () => {
  const session = await auth();

  // Only ADMIN can create BPA levels
  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/admin/bpa");
  }

  return (
    <div className="space-y-6 px-1 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/bpa">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to BPA Levels
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create BPA Level</h1>
            <p className="text-sm text-gray-600">Add a new BPA Level</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <CreateBPALevelForm />
      </div>
    </div>
  );
};

export default CreateBPALevelPage;
