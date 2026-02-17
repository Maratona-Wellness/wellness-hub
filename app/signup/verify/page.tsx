"use client";

import React, { useState, useEffect, useCallback } from "react";
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

type FormState = "idle" | "loading" | "error" | "success";

const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailParam = searchParams.get("email") || "";
  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [email] = useState(emailParam);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOKEN_TTL_SECONDS);

  // Timer de expiração
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-verificar se token veio na URL
  const verifyToken = useCallback(
    async (tokenValue: string) => {
      if (!tokenValue || !email) return;

      setFormState("loading");
      setErrorMessage("");

      try {
        const response = await fetch("/api/auth/magic-link/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: tokenValue }),
        });

        const data = await response.json();

        if (!response.ok) {
          setFormState("error");
          setErrorMessage(data.error || "Token inválido ou expirado.");
          return;
        }

        setFormState("success");
        // Redirecionar para completar cadastro
        router.push(
          `/signup/complete?email=${encodeURIComponent(email)}&token=${encodeURIComponent(tokenValue)}&tenant=${encodeURIComponent(data.data?.tenantName || "")}`,
        );
      } catch {
        setFormState("error");
        setErrorMessage("Erro inesperado. Tente novamente.");
      }
    },
    [email, router],
  );

  useEffect(() => {
    if (tokenParam && email) {
      verifyToken(tokenParam);
    }
  }, [tokenParam, email, verifyToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMessage("Informe o código de verificação.");
      setFormState("error");
      return;
    }
    await verifyToken(token);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isExpired = timeLeft <= 0;

  return (
    <AuthLayout>
      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-center">Verificar código</CardTitle>
          <CardDescription className="text-center">
            {email ? (
              <>
                Insira o código enviado para{" "}
                <span className="font-medium text-(--color-secondary)">
                  {email}
                </span>
              </>
            ) : (
              "Insira o código de verificação recebido por email"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Timer */}
          <div className="flex justify-center mb-4">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isExpired
                  ? "bg-red-100 text-red-700"
                  : timeLeft < 120
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {isExpired
                ? "Código expirado"
                : `Expira em ${formatTime(timeLeft)}`}
            </div>
          </div>

          {formState === "error" && errorMessage && (
            <Alert variant="error" className="mb-4">
              {errorMessage}
            </Alert>
          )}

          {isExpired ? (
            <div className="text-center space-y-4">
              <Text variant="p" className="text-gray-600">
                Seu código expirou. Solicite um novo código.
              </Text>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => router.push("/signup")}
              >
                Solicitar novo código
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                type="input"
                label="Código de verificação"
                required
                inputProps={{
                  type: "text",
                  placeholder: "Cole o código aqui",
                  value: token,
                  onChange: (e) => setToken(e.target.value),
                  disabled: formState === "loading",
                  autoFocus: true,
                }}
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={formState === "loading"}
                disabled={formState === "loading"}
              >
                Verificar
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="text-sm text-(--color-accent) hover:underline font-medium"
          >
            Reenviar código
          </button>
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
