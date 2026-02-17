"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

interface AuthGuardProps {
  children: React.ReactNode;
  /** URL de redirecionamento quando não autenticado */
  redirectTo?: string;
  /** Componente de fallback durante carregamento */
  fallback?: React.ReactNode;
}

/**
 * Componente de proteção de rotas autenticadas
 *
 * Redireciona para /login se o usuário não está autenticado.
 * Exibe um spinner durante a verificação de sessão.
 *
 * @example
 * <AuthGuard>
 *   <DashboardContent />
 * </AuthGuard>
 */
export function AuthGuard({
  children,
  redirectTo = "/login",
  fallback,
}: AuthGuardProps) {
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-(--color-primary)">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">Verificando sessão...</p>
          </div>
        </div>
      )
    );
  }

  if (status === "unauthenticated") {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    const callbackUrl =
      currentPath !== "/"
        ? `?callbackUrl=${encodeURIComponent(currentPath)}`
        : "";
    router.push(`${redirectTo}${callbackUrl}`);
    return null;
  }

  return <>{children}</>;
}

AuthGuard.displayName = "AuthGuard";
