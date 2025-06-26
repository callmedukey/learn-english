"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { updateChallenge } from "@/actions/admin/medals";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
// import { useToast } from "@/hooks/use-toast"; // TODO: Implement toast notifications

const formSchema = z.object({
  active: z.boolean(),
  contentIds: z.array(z.string()).min(1, "Select at least one content item"),
  scheduledActive: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditChallengeFormProps {
  challenge: any;
  availableContent: Array<{ id: string; title?: string; name?: string }>;
}

export default function EditChallengeForm({
  challenge,
  availableContent,
}: EditChallengeFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // const { toast } = useToast(); // TODO: Implement toast notifications

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      active: challenge.active,
      contentIds:
        challenge.levelType === "AR"
          ? challenge.novelIds
          : challenge.keywordIds,
      scheduledActive: challenge.scheduledActive || false,
    },
  });
  
  // Check if this is a future challenge
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const isFutureChallenge = challenge.year > currentYear || (challenge.year === currentYear && challenge.month > currentMonth);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await updateChallenge({
        id: challenge.id,
        active: data.active,
        scheduledActive: data.scheduledActive,
        ...(challenge.levelType === "AR"
          ? { novelIds: data.contentIds }
          : { keywordIds: data.contentIds }),
      });

      // TODO: Show success notification
      console.log("Challenge updated successfully");

      router.push("/admin/challenges/challenges");
      router.refresh();
    } catch (error) {
      // TODO: Show error notification
      console.error("Failed to update challenge:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Challenge Period (Read-only) */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Challenge Period</p>
          <p className="text-sm text-muted-foreground">
            {format(
              toZonedTime(challenge.startDate, APP_TIMEZONE),
              "yyyy-MM-dd HH:mm"
            )}{" "}
            ~{" "}
            {format(
              toZonedTime(challenge.endDate, APP_TIMEZONE),
              "yyyy-MM-dd HH:mm"
            )}{" "}
            KST
          </p>
        </div>

        {/* Active Status */}
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Deactivate to stop accepting new scores for this challenge
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Scheduled Active for Future Challenges */}
        {isFutureChallenge && (
          <FormField
            control={form.control}
            name="scheduledActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Auto-Activate</FormLabel>
                  <FormDescription>
                    Automatically activate when {challenge.year}년 {challenge.month}월 begins
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Content Selection */}
        <FormField
          control={form.control}
          name="contentIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Selected {challenge.levelType === "AR" ? "Novels" : "Keywords"}
              </FormLabel>
              <FormDescription>
                Choose which {challenge.levelType === "AR" ? "novels" : "keywords"}{" "}
                are part of this challenge
              </FormDescription>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {availableContent.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.value.includes(item.id)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...field.value, item.id]
                          : field.value.filter((v) => v !== item.id);
                        field.onChange(updated);
                      }}
                    />
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {item.title || item.name}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Warning if medals already awarded */}
        {challenge._count.medals > 0 && (
          <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            <p className="font-medium">⚠️ Warning</p>
            <p>
              This challenge has already awarded {challenge._count.medals}{" "}
              medal(s). Changes will not affect already awarded medals.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/challenges/challenges")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}