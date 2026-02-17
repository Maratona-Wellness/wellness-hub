import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { listAuthLogs } from "@/services/admin-dashboard";

/**
 * GET /api/admin/logs
 * Lista logs de autenticação com filtros
 * Acesso: SUPER_ADMIN
 */
export const GET = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest, { user }) => {
    try {
      const { searchParams } = new URL(request.url);

      const query = {
        page: parseInt(searchParams.get("page") || "1"),
        limit: parseInt(searchParams.get("limit") || "20"),
        method: searchParams.get("method") || undefined,
        outcome: searchParams.get("outcome") || undefined,
        userId: searchParams.get("userId") || undefined,
        startDate: searchParams.get("startDate") || undefined,
        endDate: searchParams.get("endDate") || undefined,
      };

      const result = await listAuthLogs(query);

      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      console.error("Error listing auth logs:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
