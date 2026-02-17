import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTenantById,
  updateTenant,
  TenantServiceError,
} from "@/services/tenant";
import { updateTenantSchema } from "@/lib/validations/tenant";

/**
 * GET /api/admin/tenants/[id]
 * Busca detalhes de um tenant por ID
 * Acesso: SUPER_ADMIN
 */
export const GET = requireRole(["SUPER_ADMIN"], async (request, { params }) => {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do tenant é obrigatório" },
        { status: 400 },
      );
    }

    const tenant = await getTenantById(id);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Tenant não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});

/**
 * PATCH /api/admin/tenants/[id]
 * Atualiza dados de um tenant
 * Acesso: SUPER_ADMIN
 */
export const PATCH = requireRole(
  ["SUPER_ADMIN"],
  async (request, { params }) => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { success: false, error: "ID do tenant é obrigatório" },
          { status: 400 },
        );
      }

      const body = await request.json();
      const parsed = updateTenantSchema.safeParse(body);

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

      const updated = await updateTenant(id, parsed.data);

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Tenant atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof TenantServiceError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          DOMAIN_EXISTS: 409,
        };

        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error updating tenant:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
