import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  listTenantEmployees,
  toggleEmployeeStatus,
  resetEmployeePassword,
  AdminDashboardError,
} from "@/services/admin-dashboard";

/**
 * GET /api/tenant-admin/employees
 * Lista funcionários do tenant com paginação e filtros
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

      const query = {
        page: parseInt(searchParams.get("page") || "1"),
        limit: parseInt(searchParams.get("limit") || "10"),
        search: searchParams.get("search") || undefined,
        status: (searchParams.get("status") || "all") as
          | "all"
          | "active"
          | "inactive",
        sortBy: searchParams.get("sortBy") || "name",
        sortOrder: (searchParams.get("sortOrder") || "asc") as "asc" | "desc",
      };

      const result = await listTenantEmployees(user.tenantId, query);

      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      console.error("Error listing tenant employees:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
