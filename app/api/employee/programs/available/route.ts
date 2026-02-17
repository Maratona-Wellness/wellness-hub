import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { listAvailablePrograms } from "@/services/appointment";

/**
 * GET /api/employee/programs/available — Programas disponíveis para o funcionário
 */
export const GET = requireRole(
  ["EMPLOYEE"],
  async (_request: NextRequest, { user }) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const programs = await listAvailablePrograms(user.tenantId);

      return NextResponse.json({
        success: true,
        data: programs,
      });
    } catch (error) {
      console.error("Error listing available programs:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
