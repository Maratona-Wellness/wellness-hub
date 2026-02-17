"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Alert } from "@/components/molecules/Alert";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface DailyBreakdown {
  day: number;
  total: number;
  completed: number;
}

interface ByProgramItem {
  programName: string;
  count: number;
}

interface ByLocationItem {
  locationName: string;
  count: number;
}

interface MonthlyReport {
  tenant: {
    id: string;
    name: string;
    domain: string;
  };
  period: {
    month: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    total: number;
    completed: number;
    cancelled: number;
    noShows: number;
    pending: number;
    attendanceRate: number;
    activeEmployees: number;
  };
  dailyBreakdown: DailyBreakdown[];
  byProgram: ByProgramItem[];
  byLocation: ByLocationItem[];
}

// ============================================================================
// HELPERS
// ============================================================================

function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getPreviousMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const prev = new Date(year, month - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  const next = new Date(year, month, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TenantAdminReportsPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState(getCurrentMonth());

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/tenant-admin/reports/monthly?month=${month}`,
      );
      const json = await res.json();

      if (json.success) {
        setReport(json.data);
      } else {
        setError(json.error || "Erro ao carregar relatório");
      }
    } catch {
      setError("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const isFutureMonth = month >= getCurrentMonth();

  const handleExportCSV = () => {
    if (!report || report.dailyBreakdown.length === 0) {
      addToast("warning", "Nenhum dado para exportar");
      return;
    }

    const headers = ["Dia", "Total", "Concluídos"];
    const rows = report.dailyBreakdown
      .filter((d) => d.total > 0)
      .map((d) => [
        `Dia ${d.day}`,
        d.total,
        d.completed,
      ]);

    // Summary rows
    rows.push([]);
    rows.push(["Resumo do Mês"]);
    rows.push(["Total de Agendamentos", report.summary.total]);
    rows.push(["Concluídos", report.summary.completed]);
    rows.push(["Cancelados", report.summary.cancelled]);
    rows.push(["Ausências", report.summary.noShows]);
    rows.push(["Pendentes", report.summary.pending]);
    rows.push(["Taxa de Presença", `${report.summary.attendanceRate}%`]);
    rows.push(["Funcionários Ativos", report.summary.activeEmployees]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((r) => (r as (string | number)[]).join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-${month}.csv`;
    link.click();

    addToast("success", "Relatório CSV exportado com sucesso");
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Relatórios</Text>
              <Text className="text-gray-500 mt-1">
                Relatório mensal de atendimentos
              </Text>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          </div>

          {/* Month Navigation */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMonth(getPreviousMonth(month))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Text variant="h3" className="min-w-[200px] text-center">
                  {getMonthLabel(month)}
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isFutureMonth}
                  onClick={() => setMonth(getNextMonth(month))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <Alert variant="error" title="Erro">
              {error}
            </Alert>
          ) : report ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Calendar className="h-6 w-6 text-(--color-accent) mx-auto mb-2" />
                    <p className="text-2xl font-bold text-(--color-secondary)">
                      {report.summary.total}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total Agendamentos
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {report.summary.completed}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Concluídos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <XCircle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">
                      {report.summary.cancelled}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Cancelados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">
                      {report.summary.noShows}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Ausências</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">
                      {report.summary.attendanceRate}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Taxa Presença</p>
                  </CardContent>
                </Card>
              </div>

              {/* Participants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4 flex items-center gap-4">
                    <Users className="h-8 w-8 text-(--color-accent)" />
                    <div>
                      <p className="text-xl font-bold text-(--color-secondary)">
                        {report.summary.activeEmployees}
                      </p>
                      <p className="text-sm text-gray-500">
                        Funcionários Ativos
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 flex items-center gap-4">
                    <Clock className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-xl font-bold text-(--color-secondary)">
                        {report.summary.pending}
                      </p>
                      <p className="text-sm text-gray-500">
                        Pendentes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <BarChart3 className="h-5 w-5 inline mr-2" />
                    Atendimentos Diários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.dailyBreakdown.every((d) => d.total === 0) ? (
                    <EmptyState
                      icon={<Calendar />}
                      title="Sem dados"
                      description="Nenhum atendimento registrado neste mês"
                    />
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        const maxTotal = Math.max(
                          ...report.dailyBreakdown.map((d) => d.total),
                          1,
                        );
                        return report.dailyBreakdown.map((d) => (
                          <div key={d.day} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-10 text-right">
                              Dia {d.day}
                            </span>
                            <div className="flex-1 flex items-center gap-1 h-5">
                              {d.completed > 0 && (
                                <div
                                  className="bg-green-500 h-full rounded-l"
                                  style={{
                                    width: `${(d.completed / maxTotal) * 100}%`,
                                  }}
                                  title={`Concluídos: ${d.completed}`}
                                />
                              )}
                              {d.total - d.completed > 0 && (
                                <div
                                  className="bg-blue-400 h-full rounded-r"
                                  style={{
                                    width: `${((d.total - d.completed) / maxTotal) * 100}%`,
                                  }}
                                  title={`Outros: ${d.total - d.completed}`}
                                />
                              )}
                            </div>
                            <span className="text-xs text-gray-600 font-medium w-8 text-right">
                              {d.total > 0 ? d.total : ""}
                            </span>
                          </div>
                        ));
                      })()}
                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded" />
                          <span className="text-xs text-gray-500">
                            Concluídos
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-400 rounded" />
                          <span className="text-xs text-gray-500">
                            Outros (Pendentes / Cancelados / Ausências)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* By Program */}
              {report.byProgram.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <FileText className="h-5 w-5 inline mr-2" />
                      Por Programa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        const maxCount = Math.max(
                          ...report.byProgram.map((p) => p.count),
                          1,
                        );
                        return report.byProgram.map((prog, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-(--color-secondary)">
                                {prog.programName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {prog.count} agendamento{prog.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-(--color-accent) h-2 rounded-full transition-all"
                                style={{
                                  width: `${(prog.count / maxCount) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* By Location */}
              {report.byLocation.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <BarChart3 className="h-5 w-5 inline mr-2" />
                      Por Local
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        const maxCount = Math.max(
                          ...report.byLocation.map((l) => l.count),
                          1,
                        );
                        return report.byLocation.map((loc, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-(--color-secondary)">
                                {loc.locationName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {loc.count} agendamento{loc.count !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${(loc.count / maxCount) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
