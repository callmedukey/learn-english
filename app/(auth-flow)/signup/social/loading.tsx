import React from "react";

const loading = () => {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl items-center justify-center py-16">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary" />
    </main>
  );
};

export default loading;
