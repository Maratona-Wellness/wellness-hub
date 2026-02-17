"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/hooks";

interface DashboardData {
  employee: { id: string; name: string; email: string };
  nextAppointment: AppointmentItem | null;
  upcomingAppointments: AppointmentItem[];
  stats: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    noShows: number;
    attendanceRate: number;
    lastSessionDate: string | null;
  };
}

interface AppointmentItem {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  code: string;
  therapist: { id: string; name: string; specialties: string | null };
  location: { id: string; name: string; address: string };
  program: { id: string; name: string; sessionDurationMinutes: number };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(status: string) {
  const map: Record<
    string,
    { label: string; variant: "success" | "warning" | "error" | "info" }
  > = {
    PENDING: { label: "Pendente", variant: "warning" },
    CONFIRMED: { label: "Confirmado", variant: "success" },
    CANCELLED: { label: "Cancelado", variant: "error" },
    COMPLETED: { label: "Concluído", variant: "info" },
    NO_SHOW: { label: "Ausência", variant: "error" },
  };
  return map[status] || { label: status, variant: "info" as const };
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/employee/dashboard");
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || "Erro ao carregar dashboard");
          return;
        }

        setData(json.data);
      } catch {
        setError("Erro de conexão");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <EmptyState
          icon={<XCircle />}
          title="Erro ao carregar dashboard"
          description={error}
          action={{
            label: "Tentar novamente",
            onClick: () => window.location.reload(),
          }}
        />
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { nextAppointment, upcomingAppointments, stats } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Text variant="h1" className="mb-1">
              Olá, {user?.displayName || data.employee.name}! 👋
            </Text>
            <Text variant="p" className="text-gray-600">
              Bem-vindo ao seu painel de bem-estar
            </Text>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => router.push("/appointments/new")}
          >
            Agendar Sessão
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Sessões</p>
                  <p className="text-2xl font-bold text-(--color-secondary)">
                    {stats.totalSessions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-(--color-secondary)">
                    {stats.completedSessions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Canceladas</p>
                  <p className="text-2xl font-bold text-(--color-secondary)">
                    {stats.cancelledSessions}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Comparecimento</p>
                  <p className="text-2xl font-bold text-(--color-secondary)">
                    {stats.attendanceRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Próximo Agendamento */}
          <div className="lg:col-span-1">
            <Card
              variant="elevated"
              className="border-l-4 border-l-(--color-accent)"
            >
              <CardHeader>
                <CardTitle className="text-lg">Próximo Agendamento</CardTitle>
              </CardHeader>
              <CardContent>
                {nextAppointment ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getStatusBadge(nextAppointment.status).variant}
                      >
                        {getStatusBadge(nextAppointment.status).label}
                      </Badge>
                      <span className="text-xs text-gray-500 font-mono">
                        {nextAppointment.code}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(nextAppointment.startAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatTime(nextAppointment.startAt)} -{" "}
                          {formatTime(nextAppointment.endAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{nextAppointment.location.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{nextAppointment.therapist.name}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm font-medium text-(--color-accent)">
                        {nextAppointment.program.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {nextAppointment.program.sessionDurationMinutes} min
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() =>
                        router.push(`/appointments/${nextAppointment.id}`)
                      }
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Nenhum agendamento próximo
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="mt-3"
                      onClick={() => router.push("/appointments/new")}
                    >
                      Agendar Agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Agendamentos Futuros */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Agendamentos Futuros</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/appointments")}
                >
                  Ver todos
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/appointments/${apt.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[50px]">
                            <p className="text-lg font-bold text-(--color-accent)">
                              {new Date(apt.startAt).getDate()}
                            </p>
                            <p className="text-xs text-gray-500 uppercase">
                              {new Date(apt.startAt).toLocaleDateString(
                                "pt-BR",
                                { month: "short" },
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-(--color-secondary)">
                              {apt.program.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatTime(apt.startAt)} • {apt.location.name} •{" "}
                              {apt.therapist.name}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadge(apt.status).variant}>
                          {getStatusBadge(apt.status).label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Calendar />}
                    title="Sem agendamentos futuros"
                    description="Você ainda não tem sessões agendadas. Que tal agendar uma?"
                    action={{
                      label: "Agendar Sessão",
                      onClick: () => router.push("/appointments/new"),
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Última sessão */}
        {stats.lastSessionDate && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">
                Última sessão realizada em{" "}
                <span className="font-medium text-(--color-secondary)">
                  {formatDate(stats.lastSessionDate)}
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
