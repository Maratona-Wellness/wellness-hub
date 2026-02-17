import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import {
  createAppointment,
  listEmployeeAppointments,
  AppointmentServiceError,
} from "@/services/appointment";
import {
  createAppointmentSchema,
  listEmployeeAppointmentsSchema,
} from "@/lib/validations/appointment";

/**
 * GET /api/employee/appointments — Lista agendamentos do funcionário
 */
export const GET = requireRole(
  ["EMPLOYEE"],
  async (request: NextRequest, { user }) => {
    try {
      if (!user.tenantId) {
        return NextResponse.json(
          { success: false, error: "Tenant não identificado" },
          { status: 400 },
        );
      }

      const { searchParams } = new URL(request.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      const parsed = listEmployeeAppointmentsSchema.safeParse(queryParams);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Parâmetros inválidos",
            details: parsed.error.issues,
          },
          { status: 400 },
        );
      }

      const result = await listEmployeeAppointments(
        user.id,
        user.tenantId,
        parsed.data,
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      }

      console.error("Error listing employee appointments:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * POST /api/employee/appointments — Criar agendamento
 */
export const POST = requireRole(
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
      const parsed = createAppointmentSchema.safeParse(body);

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

      const appointment = await createAppointment(
        parsed.data,
        user.id,
        user.tenantId,
      );

      return NextResponse.json(
        {
          success: true,
          data: appointment,
          message: "Agendamento confirmado com sucesso!",
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        const statusMap: Record<string, number> = {
          EMPLOYEE_NOT_FOUND: 404,
          SLOT_NOT_FOUND: 404,
          SLOT_FULL: 409,
          ALREADY_BOOKED: 409,
          PAST_DATE: 400,
          UNAUTHORIZED: 403,
        };
        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error creating appointment:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
