"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

import { revalidatePath } from "next/cache";
import sharp from "sharp";

import { prisma } from "@/prisma/prisma-client";

export const createCountry = async (formData: FormData) => {
  const countryName = formData.get("countryName") as string;
  const iconFile = formData.get("iconFile") as File;

  if (!countryName || !iconFile) {
    return { error: "Country name and icon file are required" };
  }

  if (iconFile.size === 0) {
    return {
      error: "The icon file is empty. Please choose a valid file.",
    };
  }

  if (!iconFile.type.startsWith("image/")) {
    return { error: "Please upload an image file for the icon" };
  }

  let iconPathForDb: string | undefined = undefined;
  let filePathToDeleteOnError: string | undefined = undefined;

  try {
    const bytes = await iconFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const iconFileName = `${Date.now()}-${iconFile.name.replace(/\s+/g, "-")}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "country-icons",
    );
    await mkdir(uploadDir, { recursive: true });

    iconPathForDb = `/api/uploads/country-icons/${iconFileName}`;
    const fullFilePath = path.join(uploadDir, iconFileName);
    filePathToDeleteOnError = fullFilePath;

    await writeFile(fullFilePath, buffer);

    const imageMetadata = await sharp(buffer).metadata();
    const imageWidth = imageMetadata.width || 32;
    const imageHeight = imageMetadata.height || 32;

    const result = await prisma.$transaction(async (tx) => {
      const newCountry = await tx.country.create({
        data: {
          name: countryName,
        },
      });

      const newCountryIcon = await tx.countryIcon.create({
        data: {
          iconUrl: iconPathForDb!,
          width: imageWidth,
          height: imageHeight,
          countryId: newCountry.id,
        },
      });

      const updatedCountry = await tx.country.update({
        where: { id: newCountry.id },
        data: { countryIconId: newCountryIcon.id },
        include: { countryIcon: true },
      });

      return updatedCountry;
    });

    revalidatePath("/admin/countries");
    return { success: true, country: result };
  } catch (error) {
    console.error("Failed to create country:", error);
    if (filePathToDeleteOnError) {
      try {
        await unlink(filePathToDeleteOnError);
        console.log(`Cleaned up uploaded file: ${filePathToDeleteOnError}`);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded file:", cleanupError);
      }
    }
    return {
      error: "Failed to create country. Please try again.",
    };
  }
};

export const updateCountry = async (formData: FormData) => {
  const countryId = formData.get("countryId") as string;
  const countryName = formData.get("countryName") as string;
  const iconFile = formData.get("iconFile") as File | null;

  if (!countryId || !countryName) {
    return { error: "Country ID and name are required for update" };
  }

  let iconPathForDb: string | undefined = undefined;
  let filePathToDeleteOnError: string | undefined = undefined;
  let oldIconPathToDelete: string | undefined = undefined;

  try {
    const existingCountry = await prisma.country.findUnique({
      where: { id: countryId },
      include: { countryIcon: true },
    });

    if (!existingCountry) {
      return { error: "Country not found" };
    }

    let imageWidth = existingCountry.countryIcon?.width;
    let imageHeight = existingCountry.countryIcon?.height;

    if (iconFile && iconFile.size > 0) {
      if (!iconFile.type.startsWith("image/")) {
        return {
          error: "Please upload an image file for the icon",
        };
      }

      const bytes = await iconFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const iconFileName = `${Date.now()}-${iconFile.name.replace(/\s+/g, "-")}`;
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "country-icons",
      );
      await mkdir(uploadDir, { recursive: true });

      iconPathForDb = `/api/uploads/country-icons/${iconFileName}`;
      const fullFilePath = path.join(uploadDir, iconFileName);
      filePathToDeleteOnError = fullFilePath;

      await writeFile(fullFilePath, buffer);

      const imageMetadata = await sharp(buffer).metadata();
      imageWidth = imageMetadata.width || 32;
      imageHeight = imageMetadata.height || 32;

      if (existingCountry.countryIcon?.iconUrl) {
        oldIconPathToDelete = path.join(
          process.cwd(),
          "public",
          existingCountry.countryIcon.iconUrl.replace("/api", ""),
        );
      }
    } else if (iconFile && iconFile.size === 0) {
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedCountryData: { name: string; countryIconId?: string } = {
        name: countryName,
      };

      await tx.country.update({
        where: { id: countryId },
        data: { name: countryName },
      });

      if (iconPathForDb) {
        if (existingCountry.countryIcon) {
          // Update existing icon
          const updatedIcon = await tx.countryIcon.update({
            where: { id: existingCountry.countryIcon.id },
            data: {
              iconUrl: iconPathForDb,
              width: imageWidth || 32,
              height: imageHeight || 32,
            },
          });
          updatedCountryData.countryIconId = updatedIcon.id;
        } else {
          const newIcon = await tx.countryIcon.create({
            data: {
              iconUrl: iconPathForDb,
              width: imageWidth || 32,
              height: imageHeight || 32,
              countryId: countryId,
            },
          });
          updatedCountryData.countryIconId = newIcon.id;
          await tx.country.update({
            where: { id: countryId },
            data: { countryIconId: newIcon.id },
          });
        }
      }
      const finalUpdatedCountry = await tx.country.findUnique({
        where: { id: countryId },
        include: { countryIcon: true },
      });
      return finalUpdatedCountry;
    });

    if (oldIconPathToDelete) {
      try {
        await unlink(oldIconPathToDelete);
        console.log(`Successfully deleted old icon: ${oldIconPathToDelete}`);
      } catch (deleteError) {
        console.error("Failed to delete old icon file:", deleteError);
      }
    }

    revalidatePath("/admin/countries");
    revalidatePath(`/admin/countries/${countryId}`);
    return { success: true, country: result };
  } catch (error) {
    console.error("Failed to update country:", error);
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
      error: "Failed to update country. Please try again.",
    };
  }
};

export const deleteCountryAction = async (countryId: string) => {
  if (!countryId) {
    return { error: "Country ID is required for deletion" };
  }

  let iconPathToDelete: string | undefined = undefined;

  try {
    const countryToDelete = await prisma.country.findUnique({
      where: { id: countryId },
      include: { countryIcon: true },
    });

    if (!countryToDelete) {
      return { error: "Country not found. Cannot delete." };
    }

    if (countryToDelete.countryIcon?.iconUrl) {
      iconPathToDelete = path.join(
        process.cwd(),
        "public",
        countryToDelete.countryIcon.iconUrl.replace("/api", ""),
      );
    }

    await prisma.$transaction(async (tx) => {
      if (countryToDelete.countryIcon) {
        await tx.countryIcon.delete({
          where: { id: countryToDelete.countryIcon.id },
        });
      }
      await tx.country.delete({
        where: { id: countryId },
      });
    });

    if (iconPathToDelete) {
      try {
        await unlink(iconPathToDelete);
        console.log(`Successfully deleted icon file: ${iconPathToDelete}`);
      } catch (fileDeleteError) {
        console.error("Failed to delete icon file:", fileDeleteError);
      }
    }

    revalidatePath("/admin/countries");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete country:", error);
    return {
      error: "Failed to delete country. Please try again.",
    };
  }
};
