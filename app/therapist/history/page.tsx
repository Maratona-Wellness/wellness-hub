"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Download,
  Filter,
  MapPin,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3,
  User,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/molecules/DataTable";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface HistoryItem {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  code: string;
  createdAt: string;
  employee: { id: string; name: string; email: string };
  location: { id: string; name: string; address: string };
  program: { id: string; name: string; sessionDurationMinutes: number };
  tenant: { id: string; name: string };
}

interface HistoryStats {
  totalCompleted: number;
  totalNoShows: number;
  totalCancelled: number;
  attendanceRate: number;
  totalByMonth: Array<{ month: string; count: number }>;
}

interface FilterOptions {
  tenants: Array<{
    id: string;
    name: string;
    locations: Array<{ id: string; name: string }>;
  }>;
  programs: Array<{
    id: string;
    name: string;
    tenantId: string;
  }>;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

function getStatusBadgeVariant(
  status: string,
): "success" | "warning" | "error" | "info" {
  const map: Record<string, "success" | "warning" | "error" | "info"> = {
    COMPLETED: "success",
    NO_SHOW: "error",
    CANCELLED: "error",
    PENDING: "warning",
    CONFIRMED: "info",
  };
  return map[status] || "info";
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TherapistHistoryPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [tenantId, setTenantId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const limit = 10;

  // Fetch filter options
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/therapist/appointments?filters=true");
        const json = await res.json();
        if (json.success) {
          setFilterOptions(json.data);
        }
      } catch {
        // silently fail
      }
    }
    fetchFilters();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (tenantId) params.set("tenantId", tenantId);
      if (locationId) params.set("locationId", locationId);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/therapist/history?${params}`);
      const json = await res.json();

      if (json.success !== false) {
        setItems(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
        setStats(json.stats || null);
      } else {
        addToast("error", json.error || "Erro ao carregar histórico");
      }
    } catch {
      addToast("error", "Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  }, [page, tenantId, locationId, statusFilter, startDate, endDate, addToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExportCSV = () => {
    if (items.length === 0) {
      addToast("warning", "Nenhum dado para exportar");
      return;
    }

    const headers = [
      "Código",
      "Data",
      "Horário",
      "Funcionário",
      "Email",
      "Empresa",
      "Local",
      "Programa",
      "Status",
    ];

    const rows = items.map((item) => [
      item.code,
      formatDate(item.startAt),
      `${formatTime(item.startAt)} - ${formatTime(item.endAt)}`,
      item.employee.name,
      item.employee.email,
      item.tenant.name,
      item.location.name,
      item.program.name,
      getStatusLabel(item.status),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => r.join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico-atendimentos-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    addToast("success", "Arquivo CSV exportado com sucesso");
  };

  const filteredLocations =
    filterOptions?.tenants.find((t) => t.id === tenantId)?.locations || [];

  // Calcular a altura máxima para o gráfico de barras
  const maxMonthCount = stats?.totalByMonth
    ? Math.max(...stats.totalByMonth.map((m) => m.count), 1)
    : 1;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Histórico de Atendimentos</Text>
              <Text className="text-gray-500 mt-1">
                Visualize seu histórico completo de sessões realizadas
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
                className="flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardContent className="pt-3 sm:pt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-green-600">
                        {stats.totalCompleted}
                      </div>
                      <div className="text-xs text-gray-500">Concluídos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 sm:pt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-red-600">
                        {stats.totalNoShows}
                      </div>
                      <div className="text-xs text-gray-500">Ausências</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 sm:pt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                      <XCircle className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-500">
                        {stats.totalCancelled}
                      </div>
                      <div className="text-xs text-gray-500">Cancelados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 sm:pt-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-blue-600">
                        {stats.attendanceRate}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Taxa de Presença
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monthly Chart */}
          {stats?.totalByMonth && stats.totalByMonth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-(--color-accent)" />
                  Atendimentos por Mês (últimos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="flex items-end gap-2 sm:gap-3 h-40 min-w-75">
                    {stats.totalByMonth.map((item) => (
                      <div
                        key={item.month}
                        className="flex-1 flex flex-col items-center min-w-10"
                      >
                        <span className="text-xs font-semibold text-gray-700 mb-1">
                          {item.count}
                        </span>
                        <div
                          className="w-full bg-(--color-accent) rounded-t-md transition-all duration-500 min-h-[4px]"
                          style={{
                            height: `${(item.count / maxMonthCount) * 100}%`,
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-2">
                          {formatMonthLabel(item.month)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa
                    </label>
                    <Select
                      value={tenantId}
                      onChange={(e) => {
                        setTenantId(e.target.value);
                        setLocationId("");
                        setPage(1);
                      }}
                      options={[
                        { value: "", label: "Todas" },
                        ...(filterOptions?.tenants.map((t) => ({
                          value: t.id,
                          label: t.name,
                        })) || []),
                      ]}
                      placeholder="Todas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Local
                    </label>
                    <Select
                      value={locationId}
                      onChange={(e) => {
                        setLocationId(e.target.value);
                        setPage(1);
                      }}
                      disabled={!tenantId}
                      options={[
                        { value: "", label: "Todos" },
                        ...filteredLocations.map((l) => ({
                          value: l.id,
                          label: l.name,
                        })),
                      ]}
                      placeholder="Todos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      options={[
                        { value: "all", label: "Todos" },
                        { value: "COMPLETED", label: "Concluído" },
                        { value: "NO_SHOW", label: "Ausência" },
                        { value: "CANCELLED", label: "Cancelado" },
                      ]}
                      placeholder="Todos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                {(tenantId ||
                  locationId ||
                  statusFilter !== "all" ||
                  startDate ||
                  endDate) && (
                  <div className="mt-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTenantId("");
                        setLocationId("");
                        setStatusFilter("all");
                        setStartDate("");
                        setEndDate("");
                        setPage(1);
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          {(() => {
            const historyColumns: DataTableColumn<HistoryItem>[] = [
              {
                header: "Código",
                accessor: "code",
                sortable: true,
                hideBelow: "md",
                render: (_, row) => (
                  <span className="font-mono text-xs">{row.code}</span>
                ),
              },
              {
                header: "Data / Horário",
                accessor: "startAt",
                sortable: true,
                render: (_, row) => (
                  <div>
                    <div>{formatDate(row.startAt)}</div>
                    <div className="text-xs text-gray-500">
                      {formatTime(row.startAt)} - {formatTime(row.endAt)}
                    </div>
                  </div>
                ),
              },
              {
                header: "Funcionário",
                accessor: "id",
                render: (_, row) => (
                  <div>
                    <div className="font-medium">{row.employee.name}</div>
                    <div className="text-xs text-gray-500">
                      {row.employee.email}
                    </div>
                  </div>
                ),
              },
              {
                header: "Empresa",
                accessor: "id",
                hideBelow: "md",
                render: (_, row) => (
                  <span className="text-gray-600">{row.tenant.name}</span>
                ),
              },
              {
                header: "Local",
                accessor: "id",
                hideBelow: "lg",
                render: (_, row) => (
                  <span className="text-gray-600">{row.location.name}</span>
                ),
              },
              {
                header: "Programa",
                accessor: "id",
                hideBelow: "lg",
                render: (_, row) => (
                  <span className="text-gray-600">{row.program.name}</span>
                ),
              },
              {
                header: "Status",
                accessor: "status",
                sortable: true,
                render: (_, row) => (
                  <Badge variant={getStatusBadgeVariant(row.status)}>
                    {getStatusLabel(row.status)}
                  </Badge>
                ),
              },
              {
                header: "Ações",
                accessor: "id",
                render: (_, row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(`/therapist/appointments/${row.id}`)
                    }
                  >
                    Ver
                  </Button>
                ),
              },
            ];

            return (
              <DataTable<HistoryItem>
                columns={historyColumns}
                data={items}
                loading={loading}
                rowKey="id"
                emptyMessage="Nenhum atendimento encontrado"
                emptyIcon={<Calendar className="h-16 w-16" />}
                pagination={
                  totalPages > 1
                    ? {
                        currentPage: page,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limit,
                        onPageChange: setPage,
                      }
                    : undefined
                }
              />
            );
          })()}
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
