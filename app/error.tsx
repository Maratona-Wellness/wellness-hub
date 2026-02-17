"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/molecules/Card";
import { Alert } from "@/components/molecules/Alert";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para serviço de monitoramento
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-(--color-primary) p-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Algo deu errado!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="error" title="Erro">
            {error.message ||
              "Ocorreu um erro inesperado ao processar sua solicitação."}
          </Alert>
          {error.digest && (
            <p className="text-xs text-gray-500">
              Código de erro: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          <Button variant="primary" onClick={reset} className="flex-1">
            Tentar novamente
          </Button>
          <Button
            variant="ghost"
            onClick={() => (window.location.href = "/dashboard")}
            className="flex-1"
          >
            Voltar ao início
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
