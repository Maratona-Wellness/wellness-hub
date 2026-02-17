import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getEmployeeProfile,
  updateEmployeeProfile,
  AppointmentServiceError,
} from "@/services/appointment";
import { updateEmployeeProfileSchema } from "@/lib/validations/appointment";

/**
 * GET /api/employee/profile — Perfil do funcionário
 */
export const GET = requireRole(
  ["EMPLOYEE"],
  async (_request: NextRequest, { user }) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const profile = await getEmployeeProfile(user.id, user.tenantId);

      return NextResponse.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 },
        );
      }

      console.error("Error fetching employee profile:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * PATCH /api/employee/profile — Atualizar perfil do funcionário
 */
export const PATCH = requireRole(
  ["EMPLOYEE"],
  async (request: NextRequest, { user }) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const body = await request.json();
      const parsed = updateEmployeeProfileSchema.safeParse(body);

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

      const profile = await updateEmployeeProfile(
        user.id,
        user.tenantId,
        parsed.data,
      );

      return NextResponse.json({
        success: true,
        data: profile,
        message: "Perfil atualizado com sucesso",
      });
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      }

      console.error("Error updating employee profile:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
