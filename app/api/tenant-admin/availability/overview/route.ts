import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { getAvailabilityOverview } from "@/services/program";
import { availabilityOverviewSchema } from "@/lib/validations/program";

/**
 * GET /api/tenant-admin/availability/overview — Overview de disponibilidade para TENANT_ADMIN
 */
export const GET = requireRole(
  ["TENANT_ADMIN", "SUPER_ADMIN"],
  async (request: NextRequest, { user }) => {
    try {
      const tenantId = user.tenantId;

      if (!tenantId && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      const parsed = availabilityOverviewSchema.safeParse(queryParams);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Parâmetros inválidos" },
          { status: 400 },
        );
      }

      // SUPER_ADMIN pode especificar tenantId no query
      const effectiveTenantId =
        user.role === "SUPER_ADMIN" && searchParams.get("tenantId")
          ? searchParams.get("tenantId")!
          : tenantId;

      if (!effectiveTenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant ID obrigatório" },
          { status: 400 },
        );
      }

      const overview = await getAvailabilityOverview(
        effectiveTenantId,
        parsed.data,
      );

      return NextResponse.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      console.error("Error getting availability overview:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
