"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

interface TherapistData {
  id: string;
  email: string;
  name: string;
  cpf: string;
  specialties: string | null;
  active: boolean;
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

export default function EditTherapistPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toasts, addToast, removeToast } = useToast();

  const [therapist, setTherapist] = useState<TherapistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchTherapist = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/therapists/${id}`);
      const data = await res.json();

      if (data.success) {
        setTherapist(data.data);
        setName(data.data.name);
        setSpecialties(data.data.specialties || "");
      } else {
        addToast("error", "Terapeuta não encontrado");
        router.push("/superadmin/therapists");
      }
    } catch {
      addToast("error", "Erro ao carregar terapeuta");
    } finally {
      setLoading(false);
    }
  }, [id, router, addToast]);

  useEffect(() => {
    fetchTherapist();
  }, [fetchTherapist]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name || name.trim().length < 2) {
      newErrors.name = "O nome deve ter pelo menos 2 caracteres";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/therapists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          specialties: specialties.trim() || "",
        }),
      });
      const data = await res.json();

      if (data.success) {
        addToast("success", "Terapeuta atualizado com sucesso");
        setTimeout(() => {
          router.push(`/superadmin/therapists/${id}`);
        }, 1000);
      } else {
        addToast("error", data.error || "Erro ao atualizar");
      }
    } catch {
      addToast("error", "Erro ao atualizar terapeuta");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    therapist &&
    (name !== therapist.name || specialties !== (therapist.specialties || ""));

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!therapist) return null;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/superadmin/therapists/${id}`)}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <Text variant="h2">Editar Terapeuta</Text>
              <Text variant="p" className="text-(--color-text-muted) mt-1">
                {therapist.name} — {therapist.email}
              </Text>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <div className="space-y-6 p-2">
                <Text variant="h4" className="flex items-center gap-2">
                  <Pencil size={18} />
                  Dados do Terapeuta
                </Text>

                <FormField
                  type="input"
                  label="Nome Completo"
                  error={errors.name}
                  required
                  inputProps={{
                    value: name,
                    onChange: (e) => {
                      setName(e.target.value);
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: "" }));
                    },
                    placeholder: "Nome do terapeuta",
                  }}
                />

                <FormField
                  type="input"
                  label="Especialidades"
                  helpText="Ex: Massagem relaxante, Shiatsu, Reflexologia"
                  inputProps={{
                    value: specialties,
                    onChange: (e) => setSpecialties(e.target.value),
                    placeholder: "Especialidades do terapeuta",
                  }}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    type="input"
                    label="Email"
                    helpText="Email não pode ser alterado"
                    inputProps={{
                      value: therapist.email,
                      disabled: true,
                    }}
                  />

                  <FormField
                    type="input"
                    label="CPF"
                    helpText="CPF não pode ser alterado"
                    inputProps={{
                      value: formatCPF(therapist.cpf),
                      disabled: true,
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-(--color-border) pt-4">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => router.push(`/superadmin/therapists/${id}`)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={saving}
                    disabled={!hasChanges}
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
