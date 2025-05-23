"server only";

import { unlink } from "fs/promises";
import path from "path";

export const deleteFile = async (url: string) => {
  try {
    let filePath = url;

    if (url.startsWith("/api/uploads/")) {
      filePath = url.replace("/api/uploads/", "");
    }

    const fullPath = path.join(process.cwd(), "public", "uploads", filePath);

    await unlink(fullPath);

    console.log(`Successfully deleted file: ${fullPath}`);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    console.error(`Error deleting file: ${url}`, error);

    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {
        success: true,
        message: "File already deleted or doesn't exist",
      };
    }

    return { success: false, message: "Failed to delete file", error };
  }
};
