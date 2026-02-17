import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  listTherapists,
  createTherapist,
  TherapistServiceError,
} from "@/services/therapist";
import {
  listTherapistsQuerySchema,
  createTherapistSchema,
} from "@/lib/validations/therapist";

/**
 * GET /api/admin/therapists
 * Lista terapeutas com paginação, filtros e busca
 * Acesso: SUPER_ADMIN
 */
export const GET = requireRole(["SUPER_ADMIN"], async (request) => {
  try {
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "all",
      tenantId: searchParams.get("tenantId") || undefined,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    const parsed = listTherapistsQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Parâmetros de consulta inválidos",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const result = await listTherapists(parsed.data);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error listing therapists:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});

/**
 * POST /api/admin/therapists
 * Cria um novo terapeuta com UserAccount e role
 * Acesso: SUPER_ADMIN
 */
export const POST = requireRole(["SUPER_ADMIN"], async (request) => {
  try {
    const body = await request.json();

    const parsed = createTherapistSchema.safeParse(body);

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

    const result = await createTherapist(parsed.data);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: "Terapeuta cadastrado com sucesso",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof TherapistServiceError) {
      const statusMap: Record<string, number> = {
        EMAIL_EXISTS: 409,
        CPF_EXISTS: 409,
        VALIDATION_ERROR: 400,
      };

      return NextResponse.json(
        { success: false, error: error.message },
        { status: statusMap[error.code] || 400 },
      );
    }

    console.error("Error creating therapist:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});
