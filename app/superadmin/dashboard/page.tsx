"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Stethoscope,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  BarChart3,
  Activity,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Alert } from "@/components/molecules/Alert";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface TenantStat {
  tenantId: string;
  tenantName: string;
  employees: number;
  appointments: number;
  completed: number;
}

interface TimelineItem {
  month: string;
  total: number;
  completed: number;
}

interface UserGrowthItem {
  month: string;
  newUsers: number;
}

interface RecentTenant {
  id: string;
  name: string;
  plan: string;
  employeeCount: number;
  createdAt: string;
}

interface SystemAlert {
  type: string;
  message: string;
  severity: "warning" | "error" | "info";
}

interface SuperAdminDashboardData {
  kpis: {
    totalTenants: number;
    activeTenants: number;
    totalEmployees: number;
    totalTherapists: number;
    totalAppointments: number;
    completedAppointments: number;
    globalCompletionRate: number;
  };
  byTenant: TenantStat[];
  timeline: TimelineItem[];
  userGrowth: UserGrowthItem[];
  recentTenants: RecentTenant[];
  alerts: SystemAlert[];
}

// ============================================================================
// HELPERS
// ============================================================================

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const abbr = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${abbr[parseInt(month) - 1]}/${year.slice(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();

        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Erro ao carregar dashboard");
        }
      } catch {
        setError("Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error || !data) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <Alert variant="error" title="Erro">
            {error || "Não foi possível carregar os dados"}
          </Alert>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const kpis = [
    {
      label: "Empresas Ativas",
      value: data.kpis.activeTenants,
      total: data.kpis.totalTenants,
      icon: Building2,
      color: "text-(--color-accent)",
    },
    {
      label: "Funcionários",
      value: data.kpis.totalEmployees,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Terapeutas",
      value: data.kpis.totalTherapists,
      icon: Stethoscope,
      color: "text-green-500",
    },
    {
      label: "Agendamentos",
      value: data.kpis.totalAppointments,
      icon: CalendarCheck,
      color: "text-purple-500",
    },
    {
      label: "Concluídos",
      value: data.kpis.completedAppointments,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      label: "Taxa Global",
      value: `${data.kpis.globalCompletionRate.toFixed(1)}%`,
      icon: Activity,
      color: "text-orange-500",
    },
  ];

  const maxTenantAppt = Math.max(
    ...data.byTenant.map((t) => t.appointments),
    1,
  );
  const maxTimelineTotal = Math.max(...data.timeline.map((t) => t.total), 1);
  const maxUserGrowth = Math.max(...data.userGrowth.map((u) => u.newUsers), 1);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <Text variant="h2">Painel Super Admin</Text>
            <Text className="text-gray-500 mt-1">
              Visão global da plataforma Wellness Hub
            </Text>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((alert, idx) => (
                <Alert
                  key={idx}
                  variant={
                    alert.severity === "error"
                      ? "error"
                      : alert.severity === "warning"
                        ? "warning"
                        : "info"
                  }
                  title={alert.type}
                >
                  {alert.message}
                </Alert>
              ))}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="pt-4 text-center">
                  <kpi.icon className={`h-6 w-6 ${kpi.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-(--color-secondary)">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                  {"total" in kpi && kpi.total && (
                    <p className="text-xs text-gray-400">
                      de {kpi.total} total
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <BarChart3 className="h-5 w-5 inline mr-2" />
                  Atendimentos (6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.timeline.length === 0 ? (
                  <EmptyState
                    icon={<BarChart3 />}
                    title="Sem dados"
                    description="Nenhum dado de atendimentos ainda"
                  />
                ) : (
                  <div className="space-y-3">
                    {data.timeline.map((item) => (
                      <div key={item.month} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {formatMonthLabel(item.month)}
                        </span>
                        <div className="flex-1 flex gap-1 h-5">
                          <div
                            className="bg-green-500 h-full rounded-l"
                            style={{
                              width: `${(item.completed / maxTimelineTotal) * 100}%`,
                            }}
                            title={`Concluídos: ${item.completed}`}
                          />
                          {item.total - item.completed > 0 && (
                            <div
                              className="bg-gray-300 h-full rounded-r"
                              style={{
                                width: `${((item.total - item.completed) / maxTimelineTotal) * 100}%`,
                              }}
                              title={`Outros: ${item.total - item.completed}`}
                            />
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-8 text-right">
                          {item.total}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Growth */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <TrendingUp className="h-5 w-5 inline mr-2" />
                  Crescimento de Usuários
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.userGrowth.length === 0 ? (
                  <EmptyState
                    icon={<Users />}
                    title="Sem dados"
                    description="Nenhum dado de crescimento ainda"
                  />
                ) : (
                  <div className="space-y-3">
                    {data.userGrowth.map((item) => (
                      <div key={item.month} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16 text-right">
                          {formatMonthLabel(item.month)}
                        </span>
                        <div className="flex-1 h-5">
                          <div
                            className="bg-blue-500 h-full rounded"
                            style={{
                              width: `${(item.newUsers / maxUserGrowth) * 100}%`,
                              minWidth: item.newUsers > 0 ? "4px" : "0",
                            }}
                            title={`Novos: ${item.newUsers}`}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-8 text-right">
                          {item.newUsers}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* By Tenant */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Building2 className="h-5 w-5 inline mr-2" />
                Comparativo por Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.byTenant.length === 0 ? (
                <EmptyState
                  icon={<Building2 />}
                  title="Sem empresas"
                  description="Nenhuma empresa cadastrada"
                />
              ) : (
                <div className="space-y-4">
                  {data.byTenant.map((tenant) => {
                    const rate =
                      tenant.appointments > 0
                        ? (
                            (tenant.completed / tenant.appointments) *
                            100
                          ).toFixed(0)
                        : "0";
                    return (
                      <div key={tenant.tenantId} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-(--color-secondary)">
                              {tenant.tenantName}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {tenant.employees} func.
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {tenant.completed}/{tenant.appointments} ({rate}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-(--color-accent) h-2 rounded-full transition-all"
                            style={{
                              width: `${(tenant.appointments / maxTenantAppt) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Tenants */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Clock className="h-5 w-5 inline mr-2" />
                  Empresas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentTenants.length === 0 ? (
                  <EmptyState
                    icon={<Building2 />}
                    title="Sem dados"
                    description="Nenhuma empresa recente"
                  />
                ) : (
                  <div className="space-y-3">
                    {data.recentTenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-(--color-secondary)">
                            {tenant.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(tenant.createdAt)} ·{" "}
                            {tenant.employeeCount} func.
                          </p>
                        </div>
                        <Badge variant="info">{tenant.plan}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    className="justify-start h-auto py-3"
                    onClick={() =>
                      (window.location.href = "/superadmin/tenants")
                    }
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Empresas
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start h-auto py-3"
                    onClick={() =>
                      (window.location.href = "/superadmin/therapists")
                    }
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Terapeutas
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start h-auto py-3"
                    onClick={() => (window.location.href = "/superadmin/logs")}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Logs de Acesso
                  </Button>
                  <Button
                    variant="secondary"
                    className="justify-start h-auto py-3"
                    onClick={() =>
                      (window.location.href = "/superadmin/settings")
                    }
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
