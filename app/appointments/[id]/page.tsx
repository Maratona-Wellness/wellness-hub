"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts";
import { Card, CardContent } from "@/components/molecules/Card";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ArrowLeft,
  Package,
  Hash,
  XCircle,
  CheckCircle,
  Download,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface AppointmentDetails {
  id: string;
  code: string;
  startAt: string;
  endAt: string | null;
  status: string;
  cancellationReason: string | null;
  cancelledAt: string | null;
  notes: string | null;
  createdAt: string;
  program: { name: string; sessionDurationMinutes: number };
  therapist: { name: string; specialties: string | null };
  location: { name: string; address: string };
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

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr.split("T")[0] + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "long" });
}

function getStatusConfig(status: string): {
  label: string;
  variant: "success" | "warning" | "error" | "info";
  icon: React.ReactNode;
} {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "Confirmado",
        variant: "info",
        icon: <CheckCircle className="h-5 w-5" />,
      };
    case "COMPLETED":
      return {
        label: "Realizado",
        variant: "success",
        icon: <CheckCircle className="h-5 w-5" />,
      };
    case "CANCELLED":
      return {
        label: "Cancelado",
        variant: "error",
        icon: <XCircle className="h-5 w-5" />,
      };
    case "NO_SHOW":
      return {
        label: "Não compareceu",
        variant: "warning",
        icon: <AlertTriangle className="h-5 w-5" />,
      };
    default:
      return {
        label: status,
        variant: "info",
        icon: null,
      };
  }
}

function canCancel(appointment: AppointmentDetails): boolean {
  if (appointment.status !== "CONFIRMED") return false;

  const appointmentDateTime = new Date(appointment.startAt);
  const now = new Date();
  const diffHours =
    (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return diffHours >= 4;
}

function generateICS(apt: AppointmentDetails): string {
  const dateClean = apt.startAt.split("T")[0].replace(/-/g, "");
  const startTime = apt.startAt.split("T")[1].replace(":", "") + "00";
  const endTimeParts = apt.endAt
    ? apt.endAt.replace(":", "") + "00"
    : (() => {
        const [h, m] = apt.startAt.split("T")[1].split(":").map(Number);
        const endMin = m + apt.program.sessionDurationMinutes;
        const endH = h + Math.floor(endMin / 60);
        const endM = endMin % 60;
        return `${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;
      })();

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WellnessHub//Appointment//PT-BR",
    "BEGIN:VEVENT",
    `DTSTART:${dateClean}T${startTime}`,
    `DTEND:${dateClean}T${endTimeParts}`,
    `SUMMARY:${apt.program.name} - ${apt.therapist.name}`,
    `LOCATION:${apt.location.name} - ${apt.location.address}`,
    `DESCRIPTION:Código: ${apt.code}\\nTerapeuta: ${apt.therapist.name}`,
    `UID:${apt.id}@wellnesshub`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AppointmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "true";

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/employee/appointments/${params.id}`);
        const json = await res.json();

        if (json.success) {
          setAppointment(json.data);
        } else {
          setError(json.error || "Agendamento não encontrado");
        }
      } catch {
        setError("Erro de conexão");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [params.id]);

  async function handleCancel() {
    if (!appointment) return;

    setCancelling(true);
    setError(null);

    try {
      const res = await fetch(`/api/employee/appointments/${appointment.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: cancelReason || undefined,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setAppointment(json.data);
        setShowCancelModal(false);
        setCancelReason("");
      } else {
        setError(json.error || "Erro ao cancelar");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setCancelling(false);
    }
  }

  function handleDownloadICS() {
    if (!appointment) return;

    const icsContent = generateICS(appointment);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agendamento-${appointment.code}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !appointment) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <Text variant="h3" className="mb-2">
            {error}
          </Text>
          <Link href="/appointments">
            <Button variant="ghost">Voltar aos agendamentos</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) return null;

  const statusConfig = getStatusConfig(appointment.status);
  const showCancel = canCancel(appointment);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/appointments"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-(--color-secondary) mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos agendamentos
          </Link>
          <div className="flex items-center justify-between">
            <Text variant="h1">Detalhes do Agendamento</Text>
            <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Success banner */}
        {justCreated && (
          <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Agendamento criado com sucesso!</p>
            </div>
            <p className="text-sm mt-1">
              Seu código de agendamento é:{" "}
              <strong className="font-mono">{appointment.code}</strong>
            </p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Main card */}
        <Card variant="elevated">
          <CardContent className="p-6 space-y-5">
            {/* Code */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Hash className="h-5 w-5 text-(--color-accent)" />
              <div>
                <p className="text-sm text-gray-500">Código</p>
                <p className="font-mono font-bold text-lg text-(--color-secondary)">
                  {appointment.code}
                </p>
              </div>
            </div>

            {/* Program */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Package className="h-5 w-5 text-(--color-accent)" />
              <div>
                <p className="text-sm text-gray-500">Programa</p>
                <p className="font-semibold text-(--color-secondary)">
                  {appointment.program.name}
                </p>
                <p className="text-xs text-gray-500">
                  Duração: {appointment.program.sessionDurationMinutes} minutos
                </p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Calendar className="h-5 w-5 text-(--color-accent)" />
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-semibold text-(--color-secondary)">
                  {formatDate(appointment.startAt)}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {getDayName(appointment.startAt)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Clock className="h-5 w-5 text-(--color-accent)" />
              <div>
                <p className="text-sm text-gray-500">Horário</p>
                <p className="font-semibold text-(--color-secondary)">
                  {formatHour(appointment.startAt)}
                  {appointment.endAt && ` - ${formatHour(appointment.endAt)}`}
                </p>
              </div>
            </div>

            {/* Therapist */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <User className="h-5 w-5 text-(--color-accent)" />
              <div>
                <p className="text-sm text-gray-500">Terapeuta</p>
                <p className="font-semibold text-(--color-secondary)">
                  {appointment.therapist.name}
                </p>
                {appointment.therapist.specialties && (
                  <p className="text-xs text-gray-500">
                    {appointment.therapist.specialties}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <MapPin className="h-5 w-5 text-(--color-accent)" />
              <div>
                <p className="text-sm text-gray-500">Local</p>
                <p className="font-semibold text-(--color-secondary)">
                  {appointment.location.name}
                </p>
                <p className="text-xs text-gray-500">
                  {appointment.location.address}
                </p>
              </div>
            </div>

            {/* Cancellation info */}
            {appointment.status === "CANCELLED" && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700">
                <p className="text-sm font-medium">Agendamento cancelado</p>
                {appointment.cancellationReason && (
                  <p className="text-sm mt-1">
                    Motivo: {appointment.cancellationReason}
                  </p>
                )}
                {appointment.cancelledAt && (
                  <p className="text-xs mt-1 text-red-500">
                    Cancelado em: {formatDateTime(appointment.cancelledAt)}
                  </p>
                )}
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500 mb-1">Observações</p>
                <p className="text-sm">{appointment.notes}</p>
              </div>
            )}

            {/* Created at */}
            <p className="text-xs text-gray-400 text-right">
              Agendado em: {formatDateTime(appointment.createdAt)}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          {appointment.status === "CONFIRMED" && (
            <Button
              variant="ghost"
              onClick={handleDownloadICS}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Adicionar ao Calendário
            </Button>
          )}

          {showCancel && (
            <Button
              variant="danger"
              onClick={() => setShowCancelModal(true)}
              leftIcon={<XCircle className="h-4 w-4" />}
            >
              Cancelar Agendamento
            </Button>
          )}

          {appointment.status === "CONFIRMED" && !showCancel && (
            <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Cancelamento indisponível (menos de 4h para a sessão)
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        <Modal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Cancelar Agendamento"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tem certeza que deseja cancelar este agendamento? Esta ação não
              pode ser desfeita.
            </p>

            <div className="p-3 rounded-lg bg-gray-50 text-sm">
              <p>
                <strong>{appointment.program.name}</strong>
              </p>
              <p className="text-gray-600">
                {formatDate(appointment.startAt)} às{" "}
                {formatHour(appointment.startAt)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do cancelamento (opcional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Informe o motivo..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)/50"
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              Manter Agendamento
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              isLoading={cancelling}
            >
              Confirmar Cancelamento
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
