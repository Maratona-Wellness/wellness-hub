import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getUserProfile } from "@/services/auth";
import type { ApiResponse } from "@/types";

/**
 * GET /api/auth/me
 *
 * Retorna o perfil do usuário logado com informações completas.
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autenticado",
        },
        { status: 401 },
      );
    }

    const profile = await getUserProfile(session.user.id);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não encontrado",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno",
      },
      { status: 500 },
    );
  }
}
