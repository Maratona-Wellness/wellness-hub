import { prisma } from "@/lib/db/prisma";
import type { Tenant } from "@/types";

/**
 * Extrai o domínio do email e busca o tenant correspondente
 * @param email Email do usuário
 * @returns Tenant encontrado ou null
 */
export async function getTenantFromDomain(
  email: string,
): Promise<Tenant | null> {
  if (!email || !email.includes("@")) {
    return null;
  }

  const domain = email.split("@")[1].toLowerCase();

  const tenant = await prisma.tenant.findUnique({
    where: {
      domain,
      active: true,
    },
  });

  return tenant;
}

/**
 * Busca tenant por ID
 * @param tenantId ID do tenant
 * @returns Tenant encontrado ou null
 */
export async function getTenantById(tenantId: string): Promise<Tenant | null> {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
      active: true,
    },
  });

  return tenant;
}

/**
 * Busca todos os tenants ativos
 * @returns Lista de tenants
 */
export async function getAllActiveTenants(): Promise<Tenant[]> {
  return prisma.tenant.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Valida se um email pertence a um tenant específico
 * @param email Email do usuário
 * @param tenantId ID do tenant esperado
 * @returns true se o email pertence ao tenant
 */
export async function validateEmailTenant(
  email: string,
  tenantId: string,
): Promise<boolean> {
  const tenant = await getTenantFromDomain(email);
  return tenant?.id === tenantId;
}
