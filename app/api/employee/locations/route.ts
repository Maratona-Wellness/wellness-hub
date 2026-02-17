import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { listAvailableLocations } from "@/services/appointment";

/**
 * GET /api/employee/locations — Locations com disponibilidade para o programa
 */
export const GET = requireRole(
  ["EMPLOYEE"],
  async (request: NextRequest, { user }) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const { searchParams } = new URL(request.url);
      const programId = searchParams.get("programId");

      if (!programId) {
        return NextResponse.json(
          { success: false, error: "programId é obrigatório" },
          { status: 400 },
        );
      }

      const locations = await listAvailableLocations(user.tenantId, programId);

      return NextResponse.json({
        success: true,
        data: locations,
      });
    } catch (error) {
      console.error("Error listing locations:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
