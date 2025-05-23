"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ImageUploadSectionProps {
  currentImage: {
    id: string;
    imageUrl: string;
    width: number;
    height: number;
  } | null;
  onImageChange: (file: File | null) => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  currentImage,
  onImageChange,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageChange(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayImage = previewUrl || currentImage?.imageUrl;

  return (
    <div className="space-y-4">
      <Label>Novel Cover Image</Label>

      <div className="space-y-4">
        {/* Current/Preview Image */}
        {displayImage && (
          <div className="relative">
            <div className="relative h-64 w-48 overflow-hidden rounded-lg border">
              <Image
                src={displayImage}
                alt="Novel cover"
                fill
                className="object-cover"
              />
            </div>
            {previewUrl && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Upload Button */}
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {currentImage ? "Change Image" : "Upload Image"}
          </Button>
          <p className="text-xs text-gray-500">
            Recommended: 300x400px, max 5MB
          </p>
        </div>

        {/* Image Info */}
        {currentImage && !previewUrl && (
          <div className="text-xs text-gray-500">
            <p>
              Current: {currentImage.width}x{currentImage.height}px
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploadSection;
