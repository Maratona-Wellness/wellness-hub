import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  toggleEmployeeStatus,
  AdminDashboardError,
} from "@/services/admin-dashboard";

/**
 * PATCH /api/tenant-admin/employees/[id]/toggle-status
 * Ativa/desativa um funcionário
 * Acesso: TENANT_ADMIN
 */
export const PATCH = requireRole(
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

      const result = await toggleEmployeeStatus(id, user.tenantId);

      return NextResponse.json({
        success: true,
        message: result.message,
        data: { active: result.active },
      });
    } catch (error) {
      if (error instanceof AdminDashboardError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 },
        );
      }

      console.error("Error toggling employee status:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
