import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import {
  assertTenantAccess,
  logTenantAccessViolation,
} from "@/lib/utils/tenant-access";
import type { RoleType } from "@/types";

/**
 * Tipo do handler autenticado com dados do usuário
 */
export type AuthenticatedHandler = (
  request: NextRequest,
  context: {
    params: Record<string, string>;
    user: {
      id: string;
      email: string;
      role: RoleType;
      tenantId: string | null;
    };
  },
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware que exige autenticação e injeta dados do usuário no contexto
 */
export function requireAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: "Autenticação necessária" },
          { status: 401 },
        );
      }

      // Resolve params promise (Next.js 15+)
      const params = await context.params;

      return handler(request, {
        params,
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          tenantId: session.user.tenantId,
        },
      });
    } catch (error) {
      console.error("Error in requireAuth:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno" },
        { status: 500 },
      );
    }
  };
}

/**
 * Middleware que exige uma ou mais roles específicas
 *
 * @param allowedRoles Lista de roles permitidas
 * @param handler Handler da API route
 *
 * @example
 * export const GET = requireRole(["SUPER_ADMIN", "TENANT_ADMIN"], async (request, { user }) => {
 *   // user.role é SUPER_ADMIN ou TENANT_ADMIN
 *   return NextResponse.json({ success: true });
 * });
 */
export function requireRole(
  allowedRoles: RoleType[],
  handler: AuthenticatedHandler,
) {
  return requireAuth(async (request, context) => {
    const { user } = context;

    if (!allowedRoles.includes(user.role)) {
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      await logTenantAccessViolation(
        user.id,
        user.tenantId || "SYSTEM",
        `Role ${user.role} attempted to access resource requiring ${allowedRoles.join(", ")}`,
        ip,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Acesso não autorizado para esta operação",
        },
        { status: 403 },
      );
    }

    return handler(request, context);
  });
}

/**
 * Middleware que exige acesso ao tenant especificado
 *
 * Valida que:
 * 1. O usuário está autenticado
 * 2. O usuário tem acesso ao tenant (ou é SUPER_ADMIN)
 *
 * @param handler Handler da API route
 *
 * @example
 * export const GET = requireTenantAccessMiddleware(async (request, { user }) => {
 *   // user.tenantId é validado
 *   return NextResponse.json({ success: true });
 * });
 */
export function requireTenantAccessMiddleware(handler: AuthenticatedHandler) {
  return requireAuth(async (request, context) => {
    const { user, params } = context;
    const tenantId = params.tenantId || user.tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant não identificado" },
        { status: 400 },
      );
    }

    try {
      await assertTenantAccess(user.id, tenantId);
    } catch (error) {
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      await logTenantAccessViolation(
        user.id,
        tenantId,
        error instanceof Error ? error.message : "Tenant access denied",
        ip,
      );

      return NextResponse.json(
        { success: false, error: "Acesso negado ao tenant" },
        { status: 403 },
      );
    }

    return handler(request, {
      ...context,
      user: { ...user, tenantId },
    });
  });
}

/**
 * Middleware que verifica ownership de um recurso
 *
 * Verifica se o ID do recurso corresponde ao usuário logado,
 * ou se o usuário é SUPER_ADMIN/TENANT_ADMIN.
 *
 * @param resourceUserIdExtractor Função que extrai o userId do recurso
 * @param handler Handler da API route
 */
export function requireOwnership(
  resourceUserIdExtractor: (
    params: Record<string, string>,
  ) => string | Promise<string>,
  handler: AuthenticatedHandler,
) {
  return requireAuth(async (request, context) => {
    const { user, params } = context;

    // SUPER_ADMIN e TENANT_ADMIN podem acessar qualquer recurso
    if (user.role === "SUPER_ADMIN" || user.role === "TENANT_ADMIN") {
      return handler(request, context);
    }

    const resourceUserId = await resourceUserIdExtractor(params);

    if (resourceUserId !== user.id) {
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      await logTenantAccessViolation(
        user.id,
        user.tenantId || "SYSTEM",
        `User attempted to access resource owned by ${resourceUserId}`,
        ip,
      );

      return NextResponse.json(
        { success: false, error: "Acesso não autorizado a este recurso" },
        { status: 403 },
      );
    }

    return handler(request, context);
  });
}
