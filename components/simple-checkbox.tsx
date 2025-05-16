import { useId } from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SimpleCheckboxProps {
  label?: React.ReactNode;
  name?: string;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export default function SimpleCheckbox({
  label = "Simple checkbox",
  name,
  onChange,
  className = ""
}: SimpleCheckboxProps) {
  const id = useId()
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Checkbox 
        id={id}
        name={name}
        onCheckedChange={onChange}
      />
      <Label 
        htmlFor={id} 
        className="text-sm font-normal leading-[14px] tracking-[0%]"
      >
        {label}
      </Label>
    </div>
  )
}
