"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Hash,
  Activity,
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
import { Modal } from "@/components/molecules/Modal";
import { Alert } from "@/components/molecules/Alert";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface AppointmentDetail {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  employee: { id: string; name: string; email: string };
  therapist: { id: string; name: string; specialties: string | null };
  location: { id: string; name: string; address: string };
  program: { id: string; name: string; sessionDurationMinutes: number };
  tenant: { id: string; name: string };
  slot: {
    id: string;
    slotDate: string;
    startTime: string;
    endTime: string;
    capacity: number;
    reserved: number;
  };
  canCheckIn: boolean;
  canMarkNoShow: boolean;
  employeeStats: {
    previousSessionsWithTherapist: number;
    totalNoShows: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TherapistAppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const { toasts, addToast, removeToast } = useToast();

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check-in modal
  const [checkInModal, setCheckInModal] = useState<{
    open: boolean;
    status: "COMPLETED" | "NO_SHOW" | null;
  }>({ open: false, status: null });
  const [checkInNotes, setCheckInNotes] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);

  const fetchAppointment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/therapist/appointments/${appointmentId}`);
      const json = await res.json();

      if (json.success) {
        setAppointment(json.data);
      } else {
        setError(json.error || "Erro ao carregar agendamento");
      }
    } catch {
      setError("Erro ao carregar agendamento");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleCheckIn = async () => {
    if (!checkInModal.status) return;

    setCheckInLoading(true);
    try {
      const res = await fetch(
        `/api/therapist/appointments/${appointmentId}/check-in`,
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
        setCheckInModal({ open: false, status: null });
        setCheckInNotes("");
        fetchAppointment();
      } else {
        addToast("error", json.error || "Erro ao registrar");
      }
    } catch {
      addToast("error", "Erro ao registrar");
    } finally {
      setCheckInLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error || !appointment) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <Alert variant="error">
              {error || "Agendamento não encontrado"}
            </Alert>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const isPending = ["PENDING", "CONFIRMED"].includes(appointment.status);
  const isPast = new Date(appointment.startAt) < new Date();

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Back Button + Title */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Text variant="h2">Detalhes do Agendamento</Text>
                <Badge variant={getStatusBadgeVariant(appointment.status)}>
                  {getStatusLabel(appointment.status)}
                </Badge>
              </div>
              <Text className="text-gray-500 text-sm mt-0.5">
                Código: {appointment.code}
              </Text>
            </div>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-3">
              {appointment.canCheckIn && (
                <Button
                  onClick={() =>
                    setCheckInModal({ open: true, status: "COMPLETED" })
                  }
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marcar Presença
                </Button>
              )}
              {appointment.canMarkNoShow && (
                <Button
                  variant="danger"
                  onClick={() =>
                    setCheckInModal({ open: true, status: "NO_SHOW" })
                  }
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Marcar Ausência
                </Button>
              )}
              {!appointment.canCheckIn && !appointment.canMarkNoShow && (
                <Alert variant="info" className="flex-1">
                  O check-in estará disponível a partir de 5 minutos antes do
                  horário agendado.
                </Alert>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Appointment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-(--color-accent)" />
                  Dados do Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="Data"
                    value={formatDateTime(appointment.startAt)}
                  />
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Horário"
                    value={`${formatTime(appointment.startAt)} - ${formatTime(appointment.endAt)}`}
                  />
                  <InfoRow
                    icon={<Activity className="h-4 w-4" />}
                    label="Programa"
                    value={`${appointment.program.name} (${appointment.program.sessionDurationMinutes}min)`}
                  />
                  <InfoRow
                    icon={<Hash className="h-4 w-4" />}
                    label="Código"
                    value={appointment.code}
                  />
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Criado em"
                    value={formatDateShort(appointment.createdAt)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Employee Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-(--color-accent)" />
                  Dados do Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="Nome"
                    value={appointment.employee.name}
                  />
                  <InfoRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    value={appointment.employee.email}
                  />
                  <InfoRow
                    icon={<Building2 className="h-4 w-4" />}
                    label="Empresa"
                    value={appointment.tenant.name}
                  />
                  <InfoRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="Local"
                    value={appointment.location.name}
                  />
                  <div className="text-sm text-gray-500 ml-6">
                    {appointment.location.address}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-(--color-accent)" />
                  Histórico do Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      Sessões anteriores com você
                    </span>
                    <span className="font-semibold">
                      {appointment.employeeStats.previousSessionsWithTherapist}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      appointment.employeeStats.totalNoShows >= 3
                        ? "bg-red-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="text-sm text-gray-600">
                      Total de ausências (no-shows)
                    </span>
                    <span
                      className={`font-semibold ${
                        appointment.employeeStats.totalNoShows >= 3
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {appointment.employeeStats.totalNoShows}
                    </span>
                  </div>
                  {appointment.employeeStats.totalNoShows >= 3 && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4 mr-1 inline" />
                      Este funcionário possui{" "}
                      {appointment.employeeStats.totalNoShows} ausências
                      registradas.
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-(--color-accent)" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <StatusStep
                    label="Agendamento criado"
                    date={appointment.createdAt}
                    active
                  />
                  <StatusStep
                    label="Confirmado"
                    date={
                      appointment.status !== "PENDING"
                        ? appointment.createdAt
                        : undefined
                    }
                    active={appointment.status !== "PENDING"}
                  />
                  {appointment.status === "COMPLETED" && (
                    <StatusStep
                      label="Presença confirmada"
                      date={appointment.updatedAt}
                      active
                      variant="success"
                    />
                  )}
                  {appointment.status === "NO_SHOW" && (
                    <StatusStep
                      label="Ausência registrada"
                      date={appointment.updatedAt}
                      active
                      variant="error"
                    />
                  )}
                  {appointment.status === "CANCELLED" && (
                    <StatusStep
                      label="Cancelado"
                      date={appointment.updatedAt}
                      active
                      variant="error"
                    />
                  )}
                  {isPending && (
                    <StatusStep label="Aguardando check-in" active={false} />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Check-in Modal */}
        <Modal
          isOpen={checkInModal.open}
          onClose={() => {
            setCheckInModal({ open: false, status: null });
            setCheckInNotes("");
          }}
          title={
            checkInModal.status === "COMPLETED"
              ? "Confirmar Presença"
              : "Registrar Ausência"
          }
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Text className="font-semibold">{appointment.employee.name}</Text>
              <div className="text-sm text-gray-600 mt-1">
                {formatTime(appointment.startAt)} -{" "}
                {formatTime(appointment.endAt)} • {appointment.program.name}
              </div>
              <div className="text-sm text-gray-500">
                {appointment.location.name} • {appointment.tenant.name}
              </div>
            </div>

            {checkInModal.status === "NO_SHOW" && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4 mr-1 inline" />
                Marcar como ausência registra um no-show. Após 3 ausências o
                funcionário pode ser bloqueado por 15 dias.
              </Alert>
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
                onClick={() => {
                  setCheckInModal({ open: false, status: null });
                  setCheckInNotes("");
                }}
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
        </Modal>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}

function StatusStep({
  label,
  date,
  active,
  variant = "default",
}: {
  label: string;
  date?: string;
  active: boolean;
  variant?: "default" | "success" | "error";
}) {
  const dotColors = {
    default: active ? "bg-blue-500" : "bg-gray-300",
    success: "bg-green-500",
    error: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full shrink-0 ${dotColors[variant]}`} />
      <div className="flex-1">
        <span
          className={`text-sm ${
            active ? "text-gray-900 font-medium" : "text-gray-400"
          }`}
        >
          {label}
        </span>
      </div>
      {date && (
        <span className="text-xs text-gray-400">{formatDateShort(date)}</span>
      )}
    </div>
  );
}
