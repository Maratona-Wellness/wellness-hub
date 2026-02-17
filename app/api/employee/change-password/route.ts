import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  changeEmployeePassword,
  AppointmentServiceError,
} from "@/services/appointment";
import { changePasswordSchema } from "@/lib/validations/appointment";

/**
 * POST /api/employee/change-password — Alterar senha do funcionário
 */
export const POST = requireRole(
  ["EMPLOYEE"],
  async (request: NextRequest, { user }) => {
    try {
      const body = await request.json();
      const parsed = changePasswordSchema.safeParse(body);

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

      const result = await changeEmployeePassword(
        user.id,
        parsed.data.currentPassword,
        parsed.data.newPassword,
      );

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      }

      console.error("Error changing password:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
