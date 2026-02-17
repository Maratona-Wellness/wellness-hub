import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  getEmployeeAppointmentById,
  cancelAppointment,
  AppointmentServiceError,
} from "@/services/appointment";
import { cancelAppointmentSchema } from "@/lib/validations/appointment";

/**
 * GET /api/employee/appointments/[id] — Detalhes de um agendamento
 */
export const GET = requireRole(
  ["EMPLOYEE"],
  async (
    _request: NextRequest,
    { user, params }: { user: any; params: Record<string, string> },
  ) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const { id } = await params;

      const appointment = await getEmployeeAppointmentById(
        id,
        user.id,
        user.tenantId,
      );

      return NextResponse.json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          EMPLOYEE_NOT_FOUND: 404,
          UNAUTHORIZED: 403,
        };
        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error fetching appointment details:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * DELETE /api/employee/appointments/[id] — Cancelar agendamento
 */
export const DELETE = requireRole(
  ["EMPLOYEE"],
  async (
    request: NextRequest,
    { user, params }: { user: any; params: Record<string, string> },
  ) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const { id } = await params;

      // Tentar ler body para motivo (opcional)
      let reason: string | undefined;
      try {
        const body = await request.json();
        const parsed = cancelAppointmentSchema.safeParse(body);
        if (parsed.success) {
          reason = parsed.data.reason;
        }
      } catch {
        // Body vazio é ok
      }

      const cancelled = await cancelAppointment(
        id,
        user.id,
        user.tenantId,
        reason,
      );

      return NextResponse.json({
        success: true,
        data: cancelled,
        message: "Agendamento cancelado com sucesso",
      });
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        const statusMap: Record<string, number> = {
          NOT_FOUND: 404,
          EMPLOYEE_NOT_FOUND: 404,
          UNAUTHORIZED: 403,
          INVALID_STATUS: 400,
          CANCELLATION_DEADLINE: 400,
        };
        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error cancelling appointment:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
