"use client";

import { Send, Users } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Campus, Country, PushTargetType } from "@/prisma/generated/prisma";

import UserSearch from "./user-search";
import {
  getEstimatedAudienceAction,
  sendPushNotificationAction,
} from "../actions/push.actions";

interface PushNotificationFormProps {
  campuses: Campus[];
  countries: Country[];
}

const GRADES = [
  "Kinder",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Adult",
];

export default function PushNotificationForm({
  campuses,
  countries,
}: PushNotificationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isEstimating, setIsEstimating] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetType, setTargetType] = useState<PushTargetType>(
    PushTargetType.ALL_USERS
  );
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedCampuses, setSelectedCampuses] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<
    boolean | undefined
  >();
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [estimatedAudience, setEstimatedAudience] = useState<{
    deviceCount: number;
    userCount: number;
  } | null>(null);

  const resetFilters = () => {
    setSelectedGrades([]);
    setSelectedCampuses([]);
    setSelectedCountries([]);
    setHasActiveSubscription(undefined);
    setSelectedUsers([]);
    setEstimatedAudience(null);
  };

  const handleTargetTypeChange = (value: PushTargetType) => {
    setTargetType(value);
    resetFilters();
  };

  const handleEstimateAudience = async () => {
    setIsEstimating(true);
    try {
      const result = await getEstimatedAudienceAction(
        targetType,
        {
          grades: selectedGrades,
          campusIds: selectedCampuses,
          countryIds: selectedCountries,
          hasActiveSubscription,
        },
        selectedUsers.map((u) => u.id)
      );
      setEstimatedAudience(result);
    } catch (error) {
      console.error("Estimate error:", error);
      toast.error("Failed to estimate audience");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in title and message");
      return;
    }

    if (
      targetType === PushTargetType.INDIVIDUAL &&
      selectedUsers.length === 0
    ) {
      toast.error("Please select at least one user");
      return;
    }

    startTransition(async () => {
      const result = await sendPushNotificationAction({
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        targetType,
        grades: selectedGrades,
        campusIds: selectedCampuses,
        countryIds: selectedCountries,
        hasActiveSubscription,
        userIds: selectedUsers.map((u) => u.id),
      });

      if (result.success) {
        toast.success(result.message);
        // Reset form
        setTitle("");
        setBody("");
        setImageUrl("");
        setTargetType(PushTargetType.ALL_USERS);
        resetFilters();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Send className="h-5 w-5 text-primary" />
          Send Push Notification
        </CardTitle>
        <CardDescription className="text-gray-600">
          Send push notifications to mobile app users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500">{title.length}/100</p>
          </div>

          {/* Body/Message */}
          <div className="space-y-2">
            <Label htmlFor="body" className="text-base font-medium">
              Message
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message"
              maxLength={500}
              rows={4}
              required
            />
            <p className="text-xs text-gray-500">{body.length}/500</p>
          </div>

          {/* Image URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-base font-medium">
              Image URL (optional)
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              type="url"
            />
          </div>

          {/* Target Type */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Target Audience</Label>
            <Select
              value={targetType}
              onValueChange={(v) => handleTargetTypeChange(v as PushTargetType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PushTargetType.ALL_USERS}>
                  All Users
                </SelectItem>
                <SelectItem value={PushTargetType.BY_GRADE}>
                  By Grade
                </SelectItem>
                <SelectItem value={PushTargetType.BY_CAMPUS}>
                  By Campus
                </SelectItem>
                <SelectItem value={PushTargetType.BY_COUNTRY}>
                  By Country
                </SelectItem>
                <SelectItem value={PushTargetType.BY_SUBSCRIPTION}>
                  By Subscription Status
                </SelectItem>
                <SelectItem value={PushTargetType.INDIVIDUAL}>
                  Individual Users
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Filters */}
          {targetType === PushTargetType.BY_GRADE && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Select Grades</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {GRADES.map((grade) => (
                  <label
                    key={grade}
                    className="flex cursor-pointer items-center space-x-2 rounded border p-2 hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedGrades.includes(grade)}
                      onCheckedChange={(checked) => {
                        setSelectedGrades((prev) =>
                          checked
                            ? [...prev, grade]
                            : prev.filter((g) => g !== grade)
                        );
                        setEstimatedAudience(null);
                      }}
                    />
                    <span className="text-sm">{grade}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {targetType === PushTargetType.BY_CAMPUS && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Select Campuses</Label>
              <div className="max-h-48 overflow-y-auto rounded border p-2">
                {campuses.length === 0 ? (
                  <p className="text-sm text-gray-500">No campuses available</p>
                ) : (
                  <div className="space-y-2">
                    {campuses.map((campus) => (
                      <label
                        key={campus.id}
                        className="flex cursor-pointer items-center space-x-2 rounded p-1 hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedCampuses.includes(campus.id)}
                          onCheckedChange={(checked) => {
                            setSelectedCampuses((prev) =>
                              checked
                                ? [...prev, campus.id]
                                : prev.filter((id) => id !== campus.id)
                            );
                            setEstimatedAudience(null);
                          }}
                        />
                        <span className="text-sm">{campus.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {targetType === PushTargetType.BY_COUNTRY && (
            <div className="space-y-2">
              <Label className="text-base font-medium">Select Countries</Label>
              <div className="max-h-48 overflow-y-auto rounded border p-2">
                {countries.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No countries available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {countries.map((country) => (
                      <label
                        key={country.id}
                        className="flex cursor-pointer items-center space-x-2 rounded p-1 hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedCountries.includes(country.id)}
                          onCheckedChange={(checked) => {
                            setSelectedCountries((prev) =>
                              checked
                                ? [...prev, country.id]
                                : prev.filter((id) => id !== country.id)
                            );
                            setEstimatedAudience(null);
                          }}
                        />
                        <span className="text-sm">{country.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {targetType === PushTargetType.BY_SUBSCRIPTION && (
            <div className="space-y-2">
              <Label className="text-base font-medium">
                Subscription Status
              </Label>
              <Select
                value={
                  hasActiveSubscription === true
                    ? "active"
                    : hasActiveSubscription === false
                      ? "inactive"
                      : ""
                }
                onValueChange={(v) => {
                  setHasActiveSubscription(
                    v === "active" ? true : v === "inactive" ? false : undefined
                  );
                  setEstimatedAudience(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Subscribers</SelectItem>
                  <SelectItem value="inactive">Non-Subscribers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === PushTargetType.INDIVIDUAL && (
            <div className="space-y-2">
              <Label className="text-base font-medium">
                Search and Select Users
              </Label>
              <UserSearch
                selectedUsers={selectedUsers}
                onSelect={(user) => {
                  if (!selectedUsers.find((u) => u.id === user.id)) {
                    setSelectedUsers([...selectedUsers, user]);
                    setEstimatedAudience(null);
                  }
                }}
                onRemove={(userId) => {
                  setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
                  setEstimatedAudience(null);
                }}
              />
            </div>
          )}

          {/* Estimate Audience */}
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleEstimateAudience}
              disabled={isEstimating}
            >
              <Users className="mr-2 h-4 w-4" />
              {isEstimating ? "Calculating..." : "Preview Audience"}
            </Button>
            {estimatedAudience && (
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {estimatedAudience.userCount} users
                </span>
                <span className="text-gray-500">
                  {" "}
                  ({estimatedAudience.deviceCount} devices)
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Push Notification
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
