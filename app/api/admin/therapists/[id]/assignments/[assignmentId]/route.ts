import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { removeAssignment, TherapistServiceError } from "@/services/therapist";

/**
 * DELETE /api/admin/therapists/[id]/assignments/[assignmentId]
 * Remove (soft delete) uma vinculação
 * Acesso: SUPER_ADMIN
 */
export const DELETE = requireRole(
  ["SUPER_ADMIN"],
  async (request, { params }) => {
    try {
      const { id, assignmentId } = await params;

      if (!id || !assignmentId) {
        return NextResponse.json(
          {
            success: false,
            error: "ID do terapeuta e da vinculação são obrigatórios",
          },
          { status: 400 },
        );
      }

      const result = await removeAssignment(id, assignmentId);

      return NextResponse.json({
        success: true,
        data: result,
        message:
          result.futureAppointments > 0
            ? `Vinculação removida. Atenção: existem ${result.futureAppointments} agendamento(s) futuro(s) nesta localização.`
            : "Vinculação removida com sucesso",
      });
    } catch (error) {
      if (error instanceof TherapistServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.code === "NOT_FOUND" ? 404 : 400 },
        );
      }

      console.error("Error removing assignment:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
