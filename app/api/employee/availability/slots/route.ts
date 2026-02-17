import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { listSlotsForDate } from "@/services/program";
import { availableSlotsQuerySchema } from "@/lib/validations/appointment";

/**
 * GET /api/employee/availability/slots — Slots de uma data específica
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
      const parsed = availableSlotsQuerySchema.safeParse(queryParams);

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

      const { programId, locationId, date } = parsed.data;

      const slots = await listSlotsForDate(
        user.tenantId,
        programId,
        locationId,
        date,
      );

      return NextResponse.json({
        success: true,
        data: slots,
      });
    } catch (error) {
      console.error("Error listing available slots:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
