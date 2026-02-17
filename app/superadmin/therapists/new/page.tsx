"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Eye, EyeOff } from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";
import { Input } from "@/components/ui/Input";

function formatCPFInput(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9)
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

function getPasswordStrength(password: string): {
  level: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Fraca", color: "bg-red-500" };
  if (score <= 2)
    return { level: 2, label: "Razoável", color: "bg-orange-500" };
  if (score <= 3) return { level: 3, label: "Boa", color: "bg-yellow-500" };
  return { level: 4, label: "Forte", color: "bg-green-500" };
}

interface FormData {
  name: string;
  email: string;
  cpf: string;
  specialties: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  cpf?: string;
  specialties?: string;
  password?: string;
  confirmPassword?: string;
}

export default function NewTherapistPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    cpf: "",
    specialties: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = "O nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    const cleanedCPF = formData.cpf.replace(/\D/g, "");
    if (!cleanedCPF || cleanedCPF.length !== 11) {
      newErrors.cpf = "CPF deve ter 11 dígitos";
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "A senha deve ter pelo menos 8 caracteres";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = "A senha deve conter pelo menos 1 número";
    } else if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      newErrors.password =
        "A senha deve conter pelo menos 1 caractere especial";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/therapists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          cpf: formData.cpf.replace(/\D/g, ""),
          specialties: formData.specialties.trim() || undefined,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addToast("success", "Terapeuta cadastrado com sucesso!");
        setTimeout(() => {
          router.push("/superadmin/therapists");
        }, 1000);
      } else {
        addToast("error", data.error || "Erro ao cadastrar terapeuta");
      }
    } catch {
      addToast("error", "Erro ao cadastrar terapeuta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/superadmin/therapists")}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <Text variant="h2">Novo Terapeuta</Text>
              <Text variant="p" className="text-(--color-text-muted) mt-1">
                Cadastre um novo terapeuta na plataforma
              </Text>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <div className="space-y-6 p-2">
                <Text variant="h4" className="flex items-center gap-2">
                  <UserPlus size={20} />
                  Dados do Terapeuta
                </Text>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    type="input"
                    label="Nome Completo"
                    error={errors.name}
                    required
                    inputProps={{
                      value: formData.name,
                      onChange: (e) => handleChange("name", e.target.value),
                      placeholder: "Nome completo do terapeuta",
                    }}
                  />

                  <FormField
                    type="input"
                    label="Email"
                    error={errors.email}
                    required
                    inputProps={{
                      type: "email",
                      value: formData.email,
                      onChange: (e) => handleChange("email", e.target.value),
                      placeholder: "email@exemplo.com",
                    }}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    type="input"
                    label="CPF"
                    error={errors.cpf}
                    required
                    inputProps={{
                      value: formData.cpf,
                      onChange: (e) =>
                        handleChange("cpf", formatCPFInput(e.target.value)),
                      placeholder: "000.000.000-00",
                      maxLength: 14,
                    }}
                  />

                  <FormField
                    type="input"
                    label="Especialidades"
                    error={errors.specialties}
                    helpText="Ex: Massagem relaxante, Shiatsu, Reflexologia"
                    inputProps={{
                      value: formData.specialties,
                      onChange: (e) =>
                        handleChange("specialties", e.target.value),
                      placeholder: "Especialidades do terapeuta",
                    }}
                  />
                </div>

                <div className="border-t border-(--color-border) pt-4">
                  <Text variant="h4" className="mb-4">
                    Credenciais de Acesso
                  </Text>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-(--color-secondary)">
                        Senha
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            handleChange("password", e.target.value)
                          }
                          placeholder="Mínimo 8 caracteres"
                          error={errors.password}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text)"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>

                      {errors.password && (
                        <p className="text-sm text-red-500">
                          {errors.password}
                        </p>
                      )}

                      {formData.password && (
                        <div className="mt-1 space-y-1">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((level) => (
                              <div
                                key={level}
                                className={`h-1.5 flex-1 rounded-full ${
                                  level <= passwordStrength.level
                                    ? passwordStrength.color
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <Text variant="span" className="text-xs">
                            Força: {passwordStrength.label}
                          </Text>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-(--color-secondary)">
                        Confirmar Senha
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            handleChange("confirmPassword", e.target.value)
                          }
                          placeholder="Repita a senha"
                          error={errors.confirmPassword}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text)"
                          onClick={() => setShowConfirm(!showConfirm)}
                        >
                          {showConfirm ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-(--color-border) pt-4">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => router.push("/superadmin/therapists")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={submitting}>
                    Cadastrar Terapeuta
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
