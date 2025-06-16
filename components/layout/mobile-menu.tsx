"use client";

import { Bell, Check, Menu, User } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../notifications/actions/notification.actions";

interface MobileMenuProps {
  userId?: string;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

const MobileMenu = ({ userId, notifications = [] }: MobileMenuProps) => {
  const [currentNotifications, setCurrentNotifications] =
    useState(notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = currentNotifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setCurrentNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userId) return;

    try {
      await markAllNotificationsAsRead(userId);
      setCurrentNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true })),
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const containsKorean = (text: string) => {
    return /[\u3131-\u3163\uac00-\ud7a3]/g.test(text);
  };

  const getBreakClass = (message: string) => {
    return containsKorean(message) ? "break-all" : "break-words";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full hover:bg-primary hover:text-white"
        >
          <Menu className="size-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-left">
            {showNotifications ? "Notifications" : "Navigation"}
          </SheetTitle>
        </SheetHeader>

        {!showNotifications ? (
          <div className="flex flex-col">
            {/* Navigation Links */}
            <nav className="px-6 py-4">
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/novel"
                  className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Novel
                </Link>
                <Link
                  href="/rc"
                  className="flex h-10 items-center rounded-md px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Reading Comprehension
                </Link>
              </div>
            </nav>

            {/* Divider */}
            <div className="border-t" />

            {/* Action Buttons */}
            <div className="px-6 py-4">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="h-10 w-full justify-start gap-3 px-3"
                  onClick={() => setShowNotifications(true)}
                >
                  <Bell className="size-4" />
                  Notifications
                  {userId && unreadCount > 0 && (
                    <Badge className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-700 p-0 text-xs text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 w-full justify-start gap-3 px-3"
                  asChild
                >
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <User className="size-4" />
                    Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* Notifications Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs"
                >
                  ← Back
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1">
              {currentNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {currentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 transition-colors ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p
                            className={cn(
                              "mt-1 text-xs whitespace-pre-wrap text-gray-600",
                              getBreakClass(notification.message),
                            )}
                          >
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-6 w-6 flex-shrink-0 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
