"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";


import { uploadMedalImages } from "@/actions/admin/medals";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MedalType, LevelType } from "@/prisma/generated/prisma";
// import { useToast } from "@/hooks/use-toast"; // TODO: Implement toast notifications

interface UploadMedalImageDialogProps {
  levelType: LevelType;
  levelId: string;
  levelName: string;
  medalType: MedalType;
  currentImageUrl?: string;
}

export default function UploadMedalImageDialog({
  levelType,
  levelId,
  levelName,
  medalType,
  currentImageUrl,
}: UploadMedalImageDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  // const { toast } = useToast(); // TODO: Implement toast notifications

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    try {
      // In a real app, you would upload to S3/Cloudinary/etc
      // For now, we'll use a placeholder approach
      const formData = new FormData();
      formData.append("file", file);
      formData.append("levelType", levelType);
      formData.append("levelId", levelId);
      formData.append("medalType", medalType);

      // Upload to your storage service
      const response = await fetch("/api/admin/challenges/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { imageUrl, width, height } = await response.json();

      // Update database with new image URL and dimensions
      await uploadMedalImages({
        levelType,
        levelId,
        medalType,
        imageUrl,
        width,
        height,
      });

      // TODO: Show success notification
      console.log(`${medalType} medal image for ${levelName} has been updated.`);

      setOpen(false);
      router.refresh();
    } catch (error) {
      // TODO: Show error notification
      console.error("Failed to upload medal image:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          {currentImageUrl ? "Replace" : "Upload"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Medal Image</DialogTitle>
          <DialogDescription>
            Upload a {medalType.toLowerCase()} medal image for {levelName}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="medal-image">Medal Image</Label>
            <Input
              id="medal-image"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-base text-muted-foreground">
              Recommended size: 256x256px, PNG with transparency
            </p>
          </div>
          {file && (
            <div className="text-base">
              <p>Selected: {file.name}</p>
              <p className="text-muted-foreground">
                Size: {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={loading || !file}>
            {loading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}