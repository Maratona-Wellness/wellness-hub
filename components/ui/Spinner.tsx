"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeStyles = {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12",
    };

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className={cn("inline-block", className)}
        {...props}
      >
        <Loader2
          className={cn("animate-spin text-(--color-accent)", sizeStyles[size])}
        />
        <span className="sr-only">Loading...</span>
      </div>
    );
  },
);

Spinner.displayName = "Spinner";

export { Spinner };
