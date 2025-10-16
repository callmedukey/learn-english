"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { createMonthlyChallenge } from "@/actions/admin/medals";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LevelType } from "@/prisma/generated/prisma";
// import { useToast } from "@/hooks/use-toast"; // TODO: Implement toast notifications

const formSchema = z.object({
  year: z.number().min(2024).max(2100),
  month: z.number().min(1).max(12),
  levelType: z.enum(["AR", "RC"]),
  levelId: z.string().min(1, "Please select a level"),
  contentIds: z.array(z.string()).min(1, "Select at least one content item"),
  scheduledActive: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

// This would typically be fetched from the server
// For now, we'll use a client component with useEffect
export default function CreateChallengeDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [levels, setLevels] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const router = useRouter();
  // const { toast } = useToast(); // TODO: Implement toast notifications

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      levelType: "AR",
      levelId: "",
      contentIds: [],
      scheduledActive: false,
    },
  });

  const levelType = form.watch("levelType");
  const levelId = form.watch("levelId");
  const selectedYear = form.watch("year");
  const selectedMonth = form.watch("month");
  
  // Check if the selected date is in the future
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const isFutureChallenge = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);

  // Fetch levels when level type changes
  useEffect(() => {
    async function fetchLevels() {
      const response = await fetch(
        `/api/admin/challenges/levels?type=${levelType}`
      );
      const data = await response.json();
      setLevels(data);
      form.setValue("levelId", "");
      form.setValue("contentIds", []);
    }
    fetchLevels();
  }, [levelType, form]);

  // Fetch content when level is selected
  useEffect(() => {
    async function fetchContent() {
      if (!levelId) {
        setContent([]);
        return;
      }
      const response = await fetch(
        `/api/admin/challenges/content?type=${levelType}&levelId=${levelId}`
      );
      const data = await response.json();
      setContent(data);
    }
    fetchContent();
  }, [levelType, levelId]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await createMonthlyChallenge({
        year: data.year,
        month: data.month,
        levelType: data.levelType as LevelType,
        levelId: data.levelId,
        novelIds: data.levelType === "AR" ? data.contentIds : [],
        keywordIds: data.levelType === "RC" ? data.contentIds : [],
        scheduledActive: data.scheduledActive || false,
      });

      // TODO: Show success notification
      console.log("Challenge created successfully");

      setOpen(false);
      router.refresh();
    } catch (error) {
      // TODO: Show error notification
      console.error("Failed to create challenge:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Challenge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Monthly Challenge</DialogTitle>
          <DialogDescription>
            Create a new monthly medal challenge for a specific level.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(v) => field.onChange(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2024, 2025, 2026].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(v) => field.onChange(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (month) => (
                              <SelectItem key={month} value={month.toString()}>
                                {month}월
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="levelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AR">AR (Novels)</SelectItem>
                      <SelectItem value="RC">RC (Keywords)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="levelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.level} {level.score && `(${level.score})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contentIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {levelType === "AR" ? "Novels" : "Keywords"}
                  </FormLabel>
                  <FormDescription>
                    Select which {levelType === "AR" ? "novels" : "keywords"}{" "}
                    will be part of this challenge
                  </FormDescription>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {content.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={field.value.includes(item.id)}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...field.value, item.id]
                              : field.value.filter((v) => v !== item.id);
                            field.onChange(updated);
                          }}
                        />
                        <label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {item.title || item.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFutureChallenge && (
              <FormField
                control={form.control}
                name="scheduledActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Auto-activate when month arrives
                      </FormLabel>
                      <FormDescription>
                        This challenge will automatically become active when {selectedYear}년 {selectedMonth}월 begins
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Challenge"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}