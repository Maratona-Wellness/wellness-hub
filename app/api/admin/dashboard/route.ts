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
      const data = await getSuperAdminDashboard();

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
