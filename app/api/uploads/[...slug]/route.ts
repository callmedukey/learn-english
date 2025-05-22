import fs from "fs";
import path from "path";

import mime from "mime-types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const slug = (await params).slug;
  if (!slug || slug.length === 0) {
    return NextResponse.json(
      { error: "File path is required" },
      { status: 400 },
    );
  }

  const filePath = path.join(process.cwd(), "public", "uploads", ...slug);

  try {
    const stat = await fs.promises.stat(filePath);

    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not a file" }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const contentType = mime.lookup(filePath) || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
