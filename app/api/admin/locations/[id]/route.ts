import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getLocationById,
  updateLocation,
  deleteLocation,
  TenantServiceError,
} from "@/services/tenant";
import { updateLocationSchema } from "@/lib/validations/tenant";

/**
 * GET /api/admin/locations/[id]
 * Busca detalhes de uma localização
 * Acesso: SUPER_ADMIN, TENANT_ADMIN
 */
export const GET = requireRole(
  ["SUPER_ADMIN", "TENANT_ADMIN"],
  async (request, { params, user }) => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { success: false, error: "ID da localização é obrigatório" },
          { status: 400 },
        );
      }

      const location = await getLocationById(id);

      if (!location) {
        return NextResponse.json(
          { success: false, error: "Localização não encontrada" },
          { status: 404 },
        );
      }

      // TENANT_ADMIN só pode ver locations do próprio tenant
      if (
        user.role === "TENANT_ADMIN" &&
        user.tenantId !== location.tenant.id
      ) {
        return NextResponse.json(
          { success: false, error: "Acesso negado" },
          { status: 403 },
        );
      }

      return NextResponse.json({
        success: true,
        data: location,
      });
    } catch (error) {
      console.error("Error fetching location:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * PATCH /api/admin/locations/[id]
 * Atualiza uma localização
 * Acesso: SUPER_ADMIN, TENANT_ADMIN
 */
export const PATCH = requireRole(
  ["SUPER_ADMIN", "TENANT_ADMIN"],
  async (request, { params, user }) => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { success: false, error: "ID da localização é obrigatório" },
          { status: 400 },
        );
      }

      // Verificar ownership para TENANT_ADMIN
      const existing = await getLocationById(id);
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Localização não encontrada" },
          { status: 404 },
        );
      }

      if (
        user.role === "TENANT_ADMIN" &&
        user.tenantId !== existing.tenant.id
      ) {
        return NextResponse.json(
          { success: false, error: "Acesso negado" },
          { status: 403 },
        );
      }

      const body = await request.json();
      const parsed = updateLocationSchema.safeParse(body);

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

      const updated = await updateLocation(id, parsed.data);

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Localização atualizada com sucesso",
      });
    } catch (error) {
      if (error instanceof TenantServiceError) {
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: error.code === "NOT_FOUND" ? 404 : 400 },
        );
      }

      console.error("Error updating location:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * DELETE /api/admin/locations/[id]
 * Remove uma localização
 * Acesso: SUPER_ADMIN, TENANT_ADMIN
 */
export const DELETE = requireRole(
  ["SUPER_ADMIN", "TENANT_ADMIN"],
  async (request, { params, user }) => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { success: false, error: "ID da localização é obrigatório" },
          { status: 400 },
        );
      }

      // Verificar ownership para TENANT_ADMIN
      const existing = await getLocationById(id);
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Localização não encontrada" },
          { status: 404 },
        );
      }

      if (
        user.role === "TENANT_ADMIN" &&
        user.tenantId !== existing.tenant.id
      ) {
        return NextResponse.json(
          { success: false, error: "Acesso negado" },
          { status: 403 },
        );
      }

      await deleteLocation(id);

      return NextResponse.json({
        success: true,
        message: "Localização removida com sucesso",
      });
    } catch (error) {
      if (error instanceof TenantServiceError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          HAS_FUTURE_APPOINTMENTS: 409,
        };

        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error deleting location:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
