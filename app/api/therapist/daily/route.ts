import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTherapistDailyAppointments,
  TherapistAppointmentError,
} from "@/services/therapist-appointments";
import { therapistDailySchema } from "@/lib/validations/therapist-appointments";

/**
 * GET /api/therapist/daily
 * Retorna agendamentos do dia do terapeuta
 * Acesso: THERAPIST
 */
export const GET = requireRole(
  ["THERAPIST"],
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);

      const parsed = therapistDailySchema.safeParse({
        date: searchParams.get("date") || undefined,
      });

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

      const result = await getTherapistDailyAppointments(
        user.id,
        parsed.data.date,
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TherapistAppointmentError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.code === "THERAPIST_NOT_FOUND" ? 404 : 400 },
        );
      }

      console.error("Error fetching therapist daily:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
