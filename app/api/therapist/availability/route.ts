import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import {
  listTherapistAvailability,
  deleteTherapistSlots,
  ProgramServiceError,
} from "@/services/program";

/**
 * GET /api/therapist/availability — Lista slots do terapeuta logado
 */
export const GET = requireRole(
  ["THERAPIST"],
  async (request: NextRequest, { user }) => {
    try {
      // Buscar therapist vinculado ao user
      const therapist = await prisma.therapist.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!therapist) {
        return NextResponse.json(
          { success: false, error: "Perfil de terapeuta não encontrado" },
          { status: 404 },
        );
      }

      const { searchParams } = new URL(request.url);

      const slots = await listTherapistAvailability(therapist.id, {
        tenantId: searchParams.get("tenantId") || undefined,
        locationId: searchParams.get("locationId") || undefined,
        startDate: searchParams.get("startDate") || undefined,
        endDate: searchParams.get("endDate") || undefined,
      });

      return NextResponse.json({
        success: true,
        data: slots,
        total: slots.length,
      });
    } catch (error) {
      console.error("Error listing therapist availability:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * DELETE /api/therapist/availability — Remove slots do terapeuta logado
 */
export const DELETE = requireRole(
  ["THERAPIST"],
  async (request: NextRequest, { user }) => {
    try {
      const therapist = await prisma.therapist.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!therapist) {
        return NextResponse.json(
          { success: false, error: "Perfil de terapeuta não encontrado" },
          { status: 404 },
        );
      }

      const body = await request.json();
      const { slotIds } = body;

      if (!Array.isArray(slotIds) || slotIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Informe os IDs dos slots a remover" },
          { status: 400 },
        );
      }

      const result = await deleteTherapistSlots(therapist.id, slotIds);

      return NextResponse.json({
        success: true,
        data: result,
        message: `${result.deleted} slot(s) removido(s) com sucesso`,
      });
    } catch (error) {
      if (error instanceof ProgramServiceError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.code === "HAS_FUTURE_APPOINTMENTS" ? 409 : 400 },
        );
      }

      console.error("Error deleting therapist slots:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
