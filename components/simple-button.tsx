import { Button } from "@/components/ui/button"

interface SimpleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

export default function SimpleButton({
  children = "Button",
  variant = "default",
  className = "",
  ...props
}: SimpleButtonProps) {
  return (
    <Button
      variant={variant}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}
