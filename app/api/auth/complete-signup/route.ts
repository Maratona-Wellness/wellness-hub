import { NextRequest, NextResponse } from "next/server";
import { completeSignupSchema } from "@/lib/validations/auth";
import { completeSignup, logAuthAttempt } from "@/services/auth";
import type { ApiResponse } from "@/types";

/**
 * POST /api/auth/complete-signup
 *
 * Completa o cadastro de funcionário após verificação do magic link.
 * Cria UserAccount, Employee e UserRole.
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
    const validation = completeSignupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 },
      );
    }

    const { email, token, name, password } = validation.data;

    // Completar cadastro
    const result = await completeSignup({
      email,
      token,
      name,
      password,
    });

    if (!result.success) {
      await logAuthAttempt({
        method: "MAGIC_LINK",
        outcome: "FAILURE",
        reason: `Signup failed: ${result.error}`,
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
      userId: result.userId,
      method: "MAGIC_LINK",
      outcome: "SUCCESS",
      reason: "Account created successfully",
      ip,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Conta criada com sucesso! Faça login para continuar.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in complete-signup:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno. Tente novamente mais tarde.",
      },
      { status: 500 },
    );
  }
}
