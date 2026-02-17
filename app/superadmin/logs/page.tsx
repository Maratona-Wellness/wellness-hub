"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  User,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { SearchBar } from "@/components/molecules/SearchBar";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface AuthLogItem {
  id: string;
  method: string;
  outcome: string;
  reason: string | null;
  ip: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getOutcomeVariant(
  outcome: string,
): "success" | "error" | "warning" | "info" {
  switch (outcome) {
    case "SUCCESS":
      return "success";
    case "FAILURE":
      return "error";
    case "BLOCKED":
      return "warning";
    default:
      return "info";
  }
}

function getOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case "SUCCESS":
      return "Sucesso";
    case "FAILURE":
      return "Falha";
    case "BLOCKED":
      return "Bloqueado";
    default:
      return outcome;
  }
}

function getMethodLabel(method: string): string {
  switch (method) {
    case "CREDENTIALS":
      return "Credenciais";
    case "MAGIC_LINK":
      return "Link Mágico";
    case "GOOGLE":
      return "Google";
    case "PASSWORD_RESET":
      return "Reset Senha";
    default:
      return method;
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "TENANT_ADMIN":
      return "Admin";
    case "THERAPIST":
      return "Terapeuta";
    case "EMPLOYEE":
      return "Funcionário";
    default:
      return role;
  }
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function SuperAdminLogsPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [logs, setLogs] = useState<AuthLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [method, setMethod] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (method !== "all") params.set("method", method);
      if (outcome !== "all") params.set("outcome", outcome);
      if (search) params.set("userId", search);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/admin/logs?${params}`);
      const json = await res.json();

      if (json.success) {
        setLogs(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      } else {
        addToast("error", json.error || "Erro ao carregar logs");
      }
    } catch {
      addToast("error", "Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  }, [page, method, outcome, search, startDate, endDate, addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const resetFilters = () => {
    setMethod("all");
    setOutcome("all");
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      addToast("warning", "Nenhum dado para exportar");
      return;
    }

    const headers = [
      "Data/Hora",
      "Usuário",
      "Email",
      "Role",
      "Método",
      "Resultado",
      "Motivo",
      "IP",
    ];

    const rows = logs.map((log) => [
      formatDateTime(log.createdAt),
      log.user?.name || "—",
      log.user?.email || "—",
      log.user?.role ? getRoleLabel(log.user.role) : "—",
      getMethodLabel(log.method),
      getOutcomeLabel(log.outcome),
      log.reason || "",
      log.ip,
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
    link.download = `auth-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    addToast("success", "Logs exportados com sucesso");
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Logs de Acesso</Text>
              <Text className="text-gray-500 mt-1">
                Auditoria de autenticações na plataforma
              </Text>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Filter className="h-5 w-5 inline mr-2" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Método
                  </label>
                  <Select
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: "Todos" },
                      { value: "CREDENTIALS", label: "Credenciais" },
                      { value: "MAGIC_LINK", label: "Link Mágico" },
                      { value: "GOOGLE", label: "Google" },
                      { value: "PASSWORD_RESET", label: "Reset Senha" },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Resultado
                  </label>
                  <Select
                    value={outcome}
                    onChange={(e) => {
                      setOutcome(e.target.value);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: "Todos" },
                      { value: "SUCCESS", label: "Sucesso" },
                      { value: "FAILURE", label: "Falha" },
                      { value: "BLOCKED", label: "Bloqueado" },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<Shield />}
              title="Nenhum log encontrado"
              description="Ajuste os filtros para ver os registros de acesso"
            />
          ) : (
            <>
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Data/Hora
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          <User className="h-4 w-4 inline mr-1" />
                          Usuário
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">
                          Método
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-gray-600">
                          Resultado
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          <Globe className="h-4 w-4 inline mr-1" />
                          IP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logs.map((log) => (
                        <React.Fragment key={log.id}>
                          <tr
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() =>
                              setExpandedId(
                                expandedId === log.id ? null : log.id,
                              )
                            }
                          >
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              {formatDateTime(log.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              {log.user ? (
                                <div>
                                  <p className="font-medium text-(--color-secondary)">
                                    {log.user.name}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {log.user.email}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="info">
                                {getMethodLabel(log.method)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={getOutcomeVariant(log.outcome)}>
                                {getOutcomeLabel(log.outcome)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                              {log.ip}
                            </td>
                          </tr>
                          {/* Expanded Details */}
                          {expandedId === log.id && (
                            <tr>
                              <td colSpan={5} className="bg-gray-50 px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-xs text-gray-400">
                                      ID do Log
                                    </p>
                                    <p className="font-mono text-xs text-gray-600">
                                      {log.id}
                                    </p>
                                  </div>
                                  {log.user && (
                                    <>
                                      <div>
                                        <p className="text-xs text-gray-400">
                                          Papel
                                        </p>
                                        <p className="text-gray-600">
                                          {getRoleLabel(log.user.role)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-400">
                                          ID do Usuário
                                        </p>
                                        <p className="font-mono text-xs text-gray-600">
                                          {log.user.id}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                  {log.reason && (
                                    <div>
                                      <p className="text-xs text-gray-400">
                                        Motivo
                                      </p>
                                      <p className="text-gray-600">
                                        {log.reason}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <Text className="text-sm text-gray-500">
                    Mostrando {(page - 1) * limit + 1} -{" "}
                    {Math.min(page * limit, total)} de {total} registros
                  </Text>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
