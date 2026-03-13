"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Power,
  Key,
  XCircle,
  Download,
  CheckCircle,
  Calendar,
  TrendingUp,
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
import { SearchBar } from "@/components/molecules/SearchBar";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/molecules/DataTable";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import { Alert } from "@/components/molecules/Alert";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  active: boolean;
  userId: string | null;
  userActive: boolean | null;
  lastLoginAt: string | null;
  registeredAt: string;
  totalAppointments: number;
  completedAppointments: number;
  noShows: number;
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

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TenantAdminEmployeesPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [toggleModal, setToggleModal] = useState<EmployeeItem | null>(null);
  const [toggling, setToggling] = useState(false);
  const [resetModal, setResetModal] = useState<EmployeeItem | null>(null);
  const [resetting, setResetting] = useState(false);

  const limit = 10;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        sortBy: "name",
        sortOrder: "asc",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/tenant-admin/employees?${params}`);
      const json = await res.json();

      if (json.success) {
        setEmployees(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      } else {
        addToast("error", json.error || "Erro ao carregar funcionários");
      }
    } catch {
      addToast("error", "Erro ao carregar funcionários");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, addToast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleToggleStatus = async () => {
    if (!toggleModal) return;
    setToggling(true);

    try {
      const res = await fetch(
        `/api/tenant-admin/employees/${toggleModal.id}/toggle-status`,
        { method: "PATCH" },
      );
      const json = await res.json();

      if (json.success) {
        addToast("success", json.message);
        fetchEmployees();
      } else {
        addToast("error", json.error || "Erro ao alterar status");
      }
    } catch {
      addToast("error", "Erro ao alterar status");
    } finally {
      setToggling(false);
      setToggleModal(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModal) return;
    setResetting(true);

    try {
      const res = await fetch(
        `/api/tenant-admin/employees/${resetModal.id}/reset-password`,
        { method: "POST" },
      );
      const json = await res.json();

      if (json.success) {
        addToast("success", json.message);
      } else {
        addToast("error", json.error || "Erro ao resetar senha");
      }
    } catch {
      addToast("error", "Erro ao resetar senha");
    } finally {
      setResetting(false);
      setResetModal(null);
    }
  };

  const handleExportCSV = () => {
    if (employees.length === 0) {
      addToast("warning", "Nenhum dado para exportar");
      return;
    }

    const headers = [
      "Nome",
      "Email",
      "Status",
      "Total Agend.",
      "Concluídos",
      "Ausências",
      "Último Acesso",
      "Cadastro",
    ];

    const rows = employees.map((emp) => [
      emp.name,
      emp.email,
      emp.active ? "Ativo" : "Inativo",
      emp.totalAppointments,
      emp.completedAppointments,
      emp.noShows,
      emp.lastLoginAt ? formatDate(emp.lastLoginAt) : "Nunca",
      formatDate(emp.registeredAt),
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
    link.download = `funcionarios-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    addToast("success", "Arquivo CSV exportado com sucesso");
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Funcionários</Text>
              <Text className="text-gray-500 mt-1">
                Gerencie os funcionários da sua empresa
              </Text>
            </div>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar
                    value={search}
                    onChange={handleSearch}
                    placeholder="Buscar por nome ou email..."
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: "Todos os status" },
                      { value: "active", label: "Ativos" },
                      { value: "inactive", label: "Inativos" },
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          {(() => {
            const employeeColumns: DataTableColumn<EmployeeItem>[] = [
              {
                header: "Funcionário",
                accessor: "name",
                sortable: true,
                render: (_, row) => (
                  <div>
                    <p className="font-medium text-(--color-secondary)">
                      {row.name}
                    </p>
                    <p className="text-xs text-gray-500">{row.email}</p>
                  </div>
                ),
              },
              {
                header: "Status",
                accessor: "active",
                render: (_, row) => (
                  <Badge variant={row.active ? "success" : "error"}>
                    {row.active ? "Ativo" : "Inativo"}
                  </Badge>
                ),
              },
              {
                header: "Agend.",
                accessor: "totalAppointments",
                sortable: true,
                className: "text-center",
                hideBelow: "sm",
              },
              {
                header: "Concl.",
                accessor: "completedAppointments",
                sortable: true,
                className: "text-center",
                hideBelow: "md",
                render: (val) => (
                  <span className="text-green-600 font-medium">
                    {String(val)}
                  </span>
                ),
              },
              {
                header: "Ausências",
                accessor: "noShows",
                sortable: true,
                className: "text-center",
                hideBelow: "md",
                render: (val, row) => (
                  <span
                    className={
                      row.noShows > 0
                        ? "text-red-600 font-medium"
                        : "text-gray-600"
                    }
                  >
                    {String(val)}
                  </span>
                ),
              },
              {
                header: "Último Acesso",
                accessor: "lastLoginAt",
                sortable: true,
                hideBelow: "lg",
                render: (_, row) => (
                  <span className="text-gray-500 text-sm">
                    {row.lastLoginAt
                      ? formatDate(row.lastLoginAt)
                      : "Nunca acessou"}
                  </span>
                ),
              },
              {
                header: "Ações",
                accessor: "id",
                className: "text-center",
                render: (_, row) => (
                  <div className="flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToggleModal(row);
                      }}
                      title={row.active ? "Desativar" : "Ativar"}
                    >
                      <Power
                        className={`h-4 w-4 ${row.active ? "text-red-500" : "text-green-500"}`}
                      />
                    </Button>
                    {row.userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setResetModal(row);
                        }}
                        title="Resetar senha"
                      >
                        <Key className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                ),
              },
            ];

            return (
              <DataTable<EmployeeItem>
                columns={employeeColumns}
                data={employees}
                loading={loading}
                rowKey="id"
                emptyMessage="Nenhum funcionário encontrado"
                emptyIcon={<Users />}
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

        {/* Toggle Status Modal */}
        <Modal
          isOpen={!!toggleModal}
          onClose={() => setToggleModal(null)}
          title={
            toggleModal?.active ? "Desativar Funcionário" : "Ativar Funcionário"
          }
          size="sm"
        >
          {toggleModal && (
            <>
              {toggleModal.active ? (
                <Alert variant="warning" title="Atenção">
                  Ao desativar <strong>{toggleModal.name}</strong>, o
                  funcionário não poderá mais fazer login ou agendar sessões.
                </Alert>
              ) : (
                <Alert variant="info" title="Reativação">
                  O funcionário <strong>{toggleModal.name}</strong> será
                  reativado e poderá fazer login novamente.
                </Alert>
              )}
              <ModalFooter>
                <Button variant="ghost" onClick={() => setToggleModal(null)}>
                  Cancelar
                </Button>
                <Button
                  variant={toggleModal.active ? "danger" : "primary"}
                  onClick={handleToggleStatus}
                  isLoading={toggling}
                >
                  {toggleModal.active ? "Desativar" : "Ativar"}
                </Button>
              </ModalFooter>
            </>
          )}
        </Modal>

        {/* Reset Password Modal */}
        <Modal
          isOpen={!!resetModal}
          onClose={() => setResetModal(null)}
          title="Redefinir Senha"
          size="sm"
        >
          {resetModal && (
            <>
              <Alert variant="info" title="Redefinição de Senha">
                Será enviado um link de redefinição de senha para o email{" "}
                <strong>{resetModal.email}</strong>.
              </Alert>
              <ModalFooter>
                <Button variant="ghost" onClick={() => setResetModal(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleResetPassword}
                  isLoading={resetting}
                >
                  Enviar Link
                </Button>
              </ModalFooter>
            </>
          )}
        </Modal>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
