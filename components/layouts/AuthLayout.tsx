"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  className,
}) => {
  return (
    <div className="min-h-screen bg-(--color-primary) flex items-center justify-center p-4">
      <div className={cn("w-full max-w-md", className)}>{children}</div>
    </div>
  );
};

AuthLayout.displayName = "AuthLayout";
