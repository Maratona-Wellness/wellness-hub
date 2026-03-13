"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Menu } from "lucide-react";

export interface NavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, className }) => {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-gray-200 bg-(--header-bg-color)",
        className,
      )}
    >
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6 text-(--color-secondary)" />
        </button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/logo.jpeg"
            alt="Maratona Qualidade de Vida Logo"
            width={200}
            height={24}
            className="h-8 w-auto p-1"
            priority
          />
          <span className="hidden md:block text-xl font-bold text-(--color-secondary)">
            Wellness Hub
          </span>
        </Link>
      </div>
    </header>
  );
};

Navbar.displayName = "Navbar";
