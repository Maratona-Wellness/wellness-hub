"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Plus,
  Calendar,
  Building2,
  Package,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Card } from "@/components/molecules/Card";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

interface GroupedSlot {
  tenantId: string;
  tenantName: string;
  programId: string;
  programName: string;
  sessionDuration: number;
  totalSlots: number;
  totalCapacity: number;
  totalReserved: number;
  totalAvailable: number;
  occupancyRate: number;
}

interface GroupedResponse {
  success: boolean;
  data: GroupedSlot[];
  total: number;
}

interface TenantOption {
  id: string;
  name: string;
}

interface ProgramOption {
  id: string;
  name: string;
}

function getOccupancyColor(rate: number) {
  if (rate >= 80) return "bg-red-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-green-500";
}

export default function SuperAdminAvailabilityPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [groups, setGroups] = useState<GroupedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [tenantFilter, setTenantFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  // Opcoes de filtro
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [tenantsRes, programsRes] = await Promise.all([
        fetch(
          "/api/admin/tenants?limit=100&status=active&sortBy=name&sortOrder=asc",
        ),
        fetch(
          "/api/admin/programs?limit=100&status=active&sortBy=name&sortOrder=asc",
        ),
      ]);

      const tenantsData = await tenantsRes.json();
      const programsData = await programsRes.json();

      if (tenantsData.success) {
        setTenants(
          tenantsData.data.map((t: TenantOption & Record<string, unknown>) => ({
            id: t.id,
            name: t.name,
          })),
        );
      }

      if (programsData.success) {
        setPrograms(
          programsData.data.map(
            (p: ProgramOption & Record<string, unknown>) => ({
              id: p.id,
              name: p.name,
            }),
          ),
        );
      }
    } catch {
      // Silently fail
    }
  }, []);

  const fetchGroupedSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (tenantFilter !== "all") params.set("tenantId", tenantFilter);
      if (programFilter !== "all") params.set("programId", programFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/superadmin/availability?${params}`);
      const data: GroupedResponse = await res.json();

      if (data.success) {
        setGroups(data.data);
      }
    } catch {
      addToast("error", "Erro ao carregar dados de disponibilidade");
    } finally {
      setLoading(false);
    }
  }, [tenantFilter, programFilter, startDate, endDate, addToast]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchGroupedSlots();
  }, [fetchGroupedSlots]);

  const handleClearFilters = () => {
    setTenantFilter("all");
    setProgramFilter("all");
    const today = new Date();
    setStartDate(today.toISOString().split("T")[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setEndDate(d.toISOString().split("T")[0]);
  };

  const hasActiveFilters = tenantFilter !== "all" || programFilter !== "all";

  // Agrupar por tenant para exibicao
  const groupedByTenant = groups.reduce(
    (acc, item) => {
      if (!acc[item.tenantId]) {
        acc[item.tenantId] = {
          tenantName: item.tenantName,
          programs: [],
          totalSlots: 0,
          totalAvailable: 0,
          totalReserved: 0,
        };
      }
      acc[item.tenantId].programs.push(item);
      acc[item.tenantId].totalSlots += item.totalSlots;
      acc[item.tenantId].totalAvailable += item.totalAvailable;
      acc[item.tenantId].totalReserved += item.totalReserved;
      return acc;
    },
    {} as Record<
      string,
      {
        tenantName: string;
        programs: GroupedSlot[];
        totalSlots: number;
        totalAvailable: number;
        totalReserved: number;
      }
    >,
  );

  // Totais globais
  const globalTotals = groups.reduce(
    (acc, g) => ({
      totalSlots: acc.totalSlots + g.totalSlots,
      totalAvailable: acc.totalAvailable + g.totalAvailable,
      totalReserved: acc.totalReserved + g.totalReserved,
      totalCapacity: acc.totalCapacity + g.totalCapacity,
    }),
    { totalSlots: 0, totalAvailable: 0, totalReserved: 0, totalCapacity: 0 },
  );

  const globalOccupancy =
    globalTotals.totalCapacity > 0
      ? Math.round(
          (globalTotals.totalReserved / globalTotals.totalCapacity) * 100,
        )
      : 0;

  const quickDateRange = (days: number) => {
    const today = new Date();
    setStartDate(today.toISOString().split("T")[0]);
    const end = new Date();
    end.setDate(end.getDate() + days);
    setEndDate(end.toISOString().split("T")[0]);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Disponibilidade</Text>
              <Text variant="p" className="text-(--color-text-muted) mt-1">
                Visao geral dos slots por empresa e programa
              </Text>
            </div>
            <Button
              onClick={() => router.push("/superadmin/availability/generate")}
              leftIcon={<Plus size={18} />}
            >
              Gerar Slots
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-(--color-text-muted)">
                    Empresa
                  </label>
                  <Select
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                    options={[
                      { value: "all", label: "Todas as empresas" },
                      ...tenants.map((t) => ({
                        value: t.id,
                        label: t.name,
                      })),
                    ]}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-(--color-text-muted)">
                    Programa
                  </label>
                  <Select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    options={[
                      { value: "all", label: "Todos os programas" },
                      ...programs.map((p) => ({
                        value: p.id,
                        label: p.name,
                      })),
                    ]}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-(--color-text-muted)">
                    Data inicio
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-(--color-text-muted)">
                    Data fim
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Text
                  variant="p"
                  className="text-sm text-(--color-text-muted) mr-1"
                >
                  Atalhos:
                </Text>
                {[
                  { label: "7 dias", days: 7 },
                  { label: "15 dias", days: 15 },
                  { label: "30 dias", days: 30 },
                  { label: "60 dias", days: 60 },
                  { label: "90 dias", days: 90 },
                ].map(({ label, days }) => (
                  <button
                    key={days}
                    onClick={() => quickDateRange(days)}
                    className="px-3 py-1 text-xs rounded-full border border-(--color-border) hover:bg-(--color-background-alt) transition-colors"
                  >
                    {label}
                  </button>
                ))}
                {hasActiveFilters && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClearFilters}
                    className="ml-auto"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon={<Calendar size={48} />}
              title="Nenhum slot encontrado"
              description={
                hasActiveFilters
                  ? "Tente ajustar os filtros de busca"
                  : "Gere slots de disponibilidade para comecar"
              }
              action={
                !hasActiveFilters
                  ? {
                      label: "Gerar Slots",
                      onClick: () =>
                        router.push("/superadmin/availability/generate"),
                    }
                  : undefined
              }
            />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-(--color-text-muted)">
                        Total de Slots
                      </p>
                      <p className="text-2xl font-bold">
                        {globalTotals.totalSlots}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-(--color-text-muted)">
                        Disponiveis
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {globalTotals.totalAvailable}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Clock size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-(--color-text-muted)">
                        Reservados
                      </p>
                      <p className="text-2xl font-bold text-amber-600">
                        {globalTotals.totalReserved}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${globalOccupancy >= 80 ? "bg-red-100" : globalOccupancy >= 50 ? "bg-amber-100" : "bg-green-100"}`}
                    >
                      <BarChart3
                        size={20}
                        className={
                          globalOccupancy >= 80
                            ? "text-red-600"
                            : globalOccupancy >= 50
                              ? "text-amber-600"
                              : "text-green-600"
                        }
                      />
                    </div>
                    <div>
                      <p className="text-sm text-(--color-text-muted)">
                        Ocupacao
                      </p>
                      <p
                        className={`text-2xl font-bold ${globalOccupancy >= 80 ? "text-red-600" : globalOccupancy >= 50 ? "text-amber-600" : "text-green-600"}`}
                      >
                        {globalOccupancy}%
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-(--color-border)">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-(--color-border) bg-(--color-background-alt)">
                      <th className="px-4 py-3 text-left text-sm font-medium text-(--color-text-muted)">
                        <div className="flex items-center gap-1">
                          <Building2 size={14} />
                          Empresa
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-(--color-text-muted)">
                        <div className="flex items-center gap-1">
                          <Package size={14} />
                          Programa
                        </div>
                      </th>
                      <th className="hidden px-4 py-3 text-center text-sm font-medium text-(--color-text-muted) sm:table-cell">
                        Duracao
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-(--color-text-muted)">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-(--color-text-muted)">
                        Disponiveis
                      </th>
                      <th className="hidden px-4 py-3 text-center text-sm font-medium text-(--color-text-muted) md:table-cell">
                        Reservados
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-(--color-text-muted)">
                        Ocupacao
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-border)">
                    {Object.entries(groupedByTenant).map(
                      ([tenantId, tenant]) => (
                        <React.Fragment key={tenantId}>
                          {/* Tenant header row */}
                          <tr className="bg-(--color-background-alt)/50">
                            <td colSpan={7} className="px-4 py-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Building2
                                    size={16}
                                    className="text-(--color-text-muted)"
                                  />
                                  <Text
                                    variant="p"
                                    className="font-semibold text-sm"
                                  >
                                    {tenant.tenantName}
                                  </Text>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-(--color-text-muted)">
                                  <span>
                                    {tenant.totalSlots} slot
                                    {tenant.totalSlots !== 1 ? "s" : ""}
                                  </span>
                                  <span className="text-green-600 font-medium">
                                    {tenant.totalAvailable} disponive
                                    {tenant.totalAvailable !== 1 ? "is" : "l"}
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Program rows */}
                          {tenant.programs.map((prog) => (
                            <tr
                              key={`${tenantId}-${prog.programId}`}
                              className="hover:bg-(--color-background-alt) transition-colors"
                            >
                              <td className="px-4 py-3 pl-10 text-sm text-(--color-text-muted)">
                                —
                              </td>
                              <td className="px-4 py-3">
                                <Text
                                  variant="p"
                                  className="text-sm font-medium"
                                >
                                  {prog.programName}
                                </Text>
                              </td>
                              <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) sm:table-cell">
                                {prog.sessionDuration} min
                              </td>
                              <td className="px-4 py-3 text-center text-sm font-medium">
                                {prog.totalSlots}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant="success">
                                  {prog.totalAvailable}
                                </Badge>
                              </td>
                              <td className="hidden px-4 py-3 text-center text-sm md:table-cell">
                                {prog.totalReserved}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${getOccupancyColor(prog.occupancyRate)}`}
                                      style={{
                                        width: `${Math.min(prog.occupancyRate, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium w-8 text-right">
                                    {prog.occupancyRate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
