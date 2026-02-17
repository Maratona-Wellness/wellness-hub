import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTenantAdminDashboard,
  AdminDashboardError,
} from "@/services/admin-dashboard";

/**
 * GET /api/tenant-admin/dashboard
 * Retorna dados do dashboard para TENANT_ADMIN
 * Acesso: TENANT_ADMIN
 */
export const GET = requireRole(
  ["TENANT_ADMIN"],
  async (request: NextRequest, { user }) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const data = await getTenantAdminDashboard(user.tenantId);

      return NextResponse.json({ success: true, data });
    } catch (error) {
      if (error instanceof AdminDashboardError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 },
        );
      }

      console.error("Error fetching tenant admin dashboard:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
