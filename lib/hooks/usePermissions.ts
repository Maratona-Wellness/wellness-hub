"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import type { RoleType } from "@/types";

/**
 * Mapeamento de permissões por role
 */
const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  EMPLOYEE: [
    "appointments:view-own",
    "appointments:create",
    "appointments:cancel-own",
    "profile:view",
    "profile:edit",
  ],
  THERAPIST: [
    "appointments:view-assigned",
    "appointments:checkin",
    "availability:view-own",
    "availability:manage",
    "profile:view",
    "profile:edit",
    "schedule:view",
  ],
  TENANT_ADMIN: [
    "appointments:view-all",
    "appointments:manage",
    "employees:view",
    "employees:manage",
    "locations:view",
    "locations:manage",
    "programs:view",
    "programs:manage",
    "therapists:view",
    "reports:view",
    "settings:view",
    "settings:manage",
    "profile:view",
    "profile:edit",
  ],
  SUPER_ADMIN: [
    "tenants:view",
    "tenants:manage",
    "tenants:create",
    "appointments:view-all",
    "appointments:manage",
    "employees:view",
    "employees:manage",
    "therapists:view",
    "therapists:manage",
    "therapists:create",
    "locations:view",
    "locations:manage",
    "programs:view",
    "programs:manage",
    "reports:view",
    "reports:view-global",
    "settings:view",
    "settings:manage",
    "settings:manage-global",
    "users:view",
    "users:manage",
    "logs:view",
    "profile:view",
    "profile:edit",
  ],
};

interface UsePermissionsReturn {
  /** Role atual do usuário */
  role: RoleType | null;
  /** Verifica se o usuário tem uma permissão específica */
  hasPermission: (permission: string) => boolean;
  /** Verifica se o usuário tem pelo menos uma das permissões */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** Verifica se o usuário tem todas as permissões */
  hasAllPermissions: (permissions: string[]) => boolean;
  /** Verifica se o usuário tem uma role específica */
  hasRole: (role: RoleType) => boolean;
  /** Verifica se o usuário tem pelo menos uma das roles */
  hasAnyRole: (roles: RoleType[]) => boolean;
  /** Verifica se o usuário é admin (TENANT_ADMIN ou SUPER_ADMIN) */
  isAdmin: boolean;
  /** Verifica se o usuário é super admin */
  isSuperAdmin: boolean;
  /** Lista todas as permissões do usuário */
  permissions: string[];
}

/**
 * Hook para verificar permissões do usuário logado
 *
 * @example
 * const { hasPermission, hasRole, isAdmin } = usePermissions();
 *
 * if (hasPermission("appointments:manage")) {
 *   // mostrar botão de gerenciar
 * }
 *
 * if (hasRole("SUPER_ADMIN")) {
 *   // mostrar opções de super admin
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const { data: session } = useSession();
  const role = session?.user?.role as RoleType | undefined;

  const permissions = useMemo(() => {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] || [];
  }, [role]);

  const hasPermission = useMemo(() => {
    return (permission: string) => permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useMemo(() => {
    return (perms: string[]) => perms.some((p) => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useMemo(() => {
    return (perms: string[]) => perms.every((p) => permissions.includes(p));
  }, [permissions]);

  const hasRole = useMemo(() => {
    return (r: RoleType) => role === r;
  }, [role]);

  const hasAnyRole = useMemo(() => {
    return (roles: RoleType[]) => !!role && roles.includes(role);
  }, [role]);

  return {
    role: role || null,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin: role === "TENANT_ADMIN" || role === "SUPER_ADMIN",
    isSuperAdmin: role === "SUPER_ADMIN",
    permissions,
  };
}
