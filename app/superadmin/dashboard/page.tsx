"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Building2, Users, LogIn, CalendarCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardLayout } from "@/components/layouts";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { Alert } from "@/components/molecules/Alert";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface SuperAdminDashboardData {
  bigNumbers: {
    activeTenants: number;
    totalEmployees: number;
    totalAccesses: number;
    totalAppointments: number;
  };
  charts: {
    appointmentsDaily: Array<{
      date: string;
      completed: number;
      cancelled: number;
      scheduled: number;
    }>;
    dailyAccesses: Array<{
      date: string;
      accesses: number;
    }>;
    employeesByTenant: Array<{
      tenant: string;
      employees: number;
    }>;
  };
  period: number;
}

// ============================================================================
// HELPERS
// ============================================================================

type PeriodOption = 7 | 15 | 30;

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString("pt-BR");
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodOption>(30);

  const fetchDashboard = useCallback(async (days: PeriodOption) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dashboard?days=${days}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Erro ao carregar dashboard");
      }
    } catch {
      setError("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(period);
  }, [period, fetchDashboard]);

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
          <Alert variant="error" title="Erro">
            {error || "Não foi possível carregar os dados"}
          </Alert>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const { bigNumbers, charts } = data;

  const bigNumberItems = [
    {
      label: "Empresas Ativas",
      value: bigNumbers.activeTenants,
      icon: Building2,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total de Funcionários",
      value: bigNumbers.totalEmployees,
      icon: Users,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Total de Acessos",
      value: bigNumbers.totalAccesses,
      icon: LogIn,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Total de Agendamentos",
      value: bigNumbers.totalAppointments,
      icon: CalendarCheck,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  // Preparar dados dos gráficos com labels formatados
  const appointmentsChartData = charts.appointmentsDaily.map((item) => ({
    ...item,
    label: formatDateLabel(item.date),
  }));

  const accessesChartData = charts.dailyAccesses.map((item) => ({
    ...item,
    label: formatDateLabel(item.date),
  }));

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Painel Super Admin</Text>
              <Text className="text-gray-500 mt-1">
                Visão global da plataforma Wellness Hub
              </Text>
            </div>

            {/* Filtro de período */}
            <div className="flex gap-2">
              {([7, 15, 30] as PeriodOption[]).map((days) => (
                <Button
                  key={days}
                  variant={period === days ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setPeriod(days)}
                >
                  {days} dias
                </Button>
              ))}
            </div>
          </div>

          {/* Big Numbers — 4 cards em grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bigNumberItems.map((item) => (
              <Card key={item.label}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${item.iconBg}`}>
                      <item.icon className={`h-6 w-6 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-(--color-secondary)">
                        {formatNumber(item.value)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Chart 1: Agendamentos por Dia (Barras Empilhadas) */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>
                  Agendamentos por Dia — Últimos {period} dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={appointmentsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval={period > 15 ? 2 : 0}
                        angle={period > 15 ? -45 : 0}
                        textAnchor={period > 15 ? "end" : "middle"}
                        height={period > 15 ? 60 : 30}
                      />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="completed"
                        name="Concluídos"
                        stackId="a"
                        fill="#22c55e"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="cancelled"
                        name="Cancelados"
                        stackId="a"
                        fill="#ef4444"
                      />
                      <Bar
                        dataKey="scheduled"
                        name="Agendados"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Acessos Diários */}
            <Card>
              <CardHeader>
                <CardTitle>Acessos Diários — Últimos {period} dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accessesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval={period > 15 ? 2 : 0}
                        angle={period > 15 ? -45 : 0}
                        textAnchor={period > 15 ? "end" : "middle"}
                        height={period > 15 ? 60 : 30}
                      />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Bar
                        dataKey="accesses"
                        name="Acessos"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 3: Employees por Tenant */}
            <Card>
              <CardHeader>
                <CardTitle>Funcionários por Empresa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.employeesByTenant} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <YAxis
                        dataKey="tenant"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                        }}
                      />
                      <Bar
                        dataKey="employees"
                        name="Funcionários"
                        fill="#f97316"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
