"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { Modal } from "@/components/molecules/Modal";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface AppointmentItem {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  code: string;
  employee: { id: string; name: string; email: string };
  therapist: { id: string; name: string; specialties: string | null };
  location: { id: string; name: string; address: string };
  program: { id: string; name: string; sessionDurationMinutes: number };
  tenant: { id: string; name: string };
  minutesUntilStart?: number | null;
}

interface DailyData {
  date: string;
  appointments: AppointmentItem[];
  nextAppointment: AppointmentItem | null;
  summary: {
    total: number;
    completed: number;
    pending: number;
    noShows: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Concluído",
    NO_SHOW: "Ausência",
    CANCELLED: "Cancelado",
  };
  return labels[status] || status;
}

function getStatusBadgeVariant(
  status: string,
): "success" | "warning" | "error" | "info" {
  const map: Record<string, "success" | "warning" | "error" | "info"> = {
    PENDING: "warning",
    CONFIRMED: "info",
    COMPLETED: "success",
    NO_SHOW: "error",
    CANCELLED: "error",
  };
  return map[status] || "info";
}

function getStatusTimelineColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "border-yellow-400 bg-yellow-50",
    CONFIRMED: "border-blue-400 bg-blue-50",
    COMPLETED: "border-green-400 bg-green-50",
    NO_SHOW: "border-red-400 bg-red-50",
    CANCELLED: "border-gray-300 bg-gray-50",
  };
  return colors[status] || "border-gray-300 bg-gray-50";
}

function getStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-400",
    CONFIRMED: "bg-blue-400",
    COMPLETED: "bg-green-500",
    NO_SHOW: "bg-red-500",
    CANCELLED: "bg-gray-400",
  };
  return colors[status] || "bg-gray-400";
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TherapistDailyPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check-in modal
  const [checkInModal, setCheckInModal] = useState<{
    open: boolean;
    appointment: AppointmentItem | null;
    status: "COMPLETED" | "NO_SHOW" | null;
  }>({ open: false, appointment: null, status: null });
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/therapist/daily?date=${currentDate}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        addToast("error", json.error || "Erro ao carregar agenda do dia");
      }
    } catch {
      addToast("error", "Erro ao carregar agenda do dia");
    } finally {
      setLoading(false);
    }
  }, [currentDate, addToast]);

  useEffect(() => {
    fetchDaily();
  }, [fetchDaily]);

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setCurrentDate(new Date().toISOString().split("T")[0]);
  };

  const isToday = currentDate === new Date().toISOString().split("T")[0];

  const openCheckIn = (
    appt: AppointmentItem,
    status: "COMPLETED" | "NO_SHOW",
  ) => {
    setCheckInModal({ open: true, appointment: appt, status });
    setCheckInNotes("");
  };

  const handleCheckIn = async () => {
    if (!checkInModal.appointment || !checkInModal.status) return;

    setCheckInLoading(true);
    try {
      const res = await fetch(
        `/api/therapist/appointments/${checkInModal.appointment.id}/check-in`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: checkInModal.status,
            notes: checkInNotes || undefined,
          }),
        },
      );
      const json = await res.json();

      if (json.success) {
        addToast(
          "success",
          checkInModal.status === "COMPLETED"
            ? "Presença registrada com sucesso"
            : "Ausência registrada com sucesso",
        );
        setCheckInModal({ open: false, appointment: null, status: null });
        fetchDaily();
      } else {
        addToast("error", json.error || "Erro ao registrar presença");
      }
    } catch {
      addToast("error", "Erro ao registrar presença");
    } finally {
      setCheckInLoading(false);
    }
  };

  const canDoCheckIn = (appt: AppointmentItem): boolean => {
    if (!["PENDING", "CONFIRMED"].includes(appt.status)) return false;
    const now = new Date();
    const start = new Date(appt.startAt);
    // Permite 5 minutos antes
    return now >= new Date(start.getTime() - 5 * 60 * 1000);
  };

  const canDoNoShow = (appt: AppointmentItem): boolean => {
    if (!["PENDING", "CONFIRMED"].includes(appt.status)) return false;
    const now = new Date();
    const start = new Date(appt.startAt);
    // Após 15 min de tolerância
    return now >= new Date(start.getTime() + 15 * 60 * 1000);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Agenda do Dia</Text>
              <Text className="text-gray-500 mt-1">
                {formatDateLong(currentDate)}
              </Text>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/therapist/calendar")}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendário
              </Button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isToday ? "primary" : "secondary"}
              size="sm"
              onClick={goToToday}
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {data?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-(--color-secondary)">
                        {data.summary.total}
                      </div>
                      <div className="text-sm text-gray-500">Total</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {data.summary.pending}
                      </div>
                      <div className="text-sm text-gray-500">Pendentes</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {data.summary.completed}
                      </div>
                      <div className="text-sm text-gray-500">Concluídos</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {data.summary.noShows}
                      </div>
                      <div className="text-sm text-gray-500">Ausências</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Next Appointment Highlight */}
              {data?.nextAppointment && isToday && (
                <Card variant="elevated">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-(--color-accent) animate-pulse" />
                      <Text className="text-sm font-semibold text-(--color-accent)">
                        Próximo Atendimento
                        {data.nextAppointment.minutesUntilStart != null && (
                          <span className="ml-1 font-normal">
                            (em{" "}
                            {formatMinutes(
                              data.nextAppointment.minutesUntilStart,
                            )}
                            )
                          </span>
                        )}
                      </Text>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold">
                          {formatTime(data.nextAppointment.startAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(data.nextAppointment.endAt)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Text className="font-semibold">
                          {data.nextAppointment.employee.name}
                        </Text>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {data.nextAppointment.tenant.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {data.nextAppointment.location.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {data.nextAppointment.program.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {canDoCheckIn(data.nextAppointment) && (
                          <Button
                            size="sm"
                            onClick={() =>
                              openCheckIn(data.nextAppointment!, "COMPLETED")
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Presente
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              {data?.appointments && data.appointments.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Linha do Tempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-gray-200" />

                      <div className="space-y-4">
                        {data.appointments.map((appt, index) => {
                          const isNext =
                            data.nextAppointment?.id === appt.id && isToday;

                          return (
                            <div
                              key={appt.id}
                              className={`relative flex items-start gap-4 pl-12 ${
                                isNext ? "scale-[1.01]" : ""
                              }`}
                            >
                              {/* Timeline dot */}
                              <div
                                className={`absolute left-[16px] w-4 h-4 rounded-full border-2 border-white ${getStatusDotColor(appt.status)} ${
                                  isNext
                                    ? "ring-2 ring-(--color-accent) ring-offset-2"
                                    : ""
                                }`}
                              />

                              {/* Appointment card */}
                              <div
                                className={`flex-1 p-4 rounded-lg border-l-3 ${getStatusTimelineColor(appt.status)} cursor-pointer hover:shadow-sm transition-shadow`}
                                onClick={() =>
                                  router.push(
                                    `/therapist/appointments/${appt.id}`,
                                  )
                                }
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-mono font-bold">
                                        {formatTime(appt.startAt)} -{" "}
                                        {formatTime(appt.endAt)}
                                      </span>
                                      <Badge
                                        variant={getStatusBadgeVariant(
                                          appt.status,
                                        )}
                                      >
                                        {getStatusLabel(appt.status)}
                                      </Badge>
                                      {isNext && (
                                        <Badge variant="warning">Próximo</Badge>
                                      )}
                                    </div>
                                    <Text className="font-semibold mt-1">
                                      {appt.employee.name}
                                    </Text>
                                  </div>
                                  <span className="text-xs text-gray-400 font-mono">
                                    {appt.code}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {appt.tenant.name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {appt.location.name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {appt.program.name} (
                                    {appt.program.sessionDurationMinutes}min)
                                  </span>
                                </div>

                                {/* Quick actions */}
                                {["PENDING", "CONFIRMED"].includes(
                                  appt.status,
                                ) && (
                                  <div className="flex gap-2 mt-3">
                                    {canDoCheckIn(appt) && (
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openCheckIn(appt, "COMPLETED");
                                        }}
                                      >
                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                        Presente
                                      </Button>
                                    )}
                                    {canDoNoShow(appt) && (
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openCheckIn(appt, "NO_SHOW");
                                        }}
                                      >
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                        Ausência
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={<Calendar className="h-16 w-16" />}
                  title="Nenhum agendamento"
                  description="Você não possui agendamentos para este dia."
                />
              )}
            </>
          )}
        </div>

        {/* Check-in Modal */}
        <Modal
          isOpen={checkInModal.open}
          onClose={() =>
            setCheckInModal({ open: false, appointment: null, status: null })
          }
          title={
            checkInModal.status === "COMPLETED"
              ? "Registrar Presença"
              : "Registrar Ausência"
          }
          size="sm"
        >
          {checkInModal.appointment && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Text className="font-semibold">
                  {checkInModal.appointment.employee.name}
                </Text>
                <div className="text-sm text-gray-600 mt-1">
                  {formatTime(checkInModal.appointment.startAt)} -{" "}
                  {formatTime(checkInModal.appointment.endAt)} •{" "}
                  {checkInModal.appointment.program.name}
                </div>
                <div className="text-sm text-gray-500">
                  {checkInModal.appointment.location.name} •{" "}
                  {checkInModal.appointment.tenant.name}
                </div>
              </div>

              {checkInModal.status === "NO_SHOW" && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Marcar como ausência registra um no-show para o funcionário.
                    Após 3 ausências o funcionário pode ser bloqueado por 15
                    dias.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                  rows={3}
                  placeholder="Adicionar observações..."
                  maxLength={500}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={() =>
                    setCheckInModal({
                      open: false,
                      appointment: null,
                      status: null,
                    })
                  }
                  disabled={checkInLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant={
                    checkInModal.status === "NO_SHOW" ? "danger" : "primary"
                  }
                  onClick={handleCheckIn}
                  isLoading={checkInLoading}
                >
                  {checkInModal.status === "COMPLETED" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Confirmar Presença
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Confirmar Ausência
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
