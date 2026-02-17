import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  listTenants,
  createTenantWithWizard,
  TenantServiceError,
} from "@/services/tenant";
import {
  listTenantsQuerySchema,
  createTenantWizardSchema,
} from "@/lib/validations/tenant";

/**
 * GET /api/admin/tenants
 * Lista tenants com paginação, filtros e busca
 * Acesso: SUPER_ADMIN
 */
export const GET = requireRole(["SUPER_ADMIN"], async (request) => {
  try {
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "all",
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const parsed = listTenantsQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Parâmetros de consulta inválidos",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const result = await listTenants(parsed.data);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error listing tenants:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});

/**
 * POST /api/admin/tenants
 * Cria um novo tenant com wizard (empresa, localizações, admin)
 * Acesso: SUPER_ADMIN
 */
export const POST = requireRole(["SUPER_ADMIN"], async (request) => {
  try {
    const body = await request.json();

    const parsed = createTenantWizardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados inválidos",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const result = await createTenantWithWizard(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: "Tenant criado com sucesso",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof TenantServiceError) {
      const statusMap: Record<string, number> = {
        DOMAIN_EXISTS: 409,
        EMAIL_EXISTS: 409,
        VALIDATION_ERROR: 400,
      };

      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: statusMap[error.code] || 400 },
      );
    }

    console.error("Error creating tenant:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});
