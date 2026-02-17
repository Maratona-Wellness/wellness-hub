import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";

/**
 * GET /api/admin/settings
 * Retorna configurações globais da plataforma
 * Acesso: SUPER_ADMIN
 */
export const GET = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest, { user }) => {
    try {
      // Configurações globais padrão
      // TODO: Persistir em tabela de configurações quando necessário
      const settings = {
        policies: {
          minAdvanceHours: 4,
          maxNoShowsBeforeBlock: 3,
          noShowBlockDays: 15,
          sessionToleranceMinutes: 15,
          magicLinkTtlMinutes: 15,
          passwordResetTtlHours: 1,
          sessionTimeoutMinutes: 30,
        },
        rateLimits: {
          loginAttemptsPerMinute: 5,
          magicLinkResendsPerWindow: 3,
          magicLinkResendWindowMinutes: 15,
        },
        security: {
          minPasswordLength: 8,
          requireNumber: true,
          requireSpecialChar: true,
          bcryptSaltRounds: 12,
          jwtTtlMinutes: 30,
        },
        email: {
          provider: "console", // console | resend | sendgrid
          fromAddress: "noreply@maratonaqv.com.br",
          fromName: "Maratona QV Wellness Hub",
        },
      };

      return NextResponse.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * PATCH /api/admin/settings
 * Atualiza configurações globais da plataforma
 * Acesso: SUPER_ADMIN
 */
export const PATCH = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();

      // TODO: Persistir configurações em tabela do banco de dados
      // Por ora, apenas confirmar o recebimento
      console.log(
        "[SETTINGS] Configurações atualizadas por SUPER_ADMIN:",
        body,
      );

      return NextResponse.json({
        success: true,
        message: "Configurações atualizadas com sucesso",
        data: body,
      });
    } catch (error) {
      console.error("Error updating admin settings:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
