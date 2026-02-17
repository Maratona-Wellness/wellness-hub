"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-2 text-sm", className)}
    >
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-(--color-accent) transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    isLast
                      ? "text-(--color-secondary) font-medium"
                      : "text-gray-600",
                  )}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = "Breadcrumb";

// Hook para gerar breadcrumbs automaticamente a partir da URL
export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const pathname = usePathname();

  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/dashboard" }];

  let currentPath = "";
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;

    // Capitalizar e formatar o label
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  });

  return breadcrumbs;
};
