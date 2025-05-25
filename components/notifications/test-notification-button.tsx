"use client";

import { Button } from "@/components/ui/button";

import { createTestNotification } from "./actions/notification.actions";

interface TestNotificationButtonProps {
  userId: string;
}

export function TestNotificationButton({
  userId,
}: TestNotificationButtonProps) {
  const handleCreateTestNotification = async () => {
    try {
      await createTestNotification(userId);
      // Refresh the page to see the new notification
      window.location.reload();
    } catch (error) {
      console.error("Error creating test notification:", error);
    }
  };

  return (
    <Button onClick={handleCreateTestNotification} variant="outline" size="sm">
      Test Notification
    </Button>
  );
}
