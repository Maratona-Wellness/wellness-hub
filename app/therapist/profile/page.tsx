"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Building2,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  UserCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/molecules/Card";
import { Tabs } from "@/components/molecules/Tabs";
import { FormField } from "@/components/molecules/FormField";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { Alert } from "@/components/molecules/Alert";
import { AuthGuard } from "@/components/AuthGuard";
import { Input } from "@/components/ui/Input";

interface TherapistProfile {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  cpf: string;
  specialties: string | null;
  active: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    lastLoginAt: string | null;
    createdAt: string;
  } | null;
  therapistAssignments: Array<{
    id: string;
    tenant: { id: string; name: string; domain: string };
    location: { id: string; name: string; address: string };
  }>;
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    activeAssignments: number;
  };
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

export default function TherapistProfilePage() {
  const { toasts, addToast, removeToast } = useToast();

  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editSpecialties, setEditSpecialties] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );

  const passwordStrength = getPasswordStrength(newPassword);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/therapist/profile");
      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
        setEditName(data.data.name);
        setEditSpecialties(data.data.specialties || "");
      } else {
        addToast("error", data.error || "Erro ao carregar perfil");
      }
    } catch {
      addToast("error", "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    if (!editName || editName.trim().length < 2) {
      addToast("error", "O nome deve ter pelo menos 2 caracteres");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/therapist/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          specialties: editSpecialties.trim() || "",
        }),
      });
      const data = await res.json();

      if (data.success) {
        addToast("success", "Perfil atualizado com sucesso");
        fetchProfile();
      } else {
        addToast("error", data.error || "Erro ao atualizar perfil");
      }
    } catch {
      addToast("error", "Erro ao atualizar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = "Informe a senha atual";
    }
    if (!newPassword || newPassword.length < 8) {
      errors.newPassword = "A nova senha deve ter pelo menos 8 caracteres";
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = "A nova senha deve conter pelo menos 1 número";
    } else if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      errors.newPassword =
        "A nova senha deve conter pelo menos 1 caractere especial";
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "As senhas não coincidem";
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    try {
      const res = await fetch("/api/therapist/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        addToast("success", "Senha alterada com sucesso");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordErrors({});
      } else {
        addToast("error", data.error || "Erro ao alterar senha");
      }
    } catch {
      addToast("error", "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

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

  if (!profile) return null;

  const profileHasChanges =
    editName !== profile.name ||
    editSpecialties !== (profile.specialties || "");

  // Tab: Dados Pessoais
  const personalContent = (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4 p-2">
          <Text variant="h4" className="flex items-center gap-2">
            <User size={18} />
            Dados Pessoais
          </Text>

          <FormField
            type="input"
            label="Nome Completo"
            inputProps={{
              value: editName,
              onChange: (e) => setEditName(e.target.value),
              placeholder: "Seu nome completo",
            }}
          />

          <FormField
            type="input"
            label="Especialidades"
            helpText="Ex: Massagem relaxante, Shiatsu, Reflexologia"
            inputProps={{
              value: editSpecialties,
              onChange: (e) => setEditSpecialties(e.target.value),
              placeholder: "Suas especialidades",
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              type="input"
              label="Email"
              inputProps={{
                value: profile.email,
                disabled: true,
              }}
            />
            <FormField
              type="input"
              label="CPF"
              inputProps={{
                value: formatCPF(profile.cpf),
                disabled: true,
              }}
            />
          </div>

          <div>
            <Text variant="span" className="text-(--color-text-muted) text-xs">
              Membro desde {formatDate(profile.createdAt)}
            </Text>
          </div>

          <div className="flex justify-end gap-3 border-t border-(--color-border) pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setEditName(profile.name);
                setEditSpecialties(profile.specialties || "");
              }}
              disabled={!profileHasChanges}
            >
              Resetar
            </Button>
            <Button
              onClick={handleSaveProfile}
              isLoading={savingProfile}
              disabled={!profileHasChanges}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // Tab: Vinculações
  const assignmentsContent = (
    <div className="space-y-4">
      <Alert variant="info">
        Suas vinculações são gerenciadas pela administração da plataforma. Entre
        em contato para solicitar alterações.
      </Alert>

      {profile.therapistAssignments.length === 0 ? (
        <EmptyAssignments />
      ) : (
        <div className="space-y-3">
          {profile.therapistAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <div className="flex items-center gap-4 p-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 size={20} className="text-(--color-primary)" />
                </div>
                <div>
                  <Text variant="p" className="font-medium">
                    {assignment.tenant.name}
                  </Text>
                  <Text
                    variant="span"
                    className="text-(--color-text-muted) text-sm"
                  >
                    <MapPin size={14} className="mr-1 inline" />
                    {assignment.location.name} — {assignment.location.address}
                  </Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Tab: Segurança
  const securityContent = (
    <div className="space-y-6">
      <Card>
        <div className="space-y-4 p-2">
          <Text variant="h4" className="flex items-center gap-2">
            <Lock size={18} />
            Alterar Senha
          </Text>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-(--color-secondary)">
              Senha Atual
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Input
                type={showCurrentPwd ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordErrors.currentPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      currentPassword: "",
                    }));
                  }
                }}
                placeholder="Sua senha atual"
                error={passwordErrors.currentPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text)"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
              >
                {showCurrentPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.currentPassword && (
              <p className="text-sm text-red-500">
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-(--color-secondary)">
              Nova Senha
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Input
                type={showNewPwd ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      newPassword: "",
                    }));
                  }
                }}
                placeholder="Mínimo 8 caracteres"
                error={passwordErrors.newPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text)"
                onClick={() => setShowNewPwd(!showNewPwd)}
              >
                {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p className="text-sm text-red-500">
                {passwordErrors.newPassword}
              </p>
            )}

            {newPassword && (
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
              Confirmar Nova Senha
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <Input
                type={showConfirmPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                  }
                }}
                placeholder="Repita a nova senha"
                error={passwordErrors.confirmPassword}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text)"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              >
                {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p className="text-sm text-red-500">
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="flex justify-end border-t border-(--color-border) pt-4">
            <Button
              onClick={handleChangePassword}
              isLoading={savingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Alterar Senha
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const tabs = [
    { id: "personal", label: "Dados Pessoais", content: personalContent },
    { id: "assignments", label: "Vinculações", content: assignmentsContent },
    { id: "security", label: "Segurança", content: securityContent },
  ];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div>
            <Text variant="h2">Meu Perfil</Text>
            <Text variant="p" className="text-(--color-text-muted) mt-1">
              Gerencie seus dados pessoais e configurações
            </Text>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-3 p-1">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar size={20} className="text-(--color-primary)" />
                </div>
                <div>
                  <Text
                    variant="span"
                    className="text-(--color-text-muted) text-xs"
                  >
                    Agendamentos
                  </Text>
                  <Text variant="h3">{profile.stats.totalAppointments}</Text>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3 p-1">
                <div className="rounded-lg bg-(--color-success)/10 p-2">
                  <UserCheck size={20} className="text-(--color-success)" />
                </div>
                <div>
                  <Text
                    variant="span"
                    className="text-(--color-text-muted) text-xs"
                  >
                    Concluídos
                  </Text>
                  <Text variant="h3">
                    {profile.stats.completedAppointments}
                  </Text>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3 p-1">
                <div className="rounded-lg bg-(--color-info)/10 p-2">
                  <Building2 size={20} className="text-(--color-info)" />
                </div>
                <div>
                  <Text
                    variant="span"
                    className="text-(--color-text-muted) text-xs"
                  >
                    Vinculações
                  </Text>
                  <Text variant="h3">{profile.stats.activeAssignments}</Text>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}

function EmptyAssignments() {
  return (
    <Card>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Building2 size={48} className="text-(--color-text-muted) mb-4" />
        <Text variant="h4">Nenhuma vinculação</Text>
        <Text variant="p" className="text-(--color-text-muted) mt-1">
          Você ainda não está vinculado a nenhuma empresa/localização
        </Text>
      </div>
    </Card>
  );
}
