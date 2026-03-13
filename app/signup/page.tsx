"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { magicLinkRequestSchema } from "@/lib/validations/auth";

type FormState = "idle" | "loading" | "sent" | "error";
type ErrorCode = "ACCOUNT_EXISTS" | null;

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tenantName, setTenantName] = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCountdown = useCallback(() => {
    setCountdown(60);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMessage("");
    setErrorCode(null);

    // Validação com Zod
    const validation = magicLinkRequestSchema.safeParse({ email });
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
      const response = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormState("error");
        setErrorMessage(data.error || "Erro ao enviar código de verificação.");
        if (data.code === "ACCOUNT_EXISTS") {
          setErrorCode("ACCOUNT_EXISTS");
        }
        return;
      }

      setTenantName(data.data?.tenantName || "");
      setFormState("sent");
      startCountdown();
    } catch {
      setFormState("error");
      setErrorMessage("Erro inesperado. Tente novamente.");
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setFormState("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormState("sent");
        setErrorMessage(data.error || "Erro ao reenviar.");
        return;
      }

      setFormState("sent");
      startCountdown();
    } catch {
      setFormState("sent");
      setErrorMessage("Erro ao reenviar. Tente novamente.");
    }
  };

  const handleGoToVerify = () => {
    router.push(`/signup/verify?email=${encodeURIComponent(email)}`);
  };

  if (formState === "sent") {
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
                    d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                  />
                </svg>
              </div>
            </div>
            <CardTitle className="text-center">Verifique seu email</CardTitle>
            <CardDescription className="text-center">
              Enviamos um código de verificação para{" "}
              <span className="font-medium text-(--color-secondary)">
                {email}
              </span>
              {tenantName && (
                <>
                  {" "}
                  da empresa{" "}
                  <span className="font-medium text-(--color-secondary)">
                    {tenantName}
                  </span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <Alert variant="error" className="mb-4">
                {errorMessage}
              </Alert>
            )}

            <div className="space-y-4">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleGoToVerify}
              >
                Inserir código de verificação
              </Button>

              <div className="text-center">
                <Text variant="span" className="text-sm text-gray-500">
                  Não recebeu o email?{" "}
                </Text>
                {countdown > 0 ? (
                  <Text variant="span" className="text-sm text-gray-400">
                    Reenviar em {countdown}s
                  </Text>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-sm text-(--color-accent) hover:underline font-medium"
                  >
                    Reenviar código
                  </button>
                )}
              </div>
            </div>
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

  return (
    <AuthLayout>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-(--color-accent) rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-3xl">W</span>
            </div>
          </div>
          <CardTitle className="text-center">Criar sua conta</CardTitle>
          <CardDescription className="text-center">
            Use seu email corporativo para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formState === "error" && errorMessage && (
            <Alert variant="error" className="mb-4">
              <div>
                {errorMessage}
                {errorCode === "ACCOUNT_EXISTS" && (
                  <div className="mt-2">
                    <Link
                      href="/login"
                      className="text-(--color-accent) hover:underline font-medium"
                    >
                      Ir para login →
                    </Link>
                  </div>
                )}
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              type="input"
              label="Email corporativo"
              required
              error={fieldErrors.email}
              helpText="Use o email da sua empresa. Ex: nome@suaempresa.com"
              inputProps={{
                type: "email",
                placeholder: "seu@empresa.com",
                autoComplete: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
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
              Enviar código de verificação
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
