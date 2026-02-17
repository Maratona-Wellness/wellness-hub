"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      error,
      disabled,
      placeholder = "Select an option",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[var(--color-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

    const errorStyles = error
      ? "border-red-500 focus-visible:ring-red-500"
      : "";

    return (
      <div className="relative">
        <select
          className={cn(
            baseStyles,
            errorStyles,
            "pr-10", // Espaço para o ícone
            className,
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    );
  },
);

Select.displayName = "Select";

export { Select };
