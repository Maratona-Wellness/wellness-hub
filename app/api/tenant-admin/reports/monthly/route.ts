import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTenantMonthlyReport,
  AdminDashboardError,
} from "@/services/admin-dashboard";

/**
 * GET /api/tenant-admin/reports/monthly?month=YYYY-MM
 * Retorna relatório mensal do tenant
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

      const { searchParams } = new URL(request.url);
      const month = searchParams.get("month");

      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        // Default para o mês atual
        const now = new Date();
        const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const data = await getTenantMonthlyReport(user.tenantId, defaultMonth);
        return NextResponse.json({ success: true, data });
      }

      const data = await getTenantMonthlyReport(user.tenantId, month);

      return NextResponse.json({ success: true, data });
    } catch (error) {
      if (error instanceof AdminDashboardError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 },
        );
      }

      console.error("Error fetching tenant monthly report:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
