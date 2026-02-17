import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  checkInAppointment,
  TherapistAppointmentError,
} from "@/services/therapist-appointments";
import { checkInSchema } from "@/lib/validations/therapist-appointments";

/**
 * PATCH /api/therapist/appointments/[id]/check-in
 * Registra presença ou ausência de um agendamento
 * Acesso: THERAPIST
 */
export const PATCH = requireRole(
  ["THERAPIST"],
  async (request: NextRequest, { params, user }) => {
    try {
      const { id } = await params;
      const body = await request.json();

      const parsed = checkInSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Dados inválidos",
            details: parsed.error.issues,
          },
          { status: 400 },
        );
      }

      const result = await checkInAppointment(id, user.id, parsed.data);

      const message =
        parsed.data.status === "COMPLETED"
          ? "Presença registrada com sucesso"
          : "Ausência registrada com sucesso";

      return NextResponse.json({
        success: true,
        data: result,
        message,
      });
    } catch (error) {
      if (error instanceof TherapistAppointmentError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          THERAPIST_NOT_FOUND: 404,
          UNAUTHORIZED: 403,
          ALREADY_CHECKED_IN: 409,
          TOO_EARLY: 422,
          INVALID_STATUS: 400,
        };

        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error checking in appointment:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
