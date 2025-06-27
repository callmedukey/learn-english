import React from "react";

const NotFound = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">
        Novels for this Lexile level not found
      </h1>
      <p className="text-sm text-gray-500">
        Novels for this Lexile level are coming next month.
      </p>
    </div>
  );
};

export default NotFound;
