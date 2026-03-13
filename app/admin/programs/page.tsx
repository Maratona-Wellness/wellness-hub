"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Package, Clock, Users, Calendar, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { SearchBar } from "@/components/molecules/SearchBar";
import { EmptyState } from "@/components/molecules/EmptyState";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface ProgramItem {
  id: string;
  name: string;
  sessionDurationMinutes: number;
  dayStart: string;
  dayEnd: string;
  dailyCapacityPerLocation: number;
  active: boolean;
  createdAt: string;
  _count: {
    availabilitySlots: number;
    appointments: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(time: string): string {
  return time.substring(0, 5);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // --------------------------------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------------------------------

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tenant-admin/programs");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao carregar programas");
      }

      setPrograms(data.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar programas",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // --------------------------------------------------------------------------
  // FILTERED DATA
  // --------------------------------------------------------------------------

  const filteredPrograms = programs.filter((program) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return program.name.toLowerCase().includes(term);
  });

  const activeCount = programs.filter((p) => p.active).length;

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Text variant="h2" className="flex items-center gap-2">
                <Package className="h-6 w-6 text-(--color-accent)" />
                Programas Disponíveis
              </Text>
              <Text variant="span" className="text-sm text-gray-500 mt-1">
                Programas de bem-estar vinculados à sua empresa
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{programs.length} programa(s)</Badge>
              <Badge variant="success">{activeCount} ativo(s)</Badge>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 max-w-md">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nome do programa..."
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-(--color-accent)" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card>
            <CardContent className="py-8 text-center">
              <Text className="text-red-500">{error}</Text>
              <button
                onClick={fetchPrograms}
                className="mt-2 text-sm text-(--color-accent) hover:underline"
              >
                Tentar novamente
              </button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPrograms.length === 0 && (
          <EmptyState
            icon={
              search ? (
                <Search className="h-12 w-12 text-gray-300" />
              ) : (
                <Package className="h-12 w-12 text-gray-300" />
              )
            }
            title={
              search
                ? "Nenhum programa encontrado"
                : "Nenhum programa disponível"
            }
            description={
              search
                ? "Tente buscar com outros termos"
                : "Ainda não há programas vinculados à sua empresa"
            }
          />
        )}

        {/* Program Cards */}
        {!loading && !error && filteredPrograms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPrograms.map((program) => (
              <Card
                key={program.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold text-(--color-secondary)">
                      {program.name}
                    </CardTitle>
                    <Badge
                      variant={program.active ? "success" : "warning"}
                      className="ml-2 shrink-0"
                    >
                      {program.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Duration */}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Duração: {program.sessionDurationMinutes} min
                      </span>
                    </div>

                    {/* Period */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Período: {formatTime(program.dayStart)} às{" "}
                        {formatTime(program.dayEnd)}
                      </span>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Capacidade: {program.dailyCapacityPerLocation} pessoa(s)
                        por sessão
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {program._count.availabilitySlots} slot(s) de
                        disponibilidade
                      </span>
                      <span>{program._count.appointments} agendamento(s)</span>
                    </div>

                    {/* Created at */}
                    <div className="text-xs text-gray-400">
                      Criado em {formatDate(program.createdAt)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
