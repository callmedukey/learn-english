import React from "react";

import { requireAdminAccess } from "@/lib/utils/admin-route-protection";

import NotificationForm from "./components/notification-form";

const page = async () => {
  await requireAdminAccess();
  
  return (
    <div className="px-1">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Send Announcements
          </h1>
          <p className="mt-2 text-gray-600">
            Send important announcements and updates to all users
          </p>
        </div>

        {/* Notification Form */}
        <NotificationForm />
      </div>
    </div>
  );
};

export default page;
