import { NextResponse } from "next/server";

import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(null, { status: 200 });
    }
    
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(null, { status: 500 });
  }
}