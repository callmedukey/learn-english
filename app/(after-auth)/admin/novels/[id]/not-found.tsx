import React from "react";

const NotFound = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">AR Level Not Found</h1>
      <p className="text-base text-gray-500">
        The AR level you are looking for does not exist.
      </p>
    </div>
  );
};

export default NotFound;
