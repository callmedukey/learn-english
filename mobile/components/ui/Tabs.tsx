import * as TabsPrimitive from "@rn-primitives/tabs";
import * as React from "react";
import { Text } from "react-native";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "pills";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      variant === "pills"
        ? "flex-row gap-2"
        : "flex-row border-b border-border",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "pills";
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = "default", children, ...props }, ref) => {
  const { value } = TabsPrimitive.useRootContext();
  const isActive = value === props.value;

  if (variant === "pills") {
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          "rounded-full px-3 py-1.5",
          isActive ? "bg-primary" : "bg-muted",
          className
        )}
        {...props}
      >
        <Text
          className={cn(
            "text-sm font-medium",
            isActive ? "text-white" : "text-muted-foreground"
          )}
        >
          {typeof children === "function" ? null : children}
        </Text>
      </TabsPrimitive.Trigger>
    );
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex-1 items-center border-b-2 py-2",
        isActive ? "border-primary" : "border-transparent",
        className
      )}
      {...props}
    >
      <Text
        className={cn(
          "text-sm font-medium",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        {typeof children === "function" ? null : children}
      </Text>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn(className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
