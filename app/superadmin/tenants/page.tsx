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
import { Spinner } from "@/components/ui/Spinner";
import { SearchBar } from "@/components/molecules/SearchBar";
import { Pagination } from "@/components/molecules/Pagination";
import { EmptyState } from "@/components/molecules/EmptyState";
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
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : tenants.length === 0 ? (
            <EmptyState
              icon={<Building2 />}
              title="Nenhuma empresa encontrada"
              description={
                search
                  ? "Tente ajustar os filtros de busca"
                  : "Cadastre a primeira empresa para começar"
              }
              action={
                !search
                  ? {
                      label: "Nova Empresa",
                      onClick: () => router.push("/superadmin/tenants/new"),
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 font-medium text-gray-600">
                          Empresa
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-gray-600">
                          Domínio
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          Status
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          Locais
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          <Users className="h-4 w-4 inline mr-1" />
                          Funcionários
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Agendamentos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tenants.map((tenant) => (
                        <tr
                          key={tenant.id}
                          className="hover:bg-gray-50 transition-colors"
                          onClick={() =>
                            router.push(`/superadmin/tenants/${tenant.id}`)
                          }
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                <Building2 className="h-5 w-5 text-gray-600" />
                              </div>
                              <div>
                                <span className="font-medium text-(--color-secondary)">
                                  {tenant.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {tenant.domain}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              variant={tenant.active ? "success" : "error"}
                            >
                              {tenant.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            {tenant._count.locations}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            {tenant._count.employees}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            {tenant._count.appointments}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Pagination */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={total}
                itemsPerPage={limit}
              />
            </>
          )}
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
