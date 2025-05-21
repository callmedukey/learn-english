"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { useId } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CheckboxWithLabelProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  label: string | React.ReactNode;
  className?: string;
  error?: string;
}

export default function CheckboxWithLabel({
  label,
  className,
  error,
  ...restProps
}: CheckboxWithLabelProps) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        {...restProps}
        className={cn("rounded-none bg-white", className)}
      />
      <Label htmlFor={id} className="text-gray-500">
        {label}
      </Label>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
