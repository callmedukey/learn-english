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
    <div className="space-y-1.5">
      <Label 
        htmlFor={id}
        className="text-base font-normal leading-none tracking-[0%] text-gray-600"
      >
        {label}
      </Label>
      <SelectNative
        id={id}
        name={name}
        defaultValue={defaultValue || placeholder}
        className="placeholder:text-gray-400"
      >
        {placeholder && (
          <option disabled value={placeholder} className="text-gray-400">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectNative>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
