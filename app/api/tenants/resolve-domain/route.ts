import { NextRequest, NextResponse } from "next/server";
import { resolveDomain } from "@/services/tenant";
import { resolveDomainSchema } from "@/lib/validations/tenant";

/**
 * POST /api/tenants/resolve-domain
 * Resolve um domínio para um tenant (público, usado no signup)
 * Acesso: Público
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = resolveDomainSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Domínio inválido",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const tenant = await resolveDomain(parsed.data.domain);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: "Domínio não encontrado" },
        { status: 404 },
      );
    }

    if (!tenant.active) {
      return NextResponse.json(
        { success: false, error: "Empresa não está ativa no momento" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        logoUrl: tenant.logoUrl,
      },
    });
  } catch (error) {
    console.error("Error resolving domain:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
