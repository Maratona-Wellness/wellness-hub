"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { EmptyState } from "@/components/molecules/EmptyState";
import { AuthGuard } from "@/components/AuthGuard";

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const { toasts, addToast, removeToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setName(data.data.name);
        setLogoUrl(data.data.logoUrl || "");
      } else {
        setNotFound(true);
      }
    } catch {
      addToast("error", "Erro ao carregar empresa");
    } finally {
      setLoading(false);
    }
  }, [tenantId, addToast]);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

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
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          logoUrl: logoUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addToast("success", "Empresa atualizada com sucesso");
        setTimeout(() => {
          router.push(`/superadmin/tenants/${tenantId}`);
        }, 1000);
      } else {
        addToast("error", data.error || "Erro ao atualizar empresa");
      }
    } catch {
      addToast("error", "Erro ao atualizar empresa");
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

  if (notFound) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <EmptyState
            icon={<Building2 />}
            title="Empresa não encontrada"
            action={{
              label: "Voltar para lista",
              onClick: () => router.push("/superadmin/tenants"),
            }}
          />
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/superadmin/tenants/${tenantId}`)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Voltar
            </Button>
          </div>

          <Text variant="h2">Editar Empresa</Text>

          <Card>
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
                helpText="URL da imagem do logo (opcional)"
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
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={() => router.push(`/superadmin/tenants/${tenantId}`)}
              >
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} isLoading={saving}>
                Salvar Alterações
              </Button>
            </div>
          </Card>
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
