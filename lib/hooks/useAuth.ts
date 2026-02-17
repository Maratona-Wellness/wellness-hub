"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { RoleType } from "@/types";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: RoleType;
  tenantId: string | null;
  tenantName: string | null;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  status: "authenticated" | "loading" | "unauthenticated";
  logout: () => Promise<void>;
}

/**
 * Hook para gerenciamento de autenticação
 *
 * Fornece:
 * - Estado do usuário logado
 * - Função de logout
 * - Detecção de inatividade (30min)
 *
 * @example
 * const { user, isAuthenticated, isLoading, logout } = useAuth();
 */
export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        role: session.user.role,
        tenantId: session.user.tenantId,
        tenantName: session.user.tenantName,
      }
    : null;

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/login");
  }, [router]);

  // Detecção de inatividade
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    if (status === "authenticated") {
      inactivityTimer.current = setTimeout(() => {
        signOut({ redirect: false }).then(() => {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        });
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [status, router, pathname]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];

    const handler = () => resetInactivityTimer();
    events.forEach((event) => window.addEventListener(event, handler));

    resetInactivityTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handler));
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [status, resetInactivityTimer]);

  return {
    user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    status,
    logout,
  };
}

/**
 * Helper para obter a URL de redirect por role após login
 */
export function getRedirectByRole(role: RoleType): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard";
    case "TENANT_ADMIN":
      return "/dashboard";
    case "THERAPIST":
      return "/dashboard";
    case "EMPLOYEE":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}
