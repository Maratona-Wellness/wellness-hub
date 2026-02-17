import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTherapistProfile,
  updateTherapistProfile,
  TherapistServiceError,
} from "@/services/therapist";
import { updateTherapistProfileSchema } from "@/lib/validations/therapist";

/**
 * GET /api/therapist/profile
 * Busca perfil do terapeuta logado
 * Acesso: THERAPIST
 */
export const GET = requireRole(["THERAPIST"], async (request, { user }) => {
  try {
    const profile = await getTherapistProfile(user.id);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    if (error instanceof TherapistServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      );
    }

    console.error("Error fetching therapist profile:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});

/**
 * PATCH /api/therapist/profile
 * Atualiza perfil do terapeuta logado
 * Acesso: THERAPIST
 */
export const PATCH = requireRole(["THERAPIST"], async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = updateTherapistProfileSchema.safeParse(body);

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

    const updated = await updateTherapistProfile(user.id, parsed.data);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Perfil atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof TherapistServiceError) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        INVALID_PASSWORD: 400,
      };

      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusMap[error.code] || 400 },
      );
    }

    console.error("Error updating therapist profile:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});
