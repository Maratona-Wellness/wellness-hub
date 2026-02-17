import { prisma } from "@/lib/db/prisma";
import { withTenantScope } from "@/lib/utils/tenant-access";
import { nanoid } from "nanoid";
import { compare, hash } from "bcryptjs";
import type {
  CreateAppointmentInput,
  ListEmployeeAppointmentsQuery,
  UpdateEmployeeProfileInput,
} from "@/lib/validations/appointment";
import type { PaginatedResponse, AppointmentWithDetails } from "@/types";

// ============================================================================
// ERROR CLASS
// ============================================================================

export type AppointmentErrorCode =
  | "NOT_FOUND"
  | "SLOT_NOT_FOUND"
  | "SLOT_FULL"
  | "ALREADY_BOOKED"
  | "PAST_DATE"
  | "CANCELLATION_DEADLINE"
  | "INVALID_STATUS"
  | "EMPLOYEE_NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR";

export class AppointmentServiceError extends Error {
  code: AppointmentErrorCode;

  constructor(code: AppointmentErrorCode, message: string) {
    super(message);
    this.name = "AppointmentServiceError";
    this.code = code;
  }
}

// ============================================================================
// APPOINTMENT CODE GENERATOR
// ============================================================================

/**
 * Gera código único para agendamento: MQV-2026-XXXXX
 */
function generateAppointmentCode(): string {
  const year = new Date().getFullYear();
  const uniquePart = nanoid(5).toUpperCase();
  return `MQV-${year}-${uniquePart}`;
}

// ============================================================================
// EMPLOYEE DASHBOARD
// ============================================================================

/**
 * Retorna dados do dashboard do funcionário
 */
export async function getEmployeeDashboard(userId: string, tenantId: string) {
  // Buscar o employee a partir do userId
  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      ...withTenantScope(tenantId),
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!employee) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Funcionário não encontrado",
    );
  }

  const now = new Date();

  // Buscar próximo agendamento
  const nextAppointment = await prisma.appointment.findFirst({
    where: {
      employeeId: employee.id,
      ...withTenantScope(tenantId),
      startAt: { gte: now },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    orderBy: { startAt: "asc" },
    include: {
      therapist: { select: { id: true, name: true, specialties: true } },
      location: { select: { id: true, name: true, address: true } },
      program: {
        select: { id: true, name: true, sessionDurationMinutes: true },
      },
    },
  });

  // Buscar próximos agendamentos (top 5)
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      employeeId: employee.id,
      ...withTenantScope(tenantId),
      startAt: { gte: now },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    orderBy: { startAt: "asc" },
    take: 5,
    include: {
      therapist: { select: { id: true, name: true, specialties: true } },
      location: { select: { id: true, name: true, address: true } },
      program: {
        select: { id: true, name: true, sessionDurationMinutes: true },
      },
    },
  });

  // Estatísticas
  const [totalSessions, completedSessions, cancelledSessions, noShows] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          employeeId: employee.id,
          ...withTenantScope(tenantId),
        },
      }),
      prisma.appointment.count({
        where: {
          employeeId: employee.id,
          ...withTenantScope(tenantId),
          status: "COMPLETED",
        },
      }),
      prisma.appointment.count({
        where: {
          employeeId: employee.id,
          ...withTenantScope(tenantId),
          status: "CANCELLED",
        },
      }),
      prisma.appointment.count({
        where: {
          employeeId: employee.id,
          ...withTenantScope(tenantId),
          status: "NO_SHOW",
        },
      }),
    ]);

  // Última sessão completada
  const lastSession = await prisma.appointment.findFirst({
    where: {
      employeeId: employee.id,
      ...withTenantScope(tenantId),
      status: "COMPLETED",
    },
    orderBy: { startAt: "desc" },
    select: { startAt: true },
  });

  const attendanceRate =
    completedSessions + noShows > 0
      ? Math.round((completedSessions / (completedSessions + noShows)) * 100)
      : 100;

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
    },
    nextAppointment,
    upcomingAppointments,
    stats: {
      totalSessions,
      completedSessions,
      cancelledSessions,
      noShows,
      attendanceRate,
      lastSessionDate: lastSession?.startAt || null,
    },
  };
}

// ============================================================================
// AVAILABLE PROGRAMS FOR EMPLOYEE
// ============================================================================

/**
 * Lista programas ativos disponíveis para o tenant do funcionário
 */
export async function listAvailablePrograms(tenantId: string) {
  const programs = await prisma.program.findMany({
    where: {
      ...withTenantScope(tenantId),
      active: true,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sessionDurationMinutes: true,
      dayStart: true,
      dayEnd: true,
      dailyCapacityPerLocation: true,
      _count: {
        select: {
          availabilitySlots: {
            where: {
              slotDate: { gte: new Date() },
            },
          },
        },
      },
    },
  });

  return programs.map((p) => ({
    ...p,
    hasAvailability: p._count.availabilitySlots > 0,
  }));
}

// ============================================================================
// AVAILABLE LOCATIONS FOR EMPLOYEE
// ============================================================================

/**
 * Lista locations do tenant do funcionário com disponibilidade para um programa
 */
export async function listAvailableLocations(
  tenantId: string,
  programId: string,
) {
  // Buscar locations que têm slots futuros para este programa
  const locationsWithSlots = await prisma.availabilitySlot.groupBy({
    by: ["locationId"],
    where: {
      ...withTenantScope(tenantId),
      programId,
      slotDate: { gte: new Date() },
    },
    _sum: { capacity: true, reserved: true },
  });

  const locationIds = locationsWithSlots
    .filter((l) => (l._sum.capacity || 0) > (l._sum.reserved || 0))
    .map((l) => l.locationId);

  const locations = await prisma.location.findMany({
    where: {
      id: { in: locationIds },
      ...withTenantScope(tenantId),
    },
    select: {
      id: true,
      name: true,
      address: true,
    },
    orderBy: { name: "asc" },
  });

  return locations;
}

// ============================================================================
// CREATE APPOINTMENT
// ============================================================================

/**
 * Cria um novo agendamento para o funcionário
 */
export async function createAppointment(
  data: CreateAppointmentInput,
  userId: string,
  tenantId: string,
) {
  // Buscar employee
  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      ...withTenantScope(tenantId),
      active: true,
    },
    select: { id: true, name: true, email: true },
  });

  if (!employee) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Funcionário não encontrado ou inativo",
    );
  }

  // Validar data (não pode ser no passado)
  const appointmentDate = new Date(data.date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (appointmentDate < today) {
    throw new AppointmentServiceError(
      "PAST_DATE",
      "Não é possível agendar para datas passadas",
    );
  }

  // Buscar slot e verificar disponibilidade
  const slot = await prisma.availabilitySlot.findUnique({
    where: { id: data.slotId },
    include: {
      program: {
        select: { id: true, name: true, sessionDurationMinutes: true },
      },
      location: { select: { id: true, name: true } },
      therapist: { select: { id: true, name: true } },
    },
  });

  if (!slot) {
    throw new AppointmentServiceError(
      "SLOT_NOT_FOUND",
      "Slot de disponibilidade não encontrado",
    );
  }

  if (slot.tenantId !== tenantId) {
    throw new AppointmentServiceError(
      "UNAUTHORIZED",
      "Slot não pertence ao seu tenant",
    );
  }

  if (slot.reserved >= slot.capacity) {
    throw new AppointmentServiceError(
      "SLOT_FULL",
      "Este horário já está lotado. Por favor, escolha outro horário.",
    );
  }

  // Verificar se o funcionário já tem agendamento no mesmo dia/horário
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      employeeId: employee.id,
      ...withTenantScope(tenantId),
      startAt: {
        gte: new Date(`${data.date}T${slot.startTime}:00`),
        lt: new Date(`${data.date}T${slot.endTime}:00`),
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  if (existingAppointment) {
    throw new AppointmentServiceError(
      "ALREADY_BOOKED",
      "Você já possui um agendamento neste horário",
    );
  }

  // Verificar se já tem agendamento no mesmo dia (regra de 1 por dia)
  const sameDayAppointment = await prisma.appointment.findFirst({
    where: {
      employeeId: employee.id,
      ...withTenantScope(tenantId),
      startAt: {
        gte: new Date(`${data.date}T00:00:00`),
        lt: new Date(`${data.date}T23:59:59`),
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  if (sameDayAppointment) {
    throw new AppointmentServiceError(
      "ALREADY_BOOKED",
      "Você já possui um agendamento para este dia. Limite de 1 sessão por dia.",
    );
  }

  // Criar agendamento em transação
  const code = generateAppointmentCode();
  const startAt = new Date(`${data.date}T${slot.startTime}:00`);
  const endAt = new Date(`${data.date}T${slot.endTime}:00`);

  const appointment = await prisma.$transaction(async (tx) => {
    // Lock otimista: verificar novamente disponibilidade
    const freshSlot = await tx.availabilitySlot.findUnique({
      where: { id: data.slotId },
      select: { reserved: true, capacity: true },
    });

    if (!freshSlot || freshSlot.reserved >= freshSlot.capacity) {
      throw new AppointmentServiceError(
        "SLOT_FULL",
        "Este horário acabou de ser preenchido. Por favor, escolha outro.",
      );
    }

    // Incrementar reservas no slot
    await tx.availabilitySlot.update({
      where: { id: data.slotId },
      data: { reserved: { increment: 1 } },
    });

    // Criar appointment
    const created = await tx.appointment.create({
      data: {
        tenantId,
        employeeId: employee.id,
        therapistId: data.therapistId,
        locationId: data.locationId,
        programId: data.programId,
        slotId: data.slotId,
        startAt,
        endAt,
        status: "CONFIRMED",
        code,
      },
      include: {
        therapist: { select: { id: true, name: true, specialties: true } },
        location: { select: { id: true, name: true, address: true } },
        program: {
          select: { id: true, name: true, sessionDurationMinutes: true },
        },
      },
    });

    return created;
  });

  // TODO: Enviar email de confirmação ao funcionário
  console.log(
    `[EMAIL] Confirmação de agendamento ${code} para ${employee.email}`,
  );

  // TODO: Notificar terapeuta
  console.log(`[EMAIL] Notificação de agendamento ${code} para terapeuta`);

  return appointment;
}

// ============================================================================
// LIST EMPLOYEE APPOINTMENTS
// ============================================================================

/**
 * Lista agendamentos do funcionário com paginação e filtros
 */
export async function listEmployeeAppointments(
  userId: string,
  tenantId: string,
  query: ListEmployeeAppointmentsQuery,
): Promise<PaginatedResponse<AppointmentWithDetails>> {
  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      ...withTenantScope(tenantId),
    },
    select: { id: true },
  });

  if (!employee) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Funcionário não encontrado",
    );
  }

  const { page, limit, status, programId, startDate, endDate } = query;
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Record<string, unknown> = {
    employeeId: employee.id,
    ...withTenantScope(tenantId),
  };

  // Filtro por status
  switch (status) {
    case "upcoming":
      where.startAt = { gte: now };
      where.status = { in: ["PENDING", "CONFIRMED"] };
      break;
    case "completed":
      where.status = "COMPLETED";
      break;
    case "cancelled":
      where.status = "CANCELLED";
      break;
    // "all" não adiciona filtro de status
  }

  if (programId) {
    where.programId = programId;
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate + "T00:00:00");
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59");
    where.startAt = { ...((where.startAt as object) || {}), ...dateFilter };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { startAt: status === "upcoming" ? "asc" : "desc" },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        therapist: { select: { id: true, name: true, specialties: true } },
        location: { select: { id: true, name: true, address: true } },
        program: {
          select: { id: true, name: true, sessionDurationMinutes: true },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    data: appointments.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      startAt: a.startAt,
      endAt: a.endAt,
      status: a.status,
      code: a.code,
      employee: a.employee,
      therapist: {
        id: a.therapist.id,
        name: a.therapist.name,
        specialties: a.therapist.specialties,
      },
      location: a.location,
      program: a.program,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================================================
// APPOINTMENT DETAILS
// ============================================================================

/**
 * Retorna detalhes de um agendamento do funcionário
 */
export async function getEmployeeAppointmentById(
  appointmentId: string,
  userId: string,
  tenantId: string,
) {
  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      ...withTenantScope(tenantId),
    },
    select: { id: true },
  });

  if (!employee) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Funcionário não encontrado",
    );
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      therapist: { select: { id: true, name: true, specialties: true } },
      location: { select: { id: true, name: true, address: true } },
      program: {
        select: { id: true, name: true, sessionDurationMinutes: true },
      },
    },
  });

  if (!appointment) {
    throw new AppointmentServiceError(
      "NOT_FOUND",
      "Agendamento não encontrado",
    );
  }

  if (appointment.employeeId !== employee.id) {
    throw new AppointmentServiceError(
      "UNAUTHORIZED",
      "Você não tem permissão para visualizar este agendamento",
    );
  }

  if (appointment.tenantId !== tenantId) {
    throw new AppointmentServiceError(
      "UNAUTHORIZED",
      "Agendamento não pertence ao seu tenant",
    );
  }

  // Verificar se pode cancelar (4h de antecedência)
  const canCancel =
    ["PENDING", "CONFIRMED"].includes(appointment.status) &&
    appointment.startAt.getTime() - Date.now() > 4 * 60 * 60 * 1000;

  return {
    ...appointment,
    canCancel,
    cancellationDeadline: canCancel
      ? new Date(appointment.startAt.getTime() - 4 * 60 * 60 * 1000)
      : null,
  };
}

// ============================================================================
// CANCEL APPOINTMENT
// ============================================================================

/**
 * Cancela um agendamento do funcionário
 */
export async function cancelAppointment(
  appointmentId: string,
  userId: string,
  tenantId: string,
  reason?: string,
) {
  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      ...withTenantScope(tenantId),
    },
    select: { id: true, email: true, name: true },
  });

  if (!employee) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Funcionário não encontrado",
    );
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      therapist: { select: { name: true, email: true } },
      program: { select: { name: true } },
    },
  });

  if (!appointment) {
    throw new AppointmentServiceError(
      "NOT_FOUND",
      "Agendamento não encontrado",
    );
  }

  if (appointment.employeeId !== employee.id) {
    throw new AppointmentServiceError(
      "UNAUTHORIZED",
      "Você não tem permissão para cancelar este agendamento",
    );
  }

  if (appointment.tenantId !== tenantId) {
    throw new AppointmentServiceError(
      "UNAUTHORIZED",
      "Agendamento não pertence ao seu tenant",
    );
  }

  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    throw new AppointmentServiceError(
      "INVALID_STATUS",
      "Apenas agendamentos pendentes ou confirmados podem ser cancelados",
    );
  }

  // Verificar prazo (4h de antecedência)
  const hoursUntilAppointment =
    (appointment.startAt.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilAppointment < 4) {
    throw new AppointmentServiceError(
      "CANCELLATION_DEADLINE",
      "O cancelamento deve ser feito com pelo menos 4 horas de antecedência",
    );
  }

  // Cancelar em transação
  const cancelled = await prisma.$transaction(async (tx) => {
    // Atualizar status
    const updated = await tx.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
      include: {
        therapist: { select: { id: true, name: true, specialties: true } },
        location: { select: { id: true, name: true, address: true } },
        program: {
          select: { id: true, name: true, sessionDurationMinutes: true },
        },
      },
    });

    // Liberar vaga no slot
    await tx.availabilitySlot.update({
      where: { id: appointment.slotId },
      data: { reserved: { decrement: 1 } },
    });

    return updated;
  });

  // TODO: Enviar notificação de cancelamento ao funcionário
  console.log(
    `[EMAIL] Cancelamento de agendamento ${appointment.code} para ${employee.email}`,
  );

  // TODO: Notificar terapeuta sobre cancelamento
  console.log(
    `[EMAIL] Notificação de cancelamento ${appointment.code} para terapeuta`,
  );

  return cancelled;
}

// ============================================================================
// EMPLOYEE PROFILE
// ============================================================================

/**
 * Retorna perfil do funcionário
 */
export async function getEmployeeProfile(userId: string, tenantId: string) {
  const user = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      active: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Usuário não encontrado",
    );
  }

  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      ...withTenantScope(tenantId),
    },
    include: {
      tenant: { select: { id: true, name: true, domain: true } },
    },
  });

  if (!employee) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Funcionário não encontrado",
    );
  }

  // Estatísticas
  const [totalSessions, completedSessions, noShows] = await Promise.all([
    prisma.appointment.count({
      where: { employeeId: employee.id, ...withTenantScope(tenantId) },
    }),
    prisma.appointment.count({
      where: {
        employeeId: employee.id,
        ...withTenantScope(tenantId),
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: {
        employeeId: employee.id,
        ...withTenantScope(tenantId),
        status: "NO_SHOW",
      },
    }),
  ]);

  const attendanceRate =
    completedSessions + noShows > 0
      ? Math.round((completedSessions / (completedSessions + noShows)) * 100)
      : 100;

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      active: user.active,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      tenantName: employee.tenant.name,
    },
    stats: {
      totalSessions,
      completedSessions,
      noShows,
      attendanceRate,
    },
  };
}

/**
 * Atualiza perfil do funcionário
 */
export async function updateEmployeeProfile(
  userId: string,
  tenantId: string,
  data: UpdateEmployeeProfileInput,
) {
  const employee = await prisma.employee.findFirst({
    where: {
      userId,
      ...withTenantScope(tenantId),
    },
    select: { id: true },
  });

  if (!employee) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Funcionário não encontrado",
    );
  }

  // Atualizar employee name e/ou user displayName
  const updates: Promise<unknown>[] = [];

  if (data.name) {
    updates.push(
      prisma.employee.update({
        where: { id: employee.id },
        data: { name: data.name },
      }),
    );
  }

  if (data.displayName) {
    updates.push(
      prisma.userAccount.update({
        where: { id: userId },
        data: { displayName: data.displayName },
      }),
    );
  }

  await Promise.all(updates);

  return getEmployeeProfile(userId, tenantId);
}

/**
 * Altera senha do funcionário
 */
export async function changeEmployeePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.userAccount.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    throw new AppointmentServiceError(
      "EMPLOYEE_NOT_FOUND",
      "Usuário não encontrado",
    );
  }

  const isValid = await compare(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new AppointmentServiceError(
      "VALIDATION_ERROR",
      "Senha atual incorreta",
    );
  }

  const passwordHash = await hash(newPassword, 12);

  await prisma.userAccount.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true, message: "Senha alterada com sucesso" };
}
