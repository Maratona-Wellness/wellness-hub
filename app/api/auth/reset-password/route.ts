import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { resetPassword, logAuthAttempt } from "@/services/auth";
import type { ApiResponse } from "@/types";

/**
 * POST /api/auth/reset-password
 *
 * Redefine a senha do usuário após validar o token de reset.
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
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { email, token, password } = validation.data;

    // Redefinir senha
    const result = await resetPassword(email, token, password);

    if (!result.success) {
      await logAuthAttempt({
        method: "PASSWORD",
        outcome: "FAILURE",
        reason: `Password reset failed: ${result.error}`,
        ip,
      });
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Token inválido ou expirado.",
        },
        { status: 400 },
      );
    }

    await logAuthAttempt({
      method: "PASSWORD",
      outcome: "SUCCESS",
      reason: `Password reset successful for ${email}`,
      ip,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Senha redefinida com sucesso! Faça login com a nova senha.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno. Tente novamente mais tarde.",
      },
      { status: 500 },
    );
  }
}
