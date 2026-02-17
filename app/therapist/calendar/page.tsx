"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  User,
  Building2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
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
}

interface CalendarData {
  appointments: AppointmentItem[];
  summary: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    noShows: number;
    cancelled: number;
  };
  period: {
    start: string;
    end: string;
    view: "day" | "week" | "month";
  };
}

interface FilterOptions {
  tenants: Array<{
    id: string;
    name: string;
    locations: Array<{ id: string; name: string }>;
  }>;
  programs: Array<{
    id: string;
    name: string;
    tenantId: string;
    sessionDurationMinutes: number;
  }>;
}

type ViewType = "day" | "week" | "month";

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getWeekDays(dateStr: string): Date[] {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonthDays(dateStr: string): Date[][] {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Ajustar para começar na segunda-feira
  const startDayOfWeek = firstDay.getDay();
  const startOffset = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() + startOffset);

  const weeks: Date[][] = [];
  const current = new Date(calendarStart);

  while (current <= lastDay || weeks.length < 6) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current > lastDay && weeks.length >= 4) break;
  }

  return weeks;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 border-yellow-400 text-yellow-800",
    CONFIRMED: "bg-blue-100 border-blue-400 text-blue-800",
    COMPLETED: "bg-green-100 border-green-400 text-green-800",
    NO_SHOW: "bg-red-100 border-red-400 text-red-800",
    CANCELLED: "bg-gray-100 border-gray-400 text-gray-500",
  };
  return colors[status] || "bg-gray-100 border-gray-400 text-gray-800";
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

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function TherapistCalendarPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [view, setView] = useState<ViewType>("week");
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [data, setData] = useState<CalendarData | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [tenantId, setTenantId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch filter options
  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch("/api/therapist/appointments?filters=true");
        const json = await res.json();
        if (json.success) {
          setFilterOptions(json.data);
        }
      } catch {
        // silently fail
      }
    }
    fetchFilters();
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view,
        date: currentDate,
      });
      if (tenantId) params.set("tenantId", tenantId);
      if (locationId) params.set("locationId", locationId);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/therapist/appointments?${params}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        addToast("error", json.error || "Erro ao carregar agendamentos");
      }
    } catch {
      addToast("error", "Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }, [view, currentDate, tenantId, locationId, statusFilter, addToast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(currentDate);
    switch (view) {
      case "day":
        date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        date.setDate(date.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        date.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
        break;
    }
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setCurrentDate(new Date().toISOString().split("T")[0]);
  };

  const getPeriodLabel = (): string => {
    const date = new Date(currentDate);
    switch (view) {
      case "day":
        return formatDateLong(currentDate);
      case "week": {
        const days = getWeekDays(currentDate);
        const start = days[0];
        const end = days[6];
        if (start.getMonth() === end.getMonth()) {
          return `${start.getDate()} - ${end.getDate()} de ${start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
        }
        return `${start.getDate()} ${start.toLocaleDateString("pt-BR", { month: "short" })} - ${end.getDate()} ${end.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
      }
      case "month":
        return date.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        });
    }
  };

  const filteredLocations =
    filterOptions?.tenants.find((t) => t.id === tenantId)?.locations || [];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Minha Agenda</Text>
              <Text className="text-gray-500 mt-1">
                Visualize e gerencie seus agendamentos
              </Text>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/therapist/daily")}
              >
                <Clock className="h-4 w-4 mr-1" />
                Hoje
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa
                    </label>
                    <Select
                      value={tenantId}
                      onChange={(e) => {
                        setTenantId(e.target.value);
                        setLocationId("");
                      }}
                      options={[
                        { value: "", label: "Todas" },
                        ...(filterOptions?.tenants.map((t) => ({
                          value: t.id,
                          label: t.name,
                        })) || []),
                      ]}
                      placeholder="Todas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Local
                    </label>
                    <Select
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      disabled={!tenantId}
                      options={[
                        { value: "", label: "Todos" },
                        ...filteredLocations.map((l) => ({
                          value: l.id,
                          label: l.name,
                        })),
                      ]}
                      placeholder="Todos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      options={[
                        { value: "all", label: "Todos" },
                        { value: "PENDING", label: "Pendente" },
                        { value: "CONFIRMED", label: "Confirmado" },
                        { value: "COMPLETED", label: "Concluído" },
                        { value: "NO_SHOW", label: "Ausência" },
                        { value: "CANCELLED", label: "Cancelado" },
                      ]}
                      placeholder="Todos"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Calendar Area */}
            <div className="flex-1">
              {/* Calendar Navigation */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateDate("prev")}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={goToToday}>
                        Hoje
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateDate("next")}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Text variant="h4" className="ml-2">
                        {getPeriodLabel()}
                      </Text>
                    </div>
                    <div className="flex border rounded-md overflow-hidden">
                      {(["day", "week", "month"] as ViewType[]).map((v) => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                            view === v
                              ? "bg-(--color-accent) text-white"
                              : "bg-white text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {v === "day"
                            ? "Dia"
                            : v === "week"
                              ? "Semana"
                              : "Mês"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    <>
                      {view === "month" && (
                        <MonthView
                          date={currentDate}
                          appointments={data?.appointments || []}
                          onClickAppointment={(id) =>
                            router.push(`/therapist/appointments/${id}`)
                          }
                          onClickDay={(d) => {
                            setCurrentDate(d);
                            setView("day");
                          }}
                        />
                      )}

                      {view === "week" && (
                        <WeekView
                          date={currentDate}
                          appointments={data?.appointments || []}
                          onClickAppointment={(id) =>
                            router.push(`/therapist/appointments/${id}`)
                          }
                        />
                      )}

                      {view === "day" && (
                        <DayView
                          date={currentDate}
                          appointments={data?.appointments || []}
                          onClickAppointment={(id) =>
                            router.push(`/therapist/appointments/${id}`)
                          }
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div className="w-full lg:w-72 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo do Período</CardTitle>
                </CardHeader>
                <CardContent>
                  {data?.summary ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total</span>
                        <span className="font-semibold">
                          {data.summary.total}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span className="text-sm text-gray-600">
                            Confirmados
                          </span>
                        </div>
                        <span className="font-semibold text-blue-600">
                          {data.summary.confirmed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                          <span className="text-sm text-gray-600">
                            Pendentes
                          </span>
                        </div>
                        <span className="font-semibold text-yellow-600">
                          {data.summary.pending}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          <span className="text-sm text-gray-600">
                            Concluídos
                          </span>
                        </div>
                        <span className="font-semibold text-green-600">
                          {data.summary.completed}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="text-sm text-gray-600">
                            Ausências
                          </span>
                        </div>
                        <span className="font-semibold text-red-600">
                          {data.summary.noShows}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                          <span className="text-sm text-gray-600">
                            Cancelados
                          </span>
                        </div>
                        <span className="font-semibold text-gray-500">
                          {data.summary.cancelled}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Text className="text-gray-400 text-sm">Carregando...</Text>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push("/therapist/daily")}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Agenda do Dia
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push("/therapist/history")}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Histórico
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push("/therapist/availability")}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Disponibilidade
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}

// ============================================================================
// MONTH VIEW COMPONENT
// ============================================================================

function MonthView({
  date,
  appointments,
  onClickAppointment,
  onClickDay,
}: {
  date: string;
  appointments: AppointmentItem[];
  onClickAppointment: (id: string) => void;
  onClickDay: (date: string) => void;
}) {
  const weeks = getMonthDays(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = new Date(date).getMonth();

  const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div>
      <div className="grid grid-cols-7 border-b">
        {dayNames.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-gray-500 uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
          {week.map((day, di) => {
            const isToday = isSameDay(day, today);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const dayAppts = appointments.filter((a) =>
              isSameDay(new Date(a.startAt), day),
            );
            const dateKey = day.toISOString().split("T")[0];

            return (
              <div
                key={di}
                className={`min-h-[80px] p-1 border-r last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? "bg-gray-50" : ""
                }`}
                onClick={() => onClickDay(dateKey)}
              >
                <div
                  className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-(--color-accent) text-white"
                      : isCurrentMonth
                        ? "text-gray-900"
                        : "text-gray-400"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map((appt) => (
                    <div
                      key={appt.id}
                      className={`text-xs px-1 py-0.5 rounded border-l-2 truncate cursor-pointer ${getStatusColor(appt.status)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClickAppointment(appt.id);
                      }}
                      title={`${formatTime(appt.startAt)} - ${appt.employee.name}`}
                    >
                      {formatTime(appt.startAt)}{" "}
                      {appt.employee.name.split(" ")[0]}
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayAppts.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// WEEK VIEW COMPONENT
// ============================================================================

function WeekView({
  date,
  appointments,
  onClickAppointment,
}: {
  date: string;
  appointments: AppointmentItem[];
  onClickAppointment: (id: string) => void;
}) {
  const days = getWeekDays(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-0">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const dayAppts = appointments.filter((a) =>
          isSameDay(new Date(a.startAt), day),
        );

        return (
          <div
            key={day.toISOString()}
            className={`border-b last:border-b-0 p-3 ${
              isToday ? "bg-blue-50/50" : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`text-sm font-semibold min-w-[100px] ${
                  isToday ? "text-(--color-accent)" : "text-gray-700"
                }`}
              >
                {day.toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
                {isToday && (
                  <span className="ml-1 text-xs font-normal text-(--color-accent)">
                    (hoje)
                  </span>
                )}
              </div>
              <div className="flex-1">
                {dayAppts.length === 0 ? (
                  <span className="text-sm text-gray-400 italic">
                    Sem agendamentos
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    {dayAppts.map((appt) => (
                      <div
                        key={appt.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md border-l-3 cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(appt.status)}`}
                        onClick={() => onClickAppointment(appt.id)}
                      >
                        <div className="text-sm font-mono font-medium min-w-[90px]">
                          {formatTime(appt.startAt)} - {formatTime(appt.endAt)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {appt.employee.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="flex items-center gap-0.5">
                              <Building2 className="h-3 w-3" />
                              {appt.tenant.name}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {appt.location.name}
                            </span>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(appt.status)}>
                          {getStatusLabel(appt.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// DAY VIEW COMPONENT
// ============================================================================

function DayView({
  date,
  appointments,
  onClickAppointment,
}: {
  date: string;
  appointments: AppointmentItem[];
  onClickAppointment: (id: string) => void;
}) {
  if (appointments.length === 0) {
    return (
      <div className="py-12 text-center">
        <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <Text className="text-gray-500">Nenhum agendamento para este dia</Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appt) => (
        <div
          key={appt.id}
          className={`flex items-start gap-4 p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(appt.status)}`}
          onClick={() => onClickAppointment(appt.id)}
        >
          <div className="text-center min-w-[60px]">
            <div className="text-lg font-bold">{formatTime(appt.startAt)}</div>
            <div className="text-xs text-gray-500">
              {formatTime(appt.endAt)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Text className="font-semibold">{appt.employee.name}</Text>
              <Badge variant={getStatusBadgeVariant(appt.status)}>
                {getStatusLabel(appt.status)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {appt.employee.email}
              </span>
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
                {appt.program.name} ({appt.program.sessionDurationMinutes}min)
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
