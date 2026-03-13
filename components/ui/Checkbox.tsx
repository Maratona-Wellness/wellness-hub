"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string | React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, disabled, ...props }, ref) => {
    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-start gap-2">
        <label
          htmlFor={checkboxId}
          className={cn(
            "relative shrink-0 cursor-pointer",
            disabled && "cursor-not-allowed",
          )}
        >
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className="peer sr-only"
            disabled={disabled}
            {...props}
          />
          <div
            className={cn(
              "h-5 w-5 rounded border-2 border-gray-300 bg-white transition-colors",
              "peer-checked:bg-(--color-accent) peer-checked:border-(--color-accent)",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-(--color-accent) peer-focus-visible:ring-offset-2",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
              "cursor-pointer",
              disabled && "cursor-not-allowed",
              className,
            )}
          >
            <Check
              className={cn(
                "h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity",
                "absolute inset-0 m-auto",
              )}
              strokeWidth={3}
            />
          </div>
        </label>
        {label && (
          <label
            htmlFor={checkboxId}
            className={cn(
              "text-sm text-(--color-secondary) cursor-pointer select-none pt-0.5",
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

Checkbox.displayName = "Checkbox";

export { Checkbox };
