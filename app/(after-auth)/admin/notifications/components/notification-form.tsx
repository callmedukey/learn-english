"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NotificationType } from "@/prisma/generated/prisma";

import { createNotificationForAllUsersAction } from "../actions/notifications.actions";

const initialState = {
  success: false,
  message: "",
  errors: undefined,
  inputs: undefined,
};

export default function NotificationForm() {
  const [state, formAction, isPending] = useActionState(
    createNotificationForAllUsersAction,
    initialState,
  );

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Send className="h-5 w-5 text-primary" />
          Send Announcement to All Users
        </CardTitle>
        <CardDescription className="text-gray-600">
          Create and send an announcement that will be delivered to all
          registered users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Hidden notification type field - always ANNOUNCEMENT */}
          <input
            type="hidden"
            name="type"
            value={NotificationType.ANNOUNCEMENT}
          />

          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-sm font-medium text-gray-700"
            >
              Announcement Title
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="Enter announcement title"
              defaultValue={state.inputs?.title || ""}
              className="border-gray-300 focus:border-primary focus:ring-primary/20"
              required
            />
            {state.errors?.title && (
              <p className="text-sm text-red-600">{state.errors.title[0]}</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label
              htmlFor="message"
              className="text-sm font-medium text-gray-700"
            >
              Announcement Message
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Enter announcement message"
              defaultValue={state.inputs?.message || ""}
              className="min-h-[120px] border-gray-300 focus:border-primary focus:ring-primary/20"
              required
            />
            {state.errors?.message && (
              <p className="text-sm text-red-600">{state.errors.message[0]}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                📢 Send Announcement to All Users
              </>
            )}
          </Button>

          {/* Status Messages */}
          {state.message && (
            <div
              className={`rounded-md p-4 ${
                state.success
                  ? "border border-amber-200 bg-amber-50 text-amber-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <p className="text-sm font-medium">{state.message}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
