"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import EditCouponDialog from "./edit-coupon-dialog";
import {
  deleteCouponAction,
  toggleCouponStatusAction,
} from "../actions/coupons.actions";
import { CouponWithStats } from "../queries/coupons.query";

interface CouponsTableProps {
  coupons: CouponWithStats[];
}

export default function CouponsTable({ coupons }: CouponsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteCouponAction(id);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
      setDeletingId(null);
    });
  };

  const handleToggleStatus = async (id: string, active: boolean) => {
    startTransition(async () => {
      const result = await toggleCouponStatusAction(id, active);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  const formatDiscount = (coupon: CouponWithStats) => {
    if (coupon.discount > 0) {
      return {
        value: `${coupon.discount}%`,
        type: "Percentage",
      };
    }

    if (coupon.flatDiscount > 0) {
      return {
        value: `₩${coupon.flatDiscount.toLocaleString()}`,
        type: "Flat Amount",
      };
    }

    return {
      value: "No discount",
      type: "None",
    };
  };

  if (coupons.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">No coupons found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Expires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {coupons.map((coupon) => {
              const discount = formatDiscount(coupon);
              return (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                      {coupon.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium">{discount.value}</span>
                      <span className="text-xs text-gray-500">
                        {discount.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={coupon.active}
                        onCheckedChange={(checked) =>
                          handleToggleStatus(coupon.id, checked)
                        }
                        disabled={isPending}
                      />
                      <div className="flex flex-col">
                        <Badge
                          className={
                            coupon.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {coupon.active ? "Active" : "Inactive"}
                        </Badge>
                        {coupon.oneTimeUse && (
                          <Badge className="mt-1 bg-amber-100 text-xs text-amber-800">
                            One-time use
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                    <div>
                      <span className="font-medium">
                        {coupon._count.payments}
                      </span>
                      <span className="ml-1 text-gray-500">
                        {coupon._count.payments === 1 ? "use" : "uses"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    {coupon.deadline ? (
                      <div>
                        <div
                          className={
                            new Date(coupon.deadline) < new Date()
                              ? "text-red-600 font-medium"
                              : "text-gray-900"
                          }
                        >
                          {format(coupon.deadline, "MMM dd, yyyy")}
                        </div>
                        {new Date(coupon.deadline) < new Date() && (
                          <Badge className="mt-1 bg-red-100 text-xs text-red-800">
                            Expired
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No expiry</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {format(coupon.createdAt, "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <EditCouponDialog
                        coupon={coupon}
                        key={`${coupon.id}-${coupon.active}-${coupon?.discount}-${coupon?.flatDiscount}-${coupon?.code}-${coupon?.oneTimeUse}-${coupon?.deadline}`}
                      />

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isPending || deletingId === coupon.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the coupon &ldquo;
                              {coupon.code}&rdquo;?{" "}
                              {coupon._count.payments > 0 && (
                                <span className="mt-2 block text-red-600">
                                  ⚠️ This coupon has been used{" "}
                                  {coupon._count.payments} time(s). Deleting it
                                  may affect payment records.
                                </span>
                              )}
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(coupon.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingId === coupon.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
