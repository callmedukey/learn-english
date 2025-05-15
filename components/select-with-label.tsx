import { useId } from "react";

import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";

export default function SelectWithLabel({
  label,
  name,
  options,
  defaultValue,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  options: { label: string; value: string | number }[];
  defaultValue?: string | number;
  placeholder?: string;
  error?: string;
}) {
  const id = useId();

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>{label}</Label>
      <SelectNative
        id={id}
        name={name}
        defaultValue={defaultValue || placeholder}
      >
        {placeholder && <option disabled>{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectNative>
      {error && <p className="text-destructive text-xs mt-2">{error}</p>}
    </div>
  );
}
