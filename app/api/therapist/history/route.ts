import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTherapistHistory,
  TherapistAppointmentError,
} from "@/services/therapist-appointments";
import { therapistHistorySchema } from "@/lib/validations/therapist-appointments";

/**
 * GET /api/therapist/history
 * Retorna histórico de atendimentos do terapeuta com estatísticas
 * Acesso: THERAPIST
 */
export const GET = requireRole(
  ["THERAPIST"],
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);

      const parsed = therapistHistorySchema.safeParse({
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
        tenantId: searchParams.get("tenantId") || undefined,
        locationId: searchParams.get("locationId") || undefined,
        programId: searchParams.get("programId") || undefined,
        status: searchParams.get("status") || undefined,
        startDate: searchParams.get("startDate") || undefined,
        endDate: searchParams.get("endDate") || undefined,
        sortBy: searchParams.get("sortBy") || undefined,
        sortOrder: searchParams.get("sortOrder") || undefined,
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

      const result = await getTherapistHistory(user.id, parsed.data);

      return NextResponse.json({
        success: true,
        ...result.data,
        stats: result.stats,
      });
    } catch (error) {
      if (error instanceof TherapistAppointmentError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.code === "THERAPIST_NOT_FOUND" ? 404 : 400 },
        );
      }

      console.error("Error fetching therapist history:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
