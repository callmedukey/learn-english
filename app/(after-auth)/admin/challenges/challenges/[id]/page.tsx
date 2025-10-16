import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/prisma/prisma-client";

import EditChallengeForm from "./edit-challenge-form";

async function getChallenge(id: string) {
  const challenge = await prisma.monthlyChallenge.findUnique({
    where: { id },
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

  if (!challenge) {
    notFound();
  }

  // Get level details
  let levelDetails;
  let availableContent;

  if (challenge.levelType === "AR") {
    levelDetails = await prisma.aR.findUnique({
      where: { id: challenge.levelId },
      select: { level: true, score: true },
    });

    availableContent = await prisma.novel.findMany({
      where: { ARId: challenge.levelId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    });
  } else {
    levelDetails = await prisma.rCLevel.findUnique({
      where: { id: challenge.levelId },
      select: { level: true },
    });

    availableContent = await prisma.rCKeyword.findMany({
      where: { rcLevelId: challenge.levelId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }

  return {
    ...challenge,
    levelDetails,
    availableContent,
  };
}

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = await getChallenge(id);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/admin/challenges/challenges">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Challenges
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Challenge</h1>
        <p className="text-muted-foreground">
          Update challenge settings and content
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Challenge Info */}
        <Card>
          <CardHeader>
            <CardTitle>Challenge Information</CardTitle>
            <CardDescription>
              {challenge.year}년 {challenge.month}월 {challenge.levelType}{" "}
              {challenge.levelDetails?.level}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-base font-medium text-muted-foreground">
                  Participants
                </dt>
                <dd className="text-2xl font-bold">
                  {challenge.levelType === "AR"
                    ? challenge._count.monthlyARScores
                    : challenge._count.monthlyRCScores}
                </dd>
              </div>
              <div>
                <dt className="text-base font-medium text-muted-foreground">
                  Medals Awarded
                </dt>
                <dd className="text-2xl font-bold">
                  {challenge._count.medals}
                </dd>
              </div>
              <div>
                <dt className="text-base font-medium text-muted-foreground">
                  Status
                </dt>
                <dd className="text-xl">
                  {challenge.active ? "Active" : "Inactive"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Update Challenge</CardTitle>
            <CardDescription>
              Modify challenge settings and selected content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditChallengeForm
              challenge={challenge}
              availableContent={challenge.availableContent}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
