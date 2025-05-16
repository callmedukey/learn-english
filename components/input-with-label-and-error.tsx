import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function InputWithLabelAndError({
  label,
  name,
  placeholder,
  error,
  type,
  defaultValue,
  iconPosition = "right",
}: {
  label: string;
  name: string;
  placeholder?: string;
  error: string | undefined;
  type: string;
  defaultValue?: string;
  iconPosition?: "left" | "right";
}) {
  const id = useId();

  return (
    <div className="space-y-1.5">
      <Label 
        htmlFor={id}
        className="text-base font-normal leading-none tracking-[0%] text-gray-600"
      >
        {label}
      </Label>
      <Input
        id={id}
        className={cn(
          "peer placeholder:text-gray-400",
          type === "date" && iconPosition === "left" && "[&::-webkit-calendar-picker-indicator] { order: -1; margin-right: 4px; }"
        )}
        placeholder={placeholder}
        type={type}
        aria-invalid={!!error}
        name={name}
        defaultValue={defaultValue}
        style={type === "date" && iconPosition === "left" ? { 
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        } : undefined}
      />
      {error && (
        <p
          className="peer-aria-invalid:text-destructive text-xs"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}
