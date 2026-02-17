import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { listAvailableDates } from "@/services/program";
import { availableDatesQuerySchema } from "@/lib/validations/appointment";

/**
 * GET /api/employee/availability/dates — Datas com slots disponíveis
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
      const queryParams = Object.fromEntries(searchParams.entries());
      const parsed = availableDatesQuerySchema.safeParse(queryParams);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Parâmetros inválidos",
            details: parsed.error.issues,
          },
          { status: 400 },
        );
      }

      const { programId, locationId, startDate, endDate } = parsed.data;

      const dates = await listAvailableDates(
        user.tenantId,
        programId,
        locationId,
        startDate,
        endDate,
      );

      return NextResponse.json({
        success: true,
        data: dates,
      });
    } catch (error) {
      console.error("Error listing available dates:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
