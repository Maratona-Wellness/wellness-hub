import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { getEmployeeDashboard } from "@/services/appointment";
import { AppointmentServiceError } from "@/services/appointment";

/**
 * GET /api/employee/dashboard — Dashboard do funcionário
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

      const data = await getEmployeeDashboard(user.id, user.tenantId);

      return NextResponse.json({ success: true, data });
    } catch (error) {
      if (error instanceof AppointmentServiceError) {
        const statusMap: Record<string, number> = {
          EMPLOYEE_NOT_FOUND: 404,
          UNAUTHORIZED: 403,
        };
        return NextResponse.json(
          { success: false, error: error.message },
          { status: statusMap[error.code] || 400 },
        );
      }

      console.error("Error in employee dashboard:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
