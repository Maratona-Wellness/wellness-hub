"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Plus, Eye, Pencil, Power, Building2 } from "lucide-react";
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

interface TherapistListItem {
  id: string;
  email: string;
  name: string;
  cpf: string;
  specialties: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    therapistAssignments: number;
    appointments: number;
  };
}

interface TherapistsResponse {
  success: boolean;
  data: TherapistListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

export default function TherapistsPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [therapists, setTherapists] = useState<TherapistListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toggleModal, setToggleModal] = useState<TherapistListItem | null>(
    null,
  );
  const [toggling, setToggling] = useState(false);

  const limit = 10;

  const fetchTherapists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        sortBy: "name",
        sortOrder: "asc",
      });

      if (search) {
        params.set("search", search);
      }

      const res = await fetch(`/api/admin/therapists?${params}`);
      const data: TherapistsResponse = await res.json();

      if (data.success) {
        setTherapists(data.data);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch {
      addToast("error", "Erro ao carregar terapeutas");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, addToast]);

  useEffect(() => {
    fetchTherapists();
  }, [fetchTherapists]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleToggleStatus = async () => {
    if (!toggleModal) return;
    setToggling(true);

    try {
      const res = await fetch(
        `/api/admin/therapists/${toggleModal.id}/toggle-status`,
        { method: "PATCH" },
      );
      const data = await res.json();

      if (data.success) {
        addToast(
          "success",
          toggleModal.active
            ? "Terapeuta desativado com sucesso"
            : "Terapeuta ativado com sucesso",
        );
        setToggleModal(null);
        fetchTherapists();
      } else {
        addToast("error", data.error || "Erro ao alterar status");
      }
    } catch {
      addToast("error", "Erro ao alterar status do terapeuta");
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
              <Text variant="h2">Terapeutas</Text>
              <Text variant="p" className="text-(--color-text-muted) mt-1">
                Gerencie os terapeutas credenciados da plataforma
              </Text>
            </div>
            <Button
              onClick={() => router.push("/superadmin/therapists/new")}
              leftIcon={<Plus size={18} />}
            >
              Novo Terapeuta
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <SearchBar
                  placeholder="Buscar por nome, email ou CPF..."
                  onChange={handleSearch}
                  value={search}
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

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : therapists.length === 0 ? (
            <EmptyState
              icon={<UserCheck size={48} />}
              title="Nenhum terapeuta encontrado"
              description={
                search || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Cadastre o primeiro terapeuta da plataforma"
              }
              action={
                !search && statusFilter === "all"
                  ? {
                      label: "Cadastrar Terapeuta",
                      onClick: () => router.push("/superadmin/therapists/new"),
                    }
                  : undefined
              }
            />
          ) : (
            <>
              {/* Summary */}
              <Text variant="p" className="text-(--color-text-muted) text-sm">
                {total} terapeuta{total !== 1 ? "s" : ""} encontrado
                {total !== 1 ? "s" : ""}
              </Text>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-(--color-border)">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-(--color-border) bg-(--color-background-alt)">
                      <th className="px-4 py-3 text-left text-sm font-medium text-(--color-text-muted)">
                        Nome
                      </th>
                      <th className="hidden px-4 py-3 text-left text-sm font-medium text-(--color-text-muted) md:table-cell">
                        Email
                      </th>
                      <th className="hidden px-4 py-3 text-left text-sm font-medium text-(--color-text-muted) lg:table-cell">
                        CPF
                      </th>
                      <th className="hidden px-4 py-3 text-left text-sm font-medium text-(--color-text-muted) sm:table-cell">
                        Especialidades
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-(--color-text-muted)">
                        Vinculações
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-(--color-text-muted)">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-border)">
                    {therapists.map((therapist) => (
                      <tr
                        key={therapist.id}
                        className="hover:bg-(--color-background-alt) transition-colors"
                        onClick={() =>
                          router.push(`/superadmin/therapists/${therapist.id}`)
                        }
                      >
                        <td className="px-4 py-3">
                          <div>
                            <Text variant="p" className="font-medium text-sm">
                              {therapist.name}
                            </Text>
                            <Text
                              variant="span"
                              className="text-(--color-text-muted) text-xs md:hidden"
                            >
                              {therapist.email}
                            </Text>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-sm md:table-cell">
                          {therapist.email}
                        </td>
                        <td className="hidden px-4 py-3 text-sm lg:table-cell">
                          {formatCPF(therapist.cpf)}
                        </td>
                        <td className="hidden px-4 py-3 text-sm sm:table-cell">
                          {therapist.specialties ? (
                            <span className="text-(--color-text-muted)">
                              {therapist.specialties}
                            </span>
                          ) : (
                            <span className="text-(--color-text-muted) italic">
                              Não informado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Building2
                              size={14}
                              className="text-(--color-text-muted)"
                            />
                            <span className="text-sm">
                              {therapist._count.therapistAssignments}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={therapist.active ? "success" : "error"}
                          >
                            {therapist.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>

        {/* Toggle Status Modal */}
        <Modal
          isOpen={!!toggleModal}
          onClose={() => setToggleModal(null)}
          title={
            toggleModal?.active ? "Desativar Terapeuta" : "Ativar Terapeuta"
          }
          size="sm"
        >
          {toggleModal && (
            <div className="space-y-4">
              <Text variant="p">
                Tem certeza que deseja{" "}
                {toggleModal.active ? "desativar" : "ativar"} o terapeuta{" "}
                <strong>{toggleModal.name}</strong>?
              </Text>

              {toggleModal.active && (
                <Alert variant="warning">
                  Ao desativar, o terapeuta não poderá fazer login, suas
                  vinculações serão desativadas e não aparecerá em novas buscas
                  de disponibilidade.
                </Alert>
              )}

              {toggleModal._count.appointments > 0 && toggleModal.active && (
                <Alert variant="info">
                  Este terapeuta possui{" "}
                  <strong>{toggleModal._count.appointments}</strong>{" "}
                  agendamento(s) registrado(s).
                </Alert>
              )}

              <ModalFooter>
                <Button
                  variant="secondary"
                  onClick={() => setToggleModal(null)}
                >
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
            </div>
          )}
        </Modal>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
