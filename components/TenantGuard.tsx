"use client";

import React from "react";
import { useTenant } from "@/lib/contexts/TenantContext";

/**
 * Props do TenantGuard
 */
interface TenantGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  requireTenant?: boolean;
}

/**
 * Componente de proteção que garante que um tenant válido está disponível
 * antes de renderizar o conteúdo filho
 *
 * @example
 * // Básico - exibe fallback padrão se não houver tenant
 * <TenantGuard>
 *   <ProtectedContent />
 * </TenantGuard>
 *
 * @example
 * // Com fallback customizado
 * <TenantGuard fallback={<NoTenantMessage />}>
 *   <ProtectedContent />
 * </TenantGuard>
 *
 * @example
 * // Com loading customizado
 * <TenantGuard loadingFallback={<Spinner />}>
 *   <ProtectedContent />
 * </TenantGuard>
 */
export function TenantGuard({
  children,
  fallback = <DefaultNoTenantFallback />,
  loadingFallback = <DefaultLoadingFallback />,
  requireTenant = true,
}: TenantGuardProps) {
  const { tenant, isLoading, error } = useTenant();

  // Exibir loading
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  // Exibir erro se houver
  if (error) {
    return <DefaultErrorFallback error={error} />;
  }

  // Se requireTenant=true e não há tenant, exibir fallback
  if (requireTenant && !tenant) {
    return <>{fallback}</>;
  }

  // Renderizar children
  return <>{children}</>;
}

/**
 * Fallback padrão quando não há tenant
 */
function DefaultNoTenantFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No Tenant Selected
        </h2>
        <p className="text-gray-600">Please select a tenant to continue.</p>
      </div>
    </div>
  );
}

/**
 * Fallback padrão durante loading
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <p className="text-gray-600">Loading tenant data...</p>
      </div>
    </div>
  );
}

/**
 * Fallback padrão quando há erro
 */
function DefaultErrorFallback({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-2">
            Error Loading Tenant
          </h2>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente HOC (Higher-Order Component) para proteger páginas
 *
 * @example
 * const ProtectedPage = withTenantGuard(() => {
 *   return <div>Protected content</div>;
 * });
 */
export function withTenantGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<TenantGuardProps, "children">,
) {
  return function GuardedComponent(props: P) {
    return (
      <TenantGuard {...guardProps}>
        <Component {...props} />
      </TenantGuard>
    );
  };
}
