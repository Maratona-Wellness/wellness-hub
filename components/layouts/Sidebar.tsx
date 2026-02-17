"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  type MenuItem,
  type RoleType,
  getMenuForRole,
} from "@/lib/config/menu";
import { ChevronDown, X } from "lucide-react";

export interface SidebarProps {
  role: RoleType;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  isOpen = true,
  onClose,
  className,
}) => {
  const pathname = usePathname();
  const menuItems = getMenuForRole(role);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);

    return (
      <li key={item.href}>
        <div className="relative">
          <Link
            href={item.href}
            onClick={!hasChildren ? onClose : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
              "hover:bg-gray-100",
              active &&
                "bg-(--color-accent) text-white hover:bg-(--color-accent)",
              depth > 0 && "ml-4",
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0",
                active
                  ? "text-white"
                  : "text-gray-600 group-hover:text-(--color-accent)",
              )}
            />
            <span
              className={cn(
                "flex-1 text-sm font-medium",
                active ? "text-white" : "text-(--color-secondary)",
              )}
            >
              {item.label}
            </span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-(--color-accent) text-white rounded-full">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleExpanded(item.label);
                }}
                className="p-1"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </button>
            )}
          </Link>
        </div>
        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-1">
            {item.children!.map((child) => renderMenuItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 lg:hidden">
            <span className="text-lg font-bold text-(--color-secondary)">
              Menu
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => renderMenuItem(item))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Wellness Hub v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

Sidebar.displayName = "Sidebar";
