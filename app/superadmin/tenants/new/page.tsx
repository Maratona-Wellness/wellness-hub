"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  UserCog,
  Check,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { Alert } from "@/components/molecules/Alert";
import { useToast, ToastContainer } from "@/components/molecules/Toast";
import { AuthGuard } from "@/components/AuthGuard";
import { cn } from "@/lib/utils/cn";

interface LocationInput {
  name: string;
  address: string;
}

interface WizardData {
  // Step 1
  name: string;
  domain: string;
  logoUrl: string;
  // Step 2
  locations: LocationInput[];
  // Step 3
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

const STEPS = [
  { id: 1, label: "Dados da Empresa", icon: Building2 },
  { id: 2, label: "Localizações", icon: MapPin },
  { id: 3, label: "Administrador", icon: UserCog },
  { id: 4, label: "Revisão", icon: Check },
];

export default function NewTenantPage() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<WizardData>({
    name: "",
    domain: "",
    logoUrl: "",
    locations: [{ name: "", address: "" }],
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const updateField = (field: keyof WizardData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateLocation = (
    index: number,
    field: keyof LocationInput,
    value: string,
  ) => {
    const newLocations = [...formData.locations];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setFormData((prev) => ({ ...prev, locations: newLocations }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`location_${index}_${field}`];
      return next;
    });
  };

  const addLocation = () => {
    setFormData((prev) => ({
      ...prev,
      locations: [...prev.locations, { name: "", address: "" }],
    }));
  };

  const removeLocation = (index: number) => {
    if (formData.locations.length <= 1) return;
    const newLocations = formData.locations.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, locations: newLocations }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim() || formData.name.length < 2)
          newErrors.name = "O nome deve ter pelo menos 2 caracteres";
        if (!formData.domain.trim() || formData.domain.length < 3)
          newErrors.domain = "O domínio deve ter pelo menos 3 caracteres";
        else if (
          !/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(
            formData.domain,
          )
        )
          newErrors.domain = "Formato de domínio inválido (ex: empresa.com.br)";
        break;

      case 2:
        formData.locations.forEach((loc, i) => {
          if (!loc.name.trim() || loc.name.length < 2)
            newErrors[`location_${i}_name`] =
              "O nome deve ter pelo menos 2 caracteres";
          if (!loc.address.trim() || loc.address.length < 5)
            newErrors[`location_${i}_address`] =
              "O endereço deve ter pelo menos 5 caracteres";
        });
        break;

      case 3:
        if (!formData.adminName.trim() || formData.adminName.length < 2)
          newErrors.adminName = "O nome deve ter pelo menos 2 caracteres";
        if (
          !formData.adminEmail.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)
        )
          newErrors.adminEmail = "Email inválido";
        if (!formData.adminPassword || formData.adminPassword.length < 8)
          newErrors.adminPassword = "A senha deve ter pelo menos 8 caracteres";
        else if (!/[0-9]/.test(formData.adminPassword))
          newErrors.adminPassword = "A senha deve conter pelo menos 1 número";
        else if (!/[^a-zA-Z0-9]/.test(formData.adminPassword))
          newErrors.adminPassword =
            "A senha deve conter pelo menos 1 caractere especial";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const getPasswordStrength = (
    password: string,
  ): { label: string; color: string; width: string } => {
    if (!password) return { label: "", color: "bg-gray-200", width: "w-0" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;

    if (score <= 1)
      return { label: "Fraca", color: "bg-red-500", width: "w-1/4" };
    if (score <= 2)
      return { label: "Razoável", color: "bg-yellow-500", width: "w-2/4" };
    if (score <= 3)
      return { label: "Boa", color: "bg-blue-500", width: "w-3/4" };
    return { label: "Forte", color: "bg-green-500", width: "w-full" };
  };

  const passwordStrength = getPasswordStrength(formData.adminPassword);

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setCurrentStep(3);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          domain: formData.domain.toLowerCase().trim(),
          locations: formData.locations.map((loc) => ({
            name: loc.name.trim(),
            address: loc.address.trim(),
          })),
          adminName: formData.adminName.trim(),
          adminEmail: formData.adminEmail.toLowerCase().trim(),
          adminPassword: formData.adminPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addToast("success", "Empresa criada com sucesso!");
        setTimeout(() => {
          router.push("/superadmin/tenants");
        }, 1500);
      } else {
        addToast("success", data.error || "Erro ao criar empresa");
      }
    } catch {
      addToast("error", "Erro ao criar empresa. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Text variant="h3" className="mb-2">
                Dados da Empresa
              </Text>
              <Text variant="p" className="text-gray-600">
                Informe os dados básicos da nova empresa cliente
              </Text>
            </div>

            <div className="space-y-4">
              <FormField
                type="input"
                label="Nome da Empresa"
                required
                error={errors.name}
                inputProps={{
                  value: formData.name,
                  onChange: (e) => updateField("name", e.target.value),
                  placeholder: "Ex: Empresa XYZ Ltda",
                }}
              />

              <FormField
                type="input"
                label="Domínio de Email"
                required
                error={errors.domain}
                helpText="Domínio do email corporativo dos funcionários (ex: empresa.com.br)"
                inputProps={{
                  value: formData.domain,
                  onChange: (e) => updateField("domain", e.target.value),
                  placeholder: "empresa.com.br",
                }}
              />

              <FormField
                type="input"
                label="URL do Logo"
                error={errors.logoUrl}
                helpText="URL da imagem do logo da empresa (opcional)"
                inputProps={{
                  value: formData.logoUrl,
                  onChange: (e) => updateField("logoUrl", e.target.value),
                  placeholder: "https://exemplo.com/logo.png",
                }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Text variant="h3" className="mb-2">
                  Localizações
                </Text>
                <Text variant="p" className="text-gray-600">
                  Cadastre as sedes/escritórios da empresa
                </Text>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={addLocation}
              >
                Adicionar
              </Button>
            </div>

            <div className="space-y-4">
              {formData.locations.map((location, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <Text variant="label" className="font-medium">
                        Localização {index + 1}
                      </Text>
                    </div>
                    {formData.locations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <FormField
                      type="input"
                      label="Nome"
                      required
                      error={errors[`location_${index}_name`]}
                      inputProps={{
                        value: location.name,
                        onChange: (e) =>
                          updateLocation(index, "name", e.target.value),
                        placeholder: "Ex: Sede São Paulo",
                      }}
                    />
                    <FormField
                      type="input"
                      label="Endereço"
                      required
                      error={errors[`location_${index}_address`]}
                      inputProps={{
                        value: location.address,
                        onChange: (e) =>
                          updateLocation(index, "address", e.target.value),
                        placeholder: "Ex: Av. Paulista, 1000 - São Paulo/SP",
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Text variant="h3" className="mb-2">
                Administrador do Tenant
              </Text>
              <Text variant="p" className="text-gray-600">
                Dados do primeiro administrador da empresa
              </Text>
            </div>

            <div className="space-y-4">
              <FormField
                type="input"
                label="Nome Completo"
                required
                error={errors.adminName}
                inputProps={{
                  value: formData.adminName,
                  onChange: (e) => updateField("adminName", e.target.value),
                  placeholder: "Ex: João Silva",
                }}
              />

              <FormField
                type="input"
                label="Email"
                required
                error={errors.adminEmail}
                inputProps={{
                  type: "email",
                  value: formData.adminEmail,
                  onChange: (e) => updateField("adminEmail", e.target.value),
                  placeholder: "admin@empresa.com.br",
                }}
              />

              <div>
                <FormField
                  type="input"
                  label="Senha"
                  required
                  error={errors.adminPassword}
                  helpText="Mín. 8 caracteres, 1 número e 1 caractere especial"
                  inputProps={{
                    type: showPassword ? "text" : "password",
                    value: formData.adminPassword,
                    onChange: (e) =>
                      updateField("adminPassword", e.target.value),
                    placeholder: "••••••••",
                    rightIcon: (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    ),
                  }}
                />
                {formData.adminPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            passwordStrength.color,
                            passwordStrength.width,
                          )}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Text variant="h3" className="mb-2">
                Revisão
              </Text>
              <Text variant="p" className="text-gray-600">
                Revise os dados antes de criar a empresa
              </Text>
            </div>

            <div className="space-y-4">
              {/* Company info */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-gray-600" />
                  <Text variant="h4">Empresa</Text>
                </div>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Nome</dt>
                      <dd className="font-medium">{formData.name}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Domínio</dt>
                      <dd className="font-medium">{formData.domain}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Locations */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <Text variant="h4">
                    Localizações ({formData.locations.length})
                  </Text>
                </div>
                <CardContent>
                  <div className="space-y-2">
                    {formData.locations.map((loc, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm p-2 rounded bg-gray-50"
                      >
                        <Badge variant="info">{i + 1}</Badge>
                        <div>
                          <p className="font-medium">{loc.name}</p>
                          <p className="text-gray-600">{loc.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Admin */}
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <UserCog className="h-5 w-5 text-blue-600" />
                  <Text variant="h4">Administrador</Text>
                </div>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Nome</dt>
                      <dd className="font-medium">{formData.adminName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium">{formData.adminEmail}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Alert variant="info">
                Um email de boas-vindas será enviado para o administrador com as
                credenciais de acesso.
              </Alert>
            </div>
          </div>
        );
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/superadmin/tenants")}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Voltar
            </Button>
          </div>

          <Text variant="h2">Nova Empresa</Text>

          {/* Steps Indicator */}
          <nav className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                        isActive && "bg-(--color-accent) text-white",
                        isCompleted && "bg-green-500 text-white",
                        !isActive &&
                          !isCompleted &&
                          "bg-gray-200 text-gray-500",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:block",
                        isActive && "text-(--color-accent)",
                        isCompleted && "text-green-600",
                        !isActive && !isCompleted && "text-gray-500",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2",
                        currentStep > step.id ? "bg-green-500" : "bg-gray-200",
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          {/* Step Content */}
          <Card>{renderStep()}</Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 1}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Anterior
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                variant="primary"
                onClick={handleNext}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Próximo
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={submitting}
                leftIcon={<Check className="h-4 w-4" />}
              >
                Criar Empresa
              </Button>
            )}
          </div>
        </div>

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
