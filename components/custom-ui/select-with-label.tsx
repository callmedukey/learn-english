import { useId } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectWithLabelProps extends React.ComponentProps<typeof Select> {
  label: string;
  placeholder: string;
  items: { label: string; value: string }[];
  error?: string;
  id?: string;
  hint?: string;
}

export default function SelectWithLabel({
  label,
  placeholder,
  hint,
  items,
  error,
  id: propId,
  ...props
}: SelectWithLabelProps) {
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
      <Select {...props}>
        <SelectTrigger
          id={finalId}
          className="text-base data-[placeholder]:text-muted-foreground/70"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
