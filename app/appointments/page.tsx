"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts";
import { Card, CardContent } from "@/components/molecules/Card";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Tabs } from "@/components/molecules/Tabs";
import { Pagination } from "@/components/molecules/Pagination";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Eye,
  CalendarCheck,
  CalendarX,
  History,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface AppointmentListItem {
  id: string;
  code: string;
  date: string;
  startAt: string;
  endAt: string | null;
  status: string;
  program: { name: string };
  therapist: { name: string };
  location: { name: string; address: string };
}

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

function formatHour(dateStr: string): string {
  const [h, min] = dateStr.split("T")[1].split(":");
  return `${h}:${min}`;
}

function getStatusConfig(status: string): {
  label: string;
  variant: "success" | "warning" | "error" | "info";
} {
  switch (status) {
    case "CONFIRMED":
      return { label: "Confirmado", variant: "info" };
    case "COMPLETED":
      return { label: "Realizado", variant: "success" };
    case "CANCELLED":
      return { label: "Cancelado", variant: "error" };
    case "NO_SHOW":
      return { label: "Não compareceu", variant: "warning" };
    default:
      return { label: status, variant: "info" };
  }
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AppointmentsPage() {
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(
    async (page: number = 1) => {
      const status = tab === "upcoming" ? "upcoming" : "all";

      const params = new URLSearchParams({
        status,
        page: String(page),
        pageSize: "10",
      });
      const res = await fetch(`/api/employee/appointments?${params}`);
      const json = await res.json();

      if (json.success) {
        setAppointments(json.data);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      } else {
        console.log("Error fetching appointments:", json.error);
        setError(json.error || "Erro ao carregar agendamentos");
      }
    },
    [tab],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      fetchAppointments(1);
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [fetchAppointments]);

  function handlePageChange(page: number) {
    fetchAppointments(page);
  }

  function renderContent() {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <EmptyState
          icon={tab === "upcoming" ? <CalendarCheck /> : <CalendarX />}
          title={
            tab === "upcoming"
              ? "Nenhum agendamento futuro"
              : "Nenhum registro no histórico"
          }
          description={
            tab === "upcoming"
              ? "Você ainda não tem agendamentos. Que tal marcar uma sessão?"
              : "Seus agendamentos finalizados aparecerão aqui."
          }
          action={
            tab === "upcoming"
              ? {
                  label: "Novo Agendamento",
                  onClick: () => (window.location.href = "/appointments/new"),
                }
              : undefined
          }
        />
      );
    }

    return (
      <div>
        <div className="space-y-3">
          {appointments.map((apt) => {
            const statusConfig = getStatusConfig(apt.status);

            return (
              <Link key={apt.id} href={`/appointments/${apt.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-(--color-secondary)">
                            {apt.program.name}
                          </h3>
                          <Badge variant={statusConfig.variant}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">
                          {apt.code}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(apt.startAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatHour(apt.startAt)}
                            {apt.endAt && ` - ${formatHour(apt.endAt)}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            {apt.therapist.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {apt.location.name}
                          </span>
                        </div>
                      </div>

                      <Eye className="h-5 w-5 text-gray-400 ml-2 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {pagination.totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Text variant="h1">Meus Agendamentos</Text>
            <Text variant="p" className="text-gray-600">
              Gerencie suas sessões de bem-estar
            </Text>
          </div>
          <Link href="/appointments/new">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Novo Agendamento
            </Button>
          </Link>
        </div>

        <Tabs
          activeTab={tab}
          onChange={(v: string) => setTab(v as "upcoming" | "history")}
          tabs={[
            {
              id: "upcoming",
              label: "Próximos",
              icon: <CalendarCheck className="h-4 w-4" />,
              content: renderContent(),
            },
            {
              id: "history",
              label: "Histórico",
              icon: <History className="h-4 w-4" />,
              content: renderContent(),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  );
}
