import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  listAssignments,
  createAssignments,
  TherapistServiceError,
} from "@/services/therapist";
import { createAssignmentSchema } from "@/lib/validations/therapist";

/**
 * GET /api/admin/therapists/[id]/assignments
 * Lista vinculações do terapeuta
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

    const assignments = await listAssignments(id);

    return NextResponse.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    if (error instanceof TherapistServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.code === "NOT_FOUND" ? 404 : 400 },
      );
    }

    console.error("Error listing assignments:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});

/**
 * POST /api/admin/therapists/[id]/assignments
 * Cria vinculações do terapeuta com tenant/locations
 * Acesso: SUPER_ADMIN
 */
export const POST = requireRole(
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
      const parsed = createAssignmentSchema.safeParse(body);

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

      const assignments = await createAssignments(id, parsed.data);

      return NextResponse.json(
        {
          success: true,
          data: assignments,
          message: `${assignments.length} vinculação(ões) criada(s) com sucesso`,
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof TherapistServiceError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          INVALID_TENANT: 400,
          INVALID_LOCATION: 400,
          ASSIGNMENT_EXISTS: 409,
          VALIDATION_ERROR: 400,
        };

        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error creating assignments:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
