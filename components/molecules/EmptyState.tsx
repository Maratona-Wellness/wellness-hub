"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className,
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-gray-400">
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, {
                className: "h-16 w-16",
              })
            : icon}
        </div>
      )}

      {/* Title */}
      <Text variant="h3" className="mb-2">
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text variant="p" className="text-gray-600 max-w-md mb-6">
          {description}
        </Text>
      )}

      {/* Action Button */}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

EmptyState.displayName = "EmptyState";
