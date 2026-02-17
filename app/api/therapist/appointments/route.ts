import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  listTherapistAppointments,
  getTherapistFilterOptions,
  TherapistAppointmentError,
} from "@/services/therapist-appointments";
import { listTherapistAppointmentsSchema } from "@/lib/validations/therapist-appointments";

/**
 * GET /api/therapist/appointments
 * Lista agendamentos do terapeuta logado com filtros de calendário
 * Acesso: THERAPIST
 */
export const GET = requireRole(
  ["THERAPIST"],
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);

      // Se solicitando opções de filtro
      if (searchParams.get("filters") === "true") {
        const options = await getTherapistFilterOptions(user.id);
        return NextResponse.json({
          success: true,
          data: options,
        });
      }

      const parsed = listTherapistAppointmentsSchema.safeParse({
        view: searchParams.get("view") || undefined,
        date: searchParams.get("date") || undefined,
        tenantId: searchParams.get("tenantId") || undefined,
        locationId: searchParams.get("locationId") || undefined,
        programId: searchParams.get("programId") || undefined,
        status: searchParams.get("status") || undefined,
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

      const result = await listTherapistAppointments(user.id, parsed.data);

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof TherapistAppointmentError) {
        const statusMap: Record<string, number> = {
          THERAPIST_NOT_FOUND: 404,
          UNAUTHORIZED: 403,
        };

        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error listing therapist appointments:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
