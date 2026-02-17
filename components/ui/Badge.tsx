"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "info", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors";

    const variantStyles = {
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      info: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";

export { Badge };
