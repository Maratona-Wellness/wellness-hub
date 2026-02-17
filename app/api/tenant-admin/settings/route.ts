import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getTenantSettings,
  updateTenantSettings,
  TenantServiceError,
} from "@/services/tenant";
import { updateTenantSettingsSchema } from "@/lib/validations/tenant";

/**
 * GET /api/tenant-admin/settings
 * Busca configurações do tenant para o TENANT_ADMIN
 * Acesso: TENANT_ADMIN
 */
export const GET = requireRole(["TENANT_ADMIN"], async (request, { user }) => {
  try {
    if (!user.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant não identificado" },
        { status: 400 },
      );
    }

    const settings = await getTenantSettings(user.tenantId);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    if (error instanceof TenantServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 },
      );
    }

    console.error("Error fetching tenant settings:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
});

/**
 * PATCH /api/tenant-admin/settings
 * Atualiza configurações do tenant
 * Acesso: TENANT_ADMIN
 */
export const PATCH = requireRole(
  ["TENANT_ADMIN"],
  async (request, { user }) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const body = await request.json();
      const parsed = updateTenantSettingsSchema.safeParse(body);

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

      const updated = await updateTenantSettings(user.tenantId, parsed.data);

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Configurações atualizadas com sucesso",
      });
    } catch (error) {
      if (error instanceof TenantServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 },
        );
      }

      console.error("Error updating tenant settings:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
