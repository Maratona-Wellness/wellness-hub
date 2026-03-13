"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { type RoleType } from "@/lib/config/menu";
import { cn } from "@/lib/utils/cn";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: RoleType;
  };
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  className,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  // Usar dados da sessão NextAuth quando disponíveis
  const sessionUser = session?.user
    ? {
        name: session.user.displayName || "Usuário",
        email: session.user.email || "",
        role: (session.user.role as RoleType) || "EMPLOYEE",
      }
    : null;

  // Default user para desenvolvimento
  const defaultUser = {
    name: "Usuário Demo",
    email: "demo@wellness.com",
    role: "EMPLOYEE" as RoleType,
  };

  const currentUser = user || sessionUser || defaultUser;

  return (
    <div className="min-h-screen bg-(--color-primary)">
      <Navbar
        onMenuClick={() => setSidebarOpen(true)}
        className="fixed top-0 left-0 right-0 z-40 w-full"
      />

      <div className="flex pt-16">
        {/* Sidebar — fixed below navbar */}
        <Sidebar
          role={currentUser.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          className="top-16 h-[calc(100vh-4rem)]"
        />

        {/* Main Content — scrollable */}
        <main
          className={cn("flex-1 min-h-[calc(100vh-4rem)] lg:ml-64", className)}
        >
          <div className="container mx-auto p-4 md:p-6 lg:p-8 shrink-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

DashboardLayout.displayName = "DashboardLayout";
