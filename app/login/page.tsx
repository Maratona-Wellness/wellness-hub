"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
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
import { loginSchema } from "@/lib/validations/auth";

type FormState = "idle" | "loading" | "error" | "success";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const signupSuccess = searchParams.get("signup") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMessage("");

    // Validação com Zod
    const validation = loginSchema.safeParse({ email, password });
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
      const result = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormState("error");
        setErrorMessage(result.error);
        return;
      }

      if (result?.ok) {
        setFormState("success");
        router.push(callbackUrl);
        router.refresh();
      }
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
          <CardTitle className="text-center">Bem-vindo de volta</CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signupSuccess && (
            <Alert variant="success" className="mb-4">
              Conta criada com sucesso! Faça login para continuar.
            </Alert>
          )}

          {formState === "error" && errorMessage && (
            <Alert variant="error" className="mb-4">
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              type="input"
              label="Email"
              required
              error={fieldErrors.email}
              inputProps={{
                type: "email",
                placeholder: "seu@email.com",
                autoComplete: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                disabled: formState === "loading",
              }}
            />
            <FormField
              type="input"
              label="Senha"
              required
              error={fieldErrors.password}
              inputProps={{
                type: "password",
                placeholder: "••••••••",
                autoComplete: "current-password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                disabled: formState === "loading",
              }}
            />
            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-(--color-accent) hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={formState === "loading"}
              disabled={formState === "loading"}
            >
              Entrar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Text variant="span" className="text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link
              href="/signup"
              className="text-(--color-accent) hover:underline font-medium"
            >
              Criar conta
            </Link>
          </Text>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
