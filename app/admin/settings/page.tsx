"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Building2, MapPin, Users, Package, UserCog, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/molecules/Card";
import { Tabs, type Tab } from "@/components/molecules/Tabs";
import { FormField } from "@/components/molecules/FormField";
import { EmptyState } from "@/components/molecules/EmptyState";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";

interface TenantSettings {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  locations: Array<{
    id: string;
    name: string;
    address: string;
  }>;
  _count: {
    employees: number;
    programs: number;
    therapistAssignments: number;
  };
}

export default function TenantAdminSettingsPage() {
  const { toasts, addToast, removeToast } = useToast();

  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tenant-admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setName(data.data.name);
        setLogoUrl(data.data.logoUrl || "");
      } else {
        addToast("error", "Erro ao carregar configurações");
      }
    } catch {
      addToast("error", "Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      const nameChanged = name !== settings.name;
      const logoChanged = logoUrl !== (settings.logoUrl || "");
      setHasChanges(nameChanged || logoChanged);
    }
  }, [name, logoUrl, settings]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.length < 2)
      newErrors.name = "O nome deve ter pelo menos 2 caracteres";
    if (logoUrl && !/^https?:\/\/.+/.test(logoUrl))
      newErrors.logoUrl = "URL inválida";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/tenant-admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          logoUrl: logoUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addToast("success", "Configurações atualizadas com sucesso");
        fetchSettings();
      } else {
        addToast("error", data.error);
      }
    } catch {
      addToast("error", "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

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

  if (!settings) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <EmptyState
            icon={<Building2 />}
            title="Configurações não encontradas"
            description="Não foi possível carregar as configurações do seu tenant"
          />
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const tabs: Tab[] = [
    {
      id: "company",
      label: "Dados da Empresa",
      content: (
        <div className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Atualize os dados da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  type="input"
                  label="Nome da Empresa"
                  required
                  error={errors.name}
                  inputProps={{
                    value: name,
                    onChange: (e) => {
                      setName(e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    },
                    placeholder: "Nome da empresa",
                  }}
                />

                <FormField
                  type="input"
                  label="URL do Logo"
                  error={errors.logoUrl}
                  helpText="URL da imagem do logo da empresa (opcional)"
                  inputProps={{
                    value: logoUrl,
                    onChange: (e) => {
                      setLogoUrl(e.target.value);
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.logoUrl;
                        return next;
                      });
                    },
                    placeholder: "https://exemplo.com/logo.png",
                  }}
                />

                <div>
                  <label className="text-sm font-medium text-(--color-secondary)">
                    Domínio
                  </label>
                  <p className="mt-1 text-sm text-gray-600">
                    {settings.domain}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    O domínio não pode ser alterado. Contate o suporte se
                    necessário.
                  </p>
                </div>

                {hasChanges && (
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      isLoading={saving}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "locations",
      label: "Localizações",
      content: (
        <div className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Localizações</CardTitle>
              <CardDescription>
                Sedes e escritórios da sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {settings.locations.length === 0 ? (
                <EmptyState
                  icon={<MapPin />}
                  title="Nenhuma localização cadastrada"
                  description="Contate o administrador do sistema para adicionar localizações"
                />
              ) : (
                <div className="space-y-3">
                  {settings.locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <MapPin className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-(--color-secondary)">
                          {location.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {location.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "summary",
      label: "Resumo",
      content: (
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Funcionários</p>
                  <p className="text-2xl font-semibold text-(--color-secondary)">
                    {settings._count.employees}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Programas Ativos</p>
                  <p className="text-2xl font-semibold text-(--color-secondary)">
                    {settings._count.programs}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-50">
                  <UserCog className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Terapeutas</p>
                  <p className="text-2xl font-semibold text-(--color-secondary)">
                    {settings._count.therapistAssignments}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge variant={settings.active ? "success" : "error"}>
                  {settings.active ? "Ativo" : "Inativo"}
                </Badge>
                <span className="text-sm text-gray-600">
                  Cadastrado em{" "}
                  {new Date(settings.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Text variant="h2">Configurações</Text>
            <Text variant="p" className="text-gray-600">
              Gerencie as configurações da sua empresa
            </Text>
          </div>

          <Tabs tabs={tabs} defaultTab="company" />
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
