import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const levelType = formData.get("levelType") as string;
    const levelId = formData.get("levelId") as string;
    const medalType = formData.get("medalType") as string;

    if (!file || !levelType || !levelId || !medalType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Please upload an image file" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if there's an existing medal image to delete
    const existingMedalImage = await prisma.medalImage.findUnique({
      where: {
        levelType_levelId_medalType: {
          levelType: levelType as any,
          levelId,
          medalType: medalType as any,
        },
      },
    });

    // If there's an existing image, prepare to delete it
    let oldImagePath: string | null = null;
    if (existingMedalImage?.imageUrl) {
      // Extract filename from the URL path (e.g., /api/uploads/medals/filename.png -> filename.png)
      const oldFileName = existingMedalImage.imageUrl.split('/').pop();
      if (oldFileName) {
        oldImagePath = path.join(process.cwd(), "public", "uploads", "medals", oldFileName);
      }
    }

    // Generate unique filename
    const fileExt = path.extname(file.name);
    const fileName = `${levelType}-${levelId}-${medalType}-${Date.now()}${fileExt}`;
    
    // Create upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "medals");
    await mkdir(uploadDir, { recursive: true });

    // Full file path
    const fullFilePath = path.join(uploadDir, fileName);

    // Write file to disk
    await writeFile(fullFilePath, buffer);

    // Get image metadata
    const imageMetadata = await sharp(buffer).metadata();
    const imageWidth = imageMetadata.width || 200;
    const imageHeight = imageMetadata.height || 200;

    // Delete old image file if it exists
    if (oldImagePath) {
      try {
        await unlink(oldImagePath);
        console.log(`Deleted old medal image: ${oldImagePath}`);
      } catch (error) {
        console.error(`Failed to delete old medal image: ${oldImagePath}`, error);
        // Continue even if deletion fails - the new image was uploaded successfully
      }
    }

    // Return the URL that will be served by the API route
    const imageUrl = `/api/uploads/medals/${fileName}`;

    return NextResponse.json({ 
      imageUrl,
      width: imageWidth,
      height: imageHeight
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}