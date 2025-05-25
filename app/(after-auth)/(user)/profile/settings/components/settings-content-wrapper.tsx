"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gender } from "@/prisma/generated/prisma";

import PasswordChangeForm from "./password-change-form";
import { updateGender } from "../../actions/user.actions";
import { getUserSettings } from "../../queries/user.query";

interface UserSettings {
  nickname: string | null;
  email: string;
  gender: Gender | null;
  isCredentialsUser: boolean;
  canEditGender: boolean;
}

interface SettingsContentWrapperProps {
  userId: string;
  initialUserSettings: UserSettings;
}

export default function SettingsContentWrapper({
  userId,
  initialUserSettings,
}: SettingsContentWrapperProps) {
  const [userSettings, setUserSettings] = useState(initialUserSettings);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(
    userSettings.gender,
  );
  const [isUpdatingGender, setIsUpdatingGender] = useState(false);

  const handleGenderUpdate = async () => {
    if (!selectedGender) return;

    setIsUpdatingGender(true);

    try {
      const result = await updateGender(userId, { gender: selectedGender });

      if (result.success) {
        toast.success(result.message);
        // Refresh user settings
        const updatedSettings = await getUserSettings(userId);
        setUserSettings(updatedSettings);
        setSelectedGender(updatedSettings.gender);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error updating gender:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdatingGender(false);
    }
  };

  const hasGenderChanged = selectedGender !== userSettings.gender;

  return (
    <div className="space-y-8">
      {/* User Information Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Account Information
          </h3>
          <p className="text-sm text-gray-600">
            Your basic account information
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={userSettings.nickname || ""}
              readOnly
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={userSettings.email}
              readOnly
              disabled
              className="mt-1 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            {userSettings.canEditGender ? (
              <div className="mt-1 flex gap-2">
                <Select
                  value={selectedGender || ""}
                  onValueChange={(value) => setSelectedGender(value as Gender)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGenderUpdate}
                  disabled={
                    isUpdatingGender || !selectedGender || !hasGenderChanged
                  }
                  size="sm"
                  className="px-4"
                >
                  {isUpdatingGender ? "Updating..." : "Apply"}
                </Button>
              </div>
            ) : (
              <Input
                id="gender"
                value={userSettings.gender || "Not specified"}
                readOnly
                disabled
                className="mt-1 bg-gray-50"
              />
            )}
          </div>
        </div>
      </div>

      {/* Password Change Section - Only for credentials users */}
      {userSettings.isCredentialsUser && (
        <div className="border-t border-gray-200 pt-8">
          <PasswordChangeForm userId={userId} />
        </div>
      )}
    </div>
  );
}
