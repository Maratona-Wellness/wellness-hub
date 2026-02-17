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
  notificationCount?: number;
  className?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  user,
  notificationCount = 0,
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
      {/* Navbar */}
      <Navbar
        onMenuClick={() => setSidebarOpen(true)}
        user={currentUser}
        notificationCount={notificationCount}
      />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          role={currentUser.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className={cn("flex-1 lg:ml-0", className)}>
          <div className="container mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

DashboardLayout.displayName = "DashboardLayout";
