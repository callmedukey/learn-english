"use client";

import { User, Crown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Role } from "@/prisma/generated/prisma";

import MobileMenu from "./mobile-menu";
import { NotificationData } from "../notifications/actions/notification.actions";
import { NotificationBell } from "../notifications/notification-bell";
import { useAuth } from "../providers/auth-provider";

const AfterAuthNavBar = () => {
  const { session, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/notifications/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            setNotifications(data);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setNotificationsLoading(false);
        }
      } else {
        setNotificationsLoading(false);
      }
    };

    if (!isLoading) {
      fetchNotifications();
    }
  }, [session, isLoading]);

  if (isLoading) {
    return (
      <div className="absolute right-4">
        <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="absolute right-4">
        <Button asChild>
          <Link href="/login">로그인</Link>
        </Button>
      </div>
    );
  }

  // Check if user is admin or sub-admin
  const isAdminUser = 
    session?.user.role === Role.ADMIN ||
    session?.user.role === Role.SUB_ADMIN;

  // Show admin button for admin users
  if (isAdminUser) {
    return (
      <div className="absolute right-4">
        <Button asChild>
          <Link href="/admin">관리자</Link>
        </Button>
      </div>
    );
  }

  const userId = session?.user?.id;
  if (!userId) return null;

  return (
    <div className="flex items-center">
      {/* Desktop Navigation Items - Hidden on mobile */}
      <nav className="hidden items-center space-x-8 lg:flex">
        <Link
          href="/dashboard"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Dashboard
        </Link>
        <Link
          href="/novel"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Novel
        </Link>
        <Link
          href="/rc"
          className="text-base font-medium text-gray-700 underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Reading Comprehension
        </Link>
        {session?.user?.campusId && (
          <Link
            href="/bpa"
            className="flex items-center gap-1 text-base font-bold text-primary underline-offset-4 transition-colors hover:underline"
          >
            BPA 회원전용
            <Crown className="size-4" fill="currentColor" strokeWidth={0} />
          </Link>
        )}
      </nav>

      {/* Right Side Icons */}
      <div className="absolute right-4 flex items-center space-x-2">
        {/* Mobile Menu - Shown only on mobile */}
        <div className="lg:hidden">
          <MobileMenu 
            userId={userId} 
            notifications={notificationsLoading ? [] : notifications} 
          />
        </div>

        {/* Desktop Icons - Hidden on mobile */}
        <div className="ml-auto hidden items-center space-x-2 lg:flex">
          {userId && !notificationsLoading && (
            <NotificationBell
              userId={userId}
              initialNotifications={notifications}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full hover:bg-primary hover:text-white"
            asChild
          >
            <Link href="/profile">
              <User className="size-5 hover:text-white" />
              <span className="sr-only">User menu</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AfterAuthNavBar;