import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { toggleTenantStatus, TenantServiceError } from "@/services/tenant";

/**
 * PATCH /api/admin/tenants/[id]/toggle-status
 * Alterna o status ativo/inativo de um tenant
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

      const result = await toggleTenantStatus(id);

      return NextResponse.json({
        success: true,
        data: result,
        message: result.active
          ? "Tenant ativado com sucesso"
          : "Tenant desativado com sucesso",
      });
    } catch (error) {
      if (error instanceof TenantServiceError) {
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: error.code === "NOT_FOUND" ? 404 : 400 },
        );
      }

      console.error("Error toggling tenant status:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
