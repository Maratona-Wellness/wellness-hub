import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  toggleTherapistStatus,
  TherapistServiceError,
} from "@/services/therapist";

/**
 * PATCH /api/admin/therapists/[id]/toggle-status
 * Alterna status ativo/inativo de um terapeuta
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

      const result = await toggleTherapistStatus(id);

      return NextResponse.json({
        success: true,
        data: result,
        message: result.active
          ? "Terapeuta ativado com sucesso"
          : "Terapeuta desativado com sucesso",
      });
    } catch (error) {
      if (error instanceof TherapistServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.code === "NOT_FOUND" ? 404 : 400 },
        );
      }

      console.error("Error toggling therapist status:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
