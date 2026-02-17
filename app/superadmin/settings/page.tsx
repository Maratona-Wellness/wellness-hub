"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Settings, Shield, Mail, Clock, Save, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Spinner } from "@/components/ui/Spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { Tabs } from "@/components/molecules/Tabs";
import { Alert } from "@/components/molecules/Alert";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

// ============================================================================
// TYPES
// ============================================================================

interface GlobalSettings {
  policies: {
    maxAppointmentsPerDay: number;
    maxCancellationsPerMonth: number;
    minAdvanceBookingHours: number;
    maxAdvanceBookingDays: number;
    allowWeekendBooking: boolean;
    requireApproval: boolean;
  };
  rateLimits: {
    loginAttemptsPerMinute: number;
    apiRequestsPerMinute: number;
    passwordResetPerHour: number;
  };
  security: {
    sessionTimeoutMinutes: number;
    passwordMinLength: number;
    requireMfa: boolean;
    allowMagicLink: boolean;
    blockAfterFailedAttempts: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    fromName: string;
    fromEmail: string;
    enableNotifications: boolean;
  };
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function SuperAdminSettingsPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [original, setOriginal] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("policies");

  const hasChanges =
    settings &&
    original &&
    JSON.stringify(settings) !== JSON.stringify(original);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();

      if (json.success) {
        setSettings(json.data);
        setOriginal(JSON.parse(JSON.stringify(json.data)));
      } else {
        setError(json.error || "Erro ao carregar configurações");
      }
    } catch {
      setError("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();

      if (json.success) {
        setOriginal(JSON.parse(JSON.stringify(settings)));
        addToast("success", "Configurações salvas com sucesso");
      } else {
        addToast("error", json.error || "Erro ao salvar configurações");
      }
    } catch {
      addToast("error", "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (original) {
      setSettings(JSON.parse(JSON.stringify(original)));
    }
  };

  // Helper to update nested settings
  const updatePolicies = (key: string, value: number | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      policies: { ...settings.policies, [key]: value },
    });
  };

  const updateRateLimits = (key: string, value: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      rateLimits: { ...settings.rateLimits, [key]: value },
    });
  };

  const updateSecurity = (key: string, value: number | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      security: { ...settings.security, [key]: value },
    });
  };

  const updateEmail = (key: string, value: string | number | boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      email: { ...settings.email, [key]: value },
    });
  };

  const tabs = [
    { id: "policies", label: "Políticas", content: null },
    { id: "security", label: "Segurança", content: null },
    { id: "email", label: "Email", content: null },
    { id: "rateLimits", label: "Rate Limits", content: null },
  ];

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error || !settings) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <Alert variant="error" title="Erro">
            {error || "Não foi possível carregar as configurações"}
          </Alert>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Text variant="h2">Configurações Globais</Text>
              <Text className="text-gray-500 mt-1">
                Gerencie as configurações da plataforma
              </Text>
            </div>
            <div className="flex gap-2">
              {hasChanges && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Desfazer
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={saving}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            </div>
          </div>

          {hasChanges && (
            <Alert variant="warning" title="Alterações pendentes">
              Você possui alterações não salvas. Clique em &quot;Salvar&quot;
              para aplicar.
            </Alert>
          )}

          {/* Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* Policies Tab */}
          {activeTab === "policies" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Clock className="h-5 w-5 inline mr-2" />
                  Políticas de Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Máximo de agendamentos por dia
                      </label>
                      <Input
                        type="number"
                        value={settings.policies.maxAppointmentsPerDay}
                        onChange={(e) =>
                          updatePolicies(
                            "maxAppointmentsPerDay",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={1}
                        max={50}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Limite diário por funcionário
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Cancelamentos por mês
                      </label>
                      <Input
                        type="number"
                        value={settings.policies.maxCancellationsPerMonth}
                        onChange={(e) =>
                          updatePolicies(
                            "maxCancellationsPerMonth",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={0}
                        max={30}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Máximo de cancelamentos permitidos
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Antecedência mínima (horas)
                      </label>
                      <Input
                        type="number"
                        value={settings.policies.minAdvanceBookingHours}
                        onChange={(e) =>
                          updatePolicies(
                            "minAdvanceBookingHours",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={0}
                        max={72}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Horas de antecedência para agendar
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Antecedência máxima (dias)
                      </label>
                      <Input
                        type="number"
                        value={settings.policies.maxAdvanceBookingDays}
                        onChange={(e) =>
                          updatePolicies(
                            "maxAdvanceBookingDays",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={1}
                        max={365}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Máximo de dias no futuro para agendamento
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Permitir agendamento nos fins de semana
                        </p>
                        <p className="text-xs text-gray-400">
                          Habilita sábados e domingos para agendamento
                        </p>
                      </div>
                      <Switch
                        checked={settings.policies.allowWeekendBooking}
                        onChange={(e) =>
                          updatePolicies(
                            "allowWeekendBooking",
                            e.target.checked,
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Requer aprovação do admin
                        </p>
                        <p className="text-xs text-gray-400">
                          Agendamentos precisam de aprovação antes de confirmar
                        </p>
                      </div>
                      <Switch
                        checked={settings.policies.requireApproval}
                        onChange={(e) =>
                          updatePolicies("requireApproval", e.target.checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Shield className="h-5 w-5 inline mr-2" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Timeout de sessão (minutos)
                      </label>
                      <Input
                        type="number"
                        value={settings.security.sessionTimeoutMinutes}
                        onChange={(e) =>
                          updateSecurity(
                            "sessionTimeoutMinutes",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={5}
                        max={1440}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Comprimento mínimo da senha
                      </label>
                      <Input
                        type="number"
                        value={settings.security.passwordMinLength}
                        onChange={(e) =>
                          updateSecurity(
                            "passwordMinLength",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={6}
                        max={32}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Bloquear após tentativas falhas
                      </label>
                      <Input
                        type="number"
                        value={settings.security.blockAfterFailedAttempts}
                        onChange={(e) =>
                          updateSecurity(
                            "blockAfterFailedAttempts",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={3}
                        max={20}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Conta será bloqueada após N tentativas
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Exigir MFA
                        </p>
                        <p className="text-xs text-gray-400">
                          Autenticação multifator obrigatória
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.requireMfa}
                        onChange={(e) =>
                          updateSecurity("requireMfa", e.target.checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Permitir Magic Link
                        </p>
                        <p className="text-xs text-gray-400">
                          Login via link enviado por email
                        </p>
                      </div>
                      <Switch
                        checked={settings.security.allowMagicLink}
                        onChange={(e) =>
                          updateSecurity("allowMagicLink", e.target.checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Tab */}
          {activeTab === "email" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Mail className="h-5 w-5 inline mr-2" />
                  Configuração de Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Servidor SMTP
                      </label>
                      <Input
                        value={settings.email.smtpHost}
                        onChange={(e) =>
                          updateEmail("smtpHost", e.target.value)
                        }
                        placeholder="smtp.example.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Porta SMTP
                      </label>
                      <Input
                        type="number"
                        value={settings.email.smtpPort}
                        onChange={(e) =>
                          updateEmail("smtpPort", parseInt(e.target.value) || 0)
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Usuário SMTP
                      </label>
                      <Input
                        value={settings.email.smtpUser}
                        onChange={(e) =>
                          updateEmail("smtpUser", e.target.value)
                        }
                        placeholder="noreply@example.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Nome do Remetente
                      </label>
                      <Input
                        value={settings.email.fromName}
                        onChange={(e) =>
                          updateEmail("fromName", e.target.value)
                        }
                        placeholder="Wellness Hub"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Email do Remetente
                      </label>
                      <Input
                        type="email"
                        value={settings.email.fromEmail}
                        onChange={(e) =>
                          updateEmail("fromEmail", e.target.value)
                        }
                        placeholder="noreply@wellness.com"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Habilitar notificações por email
                        </p>
                        <p className="text-xs text-gray-400">
                          Enviar emails de confirmação e lembretes
                        </p>
                      </div>
                      <Switch
                        checked={settings.email.enableNotifications}
                        onChange={(e) =>
                          updateEmail("enableNotifications", e.target.checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rate Limits Tab */}
          {activeTab === "rateLimits" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Shield className="h-5 w-5 inline mr-2" />
                  Limites de Taxa (Rate Limiting)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert variant="info" title="Informação">
                    Os limites de taxa protegem a plataforma contra abuso e
                    ataques de força bruta.
                  </Alert>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Tentativas de login / min
                      </label>
                      <Input
                        type="number"
                        value={settings.rateLimits.loginAttemptsPerMinute}
                        onChange={(e) =>
                          updateRateLimits(
                            "loginAttemptsPerMinute",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={1}
                        max={60}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Máximo de tentativas de login por minuto
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Requests API / min
                      </label>
                      <Input
                        type="number"
                        value={settings.rateLimits.apiRequestsPerMinute}
                        onChange={(e) =>
                          updateRateLimits(
                            "apiRequestsPerMinute",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={10}
                        max={1000}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Máximo de requisições à API por minuto
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Reset senha / hora
                      </label>
                      <Input
                        type="number"
                        value={settings.rateLimits.passwordResetPerHour}
                        onChange={(e) =>
                          updateRateLimits(
                            "passwordResetPerHour",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        min={1}
                        max={30}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Máximo de resets de senha por hora
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
