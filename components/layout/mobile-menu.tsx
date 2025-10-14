"use client";

import { Bell, Check, Crown, Menu, User } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  hasCampusAccess?: boolean;
}

const MobileMenu = ({ userId, notifications = [], hasCampusAccess = false }: MobileMenuProps) => {
  const [currentNotifications, setCurrentNotifications] =
    useState(notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = currentNotifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setCurrentNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
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
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
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
      <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-x-hidden">
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
                {hasCampusAccess && (
                  <Link
                    href="/bpa"
                    className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-bold text-primary transition-colors hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    VIP 회원전용
                    <Crown className="size-4" fill="currentColor" strokeWidth={0} />
                  </Link>
                )}
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {currentNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y overflow-x-hidden">
                  {currentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`overflow-hidden p-3 transition-colors ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex max-w-full items-start justify-between gap-2">
                        <div className="max-w-full min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <div
                            className="mt-1 text-xs text-gray-600"
                            style={{
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              width: "100%",
                              maxWidth: "100%",
                              overflow: "hidden",
                              overflowX: "hidden",
                              hyphens: "auto"
                            }}
                          >
                            {notification.message.replace(/\u00A0/g, ' ')}
                          </div>
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
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
