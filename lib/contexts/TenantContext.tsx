"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Tenant } from "@/types";

/**
 * Tipo do contexto de tenant
 */
interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;
  setTenant: (tenant: Tenant | null) => void;
  refreshTenant: () => Promise<void>;
}

/**
 * Context para dados do tenant atual
 */
const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Props do TenantProvider
 */
interface TenantProviderProps {
  children: React.ReactNode;
  initialTenant?: Tenant | null;
}

/**
 * Provider do contexto de tenant
 * Gerencia o estado do tenant atual e fornece métodos para atualizá-lo
 */
export function TenantProvider({
  children,
  initialTenant = null,
}: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Função para recarregar dados do tenant
   */
  const refreshTenant = async () => {
    if (!tenant?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implementar chamada à API quando tivermos endpoints prontos
      const response = await fetch(`/api/tenants/${tenant.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tenant data");
      }

      const data = await response.json();
      setTenant(data.tenant);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error refreshing tenant:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: TenantContextType = {
    tenant,
    tenantId: tenant?.id || null,
    isLoading,
    error,
    setTenant,
    refreshTenant,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de tenant
 *
 * @returns Contexto do tenant atual
 * @throws Error se usado fora do TenantProvider
 *
 * @example
 * const { tenant, tenantId, isLoading } = useTenant();
 *
 * if (isLoading) return <Spinner />;
 * if (!tenant) return <div>No tenant selected</div>;
 *
 * return <div>{tenant.name}</div>;
 */
export function useTenant(): TenantContextType {
  const context = useContext(TenantContext);

  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }

  return context;
}

/**
 * Hook para garantir que o tenant está disponível
 * Similar ao useTenant, mas garante que tenant não é null
 *
 * @returns Contexto do tenant com tenant garantido
 * @throws Error se tenant for null ou se usado fora do provider
 */
export function useRequiredTenant(): TenantContextType & { tenant: Tenant } {
  const context = useTenant();

  if (!context.tenant) {
    throw new Error("Tenant is required but not available");
  }

  return context as TenantContextType & { tenant: Tenant };
}
