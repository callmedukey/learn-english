import React from "react";

import KeywordCreationWorkflow from "./components/keyword-creation-workflow";

interface CreateKeywordPageProps {
  params: Promise<{ id: string }>;
}

const CreateKeywordPage = async ({ params }: CreateKeywordPageProps) => {
  const { id } = await params;

  return (
    <div className="px-1 py-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Create Keyword</h1>
      <KeywordCreationWorkflow rcLevelId={id} />
    </div>
  );
};

export default CreateKeywordPage;
