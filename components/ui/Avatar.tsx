"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { User } from "lucide-react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = "md", ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const sizeStyles = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    };

    const baseStyles =
      "relative inline-flex items-center justify-center rounded-full bg-[var(--color-secondary)] text-white font-medium overflow-hidden";

    // Gerar iniciais do nome
    const getInitials = (name: string) => {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, sizeStyles[size], className)}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : name ? (
          <span>{getInitials(name)}</span>
        ) : (
          <User className="h-1/2 w-1/2" />
        )}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

export { Avatar };
