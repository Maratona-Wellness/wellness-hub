import { prisma } from "@/lib/db/prisma";
import { hash } from "bcryptjs";
import { withTenantScope } from "@/lib/utils/tenant-access";
import type {
  CreateTenantWizardInput,
  UpdateTenantInput,
  ListTenantsQuery,
  CreateLocationInput,
  UpdateLocationInput,
  UpdateTenantSettingsInput,
} from "@/lib/validations/tenant";
import type { PaginatedResponse } from "@/types";

const BCRYPT_SALT_ROUNDS = 12;

// ============================================================================
// TENANT SERVICE
// ============================================================================

/**
 * Lista tenants com paginação, filtros e busca
 */
export async function listTenants(query: ListTenantsQuery): Promise<
  PaginatedResponse<{
    id: string;
    name: string;
    domain: string;
    logoUrl: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      employees: number;
      locations: number;
      appointments: number;
    };
  }>
> {
  const { page, limit, search, status, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Filtro de status
  if (status === "active") {
    where.active = true;
  } else if (status === "inactive") {
    where.active = false;
  }

  // Filtro de busca (nome ou domínio)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { domain: { contains: search, mode: "insensitive" } },
    ];
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            employees: true,
            locations: true,
            appointments: true,
          },
        },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    data: tenants,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Busca detalhes de um tenant por ID com contadores
 */
export async function getTenantById(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      locations: {
        orderBy: { name: "asc" },
      },
      _count: {
        select: {
          employees: { where: { active: true } },
          locations: true,
          appointments: true,
          programs: { where: { active: true } },
          therapistAssignments: { where: { active: true } },
        },
      },
    },
  });

  if (!tenant) return null;

  // Fetch tenant admins (TENANT_ADMIN role users)
  const adminRoles = await prisma.userRole.findMany({
    where: {
      tenantId: id,
      role: { roleName: "TENANT_ADMIN" },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          active: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const admins = adminRoles.map((ar) => ({
    id: ar.user.id,
    name: ar.user.displayName,
    email: ar.user.email,
    active: ar.user.active,
    createdAt: ar.user.createdAt,
  }));

  // Calcular taxa de utilização (appointments completos / total)
  const [completedAppointments, totalAppointments] = await Promise.all([
    prisma.appointment.count({
      where: {
        ...withTenantScope(id),
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: withTenantScope(id),
    }),
  ]);

  const utilizationRate =
    totalAppointments > 0
      ? Math.round((completedAppointments / totalAppointments) * 100)
      : 0;

  return {
    ...tenant,
    admins,
    stats: {
      totalEmployees: tenant._count.employees,
      totalLocations: tenant._count.locations,
      totalAppointments: tenant._count.appointments,
      activePrograms: tenant._count.programs,
      activeTherapists: tenant._count.therapistAssignments,
      utilizationRate,
    },
  };
}

/**
 * Resolve um domínio para um tenant (público, usado no signup)
 */
export async function resolveDomain(domain: string) {
  const normalizedDomain = domain.toLowerCase().trim();

  const tenant = await prisma.tenant.findUnique({
    where: { domain: normalizedDomain },
    select: {
      id: true,
      name: true,
      domain: true,
      logoUrl: true,
      active: true,
    },
  });

  return tenant;
}

/**
 * Cria um novo tenant com localizações e admin em transação atômica
 */
export async function createTenantWithWizard(data: CreateTenantWizardInput) {
  const normalizedDomain = data.domain.toLowerCase().trim();

  // Verificar unicidade do domínio
  const existingTenant = await prisma.tenant.findUnique({
    where: { domain: normalizedDomain },
  });

  if (existingTenant) {
    throw new TenantServiceError(
      "DOMAIN_EXISTS",
      `O domínio "${normalizedDomain}" já está cadastrado`,
    );
  }

  // Verificar unicidade do email do admin
  const existingUser = await prisma.userAccount.findUnique({
    where: { email: data.adminEmail.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new TenantServiceError(
      "EMAIL_EXISTS",
      "Este email já está cadastrado no sistema",
    );
  }

  // Hash da senha do admin
  const passwordHash = await hash(data.adminPassword, BCRYPT_SALT_ROUNDS);

  // Buscar ou criar a role TENANT_ADMIN
  let tenantAdminRole = await prisma.role.findUnique({
    where: { roleName: "TENANT_ADMIN" },
  });

  if (!tenantAdminRole) {
    tenantAdminRole = await prisma.role.create({
      data: { roleName: "TENANT_ADMIN" },
    });
  }

  // Transação atômica: criar tenant, locations, user, roles
  const result = await prisma.$transaction(async (tx) => {
    // 1. Criar o tenant
    const tenant = await tx.tenant.create({
      data: {
        name: data.name,
        domain: normalizedDomain,
        logoUrl: data.logoUrl || null,
        active: true,
      },
    });

    // 2. Criar localizações
    const locations = await Promise.all(
      data.locations.map((loc) =>
        tx.location.create({
          data: {
            tenantId: tenant.id,
            name: loc.name,
            address: loc.address,
          },
        }),
      ),
    );

    // 3. Criar conta do admin
    const adminUser = await tx.userAccount.create({
      data: {
        email: data.adminEmail.toLowerCase().trim(),
        passwordHash,
        displayName: data.adminName,
        active: true,
      },
    });

    // 4. Atribuir role TENANT_ADMIN
    await tx.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: tenantAdminRole.id,
        tenantId: tenant.id,
      },
    });

    return {
      tenant,
      locations,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        displayName: adminUser.displayName,
      },
    };
  });

  // TODO: Enviar email de boas-vindas para o admin
  console.log(
    `[TODO] Send welcome email to ${data.adminEmail} for tenant ${result.tenant.name}`,
  );

  return result;
}

/**
 * Atualiza dados de um tenant
 */
export async function updateTenant(id: string, data: UpdateTenantInput) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
  });

  if (!tenant) {
    throw new TenantServiceError("NOT_FOUND", "Tenant não encontrado");
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
      ...(data.active !== undefined && { active: data.active }),
    },
  });

  return updated;
}

/**
 * Alterna o status (ativo/inativo) de um tenant
 */
export async function toggleTenantStatus(id: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          employees: { where: { active: true } },
        },
      },
    },
  });

  if (!tenant) {
    throw new TenantServiceError("NOT_FOUND", "Tenant não encontrado");
  }

  const newStatus = !tenant.active;

  const updated = await prisma.tenant.update({
    where: { id },
    data: { active: newStatus },
  });

  return {
    ...updated,
    previousStatus: tenant.active,
    impactedEmployees: tenant._count.employees,
  };
}

// ============================================================================
// LOCATION SERVICE
// ============================================================================

/**
 * Lista localizações de um tenant
 */
export async function listLocations(tenantId: string) {
  const locations = await prisma.location.findMany({
    where: withTenantScope(tenantId),
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          therapistAssignments: { where: { active: true } },
          appointments: true,
          availabilitySlots: true,
        },
      },
    },
  });

  return locations;
}

/**
 * Busca uma localização por ID
 */
export async function getLocationById(id: string) {
  return prisma.location.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, name: true } },
      _count: {
        select: {
          therapistAssignments: { where: { active: true } },
          appointments: true,
        },
      },
    },
  });
}

/**
 * Cria uma nova localização para um tenant
 */
export async function createLocation(
  tenantId: string,
  data: CreateLocationInput,
) {
  // Verificar se o tenant existe
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new TenantServiceError("NOT_FOUND", "Tenant não encontrado");
  }

  const location = await prisma.location.create({
    data: {
      tenantId,
      name: data.name,
      address: data.address,
    },
  });

  return location;
}

/**
 * Atualiza uma localização
 */
export async function updateLocation(id: string, data: UpdateLocationInput) {
  const location = await prisma.location.findUnique({
    where: { id },
  });

  if (!location) {
    throw new TenantServiceError("NOT_FOUND", "Localização não encontrada");
  }

  const updated = await prisma.location.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.address !== undefined && { address: data.address }),
    },
  });

  return updated;
}

/**
 * Remove uma localização (verifica agendamentos futuros)
 */
export async function deleteLocation(id: string) {
  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          appointments: {
            where: {
              startAt: { gte: new Date() },
              status: { in: ["PENDING", "CONFIRMED"] },
            },
          },
        },
      },
    },
  });

  if (!location) {
    throw new TenantServiceError("NOT_FOUND", "Localização não encontrada");
  }

  if (location._count.appointments > 0) {
    throw new TenantServiceError(
      "HAS_FUTURE_APPOINTMENTS",
      `Esta localização possui ${location._count.appointments} agendamento(s) futuro(s). Cancele-os antes de excluir.`,
    );
  }

  await prisma.location.delete({
    where: { id },
  });

  return { deleted: true };
}

// ============================================================================
// TENANT ADMIN SETTINGS
// ============================================================================

/**
 * Busca configurações do tenant para o TENANT_ADMIN
 */
export async function getTenantSettings(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      locations: {
        orderBy: { name: "asc" },
      },
      _count: {
        select: {
          employees: { where: { active: true } },
          programs: { where: { active: true } },
          therapistAssignments: { where: { active: true } },
        },
      },
    },
  });

  if (!tenant) {
    throw new TenantServiceError("NOT_FOUND", "Tenant não encontrado");
  }

  return tenant;
}

/**
 * Atualiza configurações do tenant (TENANT_ADMIN)
 */
export async function updateTenantSettings(
  tenantId: string,
  data: UpdateTenantSettingsInput,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new TenantServiceError("NOT_FOUND", "Tenant não encontrado");
  }

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl || null }),
    },
  });

  return updated;
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export type TenantErrorCode =
  | "NOT_FOUND"
  | "DOMAIN_EXISTS"
  | "EMAIL_EXISTS"
  | "HAS_FUTURE_APPOINTMENTS"
  | "VALIDATION_ERROR";

export class TenantServiceError extends Error {
  code: TenantErrorCode;

  constructor(code: TenantErrorCode, message: string) {
    super(message);
    this.name = "TenantServiceError";
    this.code = code;
  }
}
