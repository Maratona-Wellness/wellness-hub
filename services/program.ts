import { prisma } from "@/lib/db/prisma";
import { withTenantScope } from "@/lib/utils/tenant-access";
import type {
  CreateProgramInput,
  UpdateProgramInput,
  ListProgramsQuery,
  GenerateSlotsInput,
  ListAvailabilitySlotsQuery,
  ListSlotsPaginatedQuery,
  AvailabilityOverviewQuery,
} from "@/lib/validations/program";
import type { PaginatedResponse } from "@/types";

// ============================================================================
// ERROR CLASS
// ============================================================================

export type ProgramErrorCode =
  | "NOT_FOUND"
  | "TENANT_NOT_FOUND"
  | "LOCATION_NOT_FOUND"
  | "THERAPIST_NOT_FOUND"
  | "THERAPIST_NOT_ASSIGNED"
  | "HAS_FUTURE_APPOINTMENTS"
  | "SLOT_CONFLICT"
  | "VALIDATION_ERROR";

export class ProgramServiceError extends Error {
  code: ProgramErrorCode;

  constructor(code: ProgramErrorCode, message: string) {
    super(message);
    this.name = "ProgramServiceError";
    this.code = code;
  }
}

// ============================================================================
// PROGRAM LISTING & DETAILS
// ============================================================================

/**
 * Lista programas com paginação, filtros e busca
 */
export async function listPrograms(query: ListProgramsQuery): Promise<
  PaginatedResponse<{
    id: string;
    tenantId: string;
    name: string;
    sessionDurationMinutes: number;
    dayStart: string;
    dayEnd: string;
    dailyCapacityPerLocation: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    tenant: { id: string; name: string; domain: string };
    _count: {
      availabilitySlots: number;
      appointments: number;
    };
  }>
> {
  const { page, limit, search, status, tenantId, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (status === "active") {
    where.active = true;
  } else if (status === "inactive") {
    where.active = false;
  }

  if (search) {
    where.OR = [{ name: { contains: search, mode: "insensitive" } }];
  }

  if (tenantId) {
    where.tenantId = tenantId;
  }

  const [programs, total] = await Promise.all([
    prisma.program.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        tenant: {
          select: { id: true, name: true, domain: true },
        },
        _count: {
          select: {
            availabilitySlots: true,
            appointments: true,
          },
        },
      },
    }),
    prisma.program.count({ where }),
  ]);

  return {
    data: programs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Busca detalhes de um programa por ID
 */
export async function getProgramById(id: string) {
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      tenant: {
        select: { id: true, name: true, domain: true, active: true },
      },
      _count: {
        select: {
          availabilitySlots: true,
          appointments: true,
        },
      },
    },
  });

  if (!program) return null;

  // Estatísticas adicionais
  const [futureAppointments, completedAppointments, totalSlots, reservedSlots] =
    await Promise.all([
      prisma.appointment.count({
        where: {
          programId: id,
          startAt: { gte: new Date() },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      }),
      prisma.appointment.count({
        where: {
          programId: id,
          status: "COMPLETED",
        },
      }),
      prisma.availabilitySlot.count({
        where: {
          programId: id,
          slotDate: { gte: new Date() },
        },
      }),
      prisma.availabilitySlot.aggregate({
        where: {
          programId: id,
          slotDate: { gte: new Date() },
        },
        _sum: { reserved: true },
      }),
    ]);

  return {
    ...program,
    stats: {
      totalAppointments: program._count.appointments,
      futureAppointments,
      completedAppointments,
      totalSlots,
      totalReserved: reservedSlots._sum.reserved || 0,
    },
  };
}

// ============================================================================
// PROGRAM CRUD
// ============================================================================

/**
 * Cria um novo programa vinculado a um tenant
 */
export async function createProgram(data: CreateProgramInput) {
  // Verificar se o tenant existe e está ativo
  const tenant = await prisma.tenant.findUnique({
    where: { id: data.tenantId },
    select: { id: true, active: true },
  });

  if (!tenant) {
    throw new ProgramServiceError("TENANT_NOT_FOUND", "Tenant não encontrado");
  }

  if (!tenant.active) {
    throw new ProgramServiceError("TENANT_NOT_FOUND", "Tenant está inativo");
  }

  const program = await prisma.program.create({
    data: {
      name: data.name,
      tenantId: data.tenantId,
      sessionDurationMinutes: data.sessionDurationMinutes,
      dayStart: data.dayStart,
      dayEnd: data.dayEnd,
      dailyCapacityPerLocation: data.dailyCapacityPerLocation,
      active: data.active ?? true,
    },
    include: {
      tenant: {
        select: { id: true, name: true, domain: true },
      },
    },
  });

  return program;
}

/**
 * Atualiza um programa existente
 */
export async function updateProgram(id: string, data: UpdateProgramInput) {
  const program = await prisma.program.findUnique({
    where: { id },
    select: { id: true, dayStart: true, dayEnd: true },
  });

  if (!program) {
    throw new ProgramServiceError("NOT_FOUND", "Programa não encontrado");
  }

  // Se um dos horários foi alterado, precisamos validar a combinação
  const newDayStart = data.dayStart || program.dayStart;
  const newDayEnd = data.dayEnd || program.dayEnd;

  const startMinutes = timeToMinutes(newDayStart);
  const endMinutes = timeToMinutes(newDayEnd);

  if (endMinutes <= startMinutes) {
    throw new ProgramServiceError(
      "VALIDATION_ERROR",
      "O horário de término deve ser posterior ao horário de início",
    );
  }

  const updated = await prisma.program.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.sessionDurationMinutes && {
        sessionDurationMinutes: data.sessionDurationMinutes,
      }),
      ...(data.dayStart && { dayStart: data.dayStart }),
      ...(data.dayEnd && { dayEnd: data.dayEnd }),
      ...(data.dailyCapacityPerLocation && {
        dailyCapacityPerLocation: data.dailyCapacityPerLocation,
      }),
    },
    include: {
      tenant: {
        select: { id: true, name: true, domain: true },
      },
    },
  });

  return updated;
}

/**
 * Alterna o status ativo/inativo de um programa
 */
export async function toggleProgramStatus(id: string) {
  const program = await prisma.program.findUnique({
    where: { id },
    select: { id: true, name: true, active: true },
  });

  if (!program) {
    throw new ProgramServiceError("NOT_FOUND", "Programa não encontrado");
  }

  // Verificar agendamentos futuros se estiver desativando
  let futureAppointments = 0;
  if (program.active) {
    futureAppointments = await prisma.appointment.count({
      where: {
        programId: id,
        startAt: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
  }

  const updated = await prisma.program.update({
    where: { id },
    data: { active: !program.active },
  });

  return {
    ...updated,
    futureAppointments,
    message: updated.active
      ? `Programa "${program.name}" ativado com sucesso`
      : `Programa "${program.name}" desativado com sucesso`,
  };
}

// ============================================================================
// PROGRAMS BY TENANT
// ============================================================================

/**
 * Lista programas de um tenant específico
 */
export async function listProgramsByTenant(
  tenantId: string,
  options: { activeOnly?: boolean } = {},
) {
  const where: Record<string, unknown> = {
    ...withTenantScope(tenantId),
  };

  if (options.activeOnly) {
    where.active = true;
  }

  const programs = await prisma.program.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          availabilitySlots: true,
          appointments: true,
        },
      },
    },
  });

  return programs;
}

// ============================================================================
// AVAILABILITY SLOTS
// ============================================================================

/**
 * Helper para converter HH:MM em minutos
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper para converter minutos em HH:MM
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Gera slots de disponibilidade em lote
 */
export async function generateAvailabilitySlots(
  data: GenerateSlotsInput,
  tenantId: string,
) {
  // Validar programa
  const program = await prisma.program.findUnique({
    where: { id: data.programId },
    select: {
      id: true,
      tenantId: true,
      sessionDurationMinutes: true,
      dayStart: true,
      dayEnd: true,
      dailyCapacityPerLocation: true,
      active: true,
      name: true,
    },
  });

  if (!program) {
    throw new ProgramServiceError("NOT_FOUND", "Programa não encontrado");
  }

  if (!program.active) {
    throw new ProgramServiceError("NOT_FOUND", "Programa está inativo");
  }

  if (program.tenantId !== tenantId) {
    throw new ProgramServiceError(
      "NOT_FOUND",
      "Programa não pertence ao tenant",
    );
  }

  // Validar localização
  const location = await prisma.location.findUnique({
    where: { id: data.locationId },
    select: { id: true, tenantId: true },
  });

  if (!location) {
    throw new ProgramServiceError(
      "LOCATION_NOT_FOUND",
      "Localização não encontrada",
    );
  }

  if (location.tenantId !== tenantId) {
    throw new ProgramServiceError(
      "LOCATION_NOT_FOUND",
      "Localização não pertence ao tenant",
    );
  }

  // Validar terapeutas
  for (const therapistId of data.therapistIds) {
    const assignment = await prisma.therapistAssignment.findFirst({
      where: {
        therapistId,
        tenantId,
        locationId: data.locationId,
        active: true,
      },
    });

    if (!assignment) {
      const therapist = await prisma.therapist.findUnique({
        where: { id: therapistId },
        select: { name: true },
      });
      throw new ProgramServiceError(
        "THERAPIST_NOT_ASSIGNED",
        `Terapeuta "${therapist?.name || therapistId}" não está vinculado(a) a esta localização`,
      );
    }
  }

  // Gerar datas do período
  const dates: Date[] = [];
  const start = new Date(data.startDate + "T00:00:00");
  const end = new Date(data.endDate + "T00:00:00");

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (data.weekdays.includes(d.getDay())) {
      dates.push(new Date(d));
    }
  }

  if (dates.length === 0) {
    throw new ProgramServiceError(
      "VALIDATION_ERROR",
      "Nenhuma data corresponde aos dias da semana selecionados no período",
    );
  }

  // Gerar slots de horários baseado no programa
  const programStartMinutes = timeToMinutes(program.dayStart);
  const programEndMinutes = timeToMinutes(program.dayEnd);
  const duration = program.sessionDurationMinutes;

  // Intervalo de descanso (opcional)
  const breakStartMin = data.breakStart ? timeToMinutes(data.breakStart) : null;
  const breakEndMin = data.breakEnd ? timeToMinutes(data.breakEnd) : null;

  // Intervalo entre slots (em minutos)
  const gap = data.breakBetweenSlotsMinutes ?? 0;

  const timeSlots: { startTime: string; endTime: string }[] = [];
  for (
    let t = programStartMinutes;
    t + duration <= programEndMinutes;
    t += duration + gap
  ) {
    // Pular slots que sobrepõem o intervalo de descanso
    if (
      breakStartMin !== null &&
      breakEndMin !== null &&
      t < breakEndMin &&
      t + duration > breakStartMin
    ) {
      continue;
    }

    timeSlots.push({
      startTime: minutesToTime(t),
      endTime: minutesToTime(t + duration),
    });
  }

  if (timeSlots.length === 0) {
    throw new ProgramServiceError(
      "VALIDATION_ERROR",
      "Não é possível gerar slots com a duração e janela de horário do programa",
    );
  }

  // Verificar conflitos existentes
  const existingSlots = await prisma.availabilitySlot.findMany({
    where: {
      tenantId,
      locationId: data.locationId,
      programId: data.programId,
      therapistId: { in: data.therapistIds },
      slotDate: {
        gte: start,
        lte: end,
      },
    },
    select: {
      therapistId: true,
      slotDate: true,
      startTime: true,
    },
  });

  // Criar mapa de conflitos para verificação rápida
  const conflictSet = new Set(
    existingSlots.map(
      (s) =>
        `${s.therapistId}-${s.slotDate.toISOString().split("T")[0]}-${s.startTime}`,
    ),
  );

  // Preparar dados para criação
  const slotsToCreate: Array<{
    tenantId: string;
    locationId: string;
    therapistId: string;
    programId: string;
    slotDate: Date;
    startTime: string;
    endTime: string;
    capacity: number;
    reserved: number;
  }> = [];

  let skippedConflicts = 0;

  for (const date of dates) {
    const dateStr = date.toISOString().split("T")[0];
    for (const therapistId of data.therapistIds) {
      for (const slot of timeSlots) {
        const key = `${therapistId}-${dateStr}-${slot.startTime}`;
        if (conflictSet.has(key)) {
          skippedConflicts++;
          continue;
        }

        slotsToCreate.push({
          tenantId,
          locationId: data.locationId,
          therapistId,
          programId: data.programId,
          slotDate: date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: 1,
          reserved: 0,
        });
      }
    }
  }

  // Criar slots em transação
  const result = await prisma.availabilitySlot.createMany({
    data: slotsToCreate,
    skipDuplicates: true,
  });

  return {
    created: result.count,
    skippedConflicts,
    totalDates: dates.length,
    totalTherapists: data.therapistIds.length,
    slotsPerDay: timeSlots.length,
    programName: program.name,
  };
}

/**
 * Lista slots de disponibilidade com filtros
 */
export async function listAvailabilitySlots(
  query: ListAvailabilitySlotsQuery,
  tenantId: string,
) {
  const where: Record<string, unknown> = {
    ...withTenantScope(tenantId),
  };

  if (query.date) {
    where.slotDate = new Date(query.date + "T00:00:00");
  } else if (query.startDate || query.endDate) {
    const dateFilter: Record<string, unknown> = {};
    if (query.startDate)
      dateFilter.gte = new Date(query.startDate + "T00:00:00");
    if (query.endDate) dateFilter.lte = new Date(query.endDate + "T00:00:00");
    where.slotDate = dateFilter;
  }

  if (query.programId) {
    where.programId = query.programId;
  }

  if (query.locationId) {
    where.locationId = query.locationId;
  }

  if (query.therapistId) {
    where.therapistId = query.therapistId;
  }

  if (query.onlyAvailable) {
    where.reserved = { lt: prisma.availabilitySlot.fields?.capacity };
    // Prisma não suporta comparação entre colunas diretamente, usamos raw
    // Em vez disso, filtramos no application level
  }

  const slots = await prisma.availabilitySlot.findMany({
    where,
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          specialties: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
      program: {
        select: {
          id: true,
          name: true,
          sessionDurationMinutes: true,
        },
      },
    },
  });

  // Filtrar slots disponíveis no application level se necessário
  const filteredSlots = query.onlyAvailable
    ? slots.filter((s) => s.reserved < s.capacity)
    : slots;

  return filteredSlots;
}

/**
 * Lista datas com slots disponíveis para employee
 */
export async function listAvailableDates(
  tenantId: string,
  programId: string,
  locationId: string,
  startDate?: string,
  endDate?: string,
) {
  const now = new Date();
  const defaultStart = new Date(now.toISOString().split("T")[0]);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultEnd.getDate() + 30);

  const slots = await prisma.availabilitySlot.groupBy({
    by: ["slotDate"],
    where: {
      ...withTenantScope(tenantId),
      programId,
      locationId,
      slotDate: {
        gte: startDate ? new Date(startDate + "T00:00:00") : defaultStart,
        lte: endDate ? new Date(endDate + "T00:00:00") : defaultEnd,
      },
    },
    _sum: { capacity: true, reserved: true },
    orderBy: { slotDate: "asc" },
  });

  return slots
    .filter((s) => (s._sum.capacity || 0) > (s._sum.reserved || 0))
    .map((s) => ({
      date: s.slotDate.toISOString().split("T")[0],
      totalCapacity: s._sum.capacity || 0,
      totalReserved: s._sum.reserved || 0,
      available: (s._sum.capacity || 0) - (s._sum.reserved || 0),
    }));
}

/**
 * Lista slots de uma data específica para employee
 */
export async function listSlotsForDate(
  tenantId: string,
  programId: string,
  locationId: string,
  date: string,
) {
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      ...withTenantScope(tenantId),
      programId,
      locationId,
      slotDate: new Date(date + "T00:00:00"),
    },
    include: {
      therapist: {
        select: {
          id: true,
          name: true,
          specialties: true,
        },
      },
    },
    orderBy: [{ startTime: "asc" }],
  });

  // Agrupar por horário
  const groupedByTime: Record<
    string,
    {
      startTime: string;
      endTime: string;
      therapists: Array<{
        id: string;
        name: string;
        specialties: string | null;
        slotId: string;
        available: boolean;
      }>;
      totalCapacity: number;
      totalReserved: number;
    }
  > = {};

  for (const slot of slots) {
    const key = slot.startTime;
    if (!groupedByTime[key]) {
      groupedByTime[key] = {
        startTime: slot.startTime,
        endTime: slot.endTime,
        therapists: [],
        totalCapacity: 0,
        totalReserved: 0,
      };
    }

    groupedByTime[key].therapists.push({
      id: slot.therapist.id,
      name: slot.therapist.name,
      specialties: slot.therapist.specialties,
      slotId: slot.id,
      available: slot.reserved < slot.capacity,
    });
    groupedByTime[key].totalCapacity += slot.capacity;
    groupedByTime[key].totalReserved += slot.reserved;
  }

  return Object.values(groupedByTime);
}

// ============================================================================
// AVAILABILITY OVERVIEW (TENANT_ADMIN)
// ============================================================================

/**
 * Retorna overview de disponibilidade para TENANT_ADMIN
 */
export async function getAvailabilityOverview(
  tenantId: string,
  query: AvailabilityOverviewQuery,
) {
  const now = new Date();
  const defaultStart = new Date(now.toISOString().split("T")[0]);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultEnd.getDate() + 30);

  const dateFilter = {
    gte: query.startDate
      ? new Date(query.startDate + "T00:00:00")
      : defaultStart,
    lte: query.endDate ? new Date(query.endDate + "T00:00:00") : defaultEnd,
  };

  const baseWhere: Record<string, unknown> = {
    ...withTenantScope(tenantId),
    slotDate: dateFilter,
  };

  if (query.locationId) baseWhere.locationId = query.locationId;
  if (query.programId) baseWhere.programId = query.programId;

  // Ocupação por localização
  const byLocation = await prisma.availabilitySlot.groupBy({
    by: ["locationId"],
    where: baseWhere,
    _sum: { capacity: true, reserved: true },
    _count: true,
  });

  // Buscar nomes das locations
  const locationIds = byLocation.map((b) => b.locationId);
  const locations = await prisma.location.findMany({
    where: { id: { in: locationIds } },
    select: { id: true, name: true },
  });
  const locationMap = new Map(locations.map((l) => [l.id, l.name]));

  // Ocupação por programa
  const byProgram = await prisma.availabilitySlot.groupBy({
    by: ["programId"],
    where: baseWhere,
    _sum: { capacity: true, reserved: true },
    _count: true,
  });

  const programIds = byProgram.map((b) => b.programId);
  const programs = await prisma.program.findMany({
    where: { id: { in: programIds } },
    select: { id: true, name: true },
  });
  const programMap = new Map(programs.map((p) => [p.id, p.name]));

  // Ocupação por terapeuta
  const byTherapist = await prisma.availabilitySlot.groupBy({
    by: ["therapistId"],
    where: baseWhere,
    _sum: { capacity: true, reserved: true },
    _count: true,
  });

  const therapistIds = byTherapist.map((b) => b.therapistId);
  const therapists = await prisma.therapist.findMany({
    where: { id: { in: therapistIds } },
    select: { id: true, name: true },
  });
  const therapistMap = new Map(therapists.map((t) => [t.id, t.name]));

  // Ocupação por data (heatmap)
  const byDate = await prisma.availabilitySlot.groupBy({
    by: ["slotDate"],
    where: baseWhere,
    _sum: { capacity: true, reserved: true },
    _count: true,
    orderBy: { slotDate: "asc" },
  });

  // Totais gerais
  const totals = await prisma.availabilitySlot.aggregate({
    where: baseWhere,
    _sum: { capacity: true, reserved: true },
    _count: true,
  });

  const totalCapacity = totals._sum.capacity || 0;
  const totalReserved = totals._sum.reserved || 0;

  return {
    summary: {
      totalSlots: totals._count,
      totalCapacity,
      totalReserved,
      totalAvailable: totalCapacity - totalReserved,
      occupancyRate:
        totalCapacity > 0
          ? Math.round((totalReserved / totalCapacity) * 100)
          : 0,
    },
    byLocation: byLocation.map((b) => ({
      locationId: b.locationId,
      locationName: locationMap.get(b.locationId) || "Desconhecida",
      totalSlots: b._count,
      totalCapacity: b._sum.capacity || 0,
      totalReserved: b._sum.reserved || 0,
      occupancyRate:
        (b._sum.capacity || 0) > 0
          ? Math.round(((b._sum.reserved || 0) / (b._sum.capacity || 0)) * 100)
          : 0,
    })),
    byProgram: byProgram.map((b) => ({
      programId: b.programId,
      programName: programMap.get(b.programId) || "Desconhecido",
      totalSlots: b._count,
      totalCapacity: b._sum.capacity || 0,
      totalReserved: b._sum.reserved || 0,
      occupancyRate:
        (b._sum.capacity || 0) > 0
          ? Math.round(((b._sum.reserved || 0) / (b._sum.capacity || 0)) * 100)
          : 0,
    })),
    byTherapist: byTherapist.map((b) => ({
      therapistId: b.therapistId,
      therapistName: therapistMap.get(b.therapistId) || "Desconhecido",
      totalSlots: b._count,
      totalCapacity: b._sum.capacity || 0,
      totalReserved: b._sum.reserved || 0,
      occupancyRate:
        (b._sum.capacity || 0) > 0
          ? Math.round(((b._sum.reserved || 0) / (b._sum.capacity || 0)) * 100)
          : 0,
    })),
    byDate: byDate.map((b) => ({
      date: b.slotDate.toISOString().split("T")[0],
      totalSlots: b._count,
      totalCapacity: b._sum.capacity || 0,
      totalReserved: b._sum.reserved || 0,
      occupancyRate:
        (b._sum.capacity || 0) > 0
          ? Math.round(((b._sum.reserved || 0) / (b._sum.capacity || 0)) * 100)
          : 0,
    })),
  };
}

/**
 * Lista slots de disponibilidade do terapeuta
 */
export async function listTherapistAvailability(
  therapistId: string,
  options: {
    tenantId?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
  } = {},
) {
  const now = new Date();
  const defaultStart = new Date(now.toISOString().split("T")[0]);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultEnd.getDate() + 14);

  const where: Record<string, unknown> = {
    therapistId,
    slotDate: {
      gte: options.startDate
        ? new Date(options.startDate + "T00:00:00")
        : defaultStart,
      lte: options.endDate
        ? new Date(options.endDate + "T00:00:00")
        : defaultEnd,
    },
  };

  if (options.tenantId) where.tenantId = options.tenantId;
  if (options.locationId) where.locationId = options.locationId;

  const slots = await prisma.availabilitySlot.findMany({
    where,
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    include: {
      tenant: {
        select: { id: true, name: true },
      },
      location: {
        select: { id: true, name: true, address: true },
      },
      program: {
        select: { id: true, name: true, sessionDurationMinutes: true },
      },
      appointments: {
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        select: {
          id: true,
          status: true,
          employee: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return slots;
}

/**
 * Remove slots de disponibilidade futuros do terapeuta
 */
export async function deleteTherapistSlots(
  therapistId: string,
  slotIds: string[],
) {
  // Verificar se os slots pertencem ao terapeuta e não têm agendamentos
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      id: { in: slotIds },
      therapistId,
    },
    include: {
      appointments: {
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      },
    },
  });

  const slotsWithAppointments = slots.filter((s) => s.appointments.length > 0);

  if (slotsWithAppointments.length > 0) {
    throw new ProgramServiceError(
      "HAS_FUTURE_APPOINTMENTS",
      `${slotsWithAppointments.length} slot(s) possuem agendamentos ativos e não podem ser removidos`,
    );
  }

  const result = await prisma.availabilitySlot.deleteMany({
    where: {
      id: { in: slotIds },
      therapistId,
      reserved: 0,
    },
  });

  return { deleted: result.count };
}

// ============================================================================
// SUPER_ADMIN — VISÃO AGRUPADA GLOBAL DE SLOTS
// ============================================================================

/**
 * Lista slots agrupados por tenant + programa (visão global SUPER_ADMIN)
 */
export async function listSlotsGrouped(query: ListSlotsPaginatedQuery) {
  const where: Record<string, unknown> = {};

  if (query.tenantId) {
    where.tenantId = query.tenantId;
  }

  if (query.programId) {
    where.programId = query.programId;
  }

  if (query.locationId) {
    where.locationId = query.locationId;
  }

  if (query.startDate || query.endDate) {
    const dateFilter: Record<string, unknown> = {};
    if (query.startDate)
      dateFilter.gte = new Date(query.startDate + "T00:00:00");
    if (query.endDate) dateFilter.lte = new Date(query.endDate + "T00:00:00");
    where.slotDate = dateFilter;
  }

  // Agrupar por tenant + programa
  const grouped = await prisma.availabilitySlot.groupBy({
    by: ["tenantId", "programId"],
    where,
    _sum: { capacity: true, reserved: true },
    _count: true,
  });

  // Buscar nomes dos tenants e programas
  const tenantIds = [...new Set(grouped.map((g) => g.tenantId))];
  const programIds = [...new Set(grouped.map((g) => g.programId))];

  const [tenantsData, programsData] = await Promise.all([
    prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true },
    }),
    prisma.program.findMany({
      where: { id: { in: programIds } },
      select: { id: true, name: true, sessionDurationMinutes: true },
    }),
  ]);

  const tenantMap = new Map(tenantsData.map((t) => [t.id, t.name]));
  const programMap = new Map(
    programsData.map((p) => [
      p.id,
      { name: p.name, duration: p.sessionDurationMinutes },
    ]),
  );

  const data = grouped
    .map((g) => {
      const totalCapacity = g._sum.capacity || 0;
      const totalReserved = g._sum.reserved || 0;
      const totalAvailable = totalCapacity - totalReserved;
      const occupancyRate =
        totalCapacity > 0
          ? Math.round((totalReserved / totalCapacity) * 100)
          : 0;

      return {
        tenantId: g.tenantId,
        tenantName: tenantMap.get(g.tenantId) || "Desconhecida",
        programId: g.programId,
        programName: programMap.get(g.programId)?.name || "Desconhecido",
        sessionDuration: programMap.get(g.programId)?.duration || 0,
        totalSlots: g._count,
        totalCapacity,
        totalReserved,
        totalAvailable,
        occupancyRate,
      };
    })
    .sort((a, b) => {
      // Ordenar por tenant name, depois por programa name
      const tenantCmp = a.tenantName.localeCompare(b.tenantName);
      if (tenantCmp !== 0) return tenantCmp;
      return a.programName.localeCompare(b.programName);
    });

  return { data, total: data.length };
}
