"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Modal, ModalFooter } from "@/components/molecules/Modal";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Package,
  ArrowLeft,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ProgramItem {
  id: string;
  name: string;
  sessionDurationMinutes: number;
  dayStart: string;
  dayEnd: string;
  hasAvailability: boolean;
}

interface LocationItem {
  id: string;
  name: string;
  address: string;
}

interface AvailableDate {
  date: string;
  totalCapacity: number;
  totalReserved: number;
  available: number;
}

interface SlotTherapist {
  id: string;
  name: string;
  specialties: string | null;
  slotId: string;
  available: boolean;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  therapists: SlotTherapist[];
  totalCapacity: number;
  totalReserved: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("pt-BR", { weekday: "long" });
}

function getMonthName(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

const STEPS = [
  { id: 1, label: "Programa", icon: Package },
  { id: 2, label: "Data e Local", icon: Calendar },
  { id: 3, label: "Horário", icon: Clock },
  { id: 4, label: "Confirmação", icon: Check },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  isCompleted
                    ? "bg-(--color-accent) border-(--color-accent) text-white"
                    : isCurrent
                      ? "border-(--color-accent) text-(--color-accent) bg-white"
                      : "border-gray-300 text-gray-400 bg-white"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  isCurrent
                    ? "text-(--color-accent)"
                    : isCompleted
                      ? "text-(--color-secondary)"
                      : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 mb-5 ${
                  currentStep > step.id ? "bg-(--color-accent)" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN WIZARD PAGE
// ============================================================================

export default function NewAppointmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Wizard state
  const [selectedProgram, setSelectedProgram] = useState<ProgramItem | null>(
    null,
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedTherapist, setSelectedTherapist] =
    useState<SlotTherapist | null>(null);

  // Data
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Loading & Error
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  // ========================================================================
  // STEP 1: Load Programs
  // ========================================================================

  useEffect(() => {
    async function fetchPrograms() {
      setLoading(true);
      try {
        const res = await fetch("/api/employee/programs/available");
        const json = await res.json();
        if (json.success) {
          setPrograms(json.data);
        }
      } catch {
        setError("Erro ao carregar programas");
      } finally {
        setLoading(false);
      }
    }
    fetchPrograms();
  }, []);

  // ========================================================================
  // STEP 2: Load Locations when program selected
  // ========================================================================

  useEffect(() => {
    if (!selectedProgram) return;

    async function fetchLocations() {
      setLoading(true);
      setLocations([]);
      try {
        const res = await fetch(
          `/api/employee/locations?programId=${selectedProgram!.id}`,
        );
        const json = await res.json();
        if (json.success) {
          setLocations(json.data);
        }
      } catch {
        setError("Erro ao carregar localizações");
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, [selectedProgram]);

  // ========================================================================
  // STEP 2: Load Available Dates when location selected
  // ========================================================================

  const fetchAvailableDates = useCallback(async () => {
    if (!selectedProgram || !selectedLocation) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/employee/availability/dates?programId=${selectedProgram.id}&locationId=${selectedLocation.id}`,
      );
      const json = await res.json();
      if (json.success) {
        setAvailableDates(json.data);
      }
    } catch {
      setError("Erro ao carregar datas");
    } finally {
      setLoading(false);
    }
  }, [selectedProgram, selectedLocation]);

  useEffect(() => {
    fetchAvailableDates();
  }, [fetchAvailableDates]);

  // ========================================================================
  // STEP 3: Load Slots when date selected
  // ========================================================================

  useEffect(() => {
    if (!selectedProgram || !selectedLocation || !selectedDate) return;

    async function fetchSlots() {
      setLoading(true);
      setSlots([]);
      try {
        const res = await fetch(
          `/api/employee/availability/slots?programId=${selectedProgram!.id}&locationId=${selectedLocation!.id}&date=${selectedDate}`,
        );
        const json = await res.json();
        if (json.success) {
          setSlots(json.data);
        }
      } catch {
        setError("Erro ao carregar horários");
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [selectedProgram, selectedLocation, selectedDate]);

  // ========================================================================
  // SUBMIT
  // ========================================================================

  async function handleConfirmAppointment() {
    if (
      !selectedProgram ||
      !selectedLocation ||
      !selectedDate ||
      !selectedSlot ||
      !selectedTherapist
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/employee/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgram.id,
          locationId: selectedLocation.id,
          slotId: selectedTherapist.slotId,
          therapistId: selectedTherapist.id,
          date: selectedDate,
          startTime: selectedSlot.startTime,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Erro ao criar agendamento");
        return;
      }

      router.push(`/appointments/${json.data.id}?created=true`);
    } catch {
      setError("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  }

  // ========================================================================
  // NAVIGATION
  // ========================================================================

  function goBack() {
    if (step === 1) {
      router.push("/appointments");
    } else {
      if (step === 2) {
        setSelectedLocation(null);
        setSelectedDate(null);
        setAvailableDates([]);
      }
      if (step === 3) {
        setSelectedSlot(null);
        setSelectedTherapist(null);
        setSlots([]);
      }
      setStep(step - 1);
      setError(null);
    }
  }

  // ========================================================================
  // CALENDAR COMPONENT
  // ========================================================================

  function renderCalendar() {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const availableDateSet = new Set(availableDates.map((d) => d.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = Array(firstDay).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (month === 0) {
                setCalendarMonth({ year: year - 1, month: 11 });
              } else {
                setCalendarMonth({ year, month: month - 1 });
              }
            }}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <Text variant="h4" className="capitalize">
            {getMonthName(year, month)}
          </Text>
          <button
            onClick={() => {
              if (month === 11) {
                setCalendarMonth({ year: year + 1, month: 0 });
              } else {
                setCalendarMonth({ year, month: month + 1 });
              }
            }}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-gray-500 py-1"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((day, idx) => {
            if (day === null) {
              return <div key={idx} />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isAvailable = availableDateSet.has(dateStr);
            const isPast = new Date(dateStr + "T12:00:00") < today;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (isAvailable && !isPast) {
                    setSelectedDate(dateStr);
                    setSelectedSlot(null);
                    setSelectedTherapist(null);
                  }
                }}
                disabled={!isAvailable || isPast}
                className={`
                  h-10 rounded-lg text-sm font-medium transition-all
                  ${isSelected ? "bg-(--color-accent) text-white shadow-md" : ""}
                  ${isAvailable && !isPast && !isSelected ? "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer" : ""}
                  ${isPast ? "text-gray-300 cursor-not-allowed" : ""}
                  ${!isAvailable && !isPast ? "text-gray-400 cursor-not-allowed" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-(--color-accent)" />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100" />
            <span>Indisponível</span>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-(--color-secondary) mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <Text variant="h1">Novo Agendamento</Text>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 1: PROGRAMA */}
        {/* ============================================================= */}
        {step === 1 && (
          <div>
            <Text variant="h3" className="mb-4">
              Escolha o Programa
            </Text>
            <Text variant="p" className="text-gray-600 mb-6">
              Selecione a modalidade de massagem desejada
            </Text>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : programs.length === 0 ? (
              <EmptyState
                icon={<Package />}
                title="Nenhum programa disponível"
                description="Não há programas ativos para sua empresa no momento."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programs.map((program) => (
                  <Card
                    key={program.id}
                    className={`cursor-pointer transition-all ${
                      selectedProgram?.id === program.id
                        ? "ring-2 ring-(--color-accent) border-(--color-accent)"
                        : "hover:shadow-md"
                    } ${!program.hasAvailability ? "opacity-60" : ""}`}
                    onClick={() => {
                      if (program.hasAvailability) {
                        setSelectedProgram(program);
                        setSelectedLocation(null);
                        setSelectedDate(null);
                        setSelectedSlot(null);
                        setSelectedTherapist(null);
                      }
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-(--color-secondary) mb-1">
                            {program.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {program.sessionDurationMinutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {program.dayStart} - {program.dayEnd}
                            </span>
                          </div>
                        </div>
                        {selectedProgram?.id === program.id && (
                          <div className="p-1 rounded-full bg-(--color-accent) text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      {!program.hasAvailability && (
                        <Badge variant="warning" className="mt-2">
                          Sem disponibilidade
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button
                variant="primary"
                disabled={!selectedProgram}
                onClick={() => setStep(2)}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 2: DATA E LOCAL */}
        {/* ============================================================= */}
        {step === 2 && (
          <div>
            <Text variant="h3" className="mb-4">
              Escolha o Local e a Data
            </Text>
            <Text variant="p" className="text-gray-600 mb-6">
              Selecione a localização e a data para sua sessão de{" "}
              <strong>{selectedProgram?.name}</strong>
            </Text>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Locations */}
              <div>
                <Text variant="h4" className="mb-3">
                  Localização
                </Text>
                {loading && locations.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : locations.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhuma localização com disponibilidade
                  </p>
                ) : (
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div
                        key={loc.id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setSelectedDate(null);
                          setSelectedSlot(null);
                          setSelectedTherapist(null);
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedLocation?.id === loc.id
                            ? "border-(--color-accent) bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin
                            className={`h-4 w-4 ${
                              selectedLocation?.id === loc.id
                                ? "text-(--color-accent)"
                                : "text-gray-400"
                            }`}
                          />
                          <div>
                            <p className="font-medium text-sm">{loc.name}</p>
                            <p className="text-xs text-gray-500">
                              {loc.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Calendar */}
              <div>
                <Text variant="h4" className="mb-3">
                  Data
                </Text>
                {selectedLocation ? (
                  loading && availableDates.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : (
                    renderCalendar()
                  )
                ) : (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                    Selecione uma localização primeiro
                  </div>
                )}
              </div>
            </div>

            {selectedDate && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
                📅 Data selecionada:{" "}
                <strong>
                  {formatDateBR(selectedDate)} ({getDayName(selectedDate)})
                </strong>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button
                variant="ghost"
                onClick={goBack}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                disabled={!selectedLocation || !selectedDate}
                onClick={() => setStep(3)}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 3: HORÁRIO E TERAPEUTA */}
        {/* ============================================================= */}
        {step === 3 && (
          <div>
            <Text variant="h3" className="mb-4">
              Escolha o Horário e Terapeuta
            </Text>
            <Text variant="p" className="text-gray-600 mb-6">
              {selectedProgram?.name} • {selectedLocation?.name} •{" "}
              {selectedDate && formatDateBR(selectedDate)}
            </Text>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : slots.length === 0 ? (
              <EmptyState
                icon={<Clock />}
                title="Sem horários disponíveis"
                description="Não há horários disponíveis para esta data. Tente outra data."
                action={{ label: "Voltar", onClick: goBack }}
              />
            ) : (
              <div className="space-y-4">
                {slots.map((slot) => {
                  const isSlotFull = slot.totalReserved >= slot.totalCapacity;
                  const availableTherapists = slot.therapists.filter(
                    (t) => t.available,
                  );

                  return (
                    <Card
                      key={`${slot.startTime}-${slot.endTime}`}
                      className={isSlotFull ? "opacity-50" : ""}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-(--color-accent)" />
                              <span className="text-lg font-semibold">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            {isSlotFull ? (
                              <Badge variant="error">Lotado</Badge>
                            ) : (
                              <Badge variant="success">
                                {slot.totalCapacity - slot.totalReserved} vaga
                                {slot.totalCapacity - slot.totalReserved > 1
                                  ? "s"
                                  : ""}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {!isSlotFull && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {availableTherapists.map((therapist) => (
                              <div
                                key={therapist.id}
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setSelectedTherapist(therapist);
                                }}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                  selectedTherapist?.slotId === therapist.slotId
                                    ? "border-(--color-accent) bg-red-50 ring-1 ring-(--color-accent)"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-(--color-accent)/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-(--color-accent)" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {therapist.name}
                                    </p>
                                    {therapist.specialties && (
                                      <p className="text-xs text-gray-500">
                                        {therapist.specialties}
                                      </p>
                                    )}
                                  </div>
                                  {selectedTherapist?.slotId ===
                                    therapist.slotId && (
                                    <Check className="h-4 w-4 text-(--color-accent) ml-auto" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button
                variant="ghost"
                onClick={goBack}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                disabled={!selectedSlot || !selectedTherapist}
                onClick={() => setStep(4)}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 4: CONFIRMAÇÃO */}
        {/* ============================================================= */}
        {step === 4 && (
          <div>
            <Text variant="h3" className="mb-4">
              Confirmar Agendamento
            </Text>
            <Text variant="p" className="text-gray-600 mb-6">
              Revise os detalhes do seu agendamento antes de confirmar
            </Text>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Package className="h-5 w-5 text-(--color-accent)" />
                    <div>
                      <p className="text-sm text-gray-500">Programa</p>
                      <p className="font-semibold text-(--color-secondary)">
                        {selectedProgram?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Duração: {selectedProgram?.sessionDurationMinutes}{" "}
                        minutos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pb-4 border-b">
                    <MapPin className="h-5 w-5 text-(--color-accent)" />
                    <div>
                      <p className="text-sm text-gray-500">Local</p>
                      <p className="font-semibold text-(--color-secondary)">
                        {selectedLocation?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedLocation?.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Calendar className="h-5 w-5 text-(--color-accent)" />
                    <div>
                      <p className="text-sm text-gray-500">Data</p>
                      <p className="font-semibold text-(--color-secondary)">
                        {selectedDate && formatDateBR(selectedDate)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {selectedDate && getDayName(selectedDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Clock className="h-5 w-5 text-(--color-accent)" />
                    <div>
                      <p className="text-sm text-gray-500">Horário</p>
                      <p className="font-semibold text-(--color-secondary)">
                        {selectedSlot?.startTime} - {selectedSlot?.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-(--color-accent)" />
                    <div>
                      <p className="text-sm text-gray-500">Terapeuta</p>
                      <p className="font-semibold text-(--color-secondary)">
                        {selectedTherapist?.name}
                      </p>
                      {selectedTherapist?.specialties && (
                        <p className="text-xs text-gray-500">
                          {selectedTherapist.specialties}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm">
              ⚠️ Após a confirmação, o cancelamento só poderá ser feito com pelo
              menos 4 horas de antecedência.
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="ghost"
                onClick={goBack}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                isLoading={submitting}
                onClick={handleConfirmAppointment}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Confirmar Agendamento
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
