import { prisma } from "@/lib/db/prisma";
import type { RoleType } from "@/types";

/**
 * Classe de erro para violações de multi-tenancy
 */
export class TenantAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantAccessError";
  }
}

/**
 * Helper para adicionar filtro de tenant em queries do Prisma
 * Retorna um objeto de filtro que pode ser usado em where clauses
 *
 * @param tenantId ID do tenant para filtrar
 * @returns Objeto de filtro { tenantId }
 *
 * @example
 * const employees = await prisma.employee.findMany({
 *   where: {
 *     ...withTenantScope(tenantId),
 *     active: true
 *   }
 * });
 */
export function withTenantScope(tenantId: string) {
  return {
    tenantId,
  };
}

/**
 * Valida se um usuário tem acesso a um tenant específico
 * SUPER_ADMIN tem acesso a todos os tenants
 * Outros roles só têm acesso ao seu próprio tenant
 *
 * @param userId ID do usuário
 * @param tenantId ID do tenant que se deseja acessar
 * @throws TenantAccessError se o usuário não tem acesso
 */
export async function assertTenantAccess(
  userId: string,
  tenantId: string,
): Promise<void> {
  // Buscar roles do usuário
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
    },
    include: {
      role: true,
      tenant: true,
    },
  });

  if (!userRoles || userRoles.length === 0) {
    throw new TenantAccessError("User has no roles assigned");
  }

  // SUPER_ADMIN pode acessar qualquer tenant
  const isSuperAdmin = userRoles.some(
    (ur) => ur.role.roleName === "SUPER_ADMIN",
  );

  if (isSuperAdmin) {
    return; // Acesso permitido
  }

  // Verificar se o usuário tem algum role no tenant solicitado
  const hasTenantAccess = userRoles.some((ur) => ur.tenantId === tenantId);

  if (!hasTenantAccess) {
    throw new TenantAccessError(
      `User does not have access to tenant ${tenantId}`,
    );
  }
}

/**
 * Verifica se um usuário tem uma role específica em um tenant
 *
 * @param userId ID do usuário
 * @param tenantId ID do tenant
 * @param roleName Nome da role a verificar
 * @returns true se o usuário tem a role no tenant
 */
export async function hasRoleInTenant(
  userId: string,
  tenantId: string,
  roleName: RoleType,
): Promise<boolean> {
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      tenantId,
      role: {
        roleName,
      },
    },
  });

  return !!userRole;
}

/**
 * Verifica se um usuário é SUPER_ADMIN
 *
 * @param userId ID do usuário
 * @returns true se o usuário é SUPER_ADMIN
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId,
      role: {
        roleName: "SUPER_ADMIN",
      },
    },
  });

  return !!userRole;
}

/**
 * Busca todos os tenants aos quais um usuário tem acesso
 *
 * @param userId ID do usuário
 * @returns Lista de IDs de tenants
 */
export async function getUserTenants(userId: string): Promise<string[]> {
  // Se for SUPER_ADMIN, retornar todos os tenants
  if (await isSuperAdmin(userId)) {
    const allTenants = await prisma.tenant.findMany({
      where: { active: true },
      select: { id: true },
    });
    return allTenants.map((t) => t.id);
  }

  // Caso contrário, retornar apenas tenants onde o usuário tem roles
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      tenantId: { not: null },
    },
    select: {
      tenantId: true,
    },
    distinct: ["tenantId"],
  });

  return userRoles
    .map((ur) => ur.tenantId)
    .filter((id): id is string => id !== null);
}

/**
 * Registra uma tentativa de violação de acesso cross-tenant
 *
 * @param userId ID do usuário que tentou acessar
 * @param tenantId ID do tenant que foi tentado acessar
 * @param reason Razão da violação
 * @param ip IP de origem (opcional)
 */
export async function logTenantAccessViolation(
  userId: string,
  tenantId: string,
  reason: string,
  ip?: string,
): Promise<void> {
  await prisma.authLog.create({
    data: {
      userId,
      method: "PASSWORD", // Usar PASSWORD como padrão para violations
      outcome: "FAILURE",
      reason: `Tenant access violation: ${reason} (tenant: ${tenantId})`,
      ip,
    },
  });
}
