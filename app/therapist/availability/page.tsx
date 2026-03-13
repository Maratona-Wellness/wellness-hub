"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import { Alert } from "@/components/molecules/Alert";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

interface AvailabilitySlot {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  reserved: number;
  tenant: { id: string; name: string };
  location: { id: string; name: string; address: string };
  program: { id: string; name: string; sessionDurationMinutes: number };
  appointments: Array<{
    id: string;
    status: string;
    employee: { id: string; name: string };
  }>;
}

interface AssignmentInfo {
  tenantId: string;
  tenantName: string;
  locationId: string;
  locationName: string;
}

export default function TherapistAvailabilityPage() {
  const { data: session } = useSession();
  const { toasts, addToast, removeToast } = useToast();

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);

  // Filters
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  // Date navigation
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek + 1); // Monday
    return start.toISOString().split("T")[0];
  });

  // Delete modal
  const [deleteSlots, setDeleteSlots] = useState<AvailabilitySlot[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(
    new Set(),
  );

  // Get week end
  const weekEnd = (() => {
    const end = new Date(weekStart + "T00:00:00");
    end.setDate(end.getDate() + 6);
    return end.toISOString().split("T")[0];
  })();

  // Fetch therapist assignments to populate filters
  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/therapist/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.assignments) {
          const uniqueAssignments: AssignmentInfo[] = [];
          const seen = new Set<string>();

          for (const a of data.data.assignments) {
            const key = `${a.tenant.id}-${a.location.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueAssignments.push({
                tenantId: a.tenant.id,
                tenantName: a.tenant.name,
                locationId: a.location.id,
                locationName: a.location.name,
              });
            }
          }
          setAssignments(uniqueAssignments);
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  // Fetch availability slots
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: weekStart,
        endDate: weekEnd,
      });

      if (selectedTenant) params.set("tenantId", selectedTenant);
      if (selectedLocation) params.set("locationId", selectedLocation);

      const res = await fetch(`/api/therapist/availability?${params}`);
      const data = await res.json();

      if (data.success) {
        setSlots(data.data);
      }
    } catch {
      addToast("error", "Erro ao carregar disponibilidade");
    } finally {
      setLoading(false);
    }
  }, [weekStart, weekEnd, selectedTenant, selectedLocation, addToast]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const navigateWeek = (direction: "prev" | "next") => {
    const current = new Date(weekStart + "T00:00:00");
    current.setDate(current.getDate() + (direction === "next" ? 7 : -7));
    setWeekStart(current.toISOString().split("T")[0]);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek + 1);
    setWeekStart(start.toISOString().split("T")[0]);
  };

  // Group slots by date
  const groupedByDate: Record<string, AvailabilitySlot[]> = {};
  for (const slot of slots) {
    const dateStr = slot.slotDate.split("T")[0];
    if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
    groupedByDate[dateStr].push(slot);
  }

  // Generate week days
  const allWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  // Check if weekend days have slots
  const saturdayDate = allWeekDays[5]; // Saturday (index 5, Mon-based week)
  const sundayDate = allWeekDays[6]; // Sunday (index 6)
  const hasWeekendSlots =
    (groupedByDate[saturdayDate]?.length ?? 0) > 0 ||
    (groupedByDate[sundayDate]?.length ?? 0) > 0;

  // State for screen width tracking
  const [isWideScreen, setIsWideScreen] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsWideScreen(window.innerWidth >= 1700);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Show only weekdays (Mon-Fri) on wide screens without weekend slots
  const weekDays =
    isWideScreen && !hasWeekendSlots ? allWeekDays.slice(0, 5) : allWeekDays;
  const gridCols = weekDays.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-7";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatWeekRange = () => {
    const start = new Date(weekStart + "T00:00:00");
    const end = new Date(weekEnd + "T00:00:00");
    return `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} — ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
  };

  const toggleSlotSelection = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const slotsToDelete = slots.filter((s) => selectedSlotIds.has(s.id));
    setDeleteSlots(slotsToDelete);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/therapist/availability", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotIds: Array.from(selectedSlotIds) }),
      });
      const data = await res.json();

      if (data.success) {
        addToast("success", data.message);
        setSelectedSlotIds(new Set());
        setDeleteSlots([]);
        fetchSlots();
      } else {
        addToast("error", data.error);
      }
    } catch {
      addToast("error", "Erro ao remover slots");
    } finally {
      setDeleting(false);
    }
  };

  // Get unique tenants and locations for filters
  const tenantOptions = [
    ...new Map(assignments.map((a) => [a.tenantId, a])).values(),
  ];

  const locationOptions = selectedTenant
    ? assignments.filter((a) => a.tenantId === selectedTenant)
    : assignments;
  const uniqueLocations = [
    ...new Map(locationOptions.map((a) => [a.locationId, a])).values(),
  ];

  const today = new Date().toISOString().split("T")[0];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Minha Disponibilidade</Text>
              <Text variant="p" className="text-gray-600 mt-1">
                Visualize e gerencie seus horários disponíveis
              </Text>
            </div>
            {selectedSlotIds.size > 0 && (
              <Button
                variant="danger"
                onClick={handleDeleteSelected}
                leftIcon={<Trash2 size={16} />}
              >
                Remover {selectedSlotIds.size} slot(s)
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="w-full sm:w-56">
                <Select
                  value={selectedTenant}
                  onChange={(e) => {
                    setSelectedTenant(e.target.value);
                    setSelectedLocation("");
                  }}
                  options={[
                    { value: "", label: "Todas as empresas" },
                    ...tenantOptions.map((t) => ({
                      value: t.tenantId,
                      label: t.tenantName,
                    })),
                  ]}
                />
              </div>
              <div className="w-full sm:w-56">
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  options={[
                    { value: "", label: "Todas as localizações" },
                    ...uniqueLocations.map((l) => ({
                      value: l.locationId,
                      label: l.locationName,
                    })),
                  ]}
                />
              </div>
              <div className="flex-1" />
              {/* Week Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek("prev")}
                >
                  <ChevronLeft size={18} />
                </Button>
                <button
                  onClick={goToCurrentWeek}
                  className="text-sm font-medium text-(--color-secondary) hover:text-(--color-accent) transition-colors min-w-45 text-center"
                >
                  {formatWeekRange()}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateWeek("next")}
                >
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>
          </Card>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : slots.length === 0 ? (
            <EmptyState
              icon={<Calendar size={48} />}
              title="Sem disponibilidade nesta semana"
              description="Nenhum slot de disponibilidade encontrado para o período selecionado."
            />
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`}
            >
              {weekDays.map((dateStr) => {
                const daySlots = groupedByDate[dateStr] || [];
                const isToday = dateStr === today;

                return (
                  <Card
                    key={dateStr}
                    className={`p-3 min-w-0 ${isToday ? "ring-2 ring-(--color-accent)" : ""}`}
                  >
                    <div className="text-center mb-3">
                      <p
                        className={`text-xs lg:text-sm font-medium uppercase ${
                          isToday ? "text-(--color-accent)" : "text-gray-500"
                        }`}
                      >
                        {formatDate(dateStr)}
                      </p>
                      {isToday && (
                        <Badge variant="error" className="text-xs mt-1">
                          Hoje
                        </Badge>
                      )}
                    </div>

                    {daySlots.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">
                        Sem slots
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {daySlots
                          .sort((a, b) =>
                            a.startTime.localeCompare(b.startTime),
                          )
                          .map((slot) => {
                            const hasAppointment = slot.appointments.length > 0;
                            const isSelected = selectedSlotIds.has(slot.id);
                            const isPast = dateStr < today;

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() =>
                                  !isPast &&
                                  !hasAppointment &&
                                  toggleSlotSelection(slot.id)
                                }
                                disabled={isPast || hasAppointment}
                                className={`w-full text-left p-2 lg:p-2.5 rounded-lg text-xs lg:text-sm transition-colors border ${
                                  isSelected
                                    ? "border-(--color-accent) bg-red-50"
                                    : hasAppointment
                                      ? "border-green-200 bg-green-50"
                                      : isPast
                                        ? "border-gray-200 bg-gray-50 opacity-50"
                                        : "border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1 gap-1">
                                  <span className="font-medium whitespace-nowrap">
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                  {hasAppointment ? (
                                    <Badge
                                      variant="success"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      Agendado
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="info"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      Livre
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-500 truncate lg:whitespace-normal">
                                  {slot.program.name}
                                </p>
                                <p className="text-gray-400 truncate lg:whitespace-normal flex items-center gap-1">
                                  <MapPin size={10} />
                                  {slot.location.name}
                                </p>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteSlots.length > 0}
          onClose={() => setDeleteSlots([])}
          title="Remover Slots"
          size="sm"
        >
          <Alert variant="warning" title="Atenção">
            Você está prestes a remover{" "}
            <strong>{deleteSlots.length} slot(s)</strong> de disponibilidade.
            Apenas slots sem agendamentos podem ser removidos.
          </Alert>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setDeleteSlots([])}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleting}
            >
              Confirmar Remoção
            </Button>
          </ModalFooter>
        </Modal>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
