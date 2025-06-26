import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TIMEZONE } from "@/lib/constants/timezone";
import { ChangeRequestStatus } from "@/prisma/generated/prisma";
import { getLevelChangeRequests } from "@/server-queries/level-locks";

import ActionButtons from "./action-buttons";

async function getLevelInfo(levelType: string, levelId: string) {
  const { prisma } = await import("@/prisma/prisma-client");
  
  if (levelType === "AR") {
    const ar = await prisma.aR.findUnique({
      where: { id: levelId },
      select: { level: true, score: true },
    });
    return ar ? `AR ${ar.level} (${ar.score}점)` : "Unknown";
  } else {
    const rcLevel = await prisma.rCLevel.findUnique({
      where: { id: levelId },
      select: { level: true },
    });
    return rcLevel ? `RC ${rcLevel.level}` : "Unknown";
  }
}

async function RequestsTable({ status }: { status?: ChangeRequestStatus }) {
  const requests = await getLevelChangeRequests({ status });

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No {status ? status.toLowerCase() : ""} requests found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Request Date</TableHead>
          <TableHead>Level Type</TableHead>
          <TableHead>Current Level</TableHead>
          <TableHead>Requested Level</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {await Promise.all(
          requests.map(async (request) => {
            const fromLevel = await getLevelInfo(
              request.levelType,
              request.fromLevelId
            );
            const toLevel = await getLevelInfo(
              request.levelType,
              request.toLevelId
            );

            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {request.user.nickname || "No nickname"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {format(
                    toZonedTime(request.createdAt, APP_TIMEZONE),
                    "yyyy-MM-dd HH:mm"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{request.levelType}</Badge>
                </TableCell>
                <TableCell>{fromLevel}</TableCell>
                <TableCell className="font-medium">{toLevel}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {request.reason || "-"}
                </TableCell>
                <TableCell>
                  {request.status === "PENDING" && (
                    <Badge variant="default" className="bg-yellow-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  {request.status === "APPROVED" && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  )}
                  {request.status === "REJECTED" && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {request.status === "PENDING" ? (
                    <ActionButtons requestId={request.id} />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {request.reviewedAt && (
                        <div>
                          {format(
                            toZonedTime(request.reviewedAt, APP_TIMEZONE),
                            "MM/dd HH:mm"
                          )}
                        </div>
                      )}
                      {request.reviewer && (
                        <div>by {request.reviewer.nickname}</div>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export default async function LevelChangesPage() {
  const allRequests = await getLevelChangeRequests();
  
  const pendingCount = allRequests.filter(r => r.status === "PENDING").length;
  const approvedCount = allRequests.filter(r => r.status === "APPROVED").length;
  const rejectedCount = allRequests.filter(r => r.status === "REJECTED").length;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <RefreshCw className="h-8 w-8" />
          Level Change Requests
        </h1>
        <p className="text-muted-foreground">
          Review and manage user level change requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Level changes granted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected This Month
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">
              Level changes denied
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedCount})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({allRequests.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-6">
              <RequestsTable status="PENDING" />
            </TabsContent>
            <TabsContent value="approved" className="mt-6">
              <RequestsTable status="APPROVED" />
            </TabsContent>
            <TabsContent value="rejected" className="mt-6">
              <RequestsTable status="REJECTED" />
            </TabsContent>
            <TabsContent value="all" className="mt-6">
              <RequestsTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}