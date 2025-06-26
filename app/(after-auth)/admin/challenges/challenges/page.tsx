import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Edit, Trophy, Calendar, Clock } from "lucide-react";
import Link from "next/link";

import { checkAndActivateScheduledChallenges } from "@/actions/admin/medals";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { prisma } from "@/prisma/prisma-client";
import { getCurrentKoreaYearMonth } from "@/server-queries/medals";

import CreateChallengeDialog from "./create-challenge-dialog";
import ViewChallengeDialog from "./view-challenge-dialog";

async function getChallenges() {
  const challenges = await prisma.monthlyChallenge.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }, { levelType: "asc" }],
    include: {
      _count: {
        select: {
          medals: true,
          monthlyARScores: true,
          monthlyRCScores: true,
        },
      },
    },
  });

  // Get level details for each challenge
  const challengesWithDetails = await Promise.all(
    challenges.map(async (challenge) => {
      let levelDetails;
      if (challenge.levelType === "AR") {
        levelDetails = await prisma.aR.findUnique({
          where: { id: challenge.levelId },
          select: { level: true, score: true },
        });
      } else {
        levelDetails = await prisma.rCLevel.findUnique({
          where: { id: challenge.levelId },
          select: { level: true },
        });
      }
      return { ...challenge, levelDetails };
    })
  );

  return challengesWithDetails;
}

export default async function ChallengesPage() {
  // Check and activate scheduled challenges when the page loads
  await checkAndActivateScheduledChallenges();
  
  const challenges = await getChallenges();
  const { year, month } = getCurrentKoreaYearMonth();

  // Properly categorize challenges based on Korean time
  const pastChallenges = challenges.filter(
    (c) => c.year < year || (c.year === year && c.month < month)
  );
  const currentChallenges = challenges.filter(
    (c) => c.year === year && c.month === month
  );
  const futureChallenges = challenges.filter(
    (c) => c.year > year || (c.year === year && c.month > month)
  );

  // Helper function to get status badge
  const getStatusBadge = (challenge: any) => {
    const isCurrentMonth = challenge.year === year && challenge.month === month;
    const isFuture = challenge.year > year || (challenge.year === year && challenge.month > month);
    
    if (isFuture) {
      return <Badge variant="outline">Scheduled</Badge>;
    } else if (isCurrentMonth && challenge.active) {
      return <Badge variant="default">Active</Badge>;
    } else if (isCurrentMonth && !challenge.active) {
      return <Badge variant="secondary">Inactive</Badge>;
    } else {
      return <Badge variant="secondary">Past</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Monthly Challenges
          </h1>
          <p className="text-muted-foreground">
            Create and manage monthly medal challenges
          </p>
        </div>
        <CreateChallengeDialog />
      </div>

      {/* Future Challenges */}
      {futureChallenges.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Future Challenges
            </CardTitle>
            <CardDescription>
              Scheduled challenges for upcoming months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year/Month</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {futureChallenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">
                      {challenge.year}년 {challenge.month}월
                    </TableCell>
                    <TableCell>
                      {challenge.levelDetails?.level || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{challenge.levelType}</Badge>
                    </TableCell>
                    <TableCell>
                      {challenge.levelType === "AR"
                        ? `${challenge.novelIds.length} novels`
                        : `${challenge.keywordIds.length} keywords`}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(challenge)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/challenges/challenges/${challenge.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Current Month Challenges */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Current Month ({year}년 {month}월)
          </CardTitle>
          <CardDescription>
            Active challenges for the current month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentChallenges.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No challenges created for this month yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentChallenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">
                      {challenge.levelDetails?.level || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{challenge.levelType}</Badge>
                    </TableCell>
                    <TableCell>
                      {challenge.levelType === "AR"
                        ? `${challenge.novelIds.length} novels`
                        : `${challenge.keywordIds.length} keywords`}
                    </TableCell>
                    <TableCell>
                      {challenge.levelType === "AR"
                        ? challenge._count.monthlyARScores
                        : challenge._count.monthlyRCScores}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(challenge)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/challenges/challenges/${challenge.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Past Challenges
          </CardTitle>
          <CardDescription>
            Historical challenges from previous months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastChallenges.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No past challenges found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year/Month</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Medals Awarded</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastChallenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">
                      {challenge.year}년 {challenge.month}월
                    </TableCell>
                    <TableCell>
                      {challenge.levelDetails?.level || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{challenge.levelType}</Badge>
                    </TableCell>
                    <TableCell>
                      {challenge.levelType === "AR"
                        ? `${challenge.novelIds.length} novels`
                        : `${challenge.keywordIds.length} keywords`}
                    </TableCell>
                    <TableCell>{challenge._count.medals}</TableCell>
                    <TableCell>
                      {format(
                        toZonedTime(challenge.endDate, APP_TIMEZONE),
                        "yyyy-MM-dd"
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(challenge)}
                    </TableCell>
                    <TableCell>
                      <ViewChallengeDialog challenge={challenge} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}