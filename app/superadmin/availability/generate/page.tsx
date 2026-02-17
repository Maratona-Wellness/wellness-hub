"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Package,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/molecules/Card";
import { Alert } from "@/components/molecules/Alert";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

interface ProgramOption {
  id: string;
  name: string;
  sessionDurationMinutes: number;
  dayStart: string;
  dayEnd: string;
  dailyCapacityPerLocation: number;
  active: boolean;
}

interface LocationOption {
  id: string;
  name: string;
  address: string;
}

interface TherapistOption {
  id: string;
  name: string;
  specialties: string | null;
}

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default function SuperAdminGenerateAvailabilityPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [therapists, setTherapists] = useState<TherapistOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedTherapists, setSelectedTherapists] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]);
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");
  const [breakBetweenSlots, setBreakBetweenSlots] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skippedConflicts: number;
    totalDates: number;
    totalTherapists: number;
    slotsPerDay: number;
    programName: string;
  } | null>(null);

  // Tenant select (SUPER_ADMIN sempre seleciona tenant)
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [tenantsList, setTenantsList] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    fetch(
      "/api/admin/tenants?limit=100&status=active&sortBy=name&sortOrder=asc",
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTenantsList(
            data.data.map((t: { id: string; name: string }) => ({
              id: t.id,
              name: t.name,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchProgramsAndLocations = useCallback(async () => {
    if (!selectedTenantId) return;
    setLoadingData(true);

    try {
      const [programsRes, locationsRes] = await Promise.all([
        fetch(
          `/api/admin/tenants/${selectedTenantId}/programs?activeOnly=true`,
        ),
        fetch(`/api/admin/tenants/${selectedTenantId}/locations`),
      ]);

      const [programsData, locationsData] = await Promise.all([
        programsRes.json(),
        locationsRes.json(),
      ]);

      if (programsData.success) setPrograms(programsData.data);
      if (locationsData.success) setLocations(locationsData.data);
    } catch {
      addToast("error", "Erro ao carregar dados");
    } finally {
      setLoadingData(false);
    }
  }, [selectedTenantId, addToast]);

  useEffect(() => {
    if (selectedTenantId) {
      fetchProgramsAndLocations();
      setSelectedProgram("");
      setSelectedLocation("");
      setSelectedTherapists([]);
    }
  }, [selectedTenantId, fetchProgramsAndLocations]);

  // Fetch therapists when location changes
  useEffect(() => {
    if (!selectedLocation || !selectedTenantId) {
      setTherapists([]);
      setSelectedTherapists([]);
      return;
    }

    fetch(
      `/api/admin/therapists?limit=100&status=active&tenantId=${selectedTenantId}&sortBy=name&sortOrder=asc`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTherapists(
            data.data.map(
              (t: {
                id: string;
                name: string;
                specialties: string | null;
              }) => ({
                id: t.id,
                name: t.name,
                specialties: t.specialties,
              }),
            ),
          );
        }
      })
      .catch(() => {
        addToast("error", "Erro ao carregar terapeutas");
      });
  }, [selectedLocation, selectedTenantId, addToast]);

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const toggleTherapist = (id: string) => {
    setSelectedTherapists((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const selectAllTherapists = () => {
    if (selectedTherapists.length === therapists.length) {
      setSelectedTherapists([]);
    } else {
      setSelectedTherapists(therapists.map((t) => t.id));
    }
  };

  const selectedProgramData = programs.find((p) => p.id === selectedProgram);

  // Calcular preview
  const getPreview = () => {
    if (
      !selectedProgram ||
      !startDate ||
      !endDate ||
      selectedWeekdays.length === 0 ||
      selectedTherapists.length === 0 ||
      !selectedProgramData
    ) {
      return null;
    }

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    let daysCount = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (selectedWeekdays.includes(d.getDay())) daysCount++;
    }

    const dayStartMin =
      parseInt(selectedProgramData.dayStart.split(":")[0]) * 60 +
      parseInt(selectedProgramData.dayStart.split(":")[1]);
    const dayEndMin =
      parseInt(selectedProgramData.dayEnd.split(":")[0]) * 60 +
      parseInt(selectedProgramData.dayEnd.split(":")[1]);
    const dur = selectedProgramData.sessionDurationMinutes;

    const brkStartMin = breakStart
      ? parseInt(breakStart.split(":")[0]) * 60 +
        parseInt(breakStart.split(":")[1])
      : null;
    const brkEndMin = breakEnd
      ? parseInt(breakEnd.split(":")[0]) * 60 + parseInt(breakEnd.split(":")[1])
      : null;

    const gap = breakBetweenSlots || 0;

    let slotsPerDay = 0;
    for (let t = dayStartMin; t + dur <= dayEndMin; t += dur + gap) {
      if (
        brkStartMin !== null &&
        brkEndMin !== null &&
        t < brkEndMin &&
        t + dur > brkStartMin
      ) {
        continue;
      }
      slotsPerDay++;
    }

    const totalSlots = daysCount * selectedTherapists.length * slotsPerDay;

    return {
      daysCount,
      slotsPerDay,
      totalSlots,
      therapistsCount: selectedTherapists.length,
    };
  };

  const preview = getPreview();

  const handleGenerate = async () => {
    if (!selectedTenantId) {
      addToast("error", "Selecione uma empresa");
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const body: Record<string, unknown> = {
        programId: selectedProgram,
        locationId: selectedLocation,
        therapistIds: selectedTherapists,
        startDate,
        endDate,
        weekdays: selectedWeekdays,
        tenantId: selectedTenantId,
      };

      if (breakStart && breakEnd) {
        body.breakStart = breakStart;
        body.breakEnd = breakEnd;
      }

      if (breakBetweenSlots > 0) {
        body.breakBetweenSlotsMinutes = breakBetweenSlots;
      }

      const res = await fetch("/api/availability/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        addToast("success", data.message);
      } else {
        addToast("error", data.error || "Erro ao gerar slots");
      }
    } catch {
      addToast("error", "Erro ao gerar slots de disponibilidade");
    } finally {
      setGenerating(false);
    }
  };

  const isFormValid =
    selectedTenantId &&
    selectedProgram &&
    selectedLocation &&
    selectedTherapists.length > 0 &&
    startDate &&
    endDate &&
    selectedWeekdays.length > 0 &&
    endDate >= startDate;

  // Step 1: Tenant selection
  if (!selectedTenantId) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/superadmin/availability")}
                leftIcon={<ArrowLeft size={16} />}
              >
                Voltar
              </Button>
            </div>
            <div>
              <Text variant="h2">Gerar Disponibilidade</Text>
              <Text variant="p" className="text-(--color-text-muted) mt-1">
                Selecione uma empresa para gerar slots de disponibilidade
              </Text>
            </div>
            <Card>
              <div className="flex flex-col gap-1.5 p-4">
                <label className="text-sm font-medium text-(--color-secondary)">
                  Empresa <span className="text-red-500 ml-1">*</span>
                </label>
                <Select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  options={[
                    { value: "", label: "Selecione uma empresa..." },
                    ...tenantsList.map((t) => ({
                      value: t.id,
                      label: t.name,
                    })),
                  ]}
                />
              </div>
            </Card>
          </div>
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/superadmin/availability")}
              leftIcon={<ArrowLeft size={16} />}
            >
              Voltar
            </Button>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Gerar Disponibilidade</Text>
              <Text variant="p" className="text-(--color-text-muted) mt-1">
                Gere slots de disponibilidade em lote para um programa
              </Text>
            </div>
            <div>
              <Badge variant="info">
                {tenantsList.find((t) => t.id === selectedTenantId)?.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTenantId("");
                  setPrograms([]);
                  setLocations([]);
                  setTherapists([]);
                  setSelectedProgram("");
                  setSelectedLocation("");
                  setSelectedTherapists([]);
                }}
                className="ml-2"
              >
                Trocar empresa
              </Button>
            </div>
          </div>

          {result ? (
            /* Result Card */
            <Card>
              <div className="text-center py-8 space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <Text variant="h3">Slots Gerados com Sucesso!</Text>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-(--color-accent)">
                      {result.created}
                    </p>
                    <p className="text-sm text-(--color-text-muted)">
                      Slots criados
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-(--color-secondary)">
                      {result.totalDates}
                    </p>
                    <p className="text-sm text-(--color-text-muted)">Dias</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-(--color-secondary)">
                      {result.totalTherapists}
                    </p>
                    <p className="text-sm text-(--color-text-muted)">
                      Terapeutas
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-(--color-secondary)">
                      {result.slotsPerDay}
                    </p>
                    <p className="text-sm text-(--color-text-muted)">
                      Slots/dia
                    </p>
                  </div>
                </div>
                {result.skippedConflicts > 0 && (
                  <Alert variant="warning" title="Conflitos ignorados">
                    {result.skippedConflicts} slot(s) já existiam e foram
                    ignorados na geração.
                  </Alert>
                )}
                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setResult(null)}>
                    Gerar Mais
                  </Button>
                  <Button
                    onClick={() => router.push("/superadmin/availability")}
                    leftIcon={<ArrowLeft size={16} />}
                  >
                    Ver Disponibilidade
                  </Button>
                </div>
              </div>
            </Card>
          ) : loadingData ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Programa e Localização */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package size={20} />
                      Programa e Localização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-(--color-secondary)">
                        Programa <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        options={[
                          { value: "", label: "Selecione um programa..." },
                          ...programs.map((p) => ({
                            value: p.id,
                            label: `${p.name} (${p.sessionDurationMinutes} min)`,
                          })),
                        ]}
                      />
                    </div>

                    {selectedProgramData && (
                      <div className="grid grid-cols-3 gap-4 p-3 bg-(--color-background-alt) rounded-lg text-sm">
                        <div>
                          <span className="text-(--color-text-muted)">
                            Duração:
                          </span>
                          <p className="font-medium">
                            {selectedProgramData.sessionDurationMinutes} minutos
                          </p>
                        </div>
                        <div>
                          <span className="text-(--color-text-muted)">
                            Horário:
                          </span>
                          <p className="font-medium">
                            {selectedProgramData.dayStart} –{" "}
                            {selectedProgramData.dayEnd}
                          </p>
                        </div>
                        <div>
                          <span className="text-(--color-text-muted)">
                            Capacidade:
                          </span>
                          <p className="font-medium">
                            {selectedProgramData.dailyCapacityPerLocation}/local
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-(--color-secondary)">
                        Localização <span className="text-red-500 ml-1">*</span>
                      </label>
                      <Select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        options={[
                          { value: "", label: "Selecione uma localização..." },
                          ...locations.map((l) => ({
                            value: l.id,
                            label: `${l.name} — ${l.address}`,
                          })),
                        ]}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Período */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar size={20} />
                      Período
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-(--color-secondary)">
                          Data Início{" "}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-(--color-secondary)">
                          Data Fim <span className="text-red-500 ml-1">*</span>
                        </label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={
                            startDate || new Date().toISOString().split("T")[0]
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-(--color-secondary)">
                        Dias da Semana{" "}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAY_LABELS.map((label, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleWeekday(idx)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedWeekdays.includes(idx)
                                ? "bg-(--color-accent) text-white"
                                : "bg-(--color-background-alt) text-(--color-text-muted) hover:bg-gray-200"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Intervalo de Descanso */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-(--color-secondary)">
                        Intervalo / Almoço{" "}
                        <span className="text-xs text-(--color-text-muted) font-normal">
                          (opcional)
                        </span>
                      </label>
                      <p className="text-xs text-(--color-text-muted)">
                        Slots que caírem dentro deste período serão ignorados
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-(--color-text-muted)">
                            Início
                          </label>
                          <Input
                            type="time"
                            value={breakStart}
                            onChange={(e) => setBreakStart(e.target.value)}
                            placeholder="12:00"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-(--color-text-muted)">
                            Fim
                          </label>
                          <Input
                            type="time"
                            value={breakEnd}
                            onChange={(e) => setBreakEnd(e.target.value)}
                            placeholder="13:00"
                          />
                        </div>
                      </div>
                      {breakStart && breakEnd && breakEnd <= breakStart && (
                        <p className="text-xs text-red-500">
                          O fim do intervalo deve ser posterior ao início
                        </p>
                      )}
                    </div>

                    {/* Intervalo entre Slots */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-(--color-secondary)">
                        Intervalo entre sessões{" "}
                        <span className="text-xs text-(--color-text-muted) font-normal">
                          (opcional)
                        </span>
                      </label>
                      <p className="text-xs text-(--color-text-muted)">
                        Tempo de descanso entre uma sessão e outra
                      </p>
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <Input
                          type="number"
                          value={breakBetweenSlots.toString()}
                          onChange={(e) =>
                            setBreakBetweenSlots(
                              Math.max(0, parseInt(e.target.value) || 0),
                            )
                          }
                          min={0}
                          max={120}
                        />
                        <span className="text-sm text-(--color-text-muted) whitespace-nowrap">
                          minutos
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Terapeutas */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck size={20} />
                        Terapeutas
                      </CardTitle>
                      {therapists.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllTherapists}
                        >
                          {selectedTherapists.length === therapists.length
                            ? "Desmarcar Todos"
                            : "Selecionar Todos"}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!selectedLocation ? (
                      <p className="text-sm text-(--color-text-muted) italic">
                        Selecione uma localização para ver os terapeutas
                        disponíveis
                      </p>
                    ) : therapists.length === 0 ? (
                      <Alert variant="warning" title="Sem terapeutas">
                        Nenhum terapeuta ativo está vinculado a esta
                        localização. Vincule terapeutas antes de gerar
                        disponibilidade.
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        {therapists.map((therapist) => (
                          <label
                            key={therapist.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedTherapists.includes(therapist.id)
                                ? "border-(--color-accent) bg-red-50"
                                : "border-(--color-border) hover:bg-(--color-background-alt)"
                            }`}
                          >
                            <Checkbox
                              checked={selectedTherapists.includes(
                                therapist.id,
                              )}
                              onChange={() => toggleTherapist(therapist.id)}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-(--color-secondary)">
                                {therapist.name}
                              </p>
                              {therapist.specialties && (
                                <p className="text-sm text-(--color-text-muted)">
                                  {therapist.specialties}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Preview Sidebar */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Resumo da Geração</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {preview ? (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-(--color-text-muted)">
                              Programa:
                            </span>
                            <span className="font-medium">
                              {selectedProgramData?.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-(--color-text-muted)">
                              Dias no período:
                            </span>
                            <span className="font-medium">
                              {preview.daysCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-(--color-text-muted)">
                              Terapeutas:
                            </span>
                            <span className="font-medium">
                              {preview.therapistsCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-(--color-text-muted)">
                              Slots/dia/terapeuta:
                            </span>
                            <span className="font-medium">
                              {preview.slotsPerDay}
                            </span>
                          </div>
                          {breakStart && breakEnd && breakEnd > breakStart && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-(--color-text-muted)">
                                Intervalo:
                              </span>
                              <span className="font-medium text-amber-600">
                                {breakStart} — {breakEnd}
                              </span>
                            </div>
                          )}
                          {breakBetweenSlots > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-(--color-text-muted)">
                                Entre sessões:
                              </span>
                              <span className="font-medium text-amber-600">
                                {breakBetweenSlots} min
                              </span>
                            </div>
                          )}
                          <hr className="border-(--color-border)" />
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-(--color-secondary)">
                              Total de Slots:
                            </span>
                            <Badge variant="info" className="text-lg px-3 py-1">
                              {preview.totalSlots}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          onClick={handleGenerate}
                          isLoading={generating}
                          disabled={!isFormValid}
                        >
                          Gerar {preview.totalSlots} Slots
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 text-(--color-text-muted) mx-auto mb-2" />
                        <p className="text-sm text-(--color-text-muted)">
                          Preencha todos os campos para ver o resumo da geração
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
