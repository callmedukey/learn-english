"use client";

import { format } from "date-fns";
import { CalendarIcon, InfoIcon } from "lucide-react";
import { useState } from "react";
import { DropdownNavProps, DropdownProps } from "react-day-picker";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Gender } from "@/prisma/generated/prisma";

import { updateBirthday, updateGender } from "../../actions/user.actions";
import { getUserSettings } from "../../queries/user.query";
import PasswordChangeForm from "./password-change-form";

interface UserSettings {
  nickname: string | null;
  email: string;
  gender: Gender | null;
  birthday: Date | null;
  isCredentialsUser: boolean;
  canEditGender: boolean;
  canEditBirthday: boolean;
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
  
  const [selectedBirthday, setSelectedBirthday] = useState<Date | undefined>(
    userSettings.birthday ? new Date(userSettings.birthday) : undefined,
  );
  const [showBirthdayConfirmDialog, setShowBirthdayConfirmDialog] = useState(false);
  const [showBirthdaySuccessDialog, setShowBirthdaySuccessDialog] = useState(false);
  const [isUpdatingBirthday, setIsUpdatingBirthday] = useState(false);

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

  const handleBirthdayUpdate = async () => {
    if (!selectedBirthday) return;

    setIsUpdatingBirthday(true);
    setShowBirthdayConfirmDialog(false);

    try {
      const result = await updateBirthday(userId, { birthday: selectedBirthday });

      if (result.success) {
        // Refresh user settings
        const updatedSettings = await getUserSettings(userId);
        setUserSettings(updatedSettings);
        setShowBirthdaySuccessDialog(true);
      } else {
        // Show error in dialog instead of toast
        alert(result.error || "Failed to update birthday");
      }
    } catch (error) {
      console.error("Error updating birthday:", error);
      alert("An unexpected error occurred");
    } finally {
      setIsUpdatingBirthday(false);
    }
  };

  const hasBirthdayChanged = selectedBirthday?.toDateString() !== 
    (userSettings.birthday ? new Date(userSettings.birthday).toDateString() : undefined);

  const handleCalendarChange = (
    _value: string | number,
    _e: React.ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const _event = {
      target: {
        value: String(_value),
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    _e(_event);
  };

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

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="birthday">Birthday</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You can only change your birthday once</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {userSettings.canEditBirthday ? (
              <div className="mt-1 flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !selectedBirthday && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedBirthday ? format(selectedBirthday, "PPP") : "Select your birthday"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedBirthday}
                      onSelect={setSelectedBirthday}
                      className="rounded-md border p-2"
                      classNames={{
                        month_caption: "mx-0",
                      }}
                      captionLayout="dropdown"
                      defaultMonth={selectedBirthday || new Date()}
                      startMonth={new Date(1940, 6)}
                      hideNavigation
                      components={{
                        DropdownNav: (props: DropdownNavProps) => {
                          return (
                            <div className="flex w-full items-center gap-2">
                              {props.children}
                            </div>
                          );
                        },
                        Dropdown: (props: DropdownProps) => {
                          return (
                            <Select
                              value={String(props.value)}
                              onValueChange={(value) => {
                                if (props.onChange) {
                                  handleCalendarChange(value, props.onChange);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 w-fit font-medium first:grow">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="max-h-[min(26rem,var(--radix-select-content-available-height))]">
                                {props.options?.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={String(option.value)}
                                    disabled={option.disabled}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          );
                        },
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  onClick={() => setShowBirthdayConfirmDialog(true)}
                  disabled={
                    isUpdatingBirthday || !selectedBirthday || !hasBirthdayChanged
                  }
                  size="sm"
                  className="px-4"
                >
                  Change Birthday
                </Button>
              </div>
            ) : (
              <Input
                id="birthday"
                value={userSettings.birthday ? format(new Date(userSettings.birthday), "PPP") : "Not specified"}
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

      {/* Birthday Confirmation Dialog */}
      <AlertDialog open={showBirthdayConfirmDialog} onOpenChange={setShowBirthdayConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Birthday Change</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="font-medium text-amber-600">
                  ⚠️ Important: You can only change your birthday once. This action cannot be undone.
                </p>
                <p>
                  You are about to set your birthday to:{" "}
                  <span className="font-medium">
                    {selectedBirthday && format(selectedBirthday, "MMMM d, yyyy")}
                  </span>
                </p>
                <p>Please make sure this is correct before confirming.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBirthdayUpdate}
              disabled={isUpdatingBirthday}
            >
              {isUpdatingBirthday ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Birthday Success Dialog */}
      <AlertDialog open={showBirthdaySuccessDialog} onOpenChange={setShowBirthdaySuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Birthday Updated Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              Your birthday has been updated. Remember, this was a one-time change and cannot be modified again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
