import { prisma } from "@/lib/db/prisma";
import { hash, compare } from "bcryptjs";
import type {
  CreateTherapistInput,
  UpdateTherapistInput,
  UpdateTherapistProfileInput,
  ListTherapistsQuery,
  CreateAssignmentInput,
} from "@/lib/validations/therapist";
import type { PaginatedResponse } from "@/types";

const BCRYPT_SALT_ROUNDS = 12;

// ============================================================================
// ERROR CLASS
// ============================================================================

export type TherapistErrorCode =
  | "NOT_FOUND"
  | "EMAIL_EXISTS"
  | "CPF_EXISTS"
  | "HAS_FUTURE_APPOINTMENTS"
  | "ASSIGNMENT_EXISTS"
  | "INVALID_TENANT"
  | "INVALID_LOCATION"
  | "INVALID_PASSWORD"
  | "VALIDATION_ERROR";

export class TherapistServiceError extends Error {
  code: TherapistErrorCode;

  constructor(code: TherapistErrorCode, message: string) {
    super(message);
    this.name = "TherapistServiceError";
    this.code = code;
  }
}

// ============================================================================
// THERAPIST LISTING & DETAILS
// ============================================================================

/**
 * Lista terapeutas com paginação, filtros e busca
 */
export async function listTherapists(query: ListTherapistsQuery): Promise<
  PaginatedResponse<{
    id: string;
    email: string;
    name: string;
    cpf: string;
    specialties: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      therapistAssignments: number;
      appointments: number;
    };
  }>
> {
  const { page, limit, search, status, tenantId, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Filtro de status
  if (status === "active") {
    where.active = true;
  } else if (status === "inactive") {
    where.active = false;
  }

  // Filtro de busca (nome, email ou CPF)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search } },
    ];
  }

  // Filtro por tenant vinculado
  if (tenantId) {
    where.therapistAssignments = {
      some: {
        tenantId,
        active: true,
      },
    };
  }

  const [therapists, total] = await Promise.all([
    prisma.therapist.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            therapistAssignments: { where: { active: true } },
            appointments: true,
          },
        },
      },
    }),
    prisma.therapist.count({ where }),
  ]);

  return {
    data: therapists,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Busca detalhes de um terapeuta por ID
 */
export async function getTherapistById(id: string) {
  const therapist = await prisma.therapist.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          active: true,
          lastLoginAt: true,
        },
      },
      therapistAssignments: {
        where: { active: true },
        include: {
          tenant: {
            select: { id: true, name: true, domain: true, active: true },
          },
          location: {
            select: { id: true, name: true, address: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          appointments: true,
          therapistAssignments: { where: { active: true } },
          availabilitySlots: true,
        },
      },
    },
  });

  if (!therapist) return null;

  // Buscar estatísticas de agendamentos
  const [completedAppointments, futureAppointments] = await Promise.all([
    prisma.appointment.count({
      where: {
        therapistId: id,
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: {
        therapistId: id,
        startAt: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ]);

  return {
    ...therapist,
    stats: {
      totalAppointments: therapist._count.appointments,
      completedAppointments,
      futureAppointments,
      activeAssignments: therapist._count.therapistAssignments,
      totalSlots: therapist._count.availabilitySlots,
    },
  };
}

// ============================================================================
// THERAPIST CRUD
// ============================================================================

/**
 * Cria um novo terapeuta com UserAccount e UserRole
 */
export async function createTherapist(data: CreateTherapistInput) {
  const normalizedEmail = data.email.toLowerCase().trim();
  const cleanedCPF = data.cpf.replace(/\D/g, "");

  // Verificar unicidade do email
  const existingEmail = await prisma.therapist.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    throw new TherapistServiceError(
      "EMAIL_EXISTS",
      "Este email já está cadastrado como terapeuta",
    );
  }

  // Verificar unicidade do email no UserAccount
  const existingUser = await prisma.userAccount.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    throw new TherapistServiceError(
      "EMAIL_EXISTS",
      "Este email já está cadastrado no sistema",
    );
  }

  // Verificar unicidade do CPF
  const existingCPF = await prisma.therapist.findUnique({
    where: { cpf: cleanedCPF },
  });
  if (existingCPF) {
    throw new TherapistServiceError(
      "CPF_EXISTS",
      "Este CPF já está cadastrado",
    );
  }

  // Hash da senha
  const passwordHash = await hash(data.password, BCRYPT_SALT_ROUNDS);

  // Buscar ou criar a role THERAPIST
  let therapistRole = await prisma.role.findUnique({
    where: { roleName: "THERAPIST" },
  });
  if (!therapistRole) {
    therapistRole = await prisma.role.create({
      data: { roleName: "THERAPIST" },
    });
  }

  // Transação atômica: criar UserAccount, Therapist, UserRole
  const result = await prisma.$transaction(async (tx) => {
    // 1. Criar conta do usuário
    const userAccount = await tx.userAccount.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName: data.name,
        active: true,
      },
    });

    // 2. Criar terapeuta
    const therapist = await tx.therapist.create({
      data: {
        userId: userAccount.id,
        email: normalizedEmail,
        name: data.name,
        cpf: cleanedCPF,
        specialties: data.specialties || null,
        active: true,
      },
    });

    // 3. Atribuir role THERAPIST (sem tenantId - terapeutas são globais)
    await tx.userRole.create({
      data: {
        userId: userAccount.id,
        roleId: therapistRole.id,
        tenantId: null,
      },
    });

    return {
      therapist,
      user: {
        id: userAccount.id,
        email: userAccount.email,
        displayName: userAccount.displayName,
      },
    };
  });

  // TODO: Enviar email de boas-vindas para o terapeuta
  console.log(
    `[TODO] Send welcome email to therapist ${normalizedEmail} with credentials`,
  );

  return result;
}

/**
 * Atualiza dados de um terapeuta (SUPER_ADMIN)
 */
export async function updateTherapist(id: string, data: UpdateTherapistInput) {
  const therapist = await prisma.therapist.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!therapist) {
    throw new TherapistServiceError("NOT_FOUND", "Terapeuta não encontrado");
  }

  // Atualizar terapeuta e UserAccount em transação
  const result = await prisma.$transaction(async (tx) => {
    const updatedTherapist = await tx.therapist.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.specialties !== undefined && {
          specialties: data.specialties || null,
        }),
      },
    });

    // Atualizar displayName no UserAccount se nome mudou
    if (data.name !== undefined && therapist.userId) {
      await tx.userAccount.update({
        where: { id: therapist.userId },
        data: { displayName: data.name },
      });
    }

    return updatedTherapist;
  });

  return result;
}

/**
 * Alterna o status (ativo/inativo) de um terapeuta
 */
export async function toggleTherapistStatus(id: string) {
  const therapist = await prisma.therapist.findUnique({
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

  if (!therapist) {
    throw new TherapistServiceError("NOT_FOUND", "Terapeuta não encontrado");
  }

  const newStatus = !therapist.active;

  // Atualizar status do terapeuta e do UserAccount
  const result = await prisma.$transaction(async (tx) => {
    const updatedTherapist = await tx.therapist.update({
      where: { id },
      data: { active: newStatus },
    });

    // Atualizar status no UserAccount
    if (therapist.userId) {
      await tx.userAccount.update({
        where: { id: therapist.userId },
        data: { active: newStatus },
      });
    }

    // Se desativando, desativar também as vinculações
    if (!newStatus) {
      await tx.therapistAssignment.updateMany({
        where: { therapistId: id, active: true },
        data: { active: false },
      });
    }

    return updatedTherapist;
  });

  return {
    ...result,
    previousStatus: therapist.active,
    futureAppointments: therapist._count.appointments,
  };
}

// ============================================================================
// THERAPIST ASSIGNMENTS
// ============================================================================

/**
 * Lista vinculações de um terapeuta
 */
export async function listAssignments(therapistId: string) {
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
  });

  if (!therapist) {
    throw new TherapistServiceError("NOT_FOUND", "Terapeuta não encontrado");
  }

  const assignments = await prisma.therapistAssignment.findMany({
    where: { therapistId },
    include: {
      tenant: {
        select: { id: true, name: true, domain: true, active: true },
      },
      location: {
        select: { id: true, name: true, address: true },
      },
    },
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return assignments;
}

/**
 * Cria vinculações de terapeuta com tenant/locations
 */
export async function createAssignments(
  therapistId: string,
  data: CreateAssignmentInput,
) {
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
  });

  if (!therapist) {
    throw new TherapistServiceError("NOT_FOUND", "Terapeuta não encontrado");
  }

  if (!therapist.active) {
    throw new TherapistServiceError(
      "VALIDATION_ERROR",
      "Não é possível vincular um terapeuta inativo",
    );
  }

  // Verificar se o tenant existe e está ativo
  const tenant = await prisma.tenant.findUnique({
    where: { id: data.tenantId },
  });

  if (!tenant) {
    throw new TherapistServiceError("INVALID_TENANT", "Tenant não encontrado");
  }

  if (!tenant.active) {
    throw new TherapistServiceError(
      "INVALID_TENANT",
      "Não é possível vincular a um tenant inativo",
    );
  }

  // Verificar se todas as locations existem e pertencem ao tenant
  const locations = await prisma.location.findMany({
    where: {
      id: { in: data.locationIds },
      tenantId: data.tenantId,
    },
  });

  if (locations.length !== data.locationIds.length) {
    throw new TherapistServiceError(
      "INVALID_LOCATION",
      "Uma ou mais localizações não encontradas ou não pertencem ao tenant",
    );
  }

  // Criar vinculações, reativando existentes ou criando novas
  const results = await prisma.$transaction(async (tx) => {
    const assignments = [];

    for (const locationId of data.locationIds) {
      // Verificar se já existe (ativa ou inativa)
      const existing = await tx.therapistAssignment.findUnique({
        where: {
          therapistId_tenantId_locationId: {
            therapistId,
            tenantId: data.tenantId,
            locationId,
          },
        },
      });

      if (existing) {
        if (existing.active) {
          // Já existe e está ativa, pular
          assignments.push(existing);
        } else {
          // Reativar vinculação existente
          const reactivated = await tx.therapistAssignment.update({
            where: { id: existing.id },
            data: { active: true },
          });
          assignments.push(reactivated);
        }
      } else {
        // Criar nova vinculação
        const newAssignment = await tx.therapistAssignment.create({
          data: {
            therapistId,
            tenantId: data.tenantId,
            locationId,
            active: true,
          },
        });
        assignments.push(newAssignment);
      }
    }

    return assignments;
  });

  return results;
}

/**
 * Remove (soft delete) uma vinculação
 */
export async function removeAssignment(
  therapistId: string,
  assignmentId: string,
) {
  const assignment = await prisma.therapistAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new TherapistServiceError("NOT_FOUND", "Vinculação não encontrada");
  }

  if (assignment.therapistId !== therapistId) {
    throw new TherapistServiceError(
      "NOT_FOUND",
      "Vinculação não pertence a este terapeuta",
    );
  }

  // Verificar agendamentos futuros nesta location para este terapeuta
  const futureAppointments = await prisma.appointment.count({
    where: {
      therapistId,
      locationId: assignment.locationId,
      tenantId: assignment.tenantId,
      startAt: { gte: new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  // Soft delete - desativar a vinculação
  const updated = await prisma.therapistAssignment.update({
    where: { id: assignmentId },
    data: { active: false },
  });

  return {
    ...updated,
    futureAppointments,
  };
}

// ============================================================================
// THERAPIST PROFILE (SELF-SERVICE)
// ============================================================================

/**
 * Busca perfil do terapeuta pelo userId (self-service)
 */
export async function getTherapistProfile(userId: string) {
  const therapist = await prisma.therapist.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
      therapistAssignments: {
        where: { active: true },
        include: {
          tenant: {
            select: { id: true, name: true, domain: true },
          },
          location: {
            select: { id: true, name: true, address: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          appointments: true,
          therapistAssignments: { where: { active: true } },
        },
      },
    },
  });

  if (!therapist) {
    throw new TherapistServiceError(
      "NOT_FOUND",
      "Perfil de terapeuta não encontrado",
    );
  }

  // Estatísticas
  const completedAppointments = await prisma.appointment.count({
    where: {
      therapistId: therapist.id,
      status: "COMPLETED",
    },
  });

  return {
    ...therapist,
    stats: {
      totalAppointments: therapist._count.appointments,
      completedAppointments,
      activeAssignments: therapist._count.therapistAssignments,
    },
  };
}

/**
 * Atualiza perfil do terapeuta (self-service)
 */
export async function updateTherapistProfile(
  userId: string,
  data: UpdateTherapistProfileInput,
) {
  const therapist = await prisma.therapist.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!therapist) {
    throw new TherapistServiceError(
      "NOT_FOUND",
      "Perfil de terapeuta não encontrado",
    );
  }

  // Se alterando senha, verificar senha atual
  if (data.newPassword) {
    if (!data.currentPassword) {
      throw new TherapistServiceError(
        "INVALID_PASSWORD",
        "Informe a senha atual para alterá-la",
      );
    }

    if (!therapist.user?.passwordHash) {
      throw new TherapistServiceError(
        "INVALID_PASSWORD",
        "Conta sem senha definida",
      );
    }

    const isValid = await compare(
      data.currentPassword,
      therapist.user.passwordHash,
    );
    if (!isValid) {
      throw new TherapistServiceError(
        "INVALID_PASSWORD",
        "Senha atual incorreta",
      );
    }
  }

  // Atualizar terapeuta e UserAccount em transação
  const result = await prisma.$transaction(async (tx) => {
    const updatedTherapist = await tx.therapist.update({
      where: { userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.specialties !== undefined && {
          specialties: data.specialties || null,
        }),
      },
    });

    // Atualizar UserAccount
    const userUpdateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      userUpdateData.displayName = data.name;
    }
    if (data.newPassword) {
      userUpdateData.passwordHash = await hash(
        data.newPassword,
        BCRYPT_SALT_ROUNDS,
      );
    }

    if (Object.keys(userUpdateData).length > 0) {
      await tx.userAccount.update({
        where: { id: therapist.userId! },
        data: userUpdateData,
      });
    }

    return updatedTherapist;
  });

  return result;
}
