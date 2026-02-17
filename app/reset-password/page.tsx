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
import Link from "next/link";
import { resetPasswordSchema } from "@/lib/validations/auth";

type FormState = "idle" | "loading" | "error" | "success";

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  if (!emailParam || !tokenParam) {
    return (
      <AuthLayout>
        <Card variant="elevated">
          <CardContent>
            <Alert variant="error">
              Link inválido ou expirado. Solicite um novo link de redefinição.
            </Alert>
            <div className="mt-4">
              <Link href="/forgot-password">
                <Button variant="primary" className="w-full">
                  Solicitar nova redefinição
                </Button>
              </Link>
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

    const validation = resetPasswordSchema.safeParse({
      token: tokenParam,
      email: emailParam,
      password,
      confirmPassword,
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenParam,
          email: emailParam,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormState("error");
        setErrorMessage(data.error || "Erro ao redefinir senha.");
        return;
      }

      setFormState("success");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setFormState("error");
      setErrorMessage("Erro inesperado. Tente novamente.");
    }
  };

  if (formState === "success") {
    return (
      <AuthLayout>
        <Card variant="elevated">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-center">
              Senha redefinida com sucesso!
            </CardTitle>
            <CardDescription className="text-center">
              Redirecionando para o login...
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-(--color-accent) rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-3xl">W</span>
            </div>
          </div>
          <CardTitle className="text-center">Redefinir senha</CardTitle>
          <CardDescription className="text-center">
            Crie uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formState === "error" && errorMessage && (
            <Alert variant="error" className="mb-4">
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FormField
                type="input"
                label="Nova senha"
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

            <FormField
              type="input"
              label="Confirmar nova senha"
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

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={formState === "loading"}
              disabled={formState === "loading"}
            >
              Redefinir senha
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Text variant="span" className="text-sm text-gray-600">
            Lembrou a senha?{" "}
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
