"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      error,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[var(--color-secondary)] placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

    const errorStyles = error
      ? "border-red-500 focus-visible:ring-red-500"
      : "";

    const hasIcons = leftIcon || rightIcon;
    const iconWrapperStyles = hasIcons ? "relative" : "";
    const inputWithIconStyles = cn(leftIcon && "pl-10", rightIcon && "pr-10");

    const inputElement = (
      <input
        type={type}
        className={cn(baseStyles, errorStyles, inputWithIconStyles, className)}
        ref={ref}
        disabled={disabled}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
    );

    if (hasIcons) {
      return (
        <div className={cn("relative", iconWrapperStyles)}>
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          {inputElement}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
      );
    }

    return inputElement;
  },
);

Input.displayName = "Input";

export { Input };
