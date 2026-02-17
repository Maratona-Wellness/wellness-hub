"use client";

import React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  onClose?: () => void;
  showIcon?: boolean;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      children,
      onClose,
      showIcon = true,
      ...props
    },
    ref,
  ) => {
    const variantStyles = {
      info: {
        container: "bg-blue-50 border-blue-200 text-blue-900",
        icon: <Info className="h-5 w-5 text-blue-600" />,
        title: "text-blue-800",
      },
      success: {
        container: "bg-green-50 border-green-200 text-green-900",
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        title: "text-green-800",
      },
      warning: {
        container: "bg-yellow-50 border-yellow-200 text-yellow-900",
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
        title: "text-yellow-800",
      },
      error: {
        container: "bg-red-50 border-red-200 text-red-900",
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        title: "text-red-800",
      },
    };

    const style = variantStyles[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative rounded-lg border p-4",
          style.container,
          className,
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          {showIcon && <div className="shrink-0">{style.icon}</div>}

          {/* Content */}
          <div className="flex-1">
            {title && (
              <h5 className={cn("font-semibold mb-1", style.title)}>{title}</h5>
            )}
            <div className="text-sm">{children}</div>
          </div>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar alerta"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  },
);

Alert.displayName = "Alert";
