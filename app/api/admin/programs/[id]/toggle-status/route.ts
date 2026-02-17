import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { toggleProgramStatus, ProgramServiceError } from "@/services/program";

/**
 * PATCH /api/admin/programs/[id]/toggle-status — Alterna status do programa (SUPER_ADMIN)
 */
export const PATCH = requireRole(
  ["SUPER_ADMIN"],
  async (
    _request: NextRequest,
    { params }: { params: Record<string, string> },
  ) => {
    try {
      const { id } = await params;
      const result = await toggleProgramStatus(id);

      return NextResponse.json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof ProgramServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.code === "NOT_FOUND" ? 404 : 400 },
        );
      }

      console.error("Error toggling program status:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
