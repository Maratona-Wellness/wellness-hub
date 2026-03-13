import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { listProgramsByTenant } from "@/services/program";

/**
 * GET /api/tenant-admin/programs
 * Lista programas vinculados ao tenant do admin logado
 * Acesso: TENANT_ADMIN (read-only)
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

      const programs = await listProgramsByTenant(user.tenantId);

      return NextResponse.json({
        success: true,
        data: programs,
      });
    } catch (error) {
      console.error("Error listing tenant programs:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
