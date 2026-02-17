import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { listSlotsGrouped } from "@/services/program";
import { listSlotsPaginatedSchema } from "@/lib/validations/program";

/**
 * GET /api/superadmin/availability — Lista slots agrupados por empresa/programa (SUPER_ADMIN)
 */
export const GET = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      const parsed = listSlotsPaginatedSchema.safeParse(queryParams);

      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Parâmetros inválidos" },
          { status: 400 },
        );
      }

      const result = await listSlotsGrouped(parsed.data);

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error listing slots:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
