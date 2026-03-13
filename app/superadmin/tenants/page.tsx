"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Eye,
  Pencil,
  Power,
  MapPin,
  Users,
  Calendar,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { SearchBar } from "@/components/molecules/SearchBar";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/molecules/DataTable";
import { Card } from "@/components/molecules/Card";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { Alert } from "@/components/molecules/Alert";
import { AuthGuard } from "@/components/AuthGuard";
import { Select } from "@/components/ui/Select";

interface TenantListItem {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    employees: number;
    locations: number;
    appointments: number;
  };
}

interface TenantsResponse {
  success: boolean;
  data: TenantListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function TenantsPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toggleModal, setToggleModal] = useState<TenantListItem | null>(null);
  const [toggling, setToggling] = useState(false);

  const limit = 10;

  const fetchTenants = useCallback(async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: statusFilter,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (search) {
      params.set("search", search);
    }

    const res = await fetch(`/api/admin/tenants?${params}`);
    const data: TenantsResponse = await res.json();

    if (data.success) {
      setTenants(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    try {
      fetchTenants();
    } catch {
      addToast("error", "Erro ao carregar empresas", Date.now() + 5000);
    } finally {
      setLoading(false);
    }
  }, [fetchTenants, addToast]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleToggleStatus = async () => {
    if (!toggleModal) return;
    setToggling(true);

    try {
      const res = await fetch(
        `/api/admin/tenants/${toggleModal.id}/toggle-status`,
        { method: "PATCH" },
      );
      const data = await res.json();

      if (data.success) {
        addToast("success", data.message, Date.now() + 5000);
        fetchTenants();
      } else {
        addToast(
          "error",
          data.error || "Erro ao alterar status",
          Date.now() + 5000,
        );
      }
    } catch {
      addToast("error", "Erro ao alterar status da empresa", Date.now() + 5000);
    } finally {
      setToggling(false);
      setToggleModal(null);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Text variant="h2">Empresas</Text>
              <Text variant="p" className="text-gray-600">
                Gerencie as empresas clientes da plataforma
              </Text>
            </div>
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => router.push("/superadmin/tenants/new")}
            >
              Nova Empresa
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchBar
                  value={search}
                  onChange={handleSearch}
                  placeholder="Buscar por nome ou domínio..."
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
          </Card>

          {/* Table */}
          {(() => {
            const tenantColumns: DataTableColumn<TenantListItem>[] = [
              {
                header: "Empresa",
                accessor: "name",
                sortable: true,
                render: (_, row) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Building2 className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="font-medium text-(--color-secondary)">
                      {row.name}
                    </span>
                  </div>
                ),
              },
              {
                header: "Domínio",
                accessor: "domain",
                sortable: true,
                hideBelow: "md",
              },
              {
                header: "Status",
                accessor: "active",
                className: "text-center",
                render: (_, row) => (
                  <Badge variant={row.active ? "success" : "error"}>
                    {row.active ? "Ativo" : "Inativo"}
                  </Badge>
                ),
              },
              {
                header: "Locais",
                accessor: "id",
                className: "text-center",
                hideBelow: "sm",
                render: (_, row) => (
                  <span className="text-gray-600">{row._count.locations}</span>
                ),
              },
              {
                header: "Funcionários",
                accessor: "id",
                className: "text-center",
                hideBelow: "md",
                render: (_, row) => (
                  <span className="text-gray-600">{row._count.employees}</span>
                ),
              },
              {
                header: "Agendamentos",
                accessor: "id",
                className: "text-center",
                hideBelow: "lg",
                render: (_, row) => (
                  <span className="text-gray-600">
                    {row._count.appointments}
                  </span>
                ),
              },
            ];

            return (
              <DataTable<TenantListItem>
                columns={tenantColumns}
                data={tenants}
                loading={loading}
                rowKey="id"
                emptyMessage="Nenhuma empresa encontrada"
                emptyIcon={<Building2 />}
                emptyAction={
                  !search
                    ? {
                        label: "Nova Empresa",
                        onClick: () => router.push("/superadmin/tenants/new"),
                      }
                    : undefined
                }
                onRowClick={(row) =>
                  router.push(`/superadmin/tenants/${row.id}`)
                }
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
          title={toggleModal?.active ? "Desativar Empresa" : "Ativar Empresa"}
          size="sm"
        >
          {toggleModal && (
            <>
              {toggleModal.active ? (
                <Alert variant="warning" title="Atenção">
                  Ao desativar a empresa <strong>{toggleModal.name}</strong>, os
                  funcionários não poderão mais fazer login ou agendar sessões.
                  Os dados serão mantidos.
                  {toggleModal._count.employees > 0 && (
                    <p className="mt-2">
                      <strong>{toggleModal._count.employees}</strong>{" "}
                      funcionário(s) serão impactados.
                    </p>
                  )}
                </Alert>
              ) : (
                <Alert variant="info" title="Reativação">
                  A empresa <strong>{toggleModal.name}</strong> será reativada e
                  seus funcionários poderão fazer login novamente.
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

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
