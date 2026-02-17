"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface RadioProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, disabled, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="radio"
            id={radioId}
            ref={ref}
            className="peer sr-only"
            disabled={disabled}
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 rounded-full border-2 border-gray-300 bg-white transition-colors",
              "peer-checked:border-[var(--color-accent)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-accent)] peer-focus-visible:ring-offset-2",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              "cursor-pointer",
              disabled && "cursor-not-allowed",
              className,
            )}
          >
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full bg-[var(--color-accent)] opacity-0 peer-checked:opacity-100 transition-opacity",
                "absolute inset-0 m-auto",
              )}
            />
          </div>
        </div>
        {label && (
          <label
            htmlFor={radioId}
            className={cn(
              "text-sm text-[var(--color-secondary)] cursor-pointer select-none",
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

Radio.displayName = "Radio";

export { Radio };
