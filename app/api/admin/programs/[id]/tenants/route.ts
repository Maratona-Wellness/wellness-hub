import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/admin/programs/[id]/tenants
 * Lista tenants vinculados a um programa
 * Acesso: SUPER_ADMIN
 */
export const GET = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params;

      const program = await prisma.program.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!program) {
        return NextResponse.json(
          { success: false, error: "Programa não encontrado" },
          { status: 404 },
        );
      }

      const tenantPrograms = await prisma.tenantProgram.findMany({
        where: { programId: id },
        include: {
          tenant: {
            select: { id: true, name: true, domain: true, active: true },
          },
        },
        orderBy: { tenant: { name: "asc" } },
      });

      return NextResponse.json({
        success: true,
        data: tenantPrograms.map((tp) => ({
          id: tp.id,
          tenantId: tp.tenant.id,
          tenantName: tp.tenant.name,
          tenantDomain: tp.tenant.domain,
          tenantActive: tp.tenant.active,
          active: tp.active,
          createdAt: tp.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error listing program tenants:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * POST /api/admin/programs/[id]/tenants
 * Vincula programa a um ou mais tenants
 * Acesso: SUPER_ADMIN
 */
export const POST = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { tenantIds } = body as { tenantIds: string[] };

      if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Informe ao menos um tenant" },
          { status: 400 },
        );
      }

      const program = await prisma.program.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!program) {
        return NextResponse.json(
          { success: false, error: "Programa não encontrado" },
          { status: 404 },
        );
      }

      // Verify all tenants exist
      const tenants = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
        select: { id: true },
      });

      if (tenants.length !== tenantIds.length) {
        return NextResponse.json(
          { success: false, error: "Um ou mais tenants não foram encontrados" },
          { status: 404 },
        );
      }

      // Create associations (skip duplicates)
      const result = await prisma.tenantProgram.createMany({
        data: tenantIds.map((tenantId) => ({
          tenantId,
          programId: id,
          active: true,
        })),
        skipDuplicates: true,
      });

      return NextResponse.json({
        success: true,
        data: { linked: result.count },
        message: `Programa vinculado a ${result.count} empresa(s)`,
      });
    } catch (error) {
      console.error("Error linking program to tenants:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);

/**
 * DELETE /api/admin/programs/[id]/tenants
 * Desvincula programa de um ou mais tenants
 * Acesso: SUPER_ADMIN
 */
export const DELETE = requireRole(
  ["SUPER_ADMIN"],
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { tenantIds } = body as { tenantIds: string[] };

      if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
        return NextResponse.json(
          { success: false, error: "Informe ao menos um tenant" },
          { status: 400 },
        );
      }

      const result = await prisma.tenantProgram.deleteMany({
        where: {
          programId: id,
          tenantId: { in: tenantIds },
        },
      });

      return NextResponse.json({
        success: true,
        data: { unlinked: result.count },
        message: `Programa desvinculado de ${result.count} empresa(s)`,
      });
    } catch (error) {
      console.error("Error unlinking program from tenants:", error);
      return NextResponse.json(
        { success: false, error: "Erro interno do servidor" },
        { status: 500 },
      );
    }
  },
);
