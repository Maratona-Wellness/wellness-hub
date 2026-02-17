import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  listProgramsByTenant,
  createProgram,
  ProgramServiceError,
} from "@/services/program";
import { createProgramSchema } from "@/lib/validations/program";

/**
 * GET /api/admin/tenants/[id]/programs — Lista programas do tenant
 */
export const GET = requireRole(
  ["SUPER_ADMIN", "TENANT_ADMIN"],
  async (
    request: NextRequest,
    {
      params,
      user,
    }: {
      params: Record<string, string>;
      user: { role: string; tenantId: string | null };
    },
  ) => {
    try {
      const { id } = await params;

      // TENANT_ADMIN só pode ver seus próprios programas
      if (user.role === "TENANT_ADMIN" && user.tenantId !== id) {
        return NextResponse.json(
          { success: false, error: "Acesso não autorizado" },
          { status: 403 },
        );
      }

      const { searchParams } = new URL(request.url);
      const activeOnly = searchParams.get("activeOnly") === "true";

      const programs = await listProgramsByTenant(id, { activeOnly });

      return NextResponse.json({
        success: true,
        data: programs,
      });
    } catch (error) {
      console.error("Error listing tenant programs:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * POST /api/admin/tenants/[id]/programs — Vincula programa ao tenant (SUPER_ADMIN)
 */
export const POST = requireRole(
  ["SUPER_ADMIN"],
  async (
    request: NextRequest,
    { params }: { params: Record<string, string> },
  ) => {
    try {
      const { id } = await params;
      const body = await request.json();

      const parsed = createProgramSchema.safeParse({
        ...body,
        tenantId: id,
      });

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
          message: "Programa criado e vinculado ao tenant com sucesso",
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

      console.error("Error creating tenant program:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
