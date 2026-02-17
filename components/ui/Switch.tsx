"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, disabled, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            className="peer sr-only"
            disabled={disabled}
            role="switch"
            {...props}
          />
          <div
            className={cn(
              "h-6 w-11 rounded-full bg-gray-300 transition-colors",
              "peer-checked:bg-(--color-accent)",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-(--color-accent) peer-focus-visible:ring-offset-2",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              "cursor-pointer",
              disabled && "cursor-not-allowed",
              className,
            )}
          >
            <div
              className={cn(
                "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                "absolute top-0.5 left-0.5",
                "peer-checked:translate-x-5",
              )}
            />
          </div>
        </div>
        {label && (
          <label
            htmlFor={switchId}
            className={cn(
              "text-sm text-(--color-secondary) cursor-pointer select-none",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
