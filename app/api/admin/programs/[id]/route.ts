import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getProgramById,
  updateProgram,
  ProgramServiceError,
} from "@/services/program";
import { updateProgramSchema } from "@/lib/validations/program";

/**
 * GET /api/admin/programs/[id] — Detalhes do programa (SUPER_ADMIN)
 */
export const GET = requireRole(
  ["SUPER_ADMIN"],
  async (
    _request: NextRequest,
    { params }: { params: Record<string, string> },
  ) => {
    try {
      const { id } = await params;
      const program = await getProgramById(id);

      if (!program) {
        return NextResponse.json(
          { success: false, error: "Programa não encontrado" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, data: program });
    } catch (error) {
      console.error("Error getting program:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * PATCH /api/admin/programs/[id] — Atualiza programa (SUPER_ADMIN)
 */
export const PATCH = requireRole(
  ["SUPER_ADMIN"],
  async (
    request: NextRequest,
    { params }: { params: Record<string, string> },
  ) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = updateProgramSchema.safeParse(body);

      if (!parsed.success) {
        const errors = parsed.error.issues.map((i) => i.message).join(", ");
        return NextResponse.json(
          { success: false, error: errors },
          { status: 400 },
        );
      }

      const program = await updateProgram(id, parsed.data);

      return NextResponse.json({
        success: true,
        data: program,
        message: "Programa atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof ProgramServiceError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          VALIDATION_ERROR: 400,
        };
        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error updating program:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
