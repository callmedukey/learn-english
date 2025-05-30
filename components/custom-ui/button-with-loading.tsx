import { LoaderCircleIcon } from "lucide-react";
import { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ButtonWithLoadingProps extends ComponentProps<typeof Button> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function ButtonWithLoading({
  children,
  isLoading,
  icon,
  className,
  ...props
}: ButtonWithLoadingProps) {
  return (
    <Button
      disabled={isLoading}
      className={cn("text-base", className)}
      {...props}
    >
      {isLoading && (
        <LoaderCircleIcon
          className="-ms-1 animate-spin"
          size={16}
          aria-hidden="true"
        />
      )}
      {icon && !isLoading && icon}
      {children}
    </Button>
  );
}
