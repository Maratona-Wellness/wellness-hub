import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTherapistById,
  updateTherapist,
  TherapistServiceError,
} from "@/services/therapist";
import { updateTherapistSchema } from "@/lib/validations/therapist";

/**
 * GET /api/admin/therapists/[id]
 * Busca detalhes de um terapeuta por ID
 * Acesso: SUPER_ADMIN
 */
export const GET = requireRole(["SUPER_ADMIN"], async (request, { params }) => {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do terapeuta é obrigatório" },
        { status: 400 },
      );
    }

    const therapist = await getTherapistById(id);

    if (!therapist) {
      return NextResponse.json(
        { success: false, error: "Terapeuta não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: therapist,
    });
  } catch (error) {
    console.error("Error fetching therapist:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});

/**
 * PATCH /api/admin/therapists/[id]
 * Atualiza dados de um terapeuta
 * Acesso: SUPER_ADMIN
 */
export const PATCH = requireRole(
  ["SUPER_ADMIN"],
  async (request, { params }) => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { success: false, error: "ID do terapeuta é obrigatório" },
          { status: 400 },
        );
      }

      const body = await request.json();
      const parsed = updateTherapistSchema.safeParse(body);

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

      const updated = await updateTherapist(id, parsed.data);

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Terapeuta atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof TherapistServiceError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          VALIDATION_ERROR: 400,
        };

        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error updating therapist:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
