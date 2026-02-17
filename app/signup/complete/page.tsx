"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/layouts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { Alert } from "@/components/molecules/Alert";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { completeSignupSchema } from "@/lib/validations/auth";

type FormState = "idle" | "loading" | "error" | "success";

/**
 * Calcula a força da senha
 */
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Fraca", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Razoável", color: "bg-yellow-500" };
  if (score <= 3) return { score, label: "Boa", color: "bg-blue-500" };
  return { score, label: "Forte", color: "bg-green-500" };
}

export default function CompleteSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";
  const tenantParam = searchParams.get("tenant") || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  // Validar parâmetros
  if (!emailParam || !tokenParam) {
    return (
      <AuthLayout>
        <Card variant="elevated">
          <CardContent>
            <Alert variant="error">
              Link inválido. Volte e solicite um novo código de verificação.
            </Alert>
            <div className="mt-4">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => router.push("/signup")}
              >
                Voltar para cadastro
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMessage("");

    // Validação com Zod
    const validation = completeSignupSchema.safeParse({
      token: tokenParam,
      email: emailParam,
      name,
      password,
      confirmPassword,
      acceptTerms,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as string;
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFormState("loading");

    try {
      const response = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenParam,
          email: emailParam,
          name,
          password,
          confirmPassword,
          acceptTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormState("error");
        setErrorMessage(data.error || "Erro ao criar conta.");
        return;
      }

      setFormState("success");
      router.push("/login?signup=success");
    } catch {
      setFormState("error");
      setErrorMessage("Erro inesperado. Tente novamente.");
    }
  };

  return (
    <AuthLayout>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-(--color-accent) rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-3xl">W</span>
            </div>
          </div>
          <CardTitle className="text-center">Complete seu cadastro</CardTitle>
          <CardDescription className="text-center">
            {tenantParam ? (
              <>
                Você está se cadastrando na empresa{" "}
                <Badge variant="info">{tenantParam}</Badge>
              </>
            ) : (
              "Preencha seus dados para finalizar o cadastro"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formState === "error" && errorMessage && (
            <Alert variant="error" className="mb-4">
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <FormField
              type="input"
              label="Email"
              inputProps={{
                type: "email",
                value: emailParam,
                disabled: true,
              }}
            />

            {/* Nome completo */}
            <FormField
              type="input"
              label="Nome completo"
              required
              error={fieldErrors.name}
              inputProps={{
                type: "text",
                placeholder: "Seu nome completo",
                autoComplete: "name",
                value: name,
                onChange: (e) => setName(e.target.value),
                disabled: formState === "loading",
              }}
            />

            {/* Senha */}
            <div>
              <FormField
                type="input"
                label="Senha"
                required
                error={fieldErrors.password}
                helpText="Mínimo 8 caracteres, 1 número e 1 caractere especial"
                inputProps={{
                  type: "password",
                  placeholder: "••••••••",
                  autoComplete: "new-password",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  disabled: formState === "loading",
                }}
              />
              {/* Indicador de força da senha */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <Text variant="span" className="text-xs text-gray-500">
                      {passwordStrength.label}
                    </Text>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <FormField
              type="input"
              label="Confirmar senha"
              required
              error={fieldErrors.confirmPassword}
              inputProps={{
                type: "password",
                placeholder: "••••••••",
                autoComplete: "new-password",
                value: confirmPassword,
                onChange: (e) => setConfirmPassword(e.target.value),
                disabled: formState === "loading",
              }}
            />

            {/* Aceite de termos */}
            <FormField
              type="checkbox"
              label="Li e aceito os termos de uso e política de privacidade"
              error={fieldErrors.acceptTerms}
              checkboxProps={{
                checked: acceptTerms,
                onChange: (e) => setAcceptTerms(e.target.checked),
                disabled: formState === "loading",
              }}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={formState === "loading"}
              disabled={formState === "loading"}
            >
              Criar minha conta
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Text variant="span" className="text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-(--color-accent) hover:underline font-medium"
            >
              Fazer login
            </Link>
          </Text>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
