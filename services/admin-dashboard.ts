import { prisma } from "@/lib/db/prisma";
import { withTenantScope } from "@/lib/utils/tenant-access";

// ============================================================================
// ERROR CLASS
// ============================================================================

export type AdminDashboardErrorCode =
  | "TENANT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR";

export class AdminDashboardError extends Error {
  code: AdminDashboardErrorCode;

  constructor(code: AdminDashboardErrorCode, message: string) {
    super(message);
    this.name = "AdminDashboardError";
    this.code = code;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Helper: gera mapa de datas para período (YYYY-MM-DD)
 */
function buildDailyDateMap(days: number): Map<string, number> {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    map.set(key, 0);
  }
  return map;
}

function dateToKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ============================================================================
// TENANT ADMIN DASHBOARD
// ============================================================================

/**
 * Retorna dados do dashboard para TENANT_ADMIN
 * @param days Período em dias para os gráficos (7, 15 ou 30)
 */
export async function getTenantAdminDashboard(
  tenantId: string,
  days: number = 30,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, active: true },
  });

  if (!tenant) {
    throw new AdminDashboardError("TENANT_NOT_FOUND", "Empresa não encontrada");
  }

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days + 1);
  periodStart.setHours(0, 0, 0, 0);

  // Buscar userIds dos employees do tenant para contar acessos
  const tenantEmployeeUserIds = await prisma.employee.findMany({
    where: { ...withTenantScope(tenantId), userId: { not: null } },
    select: { userId: true },
  });
  const userIds = tenantEmployeeUserIds
    .map((e) => e.userId)
    .filter((id): id is string => id !== null);

  // Buscar userIds dos tenant_admins do tenant
  const tenantAdminRoles = await prisma.userRole.findMany({
    where: {
      tenantId,
      role: { roleName: "TENANT_ADMIN" },
    },
    select: { userId: true },
  });
  const adminUserIds = tenantAdminRoles.map((r) => r.userId);
  const allTenantUserIds = [...new Set([...userIds, ...adminUserIds])];

  // Big Numbers
  const [totalEmployees, totalAccesses, totalAppointments] = await Promise.all([
    prisma.employee.count({ where: { ...withTenantScope(tenantId) } }),
    allTenantUserIds.length > 0
      ? prisma.authLog.count({
          where: { outcome: "SUCCESS", userId: { in: allTenantUserIds } },
        })
      : Promise.resolve(0),
    prisma.appointment.count({ where: { ...withTenantScope(tenantId) } }),
  ]);

  const conversionRate =
    totalAccesses > 0
      ? Math.round((totalAppointments / totalAccesses) * 100 * 10) / 10
      : 0;

  // ============================================================
  // Chart 1: Agendamentos por Dia (empilhado por status)
  // ============================================================
  const appointmentsInPeriod = await prisma.appointment.findMany({
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: periodStart },
    },
    select: { startAt: true, status: true },
    orderBy: { startAt: "asc" },
  });

  const dailyDates = Array.from(buildDailyDateMap(days).keys());
  const appointmentsDailyAgg = new Map<
    string,
    { completed: number; cancelled: number; scheduled: number }
  >();
  for (const dateKey of dailyDates) {
    appointmentsDailyAgg.set(dateKey, {
      completed: 0,
      cancelled: 0,
      scheduled: 0,
    });
  }
  for (const appt of appointmentsInPeriod) {
    const dateKey = dateToKey(appt.startAt);
    const entry = appointmentsDailyAgg.get(dateKey);
    if (entry) {
      if (appt.status === "COMPLETED") entry.completed++;
      else if (appt.status === "CANCELLED") entry.cancelled++;
      else entry.scheduled++;
    }
  }

  const appointmentsChart = dailyDates.map((date) => ({
    date,
    ...appointmentsDailyAgg.get(date)!,
  }));

  // ============================================================
  // Chart 2: Acessos Diários dos Funcionários do Tenant
  // ============================================================
  const accessLogs =
    allTenantUserIds.length > 0
      ? await prisma.authLog.findMany({
          where: {
            outcome: "SUCCESS",
            userId: { in: allTenantUserIds },
            createdAt: { gte: periodStart },
          },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const dailyAccessMap = buildDailyDateMap(days);
  for (const log of accessLogs) {
    const key = dateToKey(log.createdAt);
    if (dailyAccessMap.has(key)) {
      dailyAccessMap.set(key, (dailyAccessMap.get(key) || 0) + 1);
    }
  }

  const dailyAccessesChart = Array.from(dailyAccessMap.entries()).map(
    ([date, count]) => ({
      date,
      accesses: count,
    }),
  );

  // ============================================================
  // Chart 3: Taxa de Conversão Diária (agendamentos / acessos por dia)
  // ============================================================
  const conversionChart = dailyDates.map((date) => {
    const apptData = appointmentsDailyAgg.get(date);
    const totalApptDay = apptData
      ? apptData.completed + apptData.cancelled + apptData.scheduled
      : 0;
    const accessDay = dailyAccessMap.get(date) || 0;
    const rate =
      accessDay > 0
        ? Math.round((totalApptDay / accessDay) * 100 * 10) / 10
        : 0;

    return {
      date,
      rate,
      appointments: totalApptDay,
      accesses: accessDay,
    };
  });

  return {
    tenant: { id: tenant.id, name: tenant.name },
    bigNumbers: {
      totalEmployees,
      totalAccesses,
      totalAppointments,
      conversionRate,
    },
    charts: {
      appointmentsDaily: appointmentsChart,
      dailyAccesses: dailyAccessesChart,
      conversionDaily: conversionChart,
    },
    period: days,
  };
}

// ============================================================================
// SUPER ADMIN DASHBOARD
// ============================================================================

/**
 * Retorna dados do dashboard global para SUPER_ADMIN
 * @param days Período em dias para os gráficos (7, 15 ou 30)
 */
export async function getSuperAdminDashboard(days: number = 30) {
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days + 1);
  periodStart.setHours(0, 0, 0, 0);

  // Big Numbers — KPIs globais
  const [activeTenants, totalEmployees, totalAccesses, totalAppointments] =
    await Promise.all([
      prisma.tenant.count({ where: { active: true } }),
      prisma.employee.count(),
      prisma.authLog.count({ where: { outcome: "SUCCESS" } }),
      prisma.appointment.count(),
    ]);

  // ============================================================
  // Chart 1: Agendamentos por Tenant por Dia (empilhado por status)
  // ============================================================
  const appointmentsInPeriod = await prisma.appointment.findMany({
    where: { startAt: { gte: periodStart } },
    select: { tenantId: true, startAt: true, status: true },
    orderBy: { startAt: "asc" },
  });

  // Buscar nomes dos tenants
  const allTenantIds = [
    ...new Set(appointmentsInPeriod.map((a) => a.tenantId)),
  ];
  const tenantsData = await prisma.tenant.findMany({
    where: { id: { in: allTenantIds } },
    select: { id: true, name: true },
  });
  const tenantNameMap = new Map(tenantsData.map((t) => [t.id, t.name]));

  // Montar dados diários por tenant
  const dailyDates = Array.from(buildDailyDateMap(days).keys());
  const appointmentsByTenantDaily: Array<{
    date: string;
    tenant: string;
    completed: number;
    cancelled: number;
    scheduled: number;
  }> = [];

  // Agrupar por date+tenant
  const dailyTenantMap = new Map<
    string,
    { completed: number; cancelled: number; scheduled: number }
  >();
  for (const appt of appointmentsInPeriod) {
    const dateKey = dateToKey(appt.startAt);
    const tenantName = tenantNameMap.get(appt.tenantId) || "Desconhecido";
    const compositeKey = `${dateKey}|${tenantName}`;

    if (!dailyTenantMap.has(compositeKey)) {
      dailyTenantMap.set(compositeKey, {
        completed: 0,
        cancelled: 0,
        scheduled: 0,
      });
    }
    const entry = dailyTenantMap.get(compositeKey)!;
    if (appt.status === "COMPLETED") entry.completed++;
    else if (appt.status === "CANCELLED") entry.cancelled++;
    else entry.scheduled++;
  }

  // Converter para formato flat para Recharts (uma linha por dia, colunas por status)
  const appointmentsDailyAgg = new Map<
    string,
    { completed: number; cancelled: number; scheduled: number }
  >();
  for (const dateKey of dailyDates) {
    appointmentsDailyAgg.set(dateKey, {
      completed: 0,
      cancelled: 0,
      scheduled: 0,
    });
  }
  for (const appt of appointmentsInPeriod) {
    const dateKey = dateToKey(appt.startAt);
    const entry = appointmentsDailyAgg.get(dateKey);
    if (entry) {
      if (appt.status === "COMPLETED") entry.completed++;
      else if (appt.status === "CANCELLED") entry.cancelled++;
      else entry.scheduled++;
    }
  }

  const appointmentsChart = dailyDates.map((date) => ({
    date,
    ...appointmentsDailyAgg.get(date)!,
  }));

  // ============================================================
  // Chart 2: Acessos Diários da Plataforma
  // ============================================================
  const accessLogs = await prisma.authLog.findMany({
    where: {
      outcome: "SUCCESS",
      createdAt: { gte: periodStart },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyAccessMap = buildDailyDateMap(days);
  for (const log of accessLogs) {
    const key = dateToKey(log.createdAt);
    if (dailyAccessMap.has(key)) {
      dailyAccessMap.set(key, (dailyAccessMap.get(key) || 0) + 1);
    }
  }

  const dailyAccessesChart = Array.from(dailyAccessMap.entries()).map(
    ([date, count]) => ({
      date,
      accesses: count,
    }),
  );

  // ============================================================
  // Chart 3: Employees Cadastrados por Tenant
  // ============================================================
  const employeesByTenantRaw = await prisma.employee.groupBy({
    by: ["tenantId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 15,
  });

  const empTenantIds = employeesByTenantRaw.map((e) => e.tenantId);
  const empTenants = await prisma.tenant.findMany({
    where: { id: { in: empTenantIds } },
    select: { id: true, name: true },
  });
  const empTenantMap = new Map(empTenants.map((t) => [t.id, t.name]));

  const employeesByTenantChart = employeesByTenantRaw.map((item) => ({
    tenant: empTenantMap.get(item.tenantId) || "Desconhecido",
    employees: item._count.id,
  }));

  return {
    bigNumbers: {
      activeTenants,
      totalEmployees,
      totalAccesses,
      totalAppointments,
    },
    charts: {
      appointmentsDaily: appointmentsChart,
      dailyAccesses: dailyAccessesChart,
      employeesByTenant: employeesByTenantChart,
    },
    period: days,
  };
}

// ============================================================================
// TENANT ADMIN EMPLOYEES MANAGEMENT
// ============================================================================

export type EmployeeListQuery = {
  page: number;
  limit: number;
  search?: string;
  status?: "all" | "active" | "inactive";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

/**
 * Lista funcionários de um tenant com paginação e filtros
 */
export async function listTenantEmployees(
  tenantId: string,
  query: EmployeeListQuery,
) {
  const {
    page,
    limit,
    search,
    status,
    sortBy = "name",
    sortOrder = "asc",
  } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { ...withTenantScope(tenantId) };

  if (status === "active") {
    where.active = true;
  } else if (status === "inactive") {
    where.active = false;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            active: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    }),
    prisma.employee.count({ where }),
  ]);

  // Calcular estatísticas por funcionário
  const enrichedEmployees = await Promise.all(
    employees.map(async (emp) => {
      const [completedCount, noShowCount] = await Promise.all([
        prisma.appointment.count({
          where: { employeeId: emp.id, status: "COMPLETED" },
        }),
        prisma.appointment.count({
          where: { employeeId: emp.id, status: "NO_SHOW" },
        }),
      ]);

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        active: emp.active,
        userId: emp.userId,
        userActive: emp.user?.active ?? null,
        lastLoginAt: emp.user?.lastLoginAt ?? null,
        registeredAt: emp.user?.createdAt ?? emp.createdAt,
        totalAppointments: emp._count.appointments,
        completedAppointments: completedCount,
        noShows: noShowCount,
      };
    }),
  );

  return {
    data: enrichedEmployees,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Ativa ou desativa um funcionário
 */
export async function toggleEmployeeStatus(
  employeeId: string,
  tenantId: string,
) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, ...withTenantScope(tenantId) },
    include: { user: { select: { id: true, active: true } } },
  });

  if (!employee) {
    throw new AdminDashboardError(
      "TENANT_NOT_FOUND",
      "Funcionário não encontrado",
    );
  }

  const newStatus = !employee.active;

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: { active: newStatus },
    });

    if (employee.userId) {
      await tx.userAccount.update({
        where: { id: employee.userId },
        data: { active: newStatus },
      });
    }
  });

  return {
    id: employeeId,
    active: newStatus,
    message: newStatus
      ? "Funcionário ativado com sucesso"
      : "Funcionário desativado com sucesso",
  };
}

/**
 * Reseta a senha de um funcionário (gera uma nova senha temporária)
 */
export async function resetEmployeePassword(
  employeeId: string,
  tenantId: string,
) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, ...withTenantScope(tenantId) },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!employee) {
    throw new AdminDashboardError(
      "TENANT_NOT_FOUND",
      "Funcionário não encontrado",
    );
  }

  if (!employee.userId || !employee.user) {
    throw new AdminDashboardError(
      "VALIDATION_ERROR",
      "Funcionário não possui conta de usuário vinculada",
    );
  }

  // TODO: Gerar link de reset de senha e enviar por email
  // Por enquanto simular o envio
  console.log(
    `[EMAIL] Link de redefinição de senha enviado para ${employee.email}`,
  );

  return {
    success: true,
    message: `Link de redefinição de senha enviado para ${employee.email}`,
  };
}

// ============================================================================
// TENANT ADMIN REPORTS
// ============================================================================

/**
 * Retorna relatório mensal do tenant
 */
export async function getTenantMonthlyReport(
  tenantId: string,
  month: string, // YYYY-MM
) {
  const [year, monthNum] = month.split("-").map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, domain: true },
  });

  if (!tenant) {
    throw new AdminDashboardError("TENANT_NOT_FOUND", "Empresa não encontrada");
  }

  // Totais do mês
  const [total, completed, cancelled, noShows, pending] = await Promise.all([
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startDate, lte: endDate },
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startDate, lte: endDate },
        status: "CANCELLED",
      },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startDate, lte: endDate },
        status: "NO_SHOW",
      },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startDate, lte: endDate },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ]);

  // Agendamentos por dia do mês
  const dailyAppointments = await prisma.appointment.findMany({
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: startDate, lte: endDate },
    },
    select: { startAt: true, status: true },
    orderBy: { startAt: "asc" },
  });

  const dailyMap = new Map<string, { total: number; completed: number }>();
  const daysInMonth = endDate.getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const key = String(d).padStart(2, "0");
    dailyMap.set(key, { total: 0, completed: 0 });
  }

  for (const appt of dailyAppointments) {
    const key = String(appt.startAt.getDate()).padStart(2, "0");
    const entry = dailyMap.get(key);
    if (entry) {
      entry.total++;
      if (appt.status === "COMPLETED") entry.completed++;
    }
  }

  const dailyBreakdown = Array.from(dailyMap.entries()).map(([day, data]) => ({
    day: parseInt(day),
    ...data,
  }));

  // Por programa
  const byProgram = await prisma.appointment.groupBy({
    by: ["programId"],
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  });

  const programIds = byProgram.map((p) => p.programId);
  const programs = await prisma.program.findMany({
    where: { id: { in: programIds } },
    select: { id: true, name: true },
  });
  const programMap = new Map(programs.map((p) => [p.id, p.name]));

  // Por localização
  const byLocation = await prisma.appointment.groupBy({
    by: ["locationId"],
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  });

  const locationIds = byLocation.map((l) => l.locationId);
  const locations = await prisma.location.findMany({
    where: { id: { in: locationIds } },
    select: { id: true, name: true },
  });
  const locationMap = new Map(locations.map((l) => [l.id, l.name]));

  // Funcionários ativos no mês
  const activeEmployeesInMonth = await prisma.appointment.groupBy({
    by: ["employeeId"],
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: startDate, lte: endDate },
    },
  });

  const attendanceRate =
    completed + noShows > 0
      ? Math.round((completed / (completed + noShows)) * 100)
      : 100;

  return {
    tenant,
    period: { month, startDate, endDate },
    summary: {
      total,
      completed,
      cancelled,
      noShows,
      pending,
      attendanceRate,
      activeEmployees: activeEmployeesInMonth.length,
    },
    dailyBreakdown,
    byProgram: byProgram.map((p) => ({
      programName: programMap.get(p.programId) || "Desconhecido",
      count: p._count.id,
    })),
    byLocation: byLocation.map((l) => ({
      locationName: locationMap.get(l.locationId) || "Desconhecido",
      count: l._count.id,
    })),
  };
}

// ============================================================================
// SUPER ADMIN LOGS
// ============================================================================

export type LogsQuery = {
  page: number;
  limit: number;
  method?: string;
  outcome?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
};

/**
 * Lista logs de autenticação com filtros
 */
export async function listAuthLogs(query: LogsQuery) {
  const { page, limit, method, outcome, userId, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (method && method !== "all") {
    where.method = method;
  }

  if (outcome && outcome !== "all") {
    where.outcome = outcome;
  }

  if (userId) {
    where.userId = userId;
  }

  if (startDate || endDate) {
    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = new Date(startDate + "T00:00:00");
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59");
    where.createdAt = dateFilter;
  }

  const [logs, total] = await Promise.all([
    prisma.authLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true, displayName: true },
        },
      },
    }),
    prisma.authLog.count({ where }),
  ]);

  return {
    data: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email || null,
      userName: log.user?.displayName || null,
      method: log.method,
      outcome: log.outcome,
      reason: log.reason,
      ipAddress: log.ip,
      timestamp: log.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
