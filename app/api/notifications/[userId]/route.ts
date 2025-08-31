import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getUserNotifications } from "@/components/notifications/actions/notification.actions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;
    
    if (!session || session.user.id !== userId) {
      return NextResponse.json([], { status: 401 });
    }
    
    const notifications = await getUserNotifications(userId);
    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json([], { status: 500 });
  }
}