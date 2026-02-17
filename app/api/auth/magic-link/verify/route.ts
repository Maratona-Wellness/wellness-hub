import { NextRequest, NextResponse } from "next/server";
import { magicLinkVerifySchema } from "@/lib/validations/auth";
import { validateMagicToken, logAuthAttempt } from "@/services/auth";
import type { ApiResponse } from "@/types";

/**
 * POST /api/auth/magic-link/verify
 *
 * Verifica um magic token sem consumi-lo.
 * Retorna dados do tenant e email para o próximo step.
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
    const validation = magicLinkVerifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { email, token } = validation.data;

    // Validar token
    const result = await validateMagicToken(email, token);

    if (!result.valid) {
      await logAuthAttempt({
        method: "MAGIC_LINK",
        outcome: "FAILURE",
        reason: `Token verification failed: ${result.error}`,
        ip,
      });
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 },
      );
    }

    await logAuthAttempt({
      method: "MAGIC_LINK",
      outcome: "SUCCESS",
      reason: `Token verified for ${email}`,
      ip,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          email,
          tenantId: result.tenantId,
          tenantName: result.tenantName,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in magic-link/verify:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno. Tente novamente mais tarde.",
      },
      { status: 500 },
    );
  }
}
