import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTherapistAppointmentById,
  TherapistAppointmentError,
} from "@/services/therapist-appointments";

/**
 * GET /api/therapist/appointments/[id]
 * Retorna detalhes de um agendamento do terapeuta
 * Acesso: THERAPIST
 */
export const GET = requireRole(
  ["THERAPIST"],
  async (request: NextRequest, { params, user }) => {
    try {
      const { id } = await params;

      const appointment = await getTherapistAppointmentById(id, user.id);

      return NextResponse.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      if (error instanceof TherapistAppointmentError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          THERAPIST_NOT_FOUND: 404,
          UNAUTHORIZED: 403,
        };

        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error fetching therapist appointment:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
