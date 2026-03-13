import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { getSuperAdminDashboard } from "@/services/admin-dashboard";

/**
 * GET /api/admin/dashboard
 * Retorna dados do dashboard global para SUPER_ADMIN
 * Acesso: SUPER_ADMIN
 */
export const GET = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const daysParam = searchParams.get("days");
      const days = daysParam
        ? Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 90)
        : 30;

      const data = await getSuperAdminDashboard(days);

      return NextResponse.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching super admin dashboard:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
