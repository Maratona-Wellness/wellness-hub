import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { assertTenantAccess, logTenantAccessViolation } from "./tenant-access";

/**
 * Tipo para handler de API route com tenant context
 */
export type TenantApiHandler = (
  request: NextRequest,
  context: { params: Record<string, string>; tenantId: string; userId: string },
) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper para API routes que exige tenant válido
 *
 * Valida que:
 * 1. O usuário está autenticado (via sessão NextAuth)
 * 2. O tenant existe e está ativo
 * 3. O usuário tem acesso ao tenant
 *
 * @param handler Handler da API route
 * @returns Handler wrappado com validação de tenant
 *
 * @example
 * export const GET = requireTenant(async (request, { tenantId, userId }) => {
 *   // tenantId e userId já validados
 *   const data = await getDataForTenant(tenantId);
 *   return NextResponse.json(data);
 * });
 */
export function requireTenant(handler: TenantApiHandler) {
  return async (
    request: NextRequest,
    context: { params: Record<string, string> },
  ) => {
    try {
      // Extrair userId da sessão NextAuth
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      // Extrair tenantId da sessão, params ou headers
      const tenantId =
        context.params.tenantId ||
        session?.user?.tenantId ||
        request.headers.get("x-tenant-id");

      if (!tenantId) {
        return NextResponse.json(
          { error: "Tenant ID required" },
          { status: 400 },
        );
      }

      // Validar acesso ao tenant
      await assertTenantAccess(userId, tenantId);

      // Chamar handler original com contexto enriquecido
      return handler(request, {
        ...context,
        tenantId,
        userId,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TenantAccessError") {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        const tenantId =
          context.params.tenantId || request.headers.get("x-tenant-id");
        const ip =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";

        if (userId && tenantId) {
          await logTenantAccessViolation(userId, tenantId, error.message, ip);
        }

        return NextResponse.json(
          { error: "Access forbidden", message: error.message },
          { status: 403 },
        );
      }

      // Erro desconhecido
      console.error("Error in requireTenant wrapper:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

/**
 * Wrapper para API routes que permite acesso apenas para SUPER_ADMIN
 *
 * @param handler Handler da API route
 * @returns Handler wrappado com validação de SUPER_ADMIN
 */
export function requireSuperAdmin(handler: TenantApiHandler) {
  return async (
    request: NextRequest,
    context: { params: Record<string, string> },
  ) => {
    try {
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        );
      }

      // Verificar se é SUPER_ADMIN via sessão ou banco
      if (session?.user?.role === "SUPER_ADMIN") {
        const tenantId =
          context.params.tenantId ||
          session?.user?.tenantId ||
          request.headers.get("x-tenant-id") ||
          "";

        return handler(request, {
          ...context,
          tenantId,
          userId,
        });
      }

      // Fallback: verificar no banco
      const { isSuperAdmin } = await import("./tenant-access");
      const isAdmin = await isSuperAdmin(userId);

      if (!isAdmin) {
        await logTenantAccessViolation(
          userId,
          "SYSTEM",
          "Attempted to access SUPER_ADMIN only resource",
          request.headers.get("x-forwarded-for") || "unknown",
        );

        return NextResponse.json(
          { error: "Super admin access required" },
          { status: 403 },
        );
      }

      // Para SUPER_ADMIN, tenantId é opcional
      const tenantId =
        context.params.tenantId || request.headers.get("x-tenant-id") || "";

      return handler(request, {
        ...context,
        tenantId,
        userId,
      });
    } catch (error) {
      console.error("Error in requireSuperAdmin wrapper:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}

/**
 * Helper para extrair tenant do email na autenticação
 * Usado principalmente no fluxo de login
 */
export async function getTenantFromAuthEmail(email: string): Promise<{
  tenantId: string | null;
  error?: string;
}> {
  const { getTenantFromDomain } = await import("./tenant");
  const tenant = await getTenantFromDomain(email);

  if (!tenant) {
    return {
      tenantId: null,
      error: "No tenant found for email domain",
    };
  }

  if (!tenant.active) {
    return {
      tenantId: null,
      error: "Tenant is not active",
    };
  }

  return {
    tenantId: tenant.id,
  };
}
