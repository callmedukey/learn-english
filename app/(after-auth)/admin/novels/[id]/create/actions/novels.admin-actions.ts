"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

import { revalidatePath } from "next/cache";
import sharp from "sharp";

import { prisma } from "@/prisma/prisma-client";

export const createNovel = async (formData: FormData) => {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const level = formData.get("level") as string;
  const thumbnailFile = formData.get("thumbnailFile") as File;

  if (!title || !level || !thumbnailFile) {
    return {
      error: "Title, description, level, and thumbnail file are required",
    };
  }

  if (thumbnailFile.size === 0) {
    return {
      error: "The thumbnail file is empty. Please choose a valid file.",
    };
  }

  if (!thumbnailFile.type.startsWith("image/")) {
    return { error: "Please upload an image file for the thumbnail" };
  }

  let thumbnailPathForDb: string | undefined = undefined;
  let filePathToDeleteOnError: string | undefined = undefined;

  try {
    const bytes = await thumbnailFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const thumbnailFileName = `${Date.now()}-${thumbnailFile.name.replace(/\s+/g, "-")}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "novel-thumbnails",
    );
    await mkdir(uploadDir, { recursive: true });

    thumbnailPathForDb = `/api/uploads/novel-thumbnails/${thumbnailFileName}`;
    const fullFilePath = path.join(uploadDir, thumbnailFileName);
    filePathToDeleteOnError = fullFilePath;

    await writeFile(fullFilePath, buffer);

    const imageMetadata = await sharp(buffer).metadata();
    const imageWidth = imageMetadata.width || 300;
    const imageHeight = imageMetadata.height || 400;

    const result = await prisma.$transaction(async (tx) => {
      const newNovel = await tx.novel.create({
        data: {
          title,
          description,
          AR: {
            connect: {
              id: level,
            },
          },
        },
      });

      const newNovelImage = await tx.novelImage.create({
        data: {
          imageUrl: thumbnailPathForDb!,
          width: imageWidth,
          height: imageHeight,
          novelId: newNovel.id,
        },
      });

      const updatedNovel = await tx.novel.update({
        where: { id: newNovel.id },
        data: { imageId: newNovelImage.id },
        include: { image: true },
      });

      return updatedNovel;
    });

    revalidatePath(`/admin/novels/${level}`);
    revalidatePath(`/admin/novels/${level}/create`);
    return { success: true, novel: result };
  } catch (error) {
    console.error("Failed to create novel:", error);
    if (filePathToDeleteOnError) {
      try {
        await unlink(filePathToDeleteOnError);
        console.log(`Cleaned up uploaded file: ${filePathToDeleteOnError}`);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded file:", cleanupError);
      }
    }
    return {
      error: "Failed to create novel. Please try again.",
    };
  }
};

export const updateNovel = async (formData: FormData) => {
  const novelId = formData.get("novelId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const thumbnailFile = formData.get("thumbnailFile") as File | null;

  if (!novelId || !title || !description) {
    return {
      error: "Novel ID, title, and description are required for update",
    };
  }

  let thumbnailPathForDb: string | undefined = undefined;
  let filePathToDeleteOnError: string | undefined = undefined;
  let oldThumbnailPathToDelete: string | undefined = undefined;

  try {
    const existingNovel = await prisma.novel.findUnique({
      where: { id: novelId },
      include: { image: true },
    });

    if (!existingNovel) {
      return { error: "Novel not found" };
    }

    let imageWidth = existingNovel.image?.width;
    let imageHeight = existingNovel.image?.height;

    if (thumbnailFile && thumbnailFile.size > 0) {
      if (!thumbnailFile.type.startsWith("image/")) {
        return {
          error: "Please upload an image file for the thumbnail",
        };
      }

      const bytes = await thumbnailFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const thumbnailFileName = `${Date.now()}-${thumbnailFile.name.replace(/\s+/g, "-")}`;
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "novel-thumbnails",
      );
      await mkdir(uploadDir, { recursive: true });

      thumbnailPathForDb = `/api/uploads/novel-thumbnails/${thumbnailFileName}`;
      const fullFilePath = path.join(uploadDir, thumbnailFileName);
      filePathToDeleteOnError = fullFilePath;

      await writeFile(fullFilePath, buffer);

      const imageMetadata = await sharp(buffer).metadata();
      imageWidth = imageMetadata.width || 300;
      imageHeight = imageMetadata.height || 400;

      if (existingNovel.image?.imageUrl) {
        oldThumbnailPathToDelete = path.join(
          process.cwd(),
          "public",
          existingNovel.image.imageUrl.replace("/api", ""),
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.novel.update({
        where: { id: novelId },
        data: { title, description },
      });

      if (thumbnailPathForDb) {
        if (existingNovel.image) {
          await tx.novelImage.update({
            where: { id: existingNovel.image.id },
            data: {
              imageUrl: thumbnailPathForDb,
              width: imageWidth || 300,
              height: imageHeight || 400,
            },
          });
        } else {
          const newImage = await tx.novelImage.create({
            data: {
              imageUrl: thumbnailPathForDb,
              width: imageWidth || 300,
              height: imageHeight || 400,
              novelId: novelId,
            },
          });
          await tx.novel.update({
            where: { id: novelId },
            data: { imageId: newImage.id },
          });
        }
      }

      const finalUpdatedNovel = await tx.novel.findUnique({
        where: { id: novelId },
        include: { image: true, AR: true },
      });
      return finalUpdatedNovel;
    });

    if (oldThumbnailPathToDelete) {
      try {
        await unlink(oldThumbnailPathToDelete);
        console.log(
          `Successfully deleted old thumbnail: ${oldThumbnailPathToDelete}`,
        );
      } catch (deleteError) {
        console.error("Failed to delete old thumbnail file:", deleteError);
      }
    }

    revalidatePath(`/admin/novels`);
    revalidatePath(
      `/admin/novels/${encodeURIComponent(result?.AR?.level ?? "")}`,
      "layout",
    );
    revalidatePath(
      `/admin/novels/${encodeURIComponent(result?.AR?.level ?? "")}/${novelId}`,
      "layout",
    );
    return { success: true, novel: result };
  } catch (error) {
    console.error("Failed to update novel:", error);
    if (filePathToDeleteOnError) {
      try {
        await unlink(filePathToDeleteOnError);
        console.log(`Cleaned up uploaded file: ${filePathToDeleteOnError}`);
      } catch (cleanupError) {
        console.error(
          "Failed to cleanup uploaded file during error:",
          cleanupError,
        );
      }
    }
    return {
      error: "Failed to update novel. Please try again.",
    };
  }
};

export const deleteNovelAction = async (novelId: string) => {
  if (!novelId) {
    return { error: "Novel ID is required for deletion" };
  }

  let thumbnailPathToDelete: string | undefined = undefined;

  try {
    const novelToDelete = await prisma.novel.findUnique({
      where: { id: novelId },
      include: { image: true },
    });

    if (!novelToDelete) {
      return { error: "Novel not found. Cannot delete." };
    }

    if (novelToDelete.image?.imageUrl) {
      thumbnailPathToDelete = path.join(
        process.cwd(),
        "public",
        novelToDelete.image.imageUrl.replace("/api", ""),
      );
    }

    await prisma.$transaction(async (tx) => {
      if (novelToDelete.image) {
        await tx.novelImage.delete({
          where: { id: novelToDelete.image.id },
        });
      }
      await tx.novel.delete({
        where: { id: novelId },
      });
    });

    if (thumbnailPathToDelete) {
      try {
        await unlink(thumbnailPathToDelete);
        console.log(
          `Successfully deleted thumbnail file: ${thumbnailPathToDelete}`,
        );
      } catch (fileDeleteError) {
        console.error("Failed to delete thumbnail file:", fileDeleteError);
      }
    }

    revalidatePath("/admin/novels");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete novel:", error);
    return {
      error: "Failed to delete novel. Please try again.",
    };
  }
};
