import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  listLocations,
  createLocation,
  TenantServiceError,
} from "@/services/tenant";
import { createLocationSchema } from "@/lib/validations/tenant";

/**
 * GET /api/admin/tenants/[id]/locations
 * Lista localizações de um tenant
 * Acesso: SUPER_ADMIN, TENANT_ADMIN
 */
export const GET = requireRole(
  ["SUPER_ADMIN", "TENANT_ADMIN"],
  async (request, { params, user }) => {
    try {
      const { id: tenantId } = await params;

      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: "ID do tenant é obrigatório" },
          { status: 400 },
        );
      }

      // TENANT_ADMIN só pode ver locations do próprio tenant
      if (user.role === "TENANT_ADMIN" && user.tenantId !== tenantId) {
        return NextResponse.json(
          { success: false, error: "Acesso negado" },
          { status: 403 },
        );
      }

      const locations = await listLocations(tenantId);

      return NextResponse.json({
        success: true,
        data: locations,
      });
    } catch (error) {
      console.error("Error listing locations:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * POST /api/admin/tenants/[id]/locations
 * Cria uma nova localização para um tenant
 * Acesso: SUPER_ADMIN, TENANT_ADMIN
 */
export const POST = requireRole(
  ["SUPER_ADMIN", "TENANT_ADMIN"],
  async (request, { params, user }) => {
    try {
      const { id: tenantId } = await params;

      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: "ID do tenant é obrigatório" },
          { status: 400 },
        );
      }

      // TENANT_ADMIN só pode criar locations no próprio tenant
      if (user.role === "TENANT_ADMIN" && user.tenantId !== tenantId) {
        return NextResponse.json(
          { success: false, error: "Acesso negado" },
          { status: 403 },
        );
      }

      const body = await request.json();
      const parsed = createLocationSchema.safeParse(body);

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

      const location = await createLocation(tenantId, parsed.data);

      return NextResponse.json(
        {
          success: true,
          data: location,
          message: "Localização criada com sucesso",
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof TenantServiceError) {
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: error.code === "NOT_FOUND" ? 404 : 400 },
        );
      }

      console.error("Error creating location:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
