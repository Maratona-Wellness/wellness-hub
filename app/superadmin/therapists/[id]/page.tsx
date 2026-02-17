"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Power,
  Pencil,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/molecules/Card";
import { Tabs } from "@/components/molecules/Tabs";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { Alert } from "@/components/molecules/Alert";
import { FormField } from "@/components/molecules/FormField";
import { AuthGuard } from "@/components/AuthGuard";

interface TherapistDetails {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  cpf: string;
  specialties: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    active: boolean;
    lastLoginAt: string | null;
  } | null;
  therapistAssignments: Array<{
    id: string;
    active: boolean;
    createdAt: string;
    tenant: {
      id: string;
      name: string;
      domain: string;
      active: boolean;
    };
    location: {
      id: string;
      name: string;
      address: string;
    };
  }>;
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    futureAppointments: number;
    activeAssignments: number;
    totalSlots: number;
  };
}

interface TenantOption {
  id: string;
  name: string;
  domain: string;
  active: boolean;
}

interface LocationOption {
  id: string;
  name: string;
  address: string;
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TherapistDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toasts, addToast, removeToast } = useToast();

  const [therapist, setTherapist] = useState<TherapistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Edit state
  const [editName, setEditName] = useState("");
  const [editSpecialties, setEditSpecialties] = useState("");
  const [saving, setSaving] = useState(false);

  // Toggle status
  const [toggleModal, setToggleModal] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Assignment modal
  const [assignModal, setAssignModal] = useState(false);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [assigningSaving, setAssigningSaving] = useState(false);

  // Remove assignment modal
  const [removeModal, setRemoveModal] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const fetchTherapist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/therapists/${id}`);
      const data = await res.json();

      if (data.success) {
        setTherapist(data.data);
        setEditName(data.data.name);
        setEditSpecialties(data.data.specialties || "");
      } else {
        addToast("error", "Terapeuta não encontrado");
        router.push("/superadmin/therapists");
      }
    } catch {
      addToast("error", "Erro ao carregar terapeuta");
    } finally {
      setLoading(false);
    }
  }, [id, router, addToast]);

  useEffect(() => {
    fetchTherapist();
  }, [fetchTherapist]);

  // Fetch tenants for assignment modal
  const fetchTenants = async () => {
    try {
      const res = await fetch(
        "/api/admin/tenants?limit=100&status=active&sortBy=name&sortOrder=asc",
      );
      const data = await res.json();
      if (data.success) {
        setTenants(data.data);
      }
    } catch {
      addToast("error", "Erro ao carregar empresas");
    }
  };

  // Fetch locations for selected tenant
  const fetchLocations = async (tenantId: string) => {
    setLoadingLocations(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/locations`);
      const data = await res.json();
      if (data.success) {
        setLocations(data.data);
      }
    } catch {
      addToast("error", "Erro ao carregar localizações");
    } finally {
      setLoadingLocations(false);
    }
  };

  // Handle edit save
  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/therapists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          specialties: editSpecialties.trim() || "",
        }),
      });
      const data = await res.json();

      if (data.success) {
        addToast("success", "Terapeuta atualizado com sucesso");
        fetchTherapist();
      } else {
        addToast("error", data.error || "Erro ao atualizar");
      }
    } catch {
      addToast("error", "Erro ao atualizar terapeuta");
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      const res = await fetch(`/api/admin/therapists/${id}/toggle-status`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (data.success) {
        addToast(
          "success",
          therapist?.active
            ? "Terapeuta desativado com sucesso"
            : "Terapeuta ativado com sucesso",
        );
        setToggleModal(false);
        fetchTherapist();
      } else {
        addToast("error", data.error || "Erro ao alterar status");
      }
    } catch {
      addToast("error", "Erro ao alterar status");
    } finally {
      setToggling(false);
    }
  };

  // Handle assignment create
  const handleCreateAssignment = async () => {
    if (!selectedTenant || selectedLocations.length === 0) return;

    setAssigningSaving(true);
    try {
      const res = await fetch(`/api/admin/therapists/${id}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenant,
          locationIds: selectedLocations,
        }),
      });
      const data = await res.json();

      if (data.success) {
        addToast("success", data.message || "Vinculação criada com sucesso");
        setAssignModal(false);
        setSelectedTenant("");
        setSelectedLocations([]);
        setLocations([]);
        fetchTherapist();
      } else {
        addToast("error", data.error || "Erro ao criar vinculação");
      }
    } catch {
      addToast("error", "Erro ao criar vinculação");
    } finally {
      setAssigningSaving(false);
    }
  };

  // Handle assignment remove
  const handleRemoveAssignment = async () => {
    if (!removeModal) return;

    setRemoving(true);
    try {
      const res = await fetch(
        `/api/admin/therapists/${id}/assignments/${removeModal}`,
        { method: "DELETE" },
      );
      const data = await res.json();

      if (data.success) {
        addToast("success", data.message || "Vinculação removida com sucesso");
        setRemoveModal(null);
        fetchTherapist();
      } else {
        addToast("error", data.error || "Erro ao remover vinculação");
      }
    } catch {
      addToast("error", "Erro ao remover vinculação");
    } finally {
      setRemoving(false);
    }
  };

  // Open assignment modal
  const openAssignModal = () => {
    fetchTenants();
    setAssignModal(true);
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!therapist) return null;

  // Tab: Visão Geral content
  const overviewContent = (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4 p-2">
          <Text variant="h4">Dados Pessoais</Text>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Text
                variant="label"
                className="text-(--color-text-muted) text-xs"
              >
                Nome
              </Text>
              <Text variant="p">{therapist.name}</Text>
            </div>
            <div>
              <Text
                variant="label"
                className="text-(--color-text-muted) text-xs"
              >
                Email
              </Text>
              <Text variant="p">{therapist.email}</Text>
            </div>
            <div>
              <Text
                variant="label"
                className="text-(--color-text-muted) text-xs"
              >
                CPF
              </Text>
              <Text variant="p">{formatCPF(therapist.cpf)}</Text>
            </div>
            <div>
              <Text
                variant="label"
                className="text-(--color-text-muted) text-xs"
              >
                Especialidades
              </Text>
              <Text variant="p">
                {therapist.specialties || (
                  <span className="italic text-(--color-text-muted)">
                    Não informado
                  </span>
                )}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4 p-2">
          <Text variant="h4">Informações da Conta</Text>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Text
                variant="label"
                className="text-(--color-text-muted) text-xs"
              >
                Cadastrado em
              </Text>
              <Text variant="p">{formatDate(therapist.createdAt)}</Text>
            </div>
            <div>
              <Text
                variant="label"
                className="text-(--color-text-muted) text-xs"
              >
                Último login
              </Text>
              <Text variant="p">
                {therapist.user?.lastLoginAt
                  ? formatDateTime(therapist.user.lastLoginAt)
                  : "Nunca acessou"}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick assignments view */}
      {therapist.therapistAssignments.length > 0 && (
        <Card>
          <div className="space-y-3 p-2">
            <div className="flex items-center justify-between">
              <Text variant="h4">Vinculações Ativas</Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("assignments")}
              >
                Ver todas
              </Button>
            </div>
            <div className="space-y-2">
              {therapist.therapistAssignments.slice(0, 3).map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-3 rounded-lg border border-(--color-border) p-3"
                >
                  <Building2 size={16} className="text-(--color-text-muted)" />
                  <div className="flex-1">
                    <Text variant="p" className="text-sm font-medium">
                      {assignment.tenant.name}
                    </Text>
                    <Text
                      variant="span"
                      className="text-(--color-text-muted) text-xs"
                    >
                      <MapPin size={12} className="mr-1 inline" />
                      {assignment.location.name}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // Tab: Vinculações content
  const assignmentsContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Text variant="h4">
          Vinculações ({therapist.therapistAssignments.length})
        </Text>
        {therapist.active && (
          <Button
            size="sm"
            onClick={openAssignModal}
            leftIcon={<Plus size={16} />}
          >
            Nova Vinculação
          </Button>
        )}
      </div>

      {therapist.therapistAssignments.length === 0 ? (
        <EmptyState
          icon={<Building2 size={48} />}
          title="Nenhuma vinculação"
          description="Este terapeuta não está vinculado a nenhuma empresa/localização"
          action={
            therapist.active
              ? {
                  label: "Adicionar Vinculação",
                  onClick: openAssignModal,
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {therapist.therapistAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Building2 size={20} className="text-(--color-primary)" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Text variant="p" className="font-medium">
                        {assignment.tenant.name}
                      </Text>
                      <Badge
                        variant={assignment.tenant.active ? "success" : "error"}
                      >
                        {assignment.tenant.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <Text
                      variant="span"
                      className="text-(--color-text-muted) text-sm"
                    >
                      <MapPin size={14} className="mr-1 inline" />
                      {assignment.location.name} — {assignment.location.address}
                    </Text>
                    <Text
                      variant="span"
                      className="text-(--color-text-muted) mt-1 block text-xs"
                    >
                      Vinculado em {formatDate(assignment.createdAt)}
                    </Text>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoveModal(assignment.id)}
                  title="Remover vinculação"
                >
                  <Trash2 size={16} className="text-(--color-error)" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Tab: Editar content
  const editContent = (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4 p-2">
          <Text variant="h4" className="flex items-center gap-2">
            <Pencil size={18} />
            Editar Dados
          </Text>

          <FormField
            type="input"
            label="Nome Completo"
            inputProps={{
              value: editName,
              onChange: (e) => setEditName(e.target.value),
              placeholder: "Nome do terapeuta",
            }}
          />

          <FormField
            type="input"
            label="Especialidades"
            helpText="Ex: Massagem relaxante, Shiatsu, Reflexologia"
            inputProps={{
              value: editSpecialties,
              onChange: (e) => setEditSpecialties(e.target.value),
              placeholder: "Especialidades",
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              type="input"
              label="Email"
              helpText="Email não pode ser alterado"
              inputProps={{
                value: therapist.email,
                disabled: true,
              }}
            />

            <FormField
              type="input"
              label="CPF"
              helpText="CPF não pode ser alterado"
              inputProps={{
                value: formatCPF(therapist.cpf),
                disabled: true,
              }}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-(--color-border) pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setEditName(therapist.name);
                setEditSpecialties(therapist.specialties || "");
              }}
            >
              Resetar
            </Button>
            <Button
              onClick={handleSaveEdit}
              isLoading={saving}
              disabled={
                editName === therapist.name &&
                editSpecialties === (therapist.specialties || "")
              }
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: "overview", label: "Visão Geral", content: overviewContent },
    { id: "assignments", label: "Vinculações", content: assignmentsContent },
    { id: "edit", label: "Editar", content: editContent },
  ];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/superadmin/therapists")}
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <Text variant="h2">{therapist.name}</Text>
                  <Badge variant={therapist.active ? "success" : "error"}>
                    {therapist.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <Text variant="p" className="text-(--color-text-muted) mt-1">
                  {therapist.email} · CPF: {formatCPF(therapist.cpf)}
                </Text>
              </div>
            </div>
            <Button
              variant={therapist.active ? "danger" : "primary"}
              size="sm"
              onClick={() => setToggleModal(true)}
              leftIcon={<Power size={16} />}
            >
              {therapist.active ? "Desativar" : "Ativar"}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <div className="flex items-center gap-3 p-1">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar size={20} className="text-(--color-primary)" />
                </div>
                <div>
                  <Text
                    variant="span"
                    className="text-(--color-text-muted) text-xs"
                  >
                    Total Agend.
                  </Text>
                  <Text variant="h3">{therapist.stats.totalAppointments}</Text>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3 p-1">
                <div className="rounded-lg bg-(--color-success)/10 p-2">
                  <UserCheck size={20} className="text-(--color-success)" />
                </div>
                <div>
                  <Text
                    variant="span"
                    className="text-(--color-text-muted) text-xs"
                  >
                    Concluídos
                  </Text>
                  <Text variant="h3">
                    {therapist.stats.completedAppointments}
                  </Text>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3 p-1">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Clock size={20} className="text-(--color-accent)" />
                </div>
                <div>
                  <Text
                    variant="span"
                    className="text-(--color-text-muted) text-xs"
                  >
                    Futuros
                  </Text>
                  <Text variant="h3">{therapist.stats.futureAppointments}</Text>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3 p-1">
                <div className="rounded-lg bg-(--color-info)/10 p-2">
                  <Building2 size={20} className="text-(--color-info)" />
                </div>
                <div>
                  <Text
                    variant="span"
                    className="text-(--color-text-muted) text-xs"
                  >
                    Vinculações
                  </Text>
                  <Text variant="h3">{therapist.stats.activeAssignments}</Text>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Toggle Status Modal */}
        <Modal
          isOpen={toggleModal}
          onClose={() => setToggleModal(false)}
          title={therapist.active ? "Desativar Terapeuta" : "Ativar Terapeuta"}
          size="sm"
        >
          <div className="space-y-4">
            <Text variant="p">
              Tem certeza que deseja {therapist.active ? "desativar" : "ativar"}{" "}
              o terapeuta <strong>{therapist.name}</strong>?
            </Text>

            {therapist.active && (
              <>
                <Alert variant="warning">
                  Ao desativar, o terapeuta não poderá fazer login, suas
                  vinculações serão desativadas e não aparecerá em novas buscas.
                </Alert>
                {therapist.stats.futureAppointments > 0 && (
                  <Alert variant="error">
                    Atenção: Este terapeuta possui{" "}
                    <strong>{therapist.stats.futureAppointments}</strong>{" "}
                    agendamento(s) futuro(s).
                  </Alert>
                )}
              </>
            )}

            <ModalFooter>
              <Button variant="secondary" onClick={() => setToggleModal(false)}>
                Cancelar
              </Button>
              <Button
                variant={therapist.active ? "danger" : "primary"}
                onClick={handleToggleStatus}
                isLoading={toggling}
              >
                {therapist.active ? "Desativar" : "Ativar"}
              </Button>
            </ModalFooter>
          </div>
        </Modal>

        {/* Add Assignment Modal */}
        <Modal
          isOpen={assignModal}
          onClose={() => {
            setAssignModal(false);
            setSelectedTenant("");
            setSelectedLocations([]);
            setLocations([]);
          }}
          title="Adicionar Vinculação"
          size="md"
        >
          <div className="space-y-4">
            <FormField
              type="select"
              label="Empresa"
              required
              selectProps={{
                value: selectedTenant,
                onChange: (e) => {
                  setSelectedTenant(e.target.value);
                  setSelectedLocations([]);
                  if (e.target.value) {
                    fetchLocations(e.target.value);
                  } else {
                    setLocations([]);
                  }
                },
                options: [
                  { value: "", label: "Selecione uma empresa..." },
                  ...tenants.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.domain})`,
                  })),
                ],
              }}
            />

            {selectedTenant && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-(--color-secondary)">
                  Localizações
                  <span className="text-red-500 ml-1">*</span>
                </label>
                {loadingLocations ? (
                  <div className="flex justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : locations.length === 0 ? (
                  <Text
                    variant="p"
                    className="text-(--color-text-muted) text-sm"
                  >
                    Nenhuma localização encontrada para esta empresa
                  </Text>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-(--color-border) p-3">
                    {locations.map((location) => {
                      const isAlreadyAssigned =
                        therapist.therapistAssignments.some(
                          (a) =>
                            a.location.id === location.id &&
                            a.tenant.id === selectedTenant,
                        );

                      return (
                        <label
                          key={location.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-(--color-background-alt) ${
                            isAlreadyAssigned
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedLocations.includes(location.id)}
                            disabled={isAlreadyAssigned}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLocations((prev) => [
                                  ...prev,
                                  location.id,
                                ]);
                              } else {
                                setSelectedLocations((prev) =>
                                  prev.filter((id) => id !== location.id),
                                );
                              }
                            }}
                            className="rounded border-(--color-border) text-(--color-primary) focus:ring-(--color-primary)"
                          />
                          <div>
                            <Text variant="p" className="text-sm font-medium">
                              {location.name}
                            </Text>
                            <Text
                              variant="span"
                              className="text-(--color-text-muted) text-xs"
                            >
                              {location.address}
                            </Text>
                            {isAlreadyAssigned && (
                              <Text
                                variant="span"
                                className="text-(--color-warning) ml-2 text-xs"
                              >
                                (já vinculado)
                              </Text>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <ModalFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setAssignModal(false);
                  setSelectedTenant("");
                  setSelectedLocations([]);
                  setLocations([]);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAssignment}
                isLoading={assigningSaving}
                disabled={!selectedTenant || selectedLocations.length === 0}
              >
                Vincular ({selectedLocations.length})
              </Button>
            </ModalFooter>
          </div>
        </Modal>

        {/* Remove Assignment Modal */}
        <Modal
          isOpen={!!removeModal}
          onClose={() => setRemoveModal(null)}
          title="Remover Vinculação"
          size="sm"
        >
          <div className="space-y-4">
            <Text variant="p">
              Tem certeza que deseja remover esta vinculação?
            </Text>

            <Alert variant="warning">
              O terapeuta não poderá mais atender nesta localização.
              Agendamentos futuros existentes não serão cancelados
              automaticamente.
            </Alert>

            <ModalFooter>
              <Button variant="secondary" onClick={() => setRemoveModal(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleRemoveAssignment}
                isLoading={removing}
              >
                Remover
              </Button>
            </ModalFooter>
          </div>
        </Modal>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
