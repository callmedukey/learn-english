import React from "react";

import NovelCreationWorkflow from "./components/novel-creation-workflow";

interface CreateNovelPageProps {
  params: Promise<{ id: string }>;
}

const CreateNovelPage = async ({ params }: CreateNovelPageProps) => {
  const { id } = await params;

  return (
    <div className="px-1 py-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Create Novel</h1>
      <NovelCreationWorkflow levelId={id} />
    </div>
  );
};

export default CreateNovelPage;
