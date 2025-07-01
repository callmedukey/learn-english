import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

import CreateARForm from "./components/create-ar-form";

const CreateARPage = () => {
  return (
    <div className="space-y-6 px-1 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/novels">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Novels
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Lexile Level</h1>
            <p className="text-sm text-gray-600">Add a new Lexile Level</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <CreateARForm />
      </div>
    </div>
  );
};

export default CreateARPage;
