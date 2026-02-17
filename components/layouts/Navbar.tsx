"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { UserMenu } from "./UserMenu";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface NavbarProps {
  onMenuClick?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  notificationCount?: number;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuClick,
  user,
  notificationCount = 0,
  className,
}) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-gray-200 bg-white",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6 text-(--color-secondary)" />
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-(--color-accent) rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="hidden md:block text-xl font-bold text-(--color-secondary)">
              Wellness Hub
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5 text-(--color-secondary)" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-accent) opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-(--color-accent) items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                </span>
              </span>
            )}
          </button>

          {/* User Menu */}
          {user && (
            <UserMenu user={user} onLogoutClick={() => console.log("Logout")} />
          )}
        </div>
      </div>
    </header>
  );
};

Navbar.displayName = "Navbar";
