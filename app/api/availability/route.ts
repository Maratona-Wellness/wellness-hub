import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { listAvailabilitySlots } from "@/services/program";
import { listAvailabilitySlotsSchema } from "@/lib/validations/program";

/**
 * GET /api/availability — Lista slots de disponibilidade (autenticado)
 */
export const GET = requireAuth(async (request: NextRequest, { user }) => {
  try {
    const tenantId = user.tenantId;

    if (!tenantId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Tenant não identificado" },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const parsed = listAvailabilitySlotsSchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos" },
        { status: 400 },
      );
    }

    // SUPER_ADMIN pode especificar tenantId no query
    const effectiveTenantId =
      user.role === "SUPER_ADMIN" && parsed.data.tenantId
        ? parsed.data.tenantId
        : tenantId;

    if (!effectiveTenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID obrigatório" },
        { status: 400 },
      );
    }

    const slots = await listAvailabilitySlots(parsed.data, effectiveTenantId);

    return NextResponse.json({
      success: true,
      data: slots,
      total: slots.length,
    });
  } catch (error) {
    console.error("Error listing availability:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});
