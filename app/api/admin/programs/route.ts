import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  listPrograms,
  createProgram,
  ProgramServiceError,
} from "@/services/program";
import {
  listProgramsQuerySchema,
  createProgramSchema,
} from "@/lib/validations/program";

/**
 * GET /api/admin/programs — Lista programas (SUPER_ADMIN)
 */
export const GET = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());

      const parsed = listProgramsQuerySchema.safeParse(queryParams);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Parâmetros de consulta inválidos" },
          { status: 400 },
        );
      }

      const result = await listPrograms(parsed.data);

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error listing programs:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * POST /api/admin/programs — Cria programa (SUPER_ADMIN)
 */
export const POST = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const parsed = createProgramSchema.safeParse(body);

      if (!parsed.success) {
        const errors = parsed.error.issues.map((i) => i.message).join(", ");
        return NextResponse.json(
          { success: false, error: errors },
          { status: 400 },
        );
      }

      const program = await createProgram(parsed.data);

      return NextResponse.json(
        {
          success: true,
          data: program,
          message: "Programa criado com sucesso",
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof ProgramServiceError) {
        const statusMap: Record<string, number> = {
          TENANT_NOT_FOUND: 404,
          VALIDATION_ERROR: 400,
        };
        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error creating program:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
