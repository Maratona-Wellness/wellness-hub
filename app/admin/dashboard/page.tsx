"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  TrendingUp,
  XCircle,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  UserCog,
  BarChart3,
  Settings,
  ArrowRight,
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
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface DashboardData {
  tenant: { id: string; name: string };
  kpis: {
    totalEmployees: number;
    activeEmployees: number;
    appointmentsThisMonth: number;
    completedThisMonth: number;
    cancelledThisMonth: number;
    noShowsThisMonth: number;
    pendingThisMonth: number;
    totalAppointments: number;
    totalLocations: number;
    totalPrograms: number;
    totalTherapists: number;
    noShowRate: number;
    utilizationRate: number;
  };
  byProgram: Array<{ programId: string; programName: string; count: number }>;
  byLocation: Array<{
    locationId: string;
    locationName: string;
    count: number;
  }>;
  timeline: Array<{
    month: string;
    total: number;
    completed: number;
    cancelled: number;
    noShows: number;
  }>;
  topUsers: Array<{
    employee: { id: string; name: string; email: string };
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    code: string;
    status: string;
    startAt: string;
    createdAt: string;
    employee: { id: string; name: string };
    therapist: { id: string; name: string };
    program: { id: string; name: string };
    location: { id: string; name: string };
  }>;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Concluído",
    NO_SHOW: "Ausência",
    CANCELLED: "Cancelado",
  };
  return labels[status] || status;
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "error" | "info" {
  const map: Record<string, "success" | "warning" | "error" | "info"> = {
    COMPLETED: "success",
    CONFIRMED: "info",
    PENDING: "warning",
    NO_SHOW: "error",
    CANCELLED: "error",
  };
  return map[status] || "info";
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TenantAdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/tenant-admin/dashboard");
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Erro ao carregar dashboard");
        return;
      }

      setData(json.data);
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
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
          <EmptyState
            icon={<XCircle />}
            title="Erro ao carregar dashboard"
            description={error || "Dados não disponíveis"}
            action={{
              label: "Tentar novamente",
              onClick: () => window.location.reload(),
            }}
          />
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const { kpis, byProgram, byLocation, timeline, topUsers, recentActivity } =
    data;

  const maxTimelineTotal = Math.max(...timeline.map((t) => t.total), 1);
  const maxProgramCount = Math.max(...byProgram.map((p) => p.count), 1);
  const maxLocationCount = Math.max(...byLocation.map((l) => l.count), 1);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Dashboard</Text>
              <Text className="text-gray-500 mt-1">
                Visão geral da {data.tenant.name}
              </Text>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/admin/employees")}
              >
                <Users className="h-4 w-4 mr-1" />
                Funcionários
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/admin/reports")}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Relatórios
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Funcionários</p>
                    <p className="text-2xl font-bold text-(--color-secondary)">
                      {kpis.activeEmployees}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Agend. Mês</p>
                    <p className="text-2xl font-bold text-(--color-secondary)">
                      {kpis.appointmentsThisMonth}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Concluídos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {kpis.completedThisMonth}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-50">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {kpis.pendingThisMonth}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ausências</p>
                    <p className="text-2xl font-bold text-red-600">
                      {kpis.noShowRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Utilização</p>
                    <p className="text-2xl font-bold text-teal-600">
                      {kpis.utilizationRate}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Chart */}
          {timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-(--color-accent)" />
                  Agendamentos por Mês (últimos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 h-40">
                  {timeline.map((item) => (
                    <div
                      key={item.month}
                      className="flex-1 flex flex-col items-center"
                    >
                      <span className="text-xs font-semibold text-gray-700 mb-1">
                        {item.total}
                      </span>
                      <div
                        className="w-full bg-(--color-accent) rounded-t-md transition-all duration-500 min-h-[4px]"
                        style={{
                          height: `${(item.total / maxTimelineTotal) * 100}%`,
                        }}
                      />
                      <span className="text-xs text-gray-500 mt-2">
                        {formatMonthLabel(item.month)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por Programa */}
            {byProgram.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-500" />
                    Agendamentos por Programa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {byProgram.map((item) => (
                      <div
                        key={item.programId}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm text-gray-700 w-32 truncate">
                          {item.programName}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(item.count / maxProgramCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Por Localização */}
            {byLocation.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Utilização por Localização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {byLocation.map((item) => (
                      <div
                        key={item.locationId}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm text-gray-700 w-32 truncate">
                          {item.locationName}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(item.count / maxLocationCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Usuários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Top Funcionários do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topUsers.length > 0 ? (
                  <div className="space-y-3">
                    {topUsers.map((item, idx) => (
                      <div
                        key={item.employee.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400 w-6">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-(--color-secondary)">
                              {item.employee.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.employee.email}
                            </p>
                          </div>
                        </div>
                        <Badge variant="info">{item.count} sessões</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma atividade registrada este mês
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.slice(0, 7).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/admin/appointments/${item.id}`)
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-(--color-secondary) truncate">
                            {item.employee.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(item.startAt)} •{" "}
                            {formatTime(item.startAt)} • {item.program.name}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(item.status)}>
                          {getStatusLabel(item.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma atividade recente
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/admin/settings")}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Localizações</p>
                    <p className="text-xl font-bold text-(--color-secondary)">
                      {kpis.totalLocations}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/admin/programs")}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Programas Ativos</p>
                    <p className="text-xl font-bold text-(--color-secondary)">
                      {kpis.totalPrograms}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/admin/availability")}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCog className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Terapeutas</p>
                    <p className="text-xl font-bold text-(--color-secondary)">
                      {kpis.totalTherapists}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
