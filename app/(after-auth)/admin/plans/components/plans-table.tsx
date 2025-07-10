"use client";

import { format } from "date-fns";
import { MoreHorizontal, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plan } from "@/prisma/generated/prisma";

import EditPlanDialog from "./edit-plan-dialog";
import {
  deletePlanAction,
  togglePlanStatusAction,
} from "../actions/plans.actions";

interface PlansTableProps {
  plans: (Plan & {
    _count: {
      payments: number;
      subscriptions: number;
    };
  })[];
}

export default function PlansTable({ plans }: PlansTableProps) {
  const [isPending, startTransition] = useTransition();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDuration = (days: number) => {
    if (days === 1) return "1 day";
    if (days < 30) return `${days} days`;
    if (days === 30) return "1 month";
    if (days < 365) {
      const months = Math.round(days / 30);
      return `${months} month${months > 1 ? "s" : ""}`;
    }
    const years = Math.round(days / 365);
    return `${years} year${years > 1 ? "s" : ""}`;
  };

  const handleToggleStatus = (planId: string) => {
    startTransition(async () => {
      const result = await togglePlanStatusAction(planId);
      if (result.success) {
        toast.success("Plan status updated successfully!");
      } else {
        toast.error(result.error || "Failed to update plan status");
      }
    });
  };

  const handleDelete = (planId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this plan? This action cannot be undone.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deletePlanAction(planId);
      if (result.success) {
        toast.success("Plan deleted successfully!");
      } else {
        toast.error(result.error || "Failed to delete plan");
      }
    });
  };

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 p-3">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No plans found</h3>
          <p className="mt-1 text-gray-500">
            Get started by creating your first subscription plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payments</TableHead>
            <TableHead>Subscriptions</TableHead>
            <TableHead>Sort Order</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                <div>
                  <div className="font-medium text-gray-900">{plan.name}</div>
                  {plan.description && (
                    <div className="text-sm text-gray-500">
                      {plan.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{formatCurrency(plan.price)}</div>
                  {plan.priceUSD && (
                    <div className="text-sm text-gray-500">
                      ${plan.priceUSD.toFixed(2)} USD
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDuration(plan.duration)}</TableCell>
              <TableCell>
                <Badge
                  variant={plan.isActive ? "default" : "secondary"}
                  className={
                    plan.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {plan._count.payments}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {plan._count.subscriptions}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">{plan.sortOrder}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {format(plan.createdAt, "yyyy-MM-dd")}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EditPlanDialog plan={plan} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(plan.id)}
                        disabled={isPending}
                      >
                        {plan.isActive ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(plan.id)}
                        disabled={
                          isPending ||
                          plan._count.payments > 0 ||
                          plan._count.subscriptions > 0
                        }
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
