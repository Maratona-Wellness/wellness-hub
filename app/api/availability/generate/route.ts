import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  generateAvailabilitySlots,
  ProgramServiceError,
} from "@/services/program";
import { generateSlotsSchema } from "@/lib/validations/program";

/**
 * POST /api/availability/generate — Gera slots de disponibilidade em lote
 * Acessível apenas por SUPER_ADMIN
 */
export const POST = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const parsed = generateSlotsSchema.safeParse(body);

      if (!parsed.success) {
        const errors = parsed.error.issues.map((i) => i.message).join(", ");
        return NextResponse.json(
          { success: false, error: errors },
          { status: 400 },
        );
      }

      // SUPER_ADMIN sempre informa tenantId no body
      const tenantId = body.tenantId;

      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant ID obrigatório" },
          { status: 400 },
        );
      }

      const result = await generateAvailabilitySlots(parsed.data, tenantId);

      return NextResponse.json(
        {
          success: true,
          data: result,
          message: `${result.created} slots de disponibilidade gerados com sucesso para o programa "${result.programName}"${result.skippedConflicts > 0 ? ` (${result.skippedConflicts} conflitos ignorados)` : ""}`,
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof ProgramServiceError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          LOCATION_NOT_FOUND: 404,
          THERAPIST_NOT_FOUND: 404,
          THERAPIST_NOT_ASSIGNED: 400,
          SLOT_CONFLICT: 409,
          VALIDATION_ERROR: 400,
        };
        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error generating slots:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
