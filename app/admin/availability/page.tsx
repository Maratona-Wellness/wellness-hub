"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Package, BarChart3, TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/molecules/DataTable";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";
import { RoleGuard } from "@/components/RoleGuard";

interface OverviewData {
  summary: {
    totalSlots: number;
    totalReserved: number;
    totalAvailable: number;
    occupancyRate: number;
  };
  byProgram: Array<{
    programId: string;
    programName: string;
    totalSlots: number;
    totalReserved: number;
    occupancyRate: number;
  }>;
}

export default function AvailabilityOverviewPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });

  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [selectedProgram, setSelectedProgram] = useState("");

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (selectedProgram) params.set("programId", selectedProgram);

      const res = await fetch(
        `/api/tenant-admin/availability/overview?${params}`,
      );
      const json = await res.json();

      if (json.success) {
        setData(json.data);

        // Extract programs from response for filters
        if (json.data.byProgram) {
          setPrograms(
            json.data.byProgram.map(
              (p: { programId: string; programName: string }) => ({
                id: p.programId,
                name: p.programName,
              }),
            ),
          );
        }
      } else {
        addToast("error", json.error || "Erro ao carregar overview");
      }
    } catch {
      addToast("error", "Erro ao carregar overview");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedProgram, addToast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const quickDateRange = (days: number) => {
    const today = new Date();
    setStartDate(today.toISOString().split("T")[0]);
    const end = new Date();
    end.setDate(end.getDate() + days);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const formatPercent = (rate: number) => `${Math.round(rate)}%`;

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return "text-red-600";
    if (rate >= 50) return "text-amber-600";
    return "text-green-600";
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["TENANT_ADMIN"]}>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Header */}
            <div>
              <Text variant="h2">Visão Geral de Disponibilidade</Text>
              <Text variant="p" className="text-gray-600 mt-1">
                Acompanhe a ocupação e disponibilidade dos horários
              </Text>
            </div>

            {/* Filters */}
            <Card>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Data inicial
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Data final
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Programa
                    </label>
                    <Select
                      value={selectedProgram}
                      onChange={(e) => setSelectedProgram(e.target.value)}
                      options={[
                        { value: "", label: "Todos" },
                        ...programs.map((p) => ({
                          value: p.id,
                          label: p.name,
                        })),
                      ]}
                    />
                  </div>
                </div>

                {/* Quick date ranges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Text variant="p" className="text-sm text-gray-500 mr-2">
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
                      className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : !data ? (
              <EmptyState
                icon={<BarChart3 size={48} />}
                title="Sem dados disponíveis"
                description="Não há dados de disponibilidade para o período selecionado."
              />
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                        <Calendar size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Total de Slots
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                          {data.summary.totalSlots}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                        <TrendingUp size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Reservados
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                          {data.summary.totalReserved}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                        <Package size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Disponíveis
                        </p>
                        <p className="text-lg sm:text-2xl font-bold">
                          {data.summary.totalAvailable}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className={`p-1.5 sm:p-2 rounded-lg ${data.summary.occupancyRate >= 80 ? "bg-red-100" : data.summary.occupancyRate >= 50 ? "bg-amber-100" : "bg-green-100"}`}
                      >
                        <BarChart3
                          size={20}
                          className={getOccupancyColor(
                            data.summary.occupancyRate,
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Taxa de Ocupação
                        </p>
                        <p
                          className={`text-lg sm:text-2xl font-bold ${getOccupancyColor(data.summary.occupancyRate)}`}
                        >
                          {formatPercent(data.summary.occupancyRate)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Programs Table */}
                {(() => {
                  type ProgramRow = OverviewData["byProgram"][number];

                  const programColumns: DataTableColumn<ProgramRow>[] = [
                    {
                      header: "Programa",
                      accessor: "programName",
                      sortable: true,
                      render: (_, row) => (
                        <div className="flex items-center gap-1">
                          <Package
                            size={14}
                            className="text-(--color-text-muted)"
                          />
                          <Text variant="p" className="text-sm font-medium">
                            {row.programName}
                          </Text>
                        </div>
                      ),
                    },
                    {
                      header: "Total",
                      accessor: "totalSlots",
                      sortable: true,
                      className: "text-center",
                      render: (val) => (
                        <span className="text-sm font-medium">
                          {String(val)}
                        </span>
                      ),
                    },
                    {
                      header: "Disponíveis",
                      accessor: "totalSlots",
                      className: "text-center",
                      render: (_, row) => (
                        <Badge variant="success">
                          {row.totalSlots - row.totalReserved}
                        </Badge>
                      ),
                    },
                    {
                      header: "Reservados",
                      accessor: "totalReserved",
                      hideBelow: "md",
                      className: "text-center",
                    },
                    {
                      header: "Ocupação",
                      accessor: "occupancyRate",
                      sortable: true,
                      className: "text-center",
                      render: (_, row) => (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.occupancyRate >= 80
                                  ? "bg-red-500"
                                  : row.occupancyRate >= 50
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(row.occupancyRate, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">
                            {formatPercent(row.occupancyRate)}
                          </span>
                        </div>
                      ),
                    },
                  ];

                  return (
                    <DataTable<ProgramRow>
                      columns={programColumns}
                      data={data.byProgram}
                      loading={false}
                      rowKey={(row) => row.programId}
                      emptyMessage="Nenhum programa encontrado para o período selecionado."
                    />
                  );
                })()}
              </>
            )}
          </div>

          <ToastContainer toasts={toasts} onClose={removeToast} />
        </DashboardLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
