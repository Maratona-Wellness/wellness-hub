"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Users,
  Calendar,
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  BarChart3,
  Package,
  UserCog,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/molecules/Card";
import { Tabs, type Tab } from "@/components/molecules/Tabs";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import { FormField } from "@/components/molecules/FormField";
import { Alert } from "@/components/molecules/Alert";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

interface TenantDetails {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  locations: LocationItem[];
  admins: AdminItem[];
  stats: {
    totalEmployees: number;
    totalLocations: number;
    totalAppointments: number;
    activePrograms: number;
    activeTherapists: number;
    utilizationRate: number;
  };
}

interface AdminItem {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
}

interface LocationItem {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  _count?: {
    therapistAssignments: number;
    appointments: number;
    availabilitySlots: number;
  };
}

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const { toasts, addToast, removeToast } = useToast();

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // Location modal state
  const [locationModal, setLocationModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: LocationItem;
  }>({ open: false, mode: "create" });
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationErrors, setLocationErrors] = useState<Record<string, string>>(
    {},
  );

  // Delete location modal
  const [deleteModal, setDeleteModal] = useState<LocationItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setTenant(data.data);
      } else {
        addToast("error", "Erro ao carregar empresa");
      }
    } catch {
      addToast("error", "Erro ao carregar empresa");
    } finally {
      setLoading(false);
    }
  }, [tenantId, addToast]);

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/locations`);
      const data = await res.json();
      if (data.success) {
        setLocations(data.data);
      }
    } catch {
      addToast("error", "Erro ao carregar localizações");
    } finally {
      setLocationsLoading(false);
    }
  }, [tenantId, addToast]);

  useEffect(() => {
    fetchTenant();
    fetchLocations();
  }, [fetchTenant, fetchLocations]);

  const openLocationModal = (mode: "create" | "edit", data?: LocationItem) => {
    setLocationModal({ open: true, mode, data });
    setLocationName(data?.name || "");
    setLocationAddress(data?.address || "");
    setLocationErrors({});
  };

  const closeLocationModal = () => {
    setLocationModal({ open: false, mode: "create" });
    setLocationName("");
    setLocationAddress("");
    setLocationErrors({});
  };

  const handleSaveLocation = async () => {
    const errors: Record<string, string> = {};
    if (!locationName.trim() || locationName.length < 2)
      errors.name = "O nome deve ter pelo menos 2 caracteres";
    if (!locationAddress.trim() || locationAddress.length < 5)
      errors.address = "O endereço deve ter pelo menos 5 caracteres";

    if (Object.keys(errors).length > 0) {
      setLocationErrors(errors);
      return;
    }

    setLocationSaving(true);

    try {
      const isEdit = locationModal.mode === "edit" && locationModal.data;
      const url = isEdit
        ? `/api/admin/locations/${locationModal.data!.id}`
        : `/api/admin/tenants/${tenantId}/locations`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locationName.trim(),
          address: locationAddress.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        addToast(
          "success",
          isEdit
            ? "Localização atualizada com sucesso"
            : "Localização criada com sucesso",
        );
        closeLocationModal();
        fetchLocations();
        fetchTenant();
      } else {
        addToast("error", data.error);
      }
    } catch {
      addToast("error", "Erro ao salvar localização");
    } finally {
      setLocationSaving(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteModal) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/locations/${deleteModal.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        addToast("success", "Localização removida com sucesso");
        fetchLocations();
        fetchTenant();
      } else {
        addToast("error", data.error);
      }
    } catch {
      addToast("error", "Erro ao remover localização");
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!tenant) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <EmptyState
            icon={<Building2 />}
            title="Empresa não encontrada"
            description="A empresa solicitada não existe ou foi removida"
            action={{
              label: "Voltar para lista",
              onClick: () => router.push("/superadmin/tenants"),
            }}
          />
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const statCards = [
    {
      label: "Funcionários",
      value: tenant.stats.totalEmployees,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Localizações",
      value: tenant.stats.totalLocations,
      icon: MapPin,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Agendamentos",
      value: tenant.stats.totalAppointments,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Programas Ativos",
      value: tenant.stats.activePrograms,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Terapeutas",
      value: tenant.stats.activeTherapists,
      icon: UserCog,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Taxa de Utilização",
      value: `${tenant.stats.utilizationRate}%`,
      icon: BarChart3,
      color: "text-(--color-accent)",
      bg: "bg-red-50",
    },
  ];

  const tabs: Tab[] = [
    {
      id: "overview",
      label: "Visão Geral",
      content: (
        <div className="space-y-6 pt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-semibold text-(--color-secondary)">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Tenant Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-(--color-secondary)">
                    {tenant.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Domínio</dt>
                  <dd className="mt-1 text-(--color-secondary)">
                    {tenant.domain}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={tenant.active ? "success" : "error"}>
                      {tenant.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Cadastrado em
                  </dt>
                  <dd className="mt-1 text-(--color-secondary)">
                    {new Date(tenant.createdAt).toLocaleDateString("pt-BR")}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "locations",
      label: "Localizações",
      content: (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <Text variant="h4">Localizações ({locations.length})</Text>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => openLocationModal("create")}
            >
              Nova Localização
            </Button>
          </div>

          {locationsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : locations.length === 0 ? (
            <EmptyState
              icon={<MapPin />}
              title="Nenhuma localização cadastrada"
              description="Adicione a primeira localização para esta empresa"
              action={{
                label: "Nova Localização",
                onClick: () => openLocationModal("create"),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locations.map((location) => (
                <Card key={location.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-(--color-secondary)">
                          {location.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {location.address}
                        </p>
                        {location._count && (
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>
                              {location._count.therapistAssignments}{" "}
                              terapeuta(s)
                            </span>
                            <span>
                              {location._count.appointments} agendamento(s)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openLocationModal("edit", location)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteModal(location)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "admins",
      label: "Administradores",
      content: (
        <div className="space-y-4 pt-4">
          <Text variant="h4">
            Administradores ({tenant.admins?.length || 0})
          </Text>
          {!tenant.admins || tenant.admins.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title="Nenhum administrador cadastrado"
              description="Administradores são criados no wizard de criação do tenant"
            />
          ) : (
            <div className="space-y-3">
              {tenant.admins.map((admin) => (
                <Card key={admin.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <UserCog className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-(--color-secondary)">
                          {admin.name}
                        </p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={admin.active ? "success" : "error"}>
                        {admin.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        Desde{" "}
                        {new Date(admin.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/superadmin/tenants")}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Voltar
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                <Building2 className="h-7 w-7 text-gray-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Text variant="h2">{tenant.name}</Text>
                  <Badge variant={tenant.active ? "success" : "error"}>
                    {tenant.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <Text variant="p" className="text-gray-600">
                  {tenant.domain}
                </Text>
              </div>
            </div>
            <Button
              variant="secondary"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() =>
                router.push(`/superadmin/tenants/${tenantId}/edit`)
              }
            >
              Editar
            </Button>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} defaultTab="overview" />
        </div>

        {/* Location Create/Edit Modal */}
        <Modal
          isOpen={locationModal.open}
          onClose={closeLocationModal}
          title={
            locationModal.mode === "create"
              ? "Nova Localização"
              : "Editar Localização"
          }
          size="md"
        >
          <div className="space-y-4">
            <FormField
              type="input"
              label="Nome"
              required
              error={locationErrors.name}
              inputProps={{
                value: locationName,
                onChange: (e) => setLocationName(e.target.value),
                placeholder: "Ex: Sede São Paulo",
              }}
            />
            <FormField
              type="input"
              label="Endereço"
              required
              error={locationErrors.address}
              inputProps={{
                value: locationAddress,
                onChange: (e) => setLocationAddress(e.target.value),
                placeholder: "Ex: Av. Paulista, 1000 - São Paulo/SP",
              }}
            />
          </div>
          <ModalFooter>
            <Button variant="ghost" onClick={closeLocationModal}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveLocation}
              isLoading={locationSaving}
            >
              {locationModal.mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Delete Location Modal */}
        <Modal
          isOpen={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Excluir Localização"
          size="sm"
        >
          {deleteModal && (
            <>
              <Alert variant="warning" title="Atenção">
                Deseja realmente excluir a localização{" "}
                <strong>{deleteModal.name}</strong>? Esta ação não pode ser
                desfeita.
              </Alert>
              <ModalFooter>
                <Button variant="ghost" onClick={() => setDeleteModal(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteLocation}
                  isLoading={deleting}
                >
                  Excluir
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
