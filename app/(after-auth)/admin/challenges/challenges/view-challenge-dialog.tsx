"use client";

import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Eye, Trophy, Users, BookOpen, Key } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { APP_TIMEZONE } from "@/lib/constants/timezone";

interface ViewChallengeDialogProps {
  challenge: {
    id: string;
    year: number;
    month: number;
    levelType: "AR" | "RC";
    levelId: string;
    novelIds: string[];
    keywordIds: string[];
    active: boolean;
    startDate: Date;
    endDate: Date;
    _count: {
      medals: number;
      monthlyARScores: number;
      monthlyRCScores: number;
    };
    levelDetails: any;
  };
}

interface ChallengeDetails {
  challenge: any;
  content: Array<{ id: string; title?: string; name?: string }>;
  levelInfo: any;
  leaderboard?: any;
  medalWinners?: Array<{
    medalType: string;
    user: { nickname: string };
    score: number;
  }>;
  topScores?: Array<{
    id: string;
    score: number;
    user: {
      id: string;
      nickname: string;
      image: string | null;
    };
  }>;
}

export default function ViewChallengeDialog({
  challenge,
}: ViewChallengeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<ChallengeDetails | null>(null);

  useEffect(() => {
    if (open && !details) {
      fetchChallengeDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function fetchChallengeDetails() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/challenges/challenges/${challenge.id}/details`
      );
      if (!response.ok) throw new Error("Failed to fetch challenge details");
      const data = await response.json();
      setDetails(data);
    } catch (error) {
      console.error("Failed to fetch challenge details:", error);
    } finally {
      setLoading(false);
    }
  }

  const participantCount =
    challenge.levelType === "AR"
      ? challenge._count.monthlyARScores
      : challenge._count.monthlyRCScores;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Challenge Details - {challenge.year}년 {challenge.month}월
          </DialogTitle>
          <DialogDescription>
            {challenge.levelType} Level {challenge.levelDetails?.level || "?"} 
            {challenge.levelDetails?.score && ` (${challenge.levelDetails.score})`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading details...</div>
          </div>
        ) : details ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-base">
                    <div>
                      <span className="text-muted-foreground">Period: </span>
                      <span className="font-medium">
                        {format(
                          toZonedTime(challenge.startDate, APP_TIMEZONE),
                          "yyyy-MM-dd"
                        )}{" "}
                        -{" "}
                        {format(
                          toZonedTime(challenge.endDate, APP_TIMEZONE),
                          "yyyy-MM-dd"
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      <Badge variant={challenge.active ? "default" : "secondary"}>
                        {challenge.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Participants: </span>
                      <span className="font-medium">{participantCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Medals Awarded: </span>
                      <span className="font-medium">{challenge._count.medals}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {challenge.levelType === "AR" ? (
                      <>
                        <BookOpen className="h-4 w-4" />
                        Selected Novels ({details.content.length})
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Selected Keywords ({details.content.length})
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {details.content.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 text-base"
                      >
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span>{item.title || item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Medal Winners */}
              {details.leaderboard && details.leaderboard.finalized && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medal Winners</CardTitle>
                    <CardDescription>
                      Final results for this challenge
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {details.leaderboard.goldUser && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-500">Gold</Badge>
                            <span className="font-medium">
                              {details.leaderboard.goldUser.nickname}
                            </span>
                          </div>
                          <span className="text-base text-muted-foreground">
                            {details.leaderboard.goldScore} points
                          </span>
                        </div>
                      )}
                      {details.leaderboard.silverUser && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-gray-400">Silver</Badge>
                            <span className="font-medium">
                              {details.leaderboard.silverUser.nickname}
                            </span>
                          </div>
                          <span className="text-base text-muted-foreground">
                            {details.leaderboard.silverScore} points
                          </span>
                        </div>
                      )}
                      {details.leaderboard.bronzeUser && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-600">Bronze</Badge>
                            <span className="font-medium">
                              {details.leaderboard.bronzeUser.nickname}
                            </span>
                          </div>
                          <span className="text-base text-muted-foreground">
                            {details.leaderboard.bronzeScore} points
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Participants (if not finalized) */}
              {details.topScores && details.topScores.length > 0 && !details.leaderboard?.finalized && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Top Participants</CardTitle>
                    <CardDescription>
                      Rankings are not yet finalized
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {details.topScores.slice(0, 5).map((score: any, index: number) => (
                        <div
                          key={score.id}
                          className="flex items-center justify-between text-base"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            <span>{score.user.nickname}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {score.score} points
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No details available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}