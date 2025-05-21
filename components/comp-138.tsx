"use client";

import { useId } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CheckboxWithLabelProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  label: string | React.ReactNode;
  className?: string;
}

export default function CheckboxWithLabel({
  label,
  className,
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
    </div>
  );
}

{
  /* <a className="underline" href={href} target="_blank">
  {hrefText}
</a>; */
}
