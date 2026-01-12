"use client";

import { format } from "date-fns";

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
import { PushCampaign, PushCampaignStatus, PushTargetType } from "@/prisma/generated/prisma";

interface CampaignHistoryProps {
  initialCampaigns: Array<
    PushCampaign & {
      createdBy: { name: string | null; email: string; nickname: string | null };
    }
  >;
  total: number;
}

const statusColors: Record<PushCampaignStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  SENDING: "bg-blue-100 text-blue-800 border-blue-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
};

const targetTypeLabels: Record<PushTargetType, string> = {
  ALL_USERS: "All Users",
  BY_GRADE: "By Grade",
  BY_CAMPUS: "By Campus",
  BY_COUNTRY: "By Country",
  BY_SUBSCRIPTION: "By Subscription",
  INDIVIDUAL: "Individual",
};

export default function CampaignHistory({
  initialCampaigns,
  total,
}: CampaignHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">
          Campaign History ({total} total)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {initialCampaigns.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>No push notification campaigns yet.</p>
            <p className="mt-1 text-sm">
              Send your first campaign using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {campaign.title}
                        </p>
                        <p className="max-w-xs truncate text-sm text-gray-500">
                          {campaign.body}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {targetTypeLabels[campaign.targetType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[campaign.status]}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium text-green-600">
                          {campaign.totalDelivered}
                        </span>
                        <span className="text-gray-400"> / </span>
                        <span>{campaign.totalSent}</span>
                        {campaign.totalFailed > 0 && (
                          <span className="ml-1 text-red-600">
                            ({campaign.totalFailed} failed)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {campaign.totalTargeted} users targeted
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {campaign.sentAt
                        ? format(new Date(campaign.sentAt), "MMM dd, yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {campaign.createdBy.nickname ||
                        campaign.createdBy.name ||
                        campaign.createdBy.email}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
