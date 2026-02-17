import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  resetEmployeePassword,
  AdminDashboardError,
} from "@/services/admin-dashboard";

/**
 * POST /api/tenant-admin/employees/[id]/reset-password
 * Envia link de redefinição de senha para o funcionário
 * Acesso: TENANT_ADMIN
 */
export const POST = requireRole(
  ["TENANT_ADMIN"],
  async (request: NextRequest, { user, params }) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const { id } = await params;

      const result = await resetEmployeePassword(id, user.tenantId);

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof AdminDashboardError) {
        const statusMap: Record<string, number> = {
          TENANT_NOT_FOUND: 404,
          VALIDATION_ERROR: 400,
        };
        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error resetting employee password:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
