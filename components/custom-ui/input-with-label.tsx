"use client";

import { InputHTMLAttributes, useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InputWithLabelProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  inputClassName?: string;
}

export default function InputWithLabel({
  label,
  hint,
  error,
  inputClassName,
  className,
  id: propId,
  ...restProps
}: InputWithLabelProps) {
  const generatedId = useId();
  const finalId = propId || generatedId;

  return (
    <div className="*:not-first:mt-2">
      <div className="flex items-center justify-between gap-1">
        <Label htmlFor={finalId} className="text-base leading-6 text-gray-500">
          {label}
        </Label>
        {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
      </div>
      <Input
        id={finalId}
        className={cn(
          "peer text-base text-gray-500 shadow-none",
          inputClassName,
          className,
        )}
        aria-invalid={!!error}
        {...restProps}
      />
      {error && (
        <p
          className="mt-2 text-xs peer-aria-invalid:text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
