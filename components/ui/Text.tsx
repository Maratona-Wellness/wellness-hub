"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "p"
  | "span"
  | "label";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: TextVariant;
  variant?: TextVariant;
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, as, variant, children, ...props }, ref) => {
    // Se 'as' não for fornecido, usar 'variant' como tag
    const Component = (as || variant || "p") as React.ElementType;
    const styleVariant = variant || as || "p";

    const variantStyles: Record<TextVariant, string> = {
      h1: "text-4xl font-bold text-[var(--color-secondary)] leading-tight",
      h2: "text-3xl font-bold text-[var(--color-secondary)] leading-tight",
      h3: "text-2xl font-bold text-[var(--color-secondary)] leading-snug",
      h4: "text-xl font-semibold text-[var(--color-secondary)] leading-snug",
      h5: "text-lg font-semibold text-[var(--color-secondary)] leading-normal",
      h6: "text-base font-semibold text-[var(--color-secondary)] leading-normal",
      p: "text-base text-[var(--color-secondary)] leading-relaxed",
      span: "text-base text-[var(--color-secondary)]",
      label: "text-sm font-medium text-[var(--color-secondary)]",
    };

    return (
      <Component
        ref={ref as any}
        className={cn(variantStyles[styleVariant], className)}
        {...(props as any)}
      >
        {children}
      </Component>
    );
  },
);

Text.displayName = "Text";

export { Text };
