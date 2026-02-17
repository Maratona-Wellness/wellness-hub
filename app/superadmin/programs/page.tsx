"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Pencil,
  Power,
  Clock,
  Building2,
  Calendar,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SearchBar } from "@/components/molecules/SearchBar";
import { Pagination } from "@/components/molecules/Pagination";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Card } from "@/components/molecules/Card";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { Alert } from "@/components/molecules/Alert";
import { AuthGuard } from "@/components/AuthGuard";

interface ProgramListItem {
  id: string;
  tenantId: string;
  name: string;
  sessionDurationMinutes: number;
  dayStart: string;
  dayEnd: string;
  dailyCapacityPerLocation: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tenant: { id: string; name: string; domain: string };
  _count: {
    availabilitySlots: number;
    appointments: number;
  };
}

interface TenantOption {
  id: string;
  name: string;
  domain: string;
}

interface ProgramFormData {
  name: string;
  tenantId: string;
  sessionDurationMinutes: number;
  dayStart: string;
  dayEnd: string;
  dailyCapacityPerLocation: number;
}

const defaultFormData: ProgramFormData = {
  name: "",
  tenantId: "",
  sessionDurationMinutes: 30,
  dayStart: "08:00",
  dayEnd: "18:00",
  dailyCapacityPerLocation: 10,
};

export default function ProgramsPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("");

  // Tenants para filtro e formulário
  const [tenants, setTenants] = useState<TenantOption[]>([]);

  // Modal state
  const [formModal, setFormModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    programId?: string;
  }>({ open: false, mode: "create" });
  const [formData, setFormData] = useState<ProgramFormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Toggle modal
  const [toggleModal, setToggleModal] = useState<ProgramListItem | null>(null);
  const [toggling, setToggling] = useState(false);

  const limit = 10;

  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/admin/tenants?limit=100&status=active&sortBy=name&sortOrder=asc",
      );
      const data = await res.json();
      if (data.success) {
        setTenants(
          data.data.map((t: TenantOption & { _count?: unknown }) => ({
            id: t.id,
            name: t.name,
            domain: t.domain,
          })),
        );
      }
    } catch {
      // Silently fail
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        sortBy: "name",
        sortOrder: "asc",
      });

      if (search) params.set("search", search);
      if (tenantFilter) params.set("tenantId", tenantFilter);

      const res = await fetch(`/api/admin/programs?${params}`);
      const data = await res.json();

      if (data.success) {
        setPrograms(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {
      addToast("error", "Erro ao carregar programas");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, tenantFilter, addToast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openCreateModal = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setFormModal({ open: true, mode: "create" });
  };

  const openEditModal = (program: ProgramListItem) => {
    setFormData({
      name: program.name,
      tenantId: program.tenantId,
      sessionDurationMinutes: program.sessionDurationMinutes,
      dayStart: program.dayStart,
      dayEnd: program.dayEnd,
      dailyCapacityPerLocation: program.dailyCapacityPerLocation,
    });
    setFormErrors({});
    setFormModal({ open: true, mode: "edit", programId: program.id });
  };

  const closeFormModal = () => {
    setFormModal({ open: false, mode: "create" });
    setFormData(defaultFormData);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.length < 2)
      errors.name = "O nome deve ter pelo menos 2 caracteres";
    if (formModal.mode === "create" && !formData.tenantId)
      errors.tenantId = "Selecione uma empresa";
    if (
      formData.sessionDurationMinutes < 10 ||
      formData.sessionDurationMinutes > 480
    )
      errors.sessionDurationMinutes = "Duração deve ser entre 10 e 480 minutos";
    if (!formData.dayStart) errors.dayStart = "Horário de início obrigatório";
    if (!formData.dayEnd) errors.dayEnd = "Horário de término obrigatório";
    if (
      formData.dayStart &&
      formData.dayEnd &&
      formData.dayEnd <= formData.dayStart
    )
      errors.dayEnd = "O horário de término deve ser posterior ao de início";
    if (
      formData.dailyCapacityPerLocation < 1 ||
      formData.dailyCapacityPerLocation > 100
    )
      errors.dailyCapacityPerLocation = "Capacidade deve ser entre 1 e 100";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      const isEdit = formModal.mode === "edit" && formModal.programId;
      const url = isEdit
        ? `/api/admin/programs/${formModal.programId}`
        : "/api/admin/programs";
      const method = isEdit ? "PATCH" : "POST";

      const payload = isEdit
        ? {
            name: formData.name,
            sessionDurationMinutes: formData.sessionDurationMinutes,
            dayStart: formData.dayStart,
            dayEnd: formData.dayEnd,
            dailyCapacityPerLocation: formData.dailyCapacityPerLocation,
          }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        addToast("success", data.message || "Operação realizada com sucesso");
        closeFormModal();
        fetchPrograms();
      } else {
        addToast("error", data.error || "Erro ao salvar programa");
      }
    } catch {
      addToast("error", "Erro ao salvar programa");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!toggleModal) return;
    setToggling(true);

    try {
      const res = await fetch(
        `/api/admin/programs/${toggleModal.id}/toggle-status`,
        { method: "PATCH" },
      );
      const data = await res.json();

      if (data.success) {
        addToast("success", data.message);
        setToggleModal(null);
        fetchPrograms();
      } else {
        addToast("error", data.error || "Erro ao alterar status");
      }
    } catch {
      addToast("error", "Erro ao alterar status do programa");
    } finally {
      setToggling(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Programas</Text>
              <Text variant="p" className="text-gray-600 mt-1">
                Gerencie os programas de bem-estar disponíveis na plataforma
              </Text>
            </div>
            <Button onClick={openCreateModal} leftIcon={<Plus size={18} />}>
              Novo Programa
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <SearchBar
                  placeholder="Buscar por nome do programa..."
                  onChange={handleSearch}
                  value={search}
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={tenantFilter}
                  onChange={(e) => {
                    setTenantFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "Todas as empresas" },
                    ...tenants.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>
              <div className="w-full sm:w-40">
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

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : programs.length === 0 ? (
            <EmptyState
              icon={<Package size={48} />}
              title="Nenhum programa encontrado"
              description={
                search || statusFilter !== "all" || tenantFilter
                  ? "Tente ajustar os filtros de busca"
                  : "Crie o primeiro programa da plataforma"
              }
              action={
                !search && statusFilter === "all" && !tenantFilter
                  ? { label: "Novo Programa", onClick: openCreateModal }
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
                          Programa
                        </th>
                        <th className="text-left px-6 py-3 font-medium text-gray-600">
                          <Building2 className="h-4 w-4 inline mr-1" />
                          Empresa
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Duração
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          Horário
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          Capacidade
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          Status
                        </th>
                        <th className="text-center px-6 py-3 font-medium text-gray-600">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Slots
                        </th>
                        <th className="text-right px-6 py-3 font-medium text-gray-600">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {programs.map((program) => (
                        <tr
                          key={program.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                                <Package className="h-5 w-5 text-purple-600" />
                              </div>
                              <span className="font-medium text-(--color-secondary)">
                                {program.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {program.tenant.name}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            {program.sessionDurationMinutes} min
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            {program.dayStart} - {program.dayEnd}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            {program.dailyCapacityPerLocation}/local
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge
                              variant={program.active ? "success" : "error"}
                            >
                              {program.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            {program._count.availabilitySlots}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(program)}
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setToggleModal(program)}
                                title={program.active ? "Desativar" : "Ativar"}
                              >
                                <Power
                                  size={16}
                                  className={
                                    program.active
                                      ? "text-red-500"
                                      : "text-green-500"
                                  }
                                />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

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

        {/* Create/Edit Modal */}
        <Modal
          isOpen={formModal.open}
          onClose={closeFormModal}
          title={
            formModal.mode === "create" ? "Novo Programa" : "Editar Programa"
          }
          size="md"
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-(--color-secondary)">
                Nome do Programa <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Massagem Relaxante"
                error={formErrors.name}
              />
            </div>

            {formModal.mode === "create" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-(--color-secondary)">
                  Empresa <span className="text-red-500 ml-1">*</span>
                </label>
                <Select
                  value={formData.tenantId}
                  onChange={(e) =>
                    setFormData({ ...formData, tenantId: e.target.value })
                  }
                  options={[
                    { value: "", label: "Selecione uma empresa..." },
                    ...tenants.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                  error={formErrors.tenantId}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-(--color-secondary)">
                Duração da Sessão (minutos){" "}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                type="number"
                value={formData.sessionDurationMinutes.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sessionDurationMinutes: parseInt(e.target.value) || 0,
                  })
                }
                min={10}
                max={480}
                error={formErrors.sessionDurationMinutes}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-(--color-secondary)">
                  Horário de Início <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.dayStart}
                  onChange={(e) =>
                    setFormData({ ...formData, dayStart: e.target.value })
                  }
                  error={formErrors.dayStart}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-(--color-secondary)">
                  Horário de Término{" "}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.dayEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, dayEnd: e.target.value })
                  }
                  error={formErrors.dayEnd}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-(--color-secondary)">
                Capacidade Diária por Local{" "}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                type="number"
                value={formData.dailyCapacityPerLocation.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dailyCapacityPerLocation: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
                max={100}
                error={formErrors.dailyCapacityPerLocation}
              />
              <p className="text-xs text-gray-500">
                Número máximo de sessões por dia em cada localização
              </p>
            </div>
          </div>

          <ModalFooter>
            <Button variant="ghost" onClick={closeFormModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              {formModal.mode === "create"
                ? "Criar Programa"
                : "Salvar Alterações"}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Toggle Status Modal */}
        <Modal
          isOpen={!!toggleModal}
          onClose={() => setToggleModal(null)}
          title={toggleModal?.active ? "Desativar Programa" : "Ativar Programa"}
          size="sm"
        >
          {toggleModal && (
            <>
              {toggleModal.active ? (
                <Alert variant="warning" title="Atenção">
                  Ao desativar o programa <strong>{toggleModal.name}</strong>,
                  ele não aparecerá para novos agendamentos. Agendamentos
                  existentes serão mantidos.
                  {toggleModal._count.appointments > 0 && (
                    <p className="mt-2">
                      Este programa possui{" "}
                      <strong>{toggleModal._count.appointments}</strong>{" "}
                      agendamento(s) registrado(s).
                    </p>
                  )}
                </Alert>
              ) : (
                <Alert variant="info" title="Reativação">
                  O programa <strong>{toggleModal.name}</strong> será reativado
                  e poderá ser utilizado em novos agendamentos.
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
