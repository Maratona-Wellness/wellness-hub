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
// TENANT ADMIN DASHBOARD
// ============================================================================

/**
 * Retorna dados do dashboard para TENANT_ADMIN
 */
export async function getTenantAdminDashboard(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, active: true },
  });

  if (!tenant) {
    throw new AdminDashboardError("TENANT_NOT_FOUND", "Empresa não encontrada");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  // KPIs principais
  const [
    totalEmployees,
    activeEmployees,
    appointmentsThisMonth,
    completedThisMonth,
    cancelledThisMonth,
    noShowsThisMonth,
    pendingThisMonth,
    totalAppointments,
    totalLocations,
    totalPrograms,
    totalTherapists,
  ] = await Promise.all([
    prisma.employee.count({ where: { ...withTenantScope(tenantId) } }),
    prisma.employee.count({
      where: { ...withTenantScope(tenantId), active: true },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: "CANCELLED",
      },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: "NO_SHOW",
      },
    }),
    prisma.appointment.count({
      where: {
        ...withTenantScope(tenantId),
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.appointment.count({ where: { ...withTenantScope(tenantId) } }),
    prisma.location.count({ where: { ...withTenantScope(tenantId) } }),
    prisma.program.count({
      where: { ...withTenantScope(tenantId), active: true },
    }),
    prisma.therapistAssignment.count({
      where: { ...withTenantScope(tenantId), active: true },
    }),
  ]);

  const noShowRate =
    completedThisMonth + noShowsThisMonth > 0
      ? Math.round(
          (noShowsThisMonth / (completedThisMonth + noShowsThisMonth)) * 100,
        )
      : 0;

  const utilizationRate =
    appointmentsThisMonth > 0
      ? Math.round((completedThisMonth / appointmentsThisMonth) * 100)
      : 0;

  // Agendamentos por programa (este mês)
  const appointmentsByProgram = await prisma.appointment.groupBy({
    by: ["programId"],
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: startOfMonth, lte: endOfMonth },
    },
    _count: { id: true },
  });

  const programs = await prisma.program.findMany({
    where: { ...withTenantScope(tenantId) },
    select: { id: true, name: true },
  });

  const programMap = new Map(programs.map((p) => [p.id, p.name]));

  const byProgram = appointmentsByProgram.map((item) => ({
    programId: item.programId,
    programName: programMap.get(item.programId) || "Desconhecido",
    count: item._count.id,
  }));

  // Agendamentos por localização (este mês)
  const appointmentsByLocation = await prisma.appointment.groupBy({
    by: ["locationId"],
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: startOfMonth, lte: endOfMonth },
    },
    _count: { id: true },
  });

  const locations = await prisma.location.findMany({
    where: { ...withTenantScope(tenantId) },
    select: { id: true, name: true },
  });

  const locationMap = new Map(locations.map((l) => [l.id, l.name]));

  const byLocation = appointmentsByLocation.map((item) => ({
    locationId: item.locationId,
    locationName: locationMap.get(item.locationId) || "Desconhecido",
    count: item._count.id,
  }));

  // Timeline dos últimos 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyAppointments = await prisma.appointment.findMany({
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: sixMonthsAgo },
      status: {
        in: ["COMPLETED", "NO_SHOW", "CANCELLED", "PENDING", "CONFIRMED"],
      },
    },
    select: { startAt: true, status: true },
    orderBy: { startAt: "asc" },
  });

  const monthlyMap = new Map<
    string,
    { total: number; completed: number; cancelled: number; noShows: number }
  >();

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { total: 0, completed: 0, cancelled: 0, noShows: 0 });
  }

  for (const appt of monthlyAppointments) {
    const key = `${appt.startAt.getFullYear()}-${String(appt.startAt.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthlyMap.get(key);
    if (entry) {
      entry.total++;
      if (appt.status === "COMPLETED") entry.completed++;
      if (appt.status === "CANCELLED") entry.cancelled++;
      if (appt.status === "NO_SHOW") entry.noShows++;
    }
  }

  const timeline = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));

  // Top usuários (funcionários com mais agendamentos este mês)
  const topUsersRaw = await prisma.appointment.groupBy({
    by: ["employeeId"],
    where: {
      ...withTenantScope(tenantId),
      startAt: { gte: startOfMonth, lte: endOfMonth },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const topEmployeeIds = topUsersRaw.map((u) => u.employeeId);
  const topEmployees = await prisma.employee.findMany({
    where: { id: { in: topEmployeeIds } },
    select: { id: true, name: true, email: true },
  });

  const employeeMap = new Map(topEmployees.map((e) => [e.id, e]));

  const topUsers = topUsersRaw.map((item) => ({
    employee: employeeMap.get(item.employeeId) || {
      id: item.employeeId,
      name: "Desconhecido",
      email: "",
    },
    count: item._count.id,
  }));

  // Atividade recente (últimos 10 agendamentos)
  const recentActivity = await prisma.appointment.findMany({
    where: { ...withTenantScope(tenantId) },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      employee: { select: { id: true, name: true } },
      therapist: { select: { id: true, name: true } },
      program: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
    },
  });

  return {
    tenant: { id: tenant.id, name: tenant.name },
    kpis: {
      totalEmployees,
      activeEmployees,
      appointmentsThisMonth,
      completedThisMonth,
      cancelledThisMonth,
      noShowsThisMonth,
      pendingThisMonth,
      totalAppointments,
      totalLocations,
      totalPrograms,
      totalTherapists,
      noShowRate,
      utilizationRate,
    },
    byProgram,
    byLocation,
    timeline,
    topUsers,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      code: a.code,
      status: a.status,
      startAt: a.startAt,
      createdAt: a.createdAt,
      employee: a.employee,
      therapist: a.therapist,
      program: a.program,
      location: a.location,
    })),
  };
}

// ============================================================================
// SUPER ADMIN DASHBOARD
// ============================================================================

/**
 * Retorna dados do dashboard global para SUPER_ADMIN
 */
export async function getSuperAdminDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

  // KPIs globais
  const [
    totalTenants,
    activeTenants,
    totalEmployees,
    activeEmployees,
    totalTherapists,
    activeTherapists,
    totalAppointments,
    appointmentsThisMonth,
    completedThisMonth,
    cancelledThisMonth,
    noShowsThisMonth,
    totalLocations,
    totalPrograms,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { active: true } }),
    prisma.employee.count(),
    prisma.employee.count({ where: { active: true } }),
    prisma.therapist.count(),
    prisma.therapist.count({ where: { active: true } }),
    prisma.appointment.count(),
    prisma.appointment.count({
      where: { startAt: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.appointment.count({
      where: {
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: "COMPLETED",
      },
    }),
    prisma.appointment.count({
      where: {
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: "CANCELLED",
      },
    }),
    prisma.appointment.count({
      where: {
        startAt: { gte: startOfMonth, lte: endOfMonth },
        status: "NO_SHOW",
      },
    }),
    prisma.location.count(),
    prisma.program.count({ where: { active: true } }),
  ]);

  const noShowRate =
    completedThisMonth + noShowsThisMonth > 0
      ? Math.round(
          (noShowsThisMonth / (completedThisMonth + noShowsThisMonth)) * 100,
        )
      : 0;

  // Agendamentos por tenant (este mês)
  const appointmentsByTenant = await prisma.appointment.groupBy({
    by: ["tenantId"],
    where: { startAt: { gte: startOfMonth, lte: endOfMonth } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const tenantIds = appointmentsByTenant.map((t) => t.tenantId);
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true },
  });

  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  const byTenant = appointmentsByTenant.map((item) => ({
    tenantId: item.tenantId,
    tenantName: tenantMap.get(item.tenantId) || "Desconhecido",
    count: item._count.id,
  }));

  // Timeline de crescimento (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyAppointments = await prisma.appointment.findMany({
    where: { startAt: { gte: sixMonthsAgo } },
    select: { startAt: true },
    orderBy: { startAt: "asc" },
  });

  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }

  for (const appt of monthlyAppointments) {
    const key = `${appt.startAt.getFullYear()}-${String(appt.startAt.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
  }

  const timeline = Array.from(monthlyMap.entries()).map(([month, count]) => ({
    month,
    count,
  }));

  // Crescimento de usuários (employees por mês)
  const monthlyUsers = await prisma.employee.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const userGrowthMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    userGrowthMap.set(key, 0);
  }

  for (const user of monthlyUsers) {
    const key = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, "0")}`;
    userGrowthMap.set(key, (userGrowthMap.get(key) || 0) + 1);
  }

  const userGrowth = Array.from(userGrowthMap.entries()).map(
    ([month, count]) => ({ month, count }),
  );

  // Tenants recentes
  const recentTenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      _count: {
        select: { employees: true, appointments: true },
      },
    },
  });

  // Alertas do sistema
  const alerts: Array<{ type: "warning" | "error" | "info"; message: string }> =
    [];

  // Tenants inativos
  const inactiveTenants = await prisma.tenant.count({
    where: { active: false },
  });
  if (inactiveTenants > 0) {
    alerts.push({
      type: "warning",
      message: `${inactiveTenants} empresa(s) inativa(s) na plataforma`,
    });
  }

  // Terapeutas inativos
  const inactiveTherapists = await prisma.therapist.count({
    where: { active: false },
  });
  if (inactiveTherapists > 0) {
    alerts.push({
      type: "info",
      message: `${inactiveTherapists} terapeuta(s) inativo(s)`,
    });
  }

  // No-show rate alto
  if (noShowRate > 15) {
    alerts.push({
      type: "error",
      message: `Taxa de ausência acima de 15% este mês (${noShowRate}%)`,
    });
  }

  return {
    kpis: {
      totalTenants,
      activeTenants,
      totalEmployees,
      activeEmployees,
      totalTherapists,
      activeTherapists,
      totalAppointments,
      appointmentsThisMonth,
      completedThisMonth,
      cancelledThisMonth,
      noShowsThisMonth,
      totalLocations,
      totalPrograms,
      noShowRate,
    },
    byTenant,
    timeline,
    userGrowth,
    recentTenants: recentTenants.map((t) => ({
      id: t.id,
      name: t.name,
      domain: t.domain,
      active: t.active,
      createdAt: t.createdAt,
      employeeCount: t._count.employees,
      appointmentCount: t._count.appointments,
    })),
    alerts,
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
