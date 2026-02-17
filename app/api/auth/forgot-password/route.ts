import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import {
  createPasswordResetToken,
  logAuthAttempt,
  sendEmail,
} from "@/services/auth";
import type { ApiResponse } from "@/types";

/**
 * POST /api/auth/forgot-password
 *
 * Solicita envio de link para reset de senha.
 * Sempre retorna sucesso (não revela se email existe).
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
    const validation = forgotPasswordSchema.safeParse(body);
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

    // Gerar token de reset (retorna null se email não existe — mas não revelamos isso)
    const result = await createPasswordResetToken(normalizedEmail);

    if (result) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${result.token}`;

      // TODO: Integrar com serviço de email real
      await sendEmail({
        to: normalizedEmail,
        subject: "Wellness Hub - Redefinição de Senha",
        body: `
          Olá!

          Recebemos uma solicitação para redefinir sua senha no Wellness Hub.

          Use o link abaixo para criar uma nova senha:
          ${resetUrl}

          Ou use o código: ${result.token}

          Este link expira em 1 hora.

          Se você não solicitou esta redefinição, ignore este email.
        `,
      });

      await logAuthAttempt({
        method: "PASSWORD",
        outcome: "SUCCESS",
        reason: `Password reset requested for ${normalizedEmail}`,
        ip,
      });
    }

    // Sempre retorna sucesso (segurança: não revelar se email existe)
    return NextResponse.json(
      {
        success: true,
        message:
          "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno. Tente novamente mais tarde.",
      },
      { status: 500 },
    );
  }
}
