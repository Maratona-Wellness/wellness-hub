import { NextRequest, NextResponse } from "next/server";
import { magicLinkRequestSchema } from "@/lib/validations/auth";
import {
  checkExistingAccount,
  createMagicToken,
  logAuthAttempt,
  sendEmail,
} from "@/services/auth";
import { getTenantFromDomain } from "@/lib/utils/tenant";
import type { ApiResponse } from "@/types";

/**
 * POST /api/auth/magic-link/request
 *
 * Solicita envio de magic link para cadastro de funcionário.
 * Valida domínio do email contra tenants ativos.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Validação do input
    const validation = magicLinkRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase();

    // Validar domínio contra tenants ativos
    const tenant = await getTenantFromDomain(normalizedEmail);

    if (!tenant) {
      await logAuthAttempt({
        method: "MAGIC_LINK",
        outcome: "FAILURE",
        reason: `No active tenant for domain: ${normalizedEmail.split("@")[1]}`,
        ip,
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "O domínio do seu email não está cadastrado. Verifique o email informado ou entre em contato com o RH da sua empresa.",
        },
        { status: 400 },
      );
    }

    // Verificar se já existe conta com esse email
    const existingAccount = await checkExistingAccount(normalizedEmail);
    if (existingAccount.exists) {
      await logAuthAttempt({
        method: "MAGIC_LINK",
        outcome: "FAILURE",
        reason: `Account already exists for: ${normalizedEmail}`,
        ip,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Já existe uma conta cadastrada com esse email. Faça login.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 },
      );
    }

    // Gerar magic token
    const result = await createMagicToken(normalizedEmail, tenant.id);

    if ("error" in result) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 429 },
      );
    }

    // Enviar email com token
    // TODO: Integrar com serviço de email real (Resend/SendGrid)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/signup/verify?email=${encodeURIComponent(normalizedEmail)}&token=${result.token}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Wellness Hub - Seu código de verificação",
      body: `
        Olá!

        Você solicitou acesso ao Wellness Hub da empresa ${tenant.name}.

        Seu código de verificação é: ${result.token}

        Ou clique no link abaixo:
        ${verifyUrl}

        Este código expira em 15 minutos.

        Se você não solicitou este acesso, ignore este email.
      `,
    });

    await logAuthAttempt({
      method: "MAGIC_LINK",
      outcome: "SUCCESS",
      reason: `Magic link sent to ${normalizedEmail}`,
      ip,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Código de verificação enviado para o seu email.",
        data: {
          email: normalizedEmail,
          expiresAt: result.expiresAt.toISOString(),
          tenantName: tenant.name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in magic-link/request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno. Tente novamente mais tarde.",
      },
      { status: 500 },
    );
  }
}
