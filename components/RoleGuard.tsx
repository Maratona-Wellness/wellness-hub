"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import type { RoleType } from "@/types";

interface RoleGuardProps {
  children: React.ReactNode;
  /** Roles permitidas para acessar o conteúdo */
  allowedRoles: RoleType[];
  /** URL de redirecionamento quando não autorizado */
  redirectTo?: string;
  /** Componente de fallback quando não autorizado (se não quiser redirecionar) */
  fallback?: React.ReactNode;
  /** Se true, renderiza o fallback em vez de redirecionar */
  renderFallback?: boolean;
}

/**
 * Componente de proteção por role
 *
 * Renderiza o conteúdo apenas se o usuário tiver uma das roles permitidas.
 * Caso contrário, redireciona ou mostra um fallback.
 *
 * @example
 * <RoleGuard allowedRoles={["SUPER_ADMIN", "TENANT_ADMIN"]}>
 *   <AdminPanel />
 * </RoleGuard>
 *
 * @example
 * <RoleGuard
 *   allowedRoles={["SUPER_ADMIN"]}
 *   renderFallback
 *   fallback={<p>Sem permissão</p>}
 * >
 *   <SuperAdminButton />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = "/dashboard",
  fallback,
  renderFallback = false,
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    if (renderFallback) return null;
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="md" />
      </div>
    );
  }

  const userRole = session?.user?.role as RoleType | undefined;

  if (!userRole || !allowedRoles.includes(userRole)) {
    if (renderFallback) {
      return <>{fallback || null}</>;
    }
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
}

RoleGuard.displayName = "RoleGuard";
