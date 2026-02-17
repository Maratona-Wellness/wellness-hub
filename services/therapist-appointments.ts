import { prisma } from "@/lib/db/prisma";
import type {
  ListTherapistAppointmentsQuery,
  CheckInInput,
  TherapistHistoryQuery,
} from "@/lib/validations/therapist-appointments";
import type { PaginatedResponse } from "@/types";

// ============================================================================
// ERROR CLASS
// ============================================================================

export type TherapistAppointmentErrorCode =
  | "NOT_FOUND"
  | "THERAPIST_NOT_FOUND"
  | "UNAUTHORIZED"
  | "INVALID_STATUS"
  | "TOO_EARLY"
  | "ALREADY_CHECKED_IN"
  | "VALIDATION_ERROR";

export class TherapistAppointmentError extends Error {
  code: TherapistAppointmentErrorCode;

  constructor(code: TherapistAppointmentErrorCode, message: string) {
    super(message);
    this.name = "TherapistAppointmentError";
    this.code = code;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

const appointmentInclude = {
  employee: { select: { id: true, name: true, email: true } },
  therapist: { select: { id: true, name: true, specialties: true } },
  location: { select: { id: true, name: true, address: true } },
  program: {
    select: { id: true, name: true, sessionDurationMinutes: true },
  },
  tenant: { select: { id: true, name: true } },
};

/**
 * Busca o therapist pelo userId
 */
async function getTherapistByUserId(userId: string) {
  const therapist = await prisma.therapist.findUnique({
    where: { userId },
    select: { id: true, name: true },
  });

  if (!therapist) {
    throw new TherapistAppointmentError(
      "THERAPIST_NOT_FOUND",
      "Perfil de terapeuta não encontrado",
    );
  }

  return therapist;
}

/**
 * Calcula range de datas baseado na view
 */
function getDateRange(
  view: "day" | "week" | "month",
  dateStr?: string,
): { start: Date; end: Date } {
  const baseDate = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  baseDate.setHours(0, 0, 0, 0);

  const start = new Date(baseDate);
  const end = new Date(baseDate);

  switch (view) {
    case "day":
      end.setDate(end.getDate() + 1);
      break;
    case "week": {
      const dayOfWeek = start.getDay();
      // Segunda como início da semana
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + diff);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
      break;
    }
    case "month":
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 1);
      break;
  }

  return { start, end };
}

// ============================================================================
// THERAPIST CALENDAR — LIST APPOINTMENTS
// ============================================================================

/**
 * Lista agendamentos do terapeuta com filtros para calendário
 */
export async function listTherapistAppointments(
  userId: string,
  query: ListTherapistAppointmentsQuery,
) {
  const therapist = await getTherapistByUserId(userId);

  const { view, date, tenantId, locationId, programId, status } = query;
  const { start, end } = getDateRange(view, date);

  const where: Record<string, unknown> = {
    therapistId: therapist.id,
    startAt: { gte: start, lt: end },
  };

  if (tenantId) where.tenantId = tenantId;
  if (locationId) where.locationId = locationId;
  if (programId) where.programId = programId;
  if (status && status !== "all") where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: appointmentInclude,
  });

  // Resumo de estatísticas do período
  const summary = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "PENDING").length,
    confirmed: appointments.filter((a) => a.status === "CONFIRMED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    noShows: appointments.filter((a) => a.status === "NO_SHOW").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
  };

  return {
    appointments,
    summary,
    period: { start, end, view },
  };
}

// ============================================================================
// DAILY VIEW
// ============================================================================

/**
 * Lista agendamentos do dia com informações extras
 */
export async function getTherapistDailyAppointments(
  userId: string,
  dateStr?: string,
) {
  const therapist = await getTherapistByUserId(userId);

  const date = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  date.setHours(0, 0, 0, 0);

  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: {
      therapistId: therapist.id,
      startAt: { gte: dayStart, lt: dayEnd },
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] },
    },
    orderBy: { startAt: "asc" },
    include: appointmentInclude,
  });

  const now = new Date();

  // Encontrar próximo agendamento pendente
  const nextAppointment = appointments.find(
    (a) =>
      a.startAt > now && (a.status === "PENDING" || a.status === "CONFIRMED"),
  );

  // Tempo até o próximo agendamento (em minutos)
  const minutesUntilNext = nextAppointment
    ? Math.round((nextAppointment.startAt.getTime() - now.getTime()) / 60000)
    : null;

  // Resumo
  const summary = {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    pending: appointments.filter(
      (a) => a.status === "PENDING" || a.status === "CONFIRMED",
    ).length,
    noShows: appointments.filter((a) => a.status === "NO_SHOW").length,
  };

  return {
    date: dayStart.toISOString().split("T")[0],
    appointments,
    nextAppointment: nextAppointment
      ? {
          ...nextAppointment,
          minutesUntilStart: minutesUntilNext,
        }
      : null,
    summary,
  };
}

// ============================================================================
// CHECK-IN (REGISTRO DE PRESENÇA)
// ============================================================================

/**
 * Registra presença ou ausência de um agendamento
 */
export async function checkInAppointment(
  appointmentId: string,
  userId: string,
  data: CheckInInput,
) {
  const therapist = await getTherapistByUserId(userId);

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      employee: {
        select: { id: true, name: true, email: true, tenantId: true },
      },
      program: {
        select: { id: true, name: true, sessionDurationMinutes: true },
      },
      location: { select: { id: true, name: true } },
      tenant: { select: { id: true, name: true } },
    },
  });

  if (!appointment) {
    throw new TherapistAppointmentError(
      "NOT_FOUND",
      "Agendamento não encontrado",
    );
  }

  // Verificar se o agendamento pertence ao terapeuta
  if (appointment.therapistId !== therapist.id) {
    throw new TherapistAppointmentError(
      "UNAUTHORIZED",
      "Este agendamento não pertence a você",
    );
  }

  // Verificar se o agendamento está em status válido para check-in
  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    throw new TherapistAppointmentError(
      "ALREADY_CHECKED_IN",
      "Este agendamento já foi finalizado ou cancelado",
    );
  }

  // Verificar se o horário já chegou (não pode fazer check-in antes do horário)
  const now = new Date();
  // Tolerância: permite check-in 5 minutos antes do horário agendado
  const earliestCheckIn = new Date(
    appointment.startAt.getTime() - 5 * 60 * 1000,
  );

  if (now < earliestCheckIn) {
    throw new TherapistAppointmentError(
      "TOO_EARLY",
      "Ainda não é possível registrar presença. Aguarde o horário do agendamento.",
    );
  }

  // Para NO_SHOW, verificar se já passou do horário + tolerância (15 min)
  if (data.status === "NO_SHOW") {
    const noShowThreshold = new Date(
      appointment.startAt.getTime() + 15 * 60 * 1000,
    );

    if (now < noShowThreshold) {
      const minutesRemaining = Math.ceil(
        (noShowThreshold.getTime() - now.getTime()) / 60000,
      );
      throw new TherapistAppointmentError(
        "TOO_EARLY",
        `Aguarde mais ${minutesRemaining} minuto(s) de tolerância antes de marcar ausência`,
      );
    }
  }

  // Atualizar status do agendamento
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: data.status,
    },
    include: appointmentInclude,
  });

  // Log de ação
  if (data.status === "NO_SHOW") {
    // Contar no-shows do funcionário
    const noShowCount = await prisma.appointment.count({
      where: {
        employeeId: appointment.employeeId,
        status: "NO_SHOW",
      },
    });

    console.log(
      `[CHECK-IN] No-show registrado para ${appointment.employee.name} ` +
        `(${appointment.employee.email}). Total no-shows: ${noShowCount}`,
    );

    // Se >= 3 no-shows, log de bloqueio (TODO: implementar bloqueio real)
    if (noShowCount >= 3) {
      console.log(
        `[ALERT] Funcionário ${appointment.employee.name} atingiu ${noShowCount} ausências. ` +
          `Considerar bloqueio de 15 dias.`,
      );
    }

    // TODO: Notificar funcionário e TENANT_ADMIN sobre no-show
    console.log(
      `[EMAIL] Notificação de ausência para ${appointment.employee.email}`,
    );
  } else {
    console.log(
      `[CHECK-IN] Presença confirmada para ${appointment.employee.name} ` +
        `no agendamento ${appointment.code}`,
    );
  }

  return {
    ...updated,
    notes: data.notes || null,
  };
}

// ============================================================================
// APPOINTMENT DETAILS (THERAPIST VIEW)
// ============================================================================

/**
 * Retorna detalhes de um agendamento para o terapeuta
 */
export async function getTherapistAppointmentById(
  appointmentId: string,
  userId: string,
) {
  const therapist = await getTherapistByUserId(userId);

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      ...appointmentInclude,
      slot: {
        select: {
          id: true,
          slotDate: true,
          startTime: true,
          endTime: true,
          capacity: true,
          reserved: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new TherapistAppointmentError(
      "NOT_FOUND",
      "Agendamento não encontrado",
    );
  }

  if (appointment.therapistId !== therapist.id) {
    throw new TherapistAppointmentError(
      "UNAUTHORIZED",
      "Este agendamento não pertence a você",
    );
  }

  // Verificar se pode fazer check-in
  const now = new Date();
  const earliestCheckIn = new Date(
    appointment.startAt.getTime() - 5 * 60 * 1000,
  );
  const canCheckIn =
    ["PENDING", "CONFIRMED"].includes(appointment.status) &&
    now >= earliestCheckIn;

  // Verificar se pode marcar no-show (após 15 min de tolerância)
  const noShowThreshold = new Date(
    appointment.startAt.getTime() + 15 * 60 * 1000,
  );
  const canMarkNoShow =
    ["PENDING", "CONFIRMED"].includes(appointment.status) &&
    now >= noShowThreshold;

  // Histórico de agendamentos do mesmo funcionário com este terapeuta
  const employeeHistory = await prisma.appointment.count({
    where: {
      employeeId: appointment.employeeId,
      therapistId: therapist.id,
      status: "COMPLETED",
      id: { not: appointmentId },
    },
  });

  const employeeNoShows = await prisma.appointment.count({
    where: {
      employeeId: appointment.employeeId,
      status: "NO_SHOW",
    },
  });

  return {
    ...appointment,
    canCheckIn,
    canMarkNoShow,
    employeeStats: {
      previousSessionsWithTherapist: employeeHistory,
      totalNoShows: employeeNoShows,
    },
  };
}

// ============================================================================
// HISTORY
// ============================================================================

/**
 * Lista histórico de atendimentos do terapeuta com estatísticas
 */
export async function getTherapistHistory(
  userId: string,
  query: TherapistHistoryQuery,
): Promise<{
  data: PaginatedResponse<Record<string, unknown>>;
  stats: {
    totalCompleted: number;
    totalNoShows: number;
    totalCancelled: number;
    attendanceRate: number;
    totalByMonth: Array<{ month: string; count: number }>;
  };
}> {
  const therapist = await getTherapistByUserId(userId);

  const {
    page,
    limit,
    tenantId,
    locationId,
    programId,
    status,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    therapistId: therapist.id,
    // Histórico = apenas sessões passadas ou finalizadas
    OR: [
      { status: { in: ["COMPLETED", "NO_SHOW", "CANCELLED"] } },
      { startAt: { lt: new Date() } },
    ],
  };

  if (tenantId) where.tenantId = tenantId;
  if (locationId) where.locationId = locationId;
  if (programId) where.programId = programId;

  if (status && status !== "all") {
    where.status = status;
    // Remover o OR genérico se filtrando por status específico
    delete where.OR;
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate + "T00:00:00");
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59");
    where.startAt = dateFilter;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: appointmentInclude,
    }),
    prisma.appointment.count({ where }),
  ]);

  // Estatísticas globais do terapeuta (sem filtros de período)
  const [totalCompleted, totalNoShows, totalCancelled] = await Promise.all([
    prisma.appointment.count({
      where: { therapistId: therapist.id, status: "COMPLETED" },
    }),
    prisma.appointment.count({
      where: { therapistId: therapist.id, status: "NO_SHOW" },
    }),
    prisma.appointment.count({
      where: { therapistId: therapist.id, status: "CANCELLED" },
    }),
  ]);

  const attendanceRate =
    totalCompleted + totalNoShows > 0
      ? Math.round((totalCompleted / (totalCompleted + totalNoShows)) * 100)
      : 100;

  // Atendimentos por mês (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyAppointments = await prisma.appointment.findMany({
    where: {
      therapistId: therapist.id,
      status: "COMPLETED",
      startAt: { gte: sixMonthsAgo },
    },
    select: { startAt: true },
    orderBy: { startAt: "asc" },
  });

  // Agrupar por mês
  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }

  for (const appt of monthlyAppointments) {
    const key = `${appt.startAt.getFullYear()}-${String(appt.startAt.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }

  const totalByMonth = Array.from(monthlyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    data: {
      data: appointments.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        startAt: a.startAt,
        endAt: a.endAt,
        status: a.status,
        code: a.code,
        createdAt: a.createdAt,
        employee: a.employee,
        therapist: {
          id: a.therapist.id,
          name: a.therapist.name,
          specialties: a.therapist.specialties,
        },
        location: a.location,
        program: a.program,
        tenant: a.tenant,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      totalCompleted,
      totalNoShows,
      totalCancelled,
      attendanceRate,
      totalByMonth,
    },
  };
}

// ============================================================================
// THERAPIST FILTER OPTIONS
// ============================================================================

/**
 * Retorna opções de filtro para o terapeuta (tenants, locations, programs)
 */
export async function getTherapistFilterOptions(userId: string) {
  const therapist = await getTherapistByUserId(userId);

  // Tenants vinculados
  const assignments = await prisma.therapistAssignment.findMany({
    where: {
      therapistId: therapist.id,
      active: true,
    },
    include: {
      tenant: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
    },
  });

  // Agrupar locations por tenant
  const tenantMap = new Map<
    string,
    {
      id: string;
      name: string;
      locations: Array<{ id: string; name: string }>;
    }
  >();

  for (const a of assignments) {
    if (!tenantMap.has(a.tenant.id)) {
      tenantMap.set(a.tenant.id, {
        id: a.tenant.id,
        name: a.tenant.name,
        locations: [],
      });
    }
    tenantMap.get(a.tenant.id)!.locations.push({
      id: a.location.id,
      name: a.location.name,
    });
  }

  const tenants = Array.from(tenantMap.values());

  // Programas dos tenants vinculados
  const tenantIds = tenants.map((t) => t.id);
  const programs = await prisma.program.findMany({
    where: {
      tenantId: { in: tenantIds },
      active: true,
    },
    select: {
      id: true,
      name: true,
      tenantId: true,
      sessionDurationMinutes: true,
    },
    orderBy: { name: "asc" },
  });

  return {
    tenants,
    programs,
  };
}
