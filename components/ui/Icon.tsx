"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { type LucideIcon } from "lucide-react";

export interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
}

const Icon = React.forwardRef<HTMLDivElement, IconProps>(
  ({ className, icon: IconComponent, size = "md", ...props }, ref) => {
    const sizeStyles = {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    };

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        <IconComponent className={sizeStyles[size]} aria-hidden="true" />
      </div>
    );
  },
);

Icon.displayName = "Icon";

export { Icon };
