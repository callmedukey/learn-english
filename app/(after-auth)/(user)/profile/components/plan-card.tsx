"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plan } from "@/prisma/generated/prisma";

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: (planId: string) => void;
  isPopular?: boolean;
  isKoreanUser?: boolean;
}

export default function PlanCard({
  plan,
  isSelected,
  onSelect,
  isPopular = false,
  isKoreanUser = true,
}: PlanCardProps) {
  const displayPrice = isKoreanUser 
    ? `₩${plan.price.toLocaleString("ko-KR")}`
    : `$${plan.priceUSD?.toFixed(2) || (plan.price / 1300).toFixed(2)} USD`;
  return (
    <Card
      className={`relative cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-amber-500 shadow-lg ring-2 ring-amber-500"
          : "border-gray-200 hover:shadow-md"
      } ${isPopular ? "border-amber-400" : ""}`}
      onClick={() => onSelect(plan.id)}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <Badge className="bg-amber-500 px-3 py-1 text-white">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-xl font-bold text-gray-900">
          {plan.name}
        </CardTitle>
        <div className="mt-4">
          <span className="text-3xl font-bold text-gray-900">{displayPrice}</span>
          <span className="text-sm text-gray-600 ml-1">/ {plan.duration} days</span>
        </div>
        {plan.description && (
          <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          className={`w-full ${
            isSelected
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(plan.id);
          }}
        >
          {isSelected ? "Selected" : "Choose Plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
